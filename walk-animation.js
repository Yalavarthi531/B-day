(function () {
    const canvas = document.getElementById('walkCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Responsive canvas
    const W = Math.min(480, (window.innerWidth || 480) - 24);
    const H = 200;
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    const GY   = H * 0.76;   // ground Y
    const LEG  = 25, BODY = 24, ARM = 16, HEAD = 10;
    const SX   = W - 42, SY = H * 0.21;   // sun position

    const CENTER = W / 2;
    const GAP    = 52;                     // gap between them when they meet
    const BMX    = CENTER - GAP / 2;       // boy   meeting X
    const GMX    = CENTER + GAP / 2;       // girl  meeting X

    let bx = -35, gx = W + 35;
    let wc = 0;
    let phase = 1, pt = 0;
    let ha = 0, hs = 0, sglow = 0;
    let raf;

    // ── Scene ────────────────────────────────────────────────────
    function drawBg() {
        const g = ctx.createLinearGradient(0, 0, 0, GY);
        g.addColorStop(0, '#0c0519'); g.addColorStop(1, '#311473');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, GY);

        const g2 = ctx.createLinearGradient(0, GY, 0, H);
        g2.addColorStop(0, '#1e0a47'); g2.addColorStop(1, '#0a0220');
        ctx.fillStyle = g2; ctx.fillRect(0, GY, W, H - GY);

        // ground line
        ctx.strokeStyle = 'rgba(192,132,252,0.28)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();
    }

    function drawSun(gl) {
        // Glow halos
        [60, 42, 26].forEach((r, i) => {
            ctx.fillStyle = `rgba(251,191,36,${(0.05 + gl * 0.07) * (1 - i * 0.28)})`;
            ctx.beginPath(); ctx.arc(SX, SY, r + gl * 20, 0, Math.PI * 2); ctx.fill();
        });
        // Core
        ctx.fillStyle = `rgba(255,224,60,${0.85 + gl * 0.15})`;
        ctx.beginPath(); ctx.arc(SX, SY, 13 + gl * 5, 0, Math.PI * 2); ctx.fill();
        // Rays
        ctx.strokeStyle = `rgba(251,191,36,${0.38 + gl * 0.45})`;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
            const a = i / 8 * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(SX + Math.cos(a) * (18 + gl * 3), SY + Math.sin(a) * (18 + gl * 3));
            ctx.lineTo(SX + Math.cos(a) * (28 + gl * 9), SY + Math.sin(a) * (28 + gl * 9));
            ctx.stroke();
        }
    }

    // ── Stick figure ─────────────────────────────────────────────
    // Drawn centred at (0,0); translate + optional horizontal flip before calling.
    function drawFig(x, wc, isBoy, facingRight) {
        ctx.save();
        ctx.translate(x, 0);
        if (!facingRight) ctx.scale(-1, 1);

        const hy  = GY - 1;         // hip   Y
        const sy  = hy - BODY;      // shoulder Y
        const hcy = sy - HEAD - 2;  // head centre Y

        const ls = Math.sin(wc) * 0.42;      // leg  swing
        const as = -Math.sin(wc) * 0.36;     // arm  swing (opposite)

        const bodyC = isBoy ? '#8b5cf6' : '#ec4899';
        const pantC = isBoy ? '#5b21b6' : '#9d174d';

        ctx.lineCap = 'round'; ctx.lineJoin = 'round';

        // ── Back leg ──
        ctx.strokeStyle = pantC; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, hy);
        ctx.lineTo(-Math.sin(ls) * LEG, hy + Math.cos(Math.abs(ls)) * (LEG - 2));
        ctx.stroke();

        // ── Body ──
        ctx.strokeStyle = bodyC; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(0, sy); ctx.stroke();

        // ── Girl skirt ──
        if (!isBoy) {
            ctx.fillStyle = '#db2777'; ctx.strokeStyle = '#9d174d'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-5, sy + BODY * 0.35);
            ctx.lineTo(-12, hy); ctx.lineTo(12, hy); ctx.lineTo(5, sy + BODY * 0.35);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }

        // ── Front leg ──
        ctx.strokeStyle = pantC; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, hy);
        ctx.lineTo(Math.sin(ls) * LEG, hy + Math.cos(Math.abs(ls)) * (LEG - 2));
        ctx.stroke();

        // ── Back arm ──
        ctx.strokeStyle = bodyC; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(-Math.sin(as) * ARM, sy + Math.cos(Math.abs(as)) * ARM * 0.8);
        ctx.stroke();

        // ── Front arm ──
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(Math.sin(as) * ARM, sy + Math.cos(Math.abs(as)) * ARM * 0.8);
        ctx.stroke();

        // ── Head ──
        ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, hcy, HEAD, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // ── Hair ──
        ctx.fillStyle = isBoy ? '#78350f' : '#6b1a0a';
        ctx.beginPath();
        if (isBoy) {
            // Short tuft on top
            ctx.arc(0, hcy - HEAD, 7, Math.PI, 0, false);
            ctx.closePath();
        } else {
            // Full top + longer on one side
            ctx.arc(0, hcy, HEAD + 3, Math.PI, 0, false);
            ctx.closePath();
        }
        ctx.fill();

        // ── Eyes ──
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath(); ctx.arc(-2.8, hcy - 1.5, 1.7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(2.8,  hcy - 1.5, 1.7, 0, Math.PI * 2); ctx.fill();

        // ── Smile ──
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, hcy + 2, 3.5, 0.18, Math.PI - 0.18); ctx.stroke();

        ctx.restore();
    }

    // ── Heart ────────────────────────────────────────────────────
    function drawHeart(cx, cy, sc, al) {
        if (al <= 0 || sc <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.min(1, al);
        ctx.translate(cx, cy);
        ctx.scale(sc * 0.68, sc * 0.68);
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.bezierCurveTo(0, -6, -15, -9, -15, 0);
        ctx.bezierCurveTo(-15, 9,  0,  18,  0, 24);
        ctx.bezierCurveTo(0,  18, 15,   9, 15,  0);
        ctx.bezierCurveTo(15, -9,  0,  -6,  0,  5);
        ctx.fill();
        ctx.restore();
    }

    // ── Animation loop ───────────────────────────────────────────
    function tick() {
        ctx.clearRect(0, 0, W, H);
        drawBg();
        drawSun(sglow);

        wc += 0.09;

        if (phase === 1) {
            // Walk toward each other
            bx = Math.min(bx + 1.5, BMX);
            gx = Math.max(gx - 1.5, GMX);
            if (bx >= BMX) { phase = 2; pt = 0; }

        } else if (phase === 2) {
            // Stop and let heart appear
            pt++;
            ha = Math.min(1, pt / 22);
            hs = pt < 18 ? pt / 18 : 1 + Math.sin(pt * 0.13) * 0.1;
            if (pt > 90) { phase = 3; pt = 0; }

        } else {
            // Walk together toward the sun
            pt++;
            bx += 1.2;
            gx = bx + GAP;
            sglow = Math.min(1, pt / 90);
            ha = Math.max(0, ha - 0.013);
            if (bx > W + 55) { cancelAnimationFrame(raf); return; }
        }

        // Girl faces left only in phase 1
        const girlRight = phase !== 1;

        drawFig(bx, wc,              true,  true);
        drawFig(gx, wc + Math.PI,    false, girlRight);

        if (ha > 0) {
            drawHeart(
                (bx + gx) / 2,
                GY - BODY - LEG - HEAD - 14,
                hs, ha
            );
        }

        raf = requestAnimationFrame(tick);
    }

    // Start after confetti (2 s delay)
    setTimeout(() => { raf = requestAnimationFrame(tick); }, 2000);
})();
