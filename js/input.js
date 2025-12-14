/* --- DRAG LOGIC --- */
let dragEl = null;
let startX = 0, startY = 0;

function setupDrag(el) {
    setup3DHover(el);
    el.addEventListener('mousedown', onDragStart);
    el.addEventListener('touchstart', onDragStart, { passive: false });
}

function highlightMoves(active) {
    document.querySelectorAll('.card-wrapper').forEach(el => el.classList.remove('valid-move'));
    if (!active) return;
    const r = hero.r;
    const c = hero.c;
    const neighbors = [
        { r: r - 1, c: c }, { r: r + 1, c: c },
        { r: r, c: c - 1 }, { r: r, c: c + 1 }
    ];
    neighbors.forEach(pos => {
        if (pos.r >= 0 && pos.r < ROWS && pos.c >= 0 && pos.c < COLS) {
            const slot = document.querySelector(`.card-slot[data-r="${pos.r}"][data-c="${pos.c}"]`);
            if (slot && slot.children.length > 0) {
                const wrapper = slot.querySelector('.card-wrapper');
                if (wrapper) wrapper.classList.add('valid-move');
            }
        }
    });
}

function onDragStart(e) {
    if (isLocked) return;
    const touch = e.touches ? e.touches[0] : e;
    dragEl = e.currentTarget;
    startX = touch.clientX;
    startY = touch.clientY;
    dragEl.classList.add('moving');
    highlightMoves(true);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchend', onDragEnd);
}

function onDragMove(e) {
    if (!dragEl) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    dragEl.style.transform = `translate(${dx}px, ${dy}px) rotateX(20deg)`;
}

function onDragEnd(e) {
    if (!dragEl) return;
    const touch = e.changedTouches ? e.changedTouches[0] : e;
    highlightMoves(false);
    dragEl.style.visibility = 'hidden';
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    dragEl.style.visibility = 'visible';
    const slot = dropTarget ? dropTarget.closest('.card-slot') : null;
    let moved = false;
    if (slot) {
        const tr = parseInt(slot.dataset.r);
        const tc = parseInt(slot.dataset.c);
        const dr = Math.abs(tr - hero.r);
        const dc = Math.abs(tc - hero.c);
        if ((dr + dc) === 1) {
            moved = true;
            attemptMove(tr, tc);
        }
    }
    if (!moved) {
        dragEl.style.transform = '';
        dragEl.classList.remove('moving');
    }
    dragEl = null;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchend', onDragEnd);
}
