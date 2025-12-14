/* --- VISUALS & UI --- */

const tooltip = document.getElementById('global-tooltip');
document.addEventListener('click', () => { tooltip.style.display = 'none'; });

// Visual Flash Overlay
function triggerFlash(intensity = 0.5) {
    let flash = document.getElementById('flash-overlay');
    if (!flash) {
        flash = document.createElement('div');
        flash.id = 'flash-overlay';
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100vw';
        flash.style.height = '100vh';
        flash.style.pointerEvents = 'none';
        flash.style.background = '#fff';
        flash.style.zIndex = '9999';
        flash.style.mixBlendMode = 'overlay';
        document.body.appendChild(flash);
    }
    flash.style.transition = 'none';
    flash.style.opacity = intensity;
    void flash.offsetWidth; // Force reflow
    flash.style.transition = 'opacity 0.2s ease-out';
    flash.style.opacity = '0';
}

function updateUI() {
    document.getElementById('hp-display').innerText = `${hero.hp}/${hero.maxHp}`;
    document.getElementById('shield-display').innerText = hero.shield;
    document.getElementById('atk-display').innerText = hero.attack;
    document.getElementById('gold-display').innerText = hero.gold;

    // Update XP Bar
    const pct = Math.min(100, (hero.xp / hero.nextLevelXp) * 100);
    document.getElementById('xp-fill').style.width = `${pct}%`;
    document.getElementById('xp-text').innerText = `LVL ${hero.level}`;
}

function updateInventory() {
    const d = document.getElementById('inventory');
    d.innerHTML = '';

    const counts = {};
    const uniqueItems = [];

    hero.inventory.forEach(item => {
        if (!counts[item.id]) {
            counts[item.id] = 0;
            uniqueItems.push(item);
        }
        counts[item.id]++;
    });

    uniqueItems.forEach(i => {
        const count = counts[i.id];

        const el = document.createElement('div');
        el.className = 'inventory-item';
        el.innerText = i.icon;

        if (count > 1) {
            const badge = document.createElement('div');
            badge.className = 'item-count';
            badge.innerText = `x${count}`;
            el.appendChild(badge);
        }

        const showTooltip = () => {
            const title = count > 1 ? `${i.name} (x${count})` : i.name;
            tooltip.innerText = `${title}\n${i.desc}`;
            tooltip.style.display = 'block';
            const rect = el.getBoundingClientRect();
            const ttRect = tooltip.getBoundingClientRect();
            let top = rect.top - ttRect.height - 10;
            let left = rect.left + (rect.width / 2) - (ttRect.width / 2);
            if (left < 10) left = 10;
            if (left + ttRect.width > window.innerWidth) left = window.innerWidth - ttRect.width - 10;
            if (top < 0) top = rect.bottom + 10;
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
        };

        el.addEventListener('mouseenter', showTooltip);
        el.addEventListener('click', (e) => { e.stopPropagation(); showTooltip(); });
        el.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

        d.appendChild(el);
    });
}

function updateBackground() {
    document.body.style.backgroundColor = currentArea.bg;
    const titleEl = document.getElementById('area-title');
    titleEl.innerText = `ENTERING:\n${currentArea.name}`;
    titleEl.style.animation = 'none';
    titleEl.offsetHeight;
    titleEl.style.animation = 'fadeInOut 3s forwards';

    const pContainer = document.getElementById('ambient-particles');
    pContainer.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'ambient-p';
        p.style.backgroundColor = currentArea.particles;
        p.style.width = Math.random() * 4 + 2 + 'px';
        p.style.height = p.style.width;
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.animationDuration = (Math.random() * 10 + 10) + 's';
        p.style.animationDelay = (Math.random() * 5) + 's';
        pContainer.appendChild(p);
    }
}

function renderCard(r, c) {
    const data = grid[r][c];
    if (!data) return;

    const slot = document.querySelector(`.card-slot[data-r="${r}"][data-c="${c}"]`);
    slot.innerHTML = '';

    const asset = getCardAsset(data.type, data.isElite);

    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper';
    wrapper.dataset.r = r;
    wrapper.dataset.c = c;

    if (data.type === TYPES.HERO) {
        setupDrag(wrapper);
        wrapper.style.zIndex = 20;
    } else {
        setup3DHover(wrapper);
    }

    const card = document.createElement('div');
    card.className = `card ${data.isElite ? 'elite' : ''}`;
    card.style.background = asset.bg;
    card.style.borderColor = asset.border;

    let statsHTML = '';
    let displayVal = data.val;

    if (data.type === TYPES.HERO) {
        displayVal = `${hero.hp}/${hero.maxHp}`;
        statsHTML = `
        <div class="card-stats-group">
            <div class="stat-badge hp">❤️ ${displayVal}</div>
            ${hero.shield > 0 ? `<div class="stat-badge shield">🛡️ ${hero.shield}</div>` : ''}
            ${hero.attack > 0 ? `<div class="stat-badge atk">⚔️ +${hero.attack}</div>` : ''}
        </div>
    `;
        displayVal = '';
    } else if (data.type === TYPES.ITEM) {
        displayVal = '?';
    } else if (data.type === TYPES.CHEST || data.type === TYPES.PORTAL || data.type === TYPES.BOMB || data.type === TYPES.MERCHANT) {
        displayVal = '';
    } else if (data.type === TYPES.SWORD || data.type === TYPES.HEART_CONT) {
        displayVal = '+1';
    }
    else if (data.type === TYPES.BARREL) {
        displayVal = data.val; // HP
    }

    // Trait Badges
    if (data.traits && data.traits.length > 0) {
        let traitBadges = '';
        data.traits.forEach(t => {
            if (t === TRAITS.MIMIC && data.type === TYPES.CHEST) return; // Hide disguise
            // Add data-trait attribute for listeners
            if (t === TRAITS.EXPLOSIVE) traitBadges += `<div class="stat-badge" data-trait="${t}" style="background:#ff3d00; border-color:#ff9e80;">🧨</div>`;
            if (t === TRAITS.ARMORED) traitBadges += `<div class="stat-badge" data-trait="${t}" style="background:#5d4037; border-color:#8d6e63;">🛡️</div>`;
            if (t === TRAITS.EVASIVE) traitBadges += `<div class="stat-badge" data-trait="${t}" style="background:#0288d1; border-color:#29b6f6;">💨</div>`;
        });

        if (traitBadges) {
            statsHTML += `<div class="card-stats-group" style="top:auto; bottom:30px;">${traitBadges}</div>`;
        }
    }

    let visualHTML = asset.type === 'emoji'
        ? `<div class="card-emoji">${asset.src}</div>`
        : `<img src="${asset.src}" class="card-emoji" style="width:60%; height:60%; object-fit:contain;">`;

    card.innerHTML = `
    <div class="card-glare"></div>
    <div class="card-shine"></div>
    <div class="card-content">
        ${statsHTML}
        ${displayVal !== '' ? `<div class="card-value">${displayVal}</div>` : ''}
        ${visualHTML}
        <div class="card-name">${asset.name}</div>
    </div>
`;

    // Attach Tooltip Listeners to Trait Badges
    card.querySelectorAll('.stat-badge[data-trait]').forEach(el => {
        const t = el.getAttribute('data-trait');
        const info = TRAIT_INFO[t];
        if (info) {
            el.addEventListener('mouseenter', () => {
                tooltip.innerText = `${info.name}\n${info.desc}`;
                tooltip.style.display = 'block';
                const rect = el.getBoundingClientRect();
                const ttRect = tooltip.getBoundingClientRect();
                let top = rect.top - ttRect.height - 10;
                let left = rect.left + (rect.width / 2) - (ttRect.width / 2);
                if (left < 10) left = 10;
                if (left + ttRect.width > window.innerWidth) left = window.innerWidth - ttRect.width - 10;
                if (top < 0) top = rect.bottom + 10;
                tooltip.style.top = `${top}px`;
                tooltip.style.left = `${left}px`;
            });
            el.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
            // Stop propagation to prevent card click/drag issues
            el.addEventListener('mousedown', (e) => e.stopPropagation());
        }
    });

    wrapper.appendChild(card);
    slot.appendChild(wrapper);
}

function setup3DHover(el) {
    el.addEventListener('mousemove', (e) => {
        if (isLocked) return;
        const card = el.querySelector('.card');
        if (!card) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -20;
        const rotateY = ((x - centerX) / centerX) * 20;
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.08)`;
        const glare = card.querySelector('.card-glare');
        if (glare) {
            glare.style.opacity = '1';
            const glareX = (x / rect.width) * 100;
            const glareY = (y / rect.height) * 100;
            glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.4) 0%, transparent 60%)`;
        }
        const shine = card.querySelector('.card-shine');
        if (shine) {
            shine.style.opacity = '1';
            const bx = 50 + ((x - centerX) / centerX) * 50;
            const by = 50 + ((y - centerY) / centerY) * 50;
            shine.style.backgroundPosition = `${bx}% ${by}%`;
        }
    });
    el.addEventListener('mouseleave', () => {
        const card = el.querySelector('.card');
        if (card) {
            card.style.transform = `rotateX(0) rotateY(0) scale(1)`;
            const glare = card.querySelector('.card-glare');
            const shine = card.querySelector('.card-shine');
            if (glare) glare.style.opacity = '0';
            if (shine) shine.style.opacity = '0';
        }
    });
}

function levelUp() {
    isLocked = true;
    hero.xp -= hero.nextLevelXp;
    hero.level++;
    hero.nextLevelXp = Math.floor(hero.nextLevelXp * 1.5);

    triggerFlash(0.7);
    triggerShake();

    document.getElementById('modal-title').innerText = "LEVEL UP!";
    const b = document.getElementById('modal-body');
    b.innerHTML = `
    <p style="margin-bottom:15px; color:#ccc;">Select a permanent upgrade:</p>
`;

    const opts = [
        { t: 'Recover HP (Full Heal)', f: () => { hero.hp = hero.maxHp; } },
        { t: 'Sharpen Sword (+1 Attack)', f: () => { hero.attack++; } },
        { t: 'Toughen Up (+3 Max HP)', f: () => { hero.maxHp += 3; hero.hp += 3; } }
    ];

    opts.forEach(o => {
        const btn = document.createElement('div');
        btn.className = 'choice-btn';
        btn.innerText = o.t;
        btn.onclick = () => {
            o.f();
            closeModal();
            updateUI();
            renderCard(hero.r, hero.c); // Sync visuals
            isLocked = false;
            showTip("Level Up Complete! Stats increased.");
            triggerFlash(0.3);
        };
        b.appendChild(btn);
    });
    document.getElementById('modal').classList.add('active');
}

function openChest() {
    isLocked = true;
    triggerFlash(0.5);
    document.getElementById('modal-title').innerText = "CHEST FOUND";
    const b = document.getElementById('modal-body');
    b.innerHTML = '';

    const opts = [
        { t: 'Small Potion (+3 HP)', f: () => { hero.hp = Math.min(hero.maxHp, hero.hp + 3) } },
        { t: 'Gold Pouch (+15 G)', f: () => { hero.gold += 15 } },
        { t: 'Repair Kit (+5 Armor)', f: () => { hero.shield += 5 } }
    ];

    opts.forEach(o => {
        const btn = document.createElement('div');
        btn.className = 'choice-btn';
        btn.innerText = o.t;
        btn.onclick = () => { o.f(); closeModal(); updateUI(); renderCard(hero.r, hero.c); isLocked = false; };
        b.appendChild(btn);
    });
    document.getElementById('modal').classList.add('active');
}

function openMerchant() {
    isLocked = true;
    document.getElementById('modal-title').innerText = "MERCHANT";
    const b = document.getElementById('modal-body');
    b.innerHTML = `
    <p style="margin-bottom:15px; color:#fbc02d;">Spend your Gold wisely!</p>
`;

    const shopItems = [
        { t: 'Buy Potion (5G)', cost: 5, f: () => { hero.hp = Math.min(hero.maxHp, hero.hp + 5); } },
        { t: 'Buy Shield (8G)', cost: 8, f: () => { hero.shield += 5; } },
        {
            t: 'Buy Random Item (15G)', cost: 15, f: () => {
                const newItem = ITEMS_POOL[Math.floor(Math.random() * ITEMS_POOL.length)];
                hero.inventory.push(newItem);
                newItem.effect();
                updateInventory();
            }
        }
    ];

    shopItems.forEach(o => {
        const btn = document.createElement('div');
        btn.className = 'choice-btn';
        btn.innerText = o.t;
        if (hero.gold < o.cost) {
            btn.style.opacity = 0.5;
            btn.innerText += " (Poor!)";
        }
        btn.onclick = () => {
            if (hero.gold >= o.cost) {
                hero.gold -= o.cost;
                o.f();
                closeModal();
                updateUI();
                renderCard(hero.r, hero.c); // Sync visuals
                isLocked = false;
                triggerFlash(0.2);
            } else {
                btn.classList.add('shake');
                setTimeout(() => btn.classList.remove('shake'), 500);
            }
        };
        b.appendChild(btn);
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn';
    closeBtn.innerText = "Leave Shop";
    closeBtn.onclick = () => { closeModal(); isLocked = false; };
    b.appendChild(closeBtn);

    document.getElementById('modal').classList.add('active');
}

function closeModal() { document.getElementById('modal').classList.remove('active'); }

function die() {
    // Check for revive (Phoenix Feather)
    if (removeItemById('feather')) {
        hero.hp = 10;
        updateUI();
        renderCard(hero.r, hero.c);
        showTip("<span style='color:#fbc02d'>PHOENIX REVIVE!</span><br>You cheated death!", 3000);
        triggerShake();
        triggerFlash(0.8);
        return;
    }

    isLocked = true;
    triggerFlash(1.0);
    triggerMegaShake();

    document.getElementById('modal-title').innerText = "GAME OVER";
    document.getElementById('modal-body').innerHTML = `
    <p style="margin-bottom:20px;">Turns: ${turn}<br>Gold: ${hero.gold}<br>Level: ${hero.level}</p>
    <button class="btn" onclick="location.reload()">TRY AGAIN</button>
`;
    document.getElementById('modal').classList.add('active');
}

/* --- INIT & CLASS SELECT --- */
function init() {
    const b = document.getElementById('modal-body');
    document.getElementById('modal-title').innerText = "SELECT CLASS";
    b.innerHTML = '';

    CLASSES.forEach(cls => {
        const div = document.createElement('div');
        div.className = 'class-card';
        div.innerHTML = `
        <div class="class-icon">${cls.icon}</div>
        <div class="class-info">
            <h3>${cls.name}</h3>
            <p>${cls.desc}</p>
        </div>
    `;
        div.onclick = () => startGame(cls);
        b.appendChild(div);
    });

    document.getElementById('modal').classList.add('active');
    createGridSlots();
}

function createGridSlots() {
    const container = document.getElementById('grid');
    container.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const slot = document.createElement('div');
            slot.className = 'card-slot';
            slot.dataset.r = r;
            slot.dataset.c = c;
            container.appendChild(slot);
        }
    }
}
