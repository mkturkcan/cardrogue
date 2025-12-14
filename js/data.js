/* --- CONFIG & ASSETS --- */
const ROWS = 3;
const COLS = 3;
const TYPES = { HERO: 'hero', MONSTER: 'monster', BOSS: 'boss', POTION: 'potion', SHIELD: 'shield', COIN: 'coin', ITEM: 'item', CHEST: 'chest', SWORD: 'sword', HEART_CONT: 'heart_cont', PORTAL: 'portal', BOMB: 'bomb', MERCHANT: 'merchant', BARREL: 'barrel', MIMIC: 'mimic' };

const TRAITS = {
    EXPLOSIVE: 'explosive', // Explodes on death
    ARMORED: 'armored',     // -1 DMG taken
    EVASIVE: 'evasive',      // Chance to dodge
    MIMIC: 'mimic'          // Disguised
};

const TRAIT_INFO = {
    [TRAITS.EXPLOSIVE]: { name: "Explosive", desc: "Explodes on death dealing damage." },
    [TRAITS.ARMORED]: { name: "Armored", desc: "Takes -1 damage from attacks." },
    [TRAITS.EVASIVE]: { name: "Evasive", desc: "25% chance to dodge attacks." },
    [TRAITS.MIMIC]: { name: "Mimic", desc: "Disguised as a chest!" }
};

// Define Areas
const AREAS = [
    {
        id: 'dungeon', name: 'Dark Dungeon',
        bg: '#1a1a1a', particles: '#444',
        monster: '👹', boss: '🐲',
        weights: { monster: 1, gold: 1, item: 1, potion: 1 }
    },
    {
        id: 'forest', name: 'Goblin Forest',
        bg: '#1b3320', particles: '#81c784',
        monster: '👺', boss: '🦍',
        weights: { monster: 0.8, gold: 1.2, item: 1, potion: 1.5 }
    },
    {
        id: 'volcano', name: 'Burning Depth',
        bg: '#331a1a', particles: '#ef5350',
        monster: '👿', boss: '🔥',
        weights: { monster: 1.3, gold: 1.5, item: 1.2, potion: 0.8 }
    },
    {
        id: 'cave', name: 'Crystal Cave',
        bg: '#1a1a33', particles: '#90caf9',
        monster: '🦇', boss: '👁️',
        weights: { monster: 1, gold: 0.5, item: 2.0, potion: 1 }
    }
];

const ITEMS_POOL = [
    { id: 'ring', name: 'Life Ring', desc: '+5 Max HP (Instant)', icon: '💍', effect: () => { hero.maxHp += 5; hero.hp += 5; } },
    { id: 'spike', name: 'Thorns', desc: 'Reflect 1 DMG when attacked', icon: '🌵', effect: () => { } },
    { id: 'armor', name: 'Plates', desc: '-1 DMG taken from monsters', icon: '🛡️', effect: () => { } },
    { id: 'luck', name: 'Charm', desc: '+2 Gold from all coins', icon: '🍀', effect: () => { } },
    { id: 'ruby', name: 'Ruby', desc: '+5 Max HP (Instant)', icon: '🔴', effect: () => { hero.maxHp += 5; hero.hp += 5; } },
    { id: 'emerald', name: 'Emerald', desc: '+15 Gold (Instant)', icon: '🟢', effect: () => { hero.gold += 15; } },
    { id: 'wand', name: 'Magic Wand', desc: 'Potions heal +2 HP', icon: '🪄', effect: () => { } },
    { id: 'paint', name: 'War Paint', desc: 'Reflects +1 DMG (Stacks with Thorns)', icon: '🎨', effect: () => { } },
    { id: 'fang', name: 'Vampire Fang', desc: 'Heal 1 HP after combat', icon: '🧛', effect: () => { } },
    { id: 'idol', name: 'Golden Idol', desc: '+20 Gold (Instant)', icon: '🗿', effect: () => { hero.gold += 20; } },
    { id: 'holy_water', name: 'Holy Water', desc: 'Potions also give +1 Shield', icon: '💧', effect: () => { } },
    { id: 'heavy_boots', name: 'Heavy Boots', desc: '-1 Dmg from Ambushes', icon: '🥾', effect: () => { } },
    { id: 'gauntlet', name: 'Iron Gauntlet', desc: '+1 Attack (Permanent)', icon: '🥊', effect: () => { hero.attack += 1; } },
    { id: 'dragon_scale', name: 'Dragon Scale', desc: '+10 Max HP (Instant)', icon: '🐉', effect: () => { hero.maxHp += 10; hero.hp += 10; } },
    { id: 'tower_shield', name: 'Tower Shield', desc: 'Shield Cards grant +2 Shield', icon: '🏯', effect: () => { } },
    { id: 'merchant_badge', name: 'Merchant Badge', desc: 'Heal 1 HP when collecting Gold', icon: '🏷️', effect: () => { } },
    { id: 'slayer_crown', name: 'Slayer Crown', desc: 'Gain +1 Gold after combat', icon: '👑', effect: () => { } },
    { id: 'feather', name: 'Phoenix Feather', desc: 'Revive with 10 HP on death (Consumable)', icon: '🪶', effect: () => { } },
    { id: 'midas', name: 'Midas Glove', desc: 'Monsters drop +2 Gold on death', icon: '🧤', effect: () => { } },
    { id: 'compass', name: 'Compass', desc: 'Higher chance to find Portals', icon: '🧭', effect: () => { } }
];

const CLASSES = [
    {
        id: 'warrior', name: 'Warrior', icon: '⚔️', desc: 'Start with 20 HP & Thorns.',
        setup: () => { hero.maxHp = 20; hero.hp = 20; addItemById('spike'); }
    },
    {
        id: 'rogue', name: 'Rogue', icon: '🗡️', desc: 'Start with 10 Gold & Vampire Fang.',
        setup: () => { hero.maxHp = 12; hero.hp = 12; hero.gold = 10; addItemById('fang'); }
    },
    {
        id: 'wizard', name: 'Wizard', icon: '🔮', desc: 'Start with Magic Wand (Potions++).',
        setup: () => { hero.maxHp = 12; hero.hp = 12; addItemById('wand'); }
    }
];
