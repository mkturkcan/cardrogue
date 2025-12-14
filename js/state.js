/* --- GAME STATE --- */
let grid = [];
let hero = { r: 2, c: 1, hp: 15, maxHp: 15, shield: 0, attack: 0, gold: 0, xp: 0, level: 1, nextLevelXp: 10, inventory: [] };
let turn = 0;
let isLocked = false;

// Tutorial State
let tutorialStep = 0; // 0: Move, 1: Gravity, 2: Combat logic, 3: Ambush seen
let hasSeenAmbushTip = false;

let currentArea = AREAS[0];
