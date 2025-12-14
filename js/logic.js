/* --- GAME LOGIC --- */

function startGame(cls) {
    document.getElementById('modal').classList.remove('active');
    // Reset State
    hero = { r: 2, c: 1, hp: 15, maxHp: 15, shield: 0, attack: 0, gold: 0, xp: 0, level: 1, nextLevelXp: 10, inventory: [] };
    turn = 0;
    currentArea = AREAS[0]; // Reset area
    updateBackground();

    // Reset Tutorial
    tutorialStep = 0;
    hasSeenAmbushTip = false;

    cls.setup();
    updateUI();
    updateInventory();
    document.getElementById('game-log').innerText = "Drag Hero to move!";

    grid = Array(ROWS).fill().map(() => Array(COLS).fill(null));
    spawnCard(2, 1, TYPES.HERO);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!grid[r][c]) spawnRandom(r, c);
        }
    }

    // Trigger First Tip
    setTimeout(() => showTip("<div class='tut-arrow'>👇</div>Drag your Hero to an adjacent card to move.", 0), 500);
}

function spawnRandom(r, c) {
    const rand = Math.random();
    const level = 1 + Math.floor(turn / 12);
    const w = currentArea.weights;

    let type = TYPES.MONSTER;
    let val = 0;
    let isElite = false;
    let traits = [];

    const spawnBoss = (turn > 20 && Math.random() < 0.04);
    let portalChance = 0.02;
    if (countItem('compass') > 0) portalChance = 0.06;
    const spawnPortal = (turn > 10 && Math.random() < portalChance);
    const spawnBomb = Math.random() < 0.03;
    const spawnMerchant = Math.random() < 0.03;
    const spawnBarrel = Math.random() < 0.04;

    if (spawnBoss) {
        type = TYPES.BOSS;
        val = (level * 2) + 6;
        if (Math.random() < 0.5) traits.push(TRAITS.EXPLOSIVE);
    }
    else if (spawnPortal) {
        type = TYPES.PORTAL; val = 0;
    }
    else if (spawnBomb) {
        type = TYPES.BOMB; val = 0;
    }
    else if (spawnMerchant) {
        type = TYPES.MERCHANT; val = 0;
    }
    else if (spawnBarrel) {
        type = TYPES.BARREL; val = 0;
        if (Math.random() < 0.3) traits.push(TRAITS.EXPLOSIVE);
    }
    else {
        let threshMonster = 0.35 * w.monster;
        let threshCoin = threshMonster + (0.18 * w.gold);
        let threshPotion = threshCoin + (0.12 * w.potion);
        let threshShield = threshPotion + (0.10 * w.item);
        let threshStats = threshShield + (0.05 * w.item);
        let threshItem = threshStats + (0.05 * w.item);

        if (rand < threshMonster) {
            type = TYPES.MONSTER;
            val = Math.floor(Math.random() * 3) + level;

            // Elite & Trait Logic
            if (Math.random() < 0.1) {
                isElite = true;
                val += Math.floor(level / 2) + 1;
            }

            // Assign Random Trait
            const traitRoll = Math.random();
            if (traitRoll < 0.1) traits.push(TRAITS.ARMORED);
            else if (traitRoll < 0.2) traits.push(TRAITS.EVASIVE);
            else if (traitRoll < 0.3) traits.push(TRAITS.EXPLOSIVE);
        }
        else if (rand < threshCoin) {
            type = TYPES.COIN;
            val = Math.floor(Math.random() * 5) + level;
        }
        else if (rand < threshPotion) {
            type = TYPES.POTION;
            val = Math.floor(Math.random() * 4) + 2;
        }
        else if (rand < threshShield) {
            type = TYPES.SHIELD;
            val = Math.floor(Math.random() * 5) + level;
        }
        else if (rand < threshStats) {
            type = Math.random() < 0.5 ? TYPES.SWORD : TYPES.HEART_CONT;
            val = 1;
        }
        else if (rand < threshItem) {
            type = TYPES.ITEM; val = 0;
        }
        else {
            type = TYPES.CHEST;
            val = 0;
            // Mimic Chance
            if (Math.random() < 0.15) {
                traits.push(TRAITS.MIMIC);
                // Hidden values for mimic combat
                val = level + 3;
            }
        }
    }

    spawnCard(r, c, type, val, isElite, traits);
}

function spawnCard(r, c, type, val = 0, isElite = false, traits = []) {
    grid[r][c] = { type, val, isElite, traits, id: Math.random().toString(36).substr(2, 9) };
    renderCard(r, c);
}

function changeArea() {
    triggerFlash(0.8);
    const otherAreas = AREAS.filter(a => a.id !== currentArea.id);
    currentArea = otherAreas[Math.floor(Math.random() * otherAreas.length)];

    updateBackground();
    showLog("Traveled to new area!");
    hero.hp = Math.min(hero.maxHp, hero.hp + 2);
    updateUI();
    renderCard(hero.r, hero.c); // Refresh hero for potential heal visual

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] && grid[r][c].type !== TYPES.HERO) {
                renderCard(r, c);
            }
        }
    }
}

function attemptMove(tr, tc) {
    const target = grid[tr][tc];
    if (!target) return;

    const slotEl = document.querySelector(`.card-slot[data-r="${tr}"][data-c="${tc}"]`);
    const rect = slotEl.getBoundingClientRect();

    // Tutorial Logic
    if (tutorialStep === 0) {
        tutorialStep = 1;
        hideTip();
        setTimeout(() => {
            showTip("Cards fall to fill empty spaces. <br>Don't get stuck under a monster!", 5000);
        }, 600);
    } else if (tutorialStep === 1 && (target.type === TYPES.MONSTER || target.type === TYPES.BOSS)) {
        showTip("Combat reduces your HP based on Monster Attack minus your Armor/Shield.", 5000);
        tutorialStep = 2;
    }

    let msg = "";
    let floatTxt = "", floatCol = "";

    // --- MIMIC REVEAL LOGIC ---
    if (target.type === TYPES.CHEST && target.traits && target.traits.includes(TRAITS.MIMIC)) {
        target.type = TYPES.MIMIC;
        // Mimic Surprise Attack!
        let dmg = target.val; // Mimic attack power
        let take = dmg;
        if (hero.shield >= dmg) { hero.shield -= dmg; take = 0; }
        else if (hero.shield > 0) { take = dmg - hero.shield; hero.shield = 0; }
        hero.hp -= take;

        showFloater(tr, tc, "IT'S ALIVE!", '#d32f2f');
        showFloater(hero.r, hero.c, `-${take}`, '#d32f2f');
        triggerHeavyShake();
        freezeFrame(100);
        renderCard(tr, tc);
        updateUI();
        msg = "MIMIC AMBUSH!";

        if (hero.hp <= 0) { die(); return; }
        // End turn basically, but since we didn't move, we just trigger turn end processing? 
        // Or simply return and let player deal with it next time. 
        // Let's force turn end to punish player.
        turn++;
        isLocked = true;
        setTimeout(() => {
            applyGravity();
            checkAmbush();
            if (hero.hp >= hero.nextLevelXp) setTimeout(levelUp, 200); else isLocked = false;
        }, 300);
        return;
    }

    if (target.type === TYPES.MONSTER || target.type === TYPES.BOSS || target.type === TYPES.MIMIC) {
        // HIT STOP!
        freezeFrame(60);

        // EVASIVE TRAIT
        if (target.traits && target.traits.includes(TRAITS.EVASIVE)) {
            if (Math.random() < 0.25) {
                showFloater(tr, tc, "MISS!", "#fff");
                msg = "Enemy Evaded!";
                // Enemy still hits back? taking full damage implies "Counter"
                // Let's say just a Miss. Turn advances.
                turn++;
                isLocked = true;
                setTimeout(() => { applyGravity(); checkAmbush(); isLocked = false; }, 300);
                return;
            }
        }

        let playerAtk = hero.attack;

        // ARMORED TRAIT (Monster takes less damage)
        if (target.traits && target.traits.includes(TRAITS.ARMORED)) {
            playerAtk = Math.max(0, playerAtk - 1);
            spawnParticles(rect, 'shield'); // Metal sound visual?
        }

        let dmg = Math.max(0, target.val - playerAtk);
        let armorCount = countItem('armor');
        if (armorCount > 0) dmg = Math.max(0, dmg - armorCount);

        let reflect = countItem('spike') + countItem('paint');
        if (reflect > 0) { spawnParticles(rect, 'combat'); }

        let take = dmg;
        if (hero.shield >= dmg) { hero.shield -= dmg; take = 0; }
        else if (hero.shield > 0) { take = dmg - hero.shield; hero.shield = 0; }
        hero.hp -= take;

        let fangCount = countItem('fang');
        if (fangCount > 0) { hero.hp = Math.min(hero.maxHp, hero.hp + fangCount); }

        let slayerCount = countItem('slayer_crown');
        if (slayerCount > 0) { hero.gold += slayerCount; }

        let midasCount = countItem('midas');
        if (midasCount > 0) { hero.gold += 2 * midasCount; }

        // Elite Bonus
        if (target.isElite) {
            hero.gold += 3;
            showFloater(tr, tc, '+3$', '#fbc02d');
            triggerHeavyShake();
        } else {
            triggerShake();
        }

        if (target.type === TYPES.BOSS) {
            triggerMegaShake();
            triggerFlash(0.2);
        }

        floatTxt = `-${take}`; floatCol = '#ef5350';
        msg = target.type === TYPES.BOSS ? `BOSS HIT! -${take} HP` : `Combat! -${take} HP`;
        spawnParticles(rect, 'combat');

        // EXPLOSIVE TRAIT (On Kill) - We are assuming we kill it because we always swap places
        // In this game, monsters are ALWAYS killed on hit (unless we want to change that core mechanic)
        // Correct, the logic below moves the Hero to (tr, tc), implying monster death.

        if (target.traits && target.traits.includes(TRAITS.EXPLOSIVE)) {
            // Explode!
            msg += " (EXPLODED!)";
            triggerHeavyShake();
            spawnParticles(rect, 'boom');

            // Deal damage to hero (who is now technically moving to that spot)
            hero.hp -= 3;
            showFloater(tr, tc, "BOOM! -3", '#ff9800');
        }

        // GAIN XP
        gainXp(target.type === TYPES.BOSS ? 5 : (target.isElite ? 2 : 1), rect);
    }
    else if (target.type === TYPES.BARREL) {
        // Hit barrel
        msg = "Smashed Barrel";
        spawnParticles(rect, 'boom');
        triggerShake();
        if (target.traits && target.traits.includes(TRAITS.EXPLOSIVE)) {
            // Explosive barrel logic
            hero.hp -= 4;
            showFloater(tr, tc, "BOOM! -4", '#ff9800');
            triggerHeavyShake();
        } else {
            // Chance for loot
            if (Math.random() < 0.4) {
                hero.gold += 1;
                floatTxt = "+1$"; floatCol = "#ffeb3b";
            }
        }
    }
    else if (target.type === TYPES.POTION) {
        let heal = target.val;
        let wandCount = countItem('wand');
        if (wandCount > 0) heal += (2 * wandCount);
        hero.hp = Math.min(hero.maxHp, hero.hp + heal);
        let holyCount = countItem('holy_water');
        if (holyCount > 0) hero.shield += holyCount;
        floatTxt = `+${heal}`; floatCol = '#66bb6a';
        spawnParticles(rect, 'heal');
    }
    else if (target.type === TYPES.SHIELD) {
        hero.shield = target.val;
        let towerCount = countItem('tower_shield');
        if (towerCount > 0) hero.shield += (2 * towerCount);
        floatTxt = `🛡️${hero.shield}`; floatCol = '#90caf9';
        spawnParticles(rect, 'shield');
    }
    else if (target.type === TYPES.COIN) {
        let gain = target.val;
        let luckCount = countItem('luck');
        if (luckCount > 0) gain += (2 * luckCount);
        hero.gold += gain;
        let merchantCount = countItem('merchant_badge');
        if (merchantCount > 0) { hero.hp = Math.min(hero.maxHp, hero.hp + merchantCount); }
        floatTxt = `+${gain}`; floatCol = '#fbc02d';
        spawnParticles(rect, 'gold');
    }
    else if (target.type === TYPES.ITEM) {
        const newItem = ITEMS_POOL[Math.floor(Math.random() * ITEMS_POOL.length)];
        hero.inventory.push(newItem);
        newItem.effect();
        updateInventory();
        msg = "Item Found";
        spawnParticles(rect, 'gold');
        triggerFlash(0.3);
    }
    else if (target.type === TYPES.CHEST) {
        setTimeout(openChest, 250);
        spawnParticles(rect, 'gold');
    }
    else if (target.type === TYPES.SWORD) {
        hero.attack += 1;
        floatTxt = `ATK UP!`; floatCol = '#ff9800';
        spawnParticles(rect, 'combat');
    }
    else if (target.type === TYPES.HEART_CONT) {
        hero.maxHp += 1;
        hero.hp = Math.min(hero.maxHp, hero.hp + 1);
        floatTxt = `HP UP!`; floatCol = '#d32f2f';
        spawnParticles(rect, 'heal');
    }
    else if (target.type === TYPES.PORTAL) {
        setTimeout(changeArea, 300);
        msg = "Entering Portal...";
        spawnParticles(rect, 'shield');
    }
    else if (target.type === TYPES.BOMB) {
        spawnParticles(rect, 'boom');
        triggerHeavyShake();
        freezeFrame(40);
        msg = "BOOM!";
        // Destroy adjacent (diagonal too)
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                let nr = tr + dr, nc = tc + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc]) {
                    // Visual explosion could go here
                    grid[nr][nc] = null; // Removed
                    const s = document.querySelector(`.card-slot[data-r="${nr}"][data-c="${nc}"]`);
                    if (s) {
                        spawnParticles(s.getBoundingClientRect(), 'boom');
                        s.innerHTML = '';
                    }
                }
            }
        }
    }
    else if (target.type === TYPES.MERCHANT) {
        setTimeout(openMerchant, 250);
        spawnParticles(rect, 'gold');
    }

    if (floatTxt) showFloater(tr, tc, floatTxt, floatCol);
    showLog(msg);
    updateUI();

    const oldR = hero.r;
    const oldC = hero.c;
    grid[oldR][oldC] = null;
    grid[tr][tc] = { type: TYPES.HERO, val: 0, id: 'HERO' };
    hero.r = tr; hero.c = tc;

    const oldSlot = document.querySelector(`.card-slot[data-r="${oldR}"][data-c="${oldC}"]`);
    oldSlot.innerHTML = '';
    renderCard(tr, tc);

    if (hero.hp <= 0) { die(); return; }

    turn++;
    isLocked = true;

    setTimeout(() => {
        applyGravity();
        checkAmbush();
        // Check Level Up after gravity settles
        if (hero.xp >= hero.nextLevelXp) {
            setTimeout(levelUp, 200);
        } else {
            isLocked = false;
        }
    }, 300);
}

function checkAmbush() {
    const enemyR = hero.r - 1;
    if (enemyR >= 0) {
        const above = grid[enemyR][hero.c];
        if (above && (above.type === TYPES.MONSTER || above.type === TYPES.BOSS)) {
            // HIT STOP ON AMBUSH
            freezeFrame(40);

            let dmg = Math.max(0, above.val - hero.attack);
            let bootCount = countItem('heavy_boots');
            if (bootCount > 0) dmg = Math.max(0, dmg - bootCount);

            let take = dmg;
            if (hero.shield >= dmg) { hero.shield -= dmg; take = 0; }
            else if (hero.shield > 0) { take = dmg - hero.shield; hero.shield = 0; }
            hero.hp -= take;

            // Tutorial Ambush Warning
            if (!hasSeenAmbushTip) {
                showTip("<span style='color:#ef5350'>⚠️ AMBUSH!</span><br>Monsters directly ABOVE you attack at the end of the turn!", 6000);
                hasSeenAmbushTip = true;
            }

            const enemySlot = document.querySelector(`.card-slot[data-r="${enemyR}"][data-c="${hero.c}"]`);
            if (enemySlot) {
                const rect = enemySlot.getBoundingClientRect();
                spawnParticles(rect, 'combat');
                const c = enemySlot.querySelector('.card');
                if (c) c.classList.add('shake');
            }

            showFloater(hero.r, hero.c, `-${take}`, '#c62828');
            showLog("Ambushed from above!");
            triggerShake();

            updateUI();
            renderCard(hero.r, hero.c); // Sync Hero visuals after damage
            if (hero.hp <= 0) die();
        }
    }
}

function gainXp(amount, rect) {
    hero.xp += amount;
    spawnParticles(rect, 'xp');
    // Visual update handled in updateUI
}

function applyGravity() {
    for (let c = 0; c < COLS; c++) {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (grid[r][c] === null) {
                for (let up = r - 1; up >= 0; up--) {
                    if (grid[up][c]) {
                        grid[r][c] = grid[up][c];
                        grid[up][c] = null;
                        if (grid[r][c].type === TYPES.HERO) { hero.r = r; hero.c = c; }

                        const srcSlot = document.querySelector(`.card-slot[data-r="${up}"][data-c="${c}"]`);
                        srcSlot.innerHTML = '';
                        renderCard(r, c);

                        const w = document.querySelector(`.card-slot[data-r="${r}"][data-c="${c}"] .card-wrapper`);
                        if (w) {
                            w.style.transition = 'none';
                            w.style.top = '-100%';
                            w.offsetHeight; // Force reflow
                            w.style.transition = 'top 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                            w.style.top = '0';
                        }
                        break;
                    }
                }
            }
        }
        for (let r = 0; r < ROWS; r++) {
            if (!grid[r][c]) {
                spawnRandom(r, c);
                const w = document.querySelector(`.card-slot[data-r="${r}"][data-c="${c}"] .card-wrapper`);
                if (w) {
                    w.style.opacity = '0';
                    w.style.transform = 'scale(0.5)';
                    setTimeout(() => {
                        w.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                        w.style.opacity = '1';
                        w.style.transform = 'scale(1)';
                    }, 50 * r); // Staggered entry
                }
            }
        }
    }
}
