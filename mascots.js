(function () {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    // ── Per-page speech bubble messages ───────────────────────────────────────
    const scripts = {
        'index.html': {
            gopi: [
                'Hey Neha! 👋',
                'I made this for you 🎂',
                'Go on... open it! 😊',
                'Trust me 🌸',
            ],
            neha: [
                'A surprise? 🎁',
                'Hmm... 🤔',
                'What did he do now 😅',
                'Okay fine 👀',
            ],
        },
        'proposal.html': {
            gopi: [
                'Neha... 😬',
                'I need you to read this',
                '14/36 is not US 💫',
                '60+25 > 15, right? 🙏',
            ],
            neha: [
                'Gopi... 🥺',
                'Hmm... thinking 🤔',
                'You called my MOM 😂',
                'But you were genuine...',
            ],
        },
        'yes.html': {
            gopi: [
                'Neha said Haan!! 🎉',
                'Best birthday gift!',
                'I KNEW it! 😄',
                'Told you 14/36 is fine 😏',
            ],
            neha: [
                'Okay okay FINE 😩',
                'Don\'t call mom again 😂',
                'This guy built a website 😭',
                'Happy bday to me! 🎂',
            ],
        },
    };

    const msgs = scripts[page] || scripts['index.html'];

    // ── Page class for pose animations ───────────────────────────────────────
    const pageClass = {
        'index.html':   'page-landing',
        'proposal.html':'page-proposal',
        'yes.html':     'page-yes',
    }[page] || 'page-landing';

    // ── Build a mascot element ────────────────────────────────────────────────
    function buildMascot(id, face, torsoColor, legColor, side, startMsg) {
        const wrap = document.createElement('div');
        wrap.className = `mascot mascot-${side} ${id}-mascot ${pageClass}`;
        wrap.id = `${id}Mascot`;

        wrap.innerHTML = `
            <div class="mascot-bubble" id="${id}Bubble">${startMsg}</div>
            <div class="mascot-figure" style="position:relative">
                <div class="char-arms">
                    <div class="char-arm left-arm"  style="background:${torsoColor}"></div>
                    <div class="char-arm right-arm" style="background:${torsoColor}"></div>
                </div>
                <div class="cat-head">
                    <div class="cat-ear left-ear"></div>
                    <div class="cat-ear right-ear"></div>
                    <div class="cat-face">${face}</div>
                </div>
                <div class="char-torso" style="background:${torsoColor}"></div>
                <div class="char-legs">
                    <div class="char-leg" style="background:${legColor}"></div>
                    <div class="char-leg" style="background:${legColor}"></div>
                </div>
            </div>`;

        return wrap;
    }

    // ── Cycle messages in a bubble ────────────────────────────────────────────
    function cycleMsgs(bubbleId, list, intervalMs, initialDelay) {
        let i = 0;
        setTimeout(() => {
            setInterval(() => {
                i = (i + 1) % list.length;
                const el = document.getElementById(bubbleId);
                if (!el) return;
                el.style.opacity = '0';
                setTimeout(() => {
                    el.textContent = list[i];
                    el.style.opacity = '1';
                }, 300);
            }, intervalMs);
        }, initialDelay);
    }

    // ── Mount on DOM ready ────────────────────────────────────────────────────
    function mount() {
        const gopi = buildMascot('gopi', '🐱', '#8b5cf6', '#5b21b6', 'left',  msgs.gopi[0]);
        const neha = buildMascot('neha', '😸', '#ec4899', '#9d174d', 'right', msgs.neha[0]);
        document.body.appendChild(gopi);
        document.body.appendChild(neha);

        cycleMsgs('gopiBubble', msgs.gopi, 3200,    600);
        cycleMsgs('nehaBubble', msgs.neha, 3200,   2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
