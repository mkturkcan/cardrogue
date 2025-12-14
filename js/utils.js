const getCardAsset = (type, isElite = false) => {
    // Base assets
    const assets = {
        [TYPES.HERO]: {
            type: 'emoji', src: '🧙‍♂️', name: 'Hero',
            bg: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', border: '#42a5f5'
        },
        [TYPES.MONSTER]: {
            type: 'emoji', src: currentArea.monster, name: isElite ? 'Elite' : 'Enemy',
            bg: 'linear-gradient(135deg, #cb2d3e 0%, #ef473a 100%)', border: isElite ? '#ffd700' : '#ef5350'
        },
        [TYPES.BOSS]: {
            type: 'emoji', src: currentArea.boss, name: 'BOSS',
            bg: 'linear-gradient(135deg, #000000 0%, #434343 100%)', border: '#b71c1c'
        },
        [TYPES.POTION]: {
            type: 'emoji', src: '🧪', name: 'Heal',
            bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', border: '#66bb6a'
        },
        [TYPES.SHIELD]: {
            type: 'emoji', src: '🛡️', name: 'Armor',
            bg: 'linear-gradient(135deg, #2c3e50 0%, #bdc3c7 100%)', border: '#bdbdbd'
        },
        [TYPES.COIN]: {
            type: 'emoji', src: '💰', name: 'Gold',
            bg: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', border: '#fbc02d'
        },
        [TYPES.ITEM]: {
            type: 'emoji', src: '💍', name: 'Item',
            bg: 'linear-gradient(135deg, #834d9b 0%, #d04ed6 100%)', border: '#ab47bc'
        },
        [TYPES.CHEST]: {
            type: 'emoji', src: '💎', name: 'Chest',
            bg: 'linear-gradient(135deg, #e65c00 0%, #f9d423 100%)', border: '#ff7043'
        },
        [TYPES.SWORD]: {
            type: 'emoji', src: '⚔️', name: 'Strength',
            bg: 'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)', border: '#ff8a65'
        },
        [TYPES.HEART_CONT]: {
            type: 'emoji', src: '💗', name: 'Vitality',
            bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', border: '#f48fb1'
        },
        [TYPES.PORTAL]: {
            type: 'emoji', src: '🌀', name: 'Portal',
            bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: '#7e57c2'
        },
        [TYPES.BOMB]: {
            type: 'emoji', src: '💣', name: 'Bomb',
            bg: 'linear-gradient(135deg, #232526 0%, #414345 100%)', border: '#757575'
        },
        [TYPES.MERCHANT]: {
            type: 'emoji', src: '⚖️', name: 'Merchant',
            bg: 'linear-gradient(135deg, #ffc107 0%, #ff8f00 100%)', border: '#ff6f00'
        },
        [TYPES.BARREL]: {
            type: 'emoji', src: '🛢️', name: 'Barrel',
            bg: 'linear-gradient(135deg, #795548 0%, #5d4037 100%)', border: '#8d6e63'
        },
        [TYPES.MIMIC]: {
            type: 'emoji', src: '👹', name: 'Mimic',
            bg: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', border: '#e53935'
        }
    };
    return assets[type];
};

/* --- IN-GAME TUTORIAL SYSTEM --- */
function showTip(text, autoHideDuration = 0) {
    const el = document.getElementById('ingame-tutorial');
    const content = document.getElementById('tut-content');

    content.innerHTML = text;
    el.classList.remove('hidden');
    el.classList.add('visible');

    if (autoHideDuration > 0) {
        setTimeout(hideTip, autoHideDuration);
    }
}

function hideTip() {
    const el = document.getElementById('ingame-tutorial');
    el.classList.remove('visible');
    el.classList.add('hidden');
}

/* --- INVENTORY UTILS --- */
function addItemById(id) {
    const item = ITEMS_POOL.find(i => i.id === id);
    if (item) {
        hero.inventory.push(item);
        item.effect();
    }
}

function countItem(id) {
    return hero.inventory.filter(i => i.id === id).length;
}

function removeItemById(id) {
    const idx = hero.inventory.findIndex(i => i.id === id);
    if (idx > -1) {
        hero.inventory.splice(idx, 1);
        updateInventory();
        return true;
    }
    return false;
}

function hasItem(id) { return hero.inventory.some(i => i.id === id); }

function showLog(t) { document.getElementById('game-log').innerText = t; }

function showFloater(r, c, txt, col) {
    const slot = document.querySelector(`.card-slot[data-r="${r}"][data-c="${c}"]`);
    if (!slot) return;
    const f = document.createElement('div');
    f.className = 'floater';
    f.innerText = txt;
    f.style.color = col;
    slot.appendChild(f);
    setTimeout(() => f.remove(), 800);
}

/* --- JUICE SYSTEMS --- */

// Hit Stop (Freeze Frame)
function freezeFrame(ms) {
    const start = performance.now();
    while (performance.now() < start + ms) {
        // Busy wait to block the thread (Simple Hit Stop)
    }
}

// Particle System
function spawnParticles(rect, type) {
    const count = type === 'boom' ? 20 : 12;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        let color = '#fff';
        if (type === 'combat') color = Math.random() > 0.5 ? '#ef5350' : '#ffffff';
        if (type === 'gold') color = '#fbc02d';
        if (type === 'heal') color = '#66bb6a';
        if (type === 'shield') color = '#42a5f5';
        if (type === 'xp') color = '#ab47bc';
        if (type === 'boom') color = '#ff5722';

        p.style.backgroundColor = color;

        // More explosive velocity
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 100 + 50;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);
        p.style.left = `${centerX}px`;
        p.style.top = `${centerY}px`;

        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }
}

// Advanced Screen Shake (Trauma-based)
let trauma = 0;
let shakeInterval = null;

function addTrauma(amount) {
    trauma = Math.min(1.0, trauma + amount);
    if (!shakeInterval) startShakeLoop();
}

function startShakeLoop() {
    const container = document.getElementById('game-container');
    if (shakeInterval) clearInterval(shakeInterval);

    shakeInterval = setInterval(() => {
        if (trauma > 0) {
            trauma = Math.max(0, trauma - 0.05); // Decay
            const shake = trauma * trauma; // Non-linear
            const maxOffset = 15 * shake;
            const maxRotate = 5 * shake;

            const ox = (Math.random() * 2 - 1) * maxOffset;
            const oy = (Math.random() * 2 - 1) * maxOffset;
            const rot = (Math.random() * 2 - 1) * maxRotate;

            container.style.transform = `translate(${ox}px, ${oy}px) rotate(${rot}deg)`;

            // Chromatic Aberration hook (if we add filters later)
            if (shake > 0.5) {
                document.body.style.filter = `blur(${shake}px)`;
            } else {
                document.body.style.filter = 'none';
            }
        } else {
            clearInterval(shakeInterval);
            shakeInterval = null;
            container.style.transform = 'none';
            document.body.style.filter = 'none';
        }
    }, 16);
}

function triggerShake() {
    // Legacy support / Simple shake
    addTrauma(0.3);
}

function triggerHeavyShake() {
    addTrauma(0.6);
}

function triggerMegaShake() {
    addTrauma(1.0);
}
