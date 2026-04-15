(function () {
    const canvas = document.getElementById('saptapadiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = Math.min(480, (window.innerWidth || 480) - 48);
    const H = 140;
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    const STEP_COUNT = 7;
    const STEP_Y     = H * 0.70;
    const PAD        = W * 0.07;
    const stepX      = Array.from({ length: STEP_COUNT },
        (_, i) => PAD + (i / (STEP_COUNT - 1)) * (W - 2 * PAD));

    // ── State ────────────────────────────────────────────────
    function fresh() {
        return {
            coupleX: stepX[0],
            step:    0,          // which step they're at / heading to
            done:    [],         // completed step indices
            phase:   'pause',    // 'walking' | 'pause'
            pt:      0,
            wc:      0,
        };
    }
    let s = fresh();

    // ── Draw a single step stone ──────────────────────────────
    function drawStep(x, idx) {
        const done   = s.done.includes(idx);
        const active = (idx === s.step && s.phase === 'pause');
        const W_S = 28, H_S = 10, R = 4;

        ctx.save();
        if (active) {
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur  = 16;
            ctx.fillStyle   = '#fbbf24';
        } else if (done) {
            ctx.shadowColor = 'rgba(251,191,36,0.5)';
            ctx.shadowBlur  = 6;
            ctx.fillStyle   = 'rgba(251,191,36,0.55)';
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.13)';
        }

        // Rounded rect (polyfill)
        const sx = x - W_S / 2, sy = STEP_Y;
        ctx.beginPath();
        ctx.moveTo(sx + R, sy);
        ctx.lineTo(sx + W_S - R, sy);
        ctx.quadraticCurveTo(sx + W_S, sy, sx + W_S, sy + R);
        ctx.lineTo(sx + W_S, sy + H_S - R);
        ctx.quadraticCurveTo(sx + W_S, sy + H_S, sx + W_S - R, sy + H_S);
        ctx.lineTo(sx + R, sy + H_S);
        ctx.quadraticCurveTo(sx, sy + H_S, sx, sy + H_S - R);
        ctx.lineTo(sx, sy + R);
        ctx.quadraticCurveTo(sx, sy, sx + R, sy);
        ctx.closePath();
        ctx.fill();

        // Step number
        ctx.shadowBlur = 0;
        ctx.fillStyle  = (active || done) ? '#1a1030' : '#64748b';
        ctx.font       = `bold 8px Nunito, sans-serif`;
        ctx.textAlign  = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(idx + 1, x, STEP_Y + H_S / 2);

        // Footprints above completed steps
        if (done) {
            ctx.font = '11px serif';
            ctx.fillText('👣', x, STEP_Y - 12);
        }
        ctx.restore();
    }

    // ── Draw one stick figure ─────────────────────────────────
    function drawFig(cx, baseY, wc, isBoy, walking) {
        const LEG = 13, BODY = 11, HEAD = 5;
        const ls = walking ? Math.sin(wc) * 0.32 : 0;
        const bodyC = isBoy ? '#a78bfa' : '#f472b6';
        const pantC = isBoy ? '#5b21b6' : '#9d174d';

        ctx.save();
        ctx.translate(cx, baseY);
        ctx.lineCap = 'round';

        // Back leg
        ctx.strokeStyle = pantC; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-Math.sin(ls) * LEG, Math.cos(Math.abs(ls)) * LEG);
        ctx.stroke();

        // Body
        ctx.strokeStyle = bodyC; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -BODY); ctx.stroke();

        // Girl skirt
        if (!isBoy) {
            ctx.fillStyle = '#db2777';
            ctx.beginPath();
            ctx.moveTo(-3, -BODY * 0.6); ctx.lineTo(-7, 0);
            ctx.lineTo(7, 0);            ctx.lineTo(3, -BODY * 0.6);
            ctx.closePath(); ctx.fill();
        }

        // Front leg
        ctx.strokeStyle = pantC; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(ls) * LEG, Math.cos(Math.abs(ls)) * LEG);
        ctx.stroke();

        // Head
        const hcy = -BODY - HEAD - 1;
        ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, hcy, HEAD, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Hair
        ctx.fillStyle = isBoy ? '#78350f' : '#6b1a0a';
        ctx.beginPath();
        ctx.arc(0, hcy - HEAD, isBoy ? HEAD * 0.7 : HEAD + 1, Math.PI, 0, false);
        ctx.closePath(); ctx.fill();

        ctx.restore();
    }

    // ── Draw couple (holding hands) ───────────────────────────
    function drawCouple(cx, wc, walking) {
        const GAP   = 15;
        const baseY = STEP_Y - 2;
        const boyX  = cx - GAP / 2;
        const girlX = cx + GAP / 2;
        const armY  = baseY - 18;

        // Joined hands line
        ctx.save();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth   = 2;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(boyX + 4, armY);
        ctx.lineTo(girlX - 4, armY);
        ctx.stroke();
        // Heart at hands
        ctx.font = '9px serif';
        ctx.textAlign = 'center';
        ctx.fillText('❤️', (boyX + girlX) / 2, armY - 2);
        ctx.restore();

        drawFig(boyX,  baseY, wc,             true,  walking);
        drawFig(girlX, baseY, wc + Math.PI,   false, walking);
    }

    // ── Animation tick ────────────────────────────────────────
    function tick() {
        ctx.clearRect(0, 0, W, H);

        // Ground line
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD * 0.5, STEP_Y + 10);
        ctx.lineTo(W - PAD * 0.5, STEP_Y + 10);
        ctx.stroke();
        ctx.restore();

        // Steps
        for (let i = 0; i < STEP_COUNT; i++) drawStep(stepX[i], i);

        // Connecting path between steps
        ctx.save();
        ctx.strokeStyle = 'rgba(251,191,36,0.12)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(stepX[0], STEP_Y + 5);
        for (let i = 1; i < STEP_COUNT; i++) ctx.lineTo(stepX[i], STEP_Y + 5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Update state
        if (s.phase === 'walking') {
            s.wc += 0.16;
            const target = stepX[s.step];
            const dx = target - s.coupleX;
            if (Math.abs(dx) < 1.8) {
                s.coupleX = target;
                s.phase   = 'pause';
                s.pt      = 0;
                s.done.push(s.step);
            } else {
                s.coupleX += dx > 0 ? Math.min(1.8, dx) : Math.max(-1.8, dx);
            }
        } else {
            s.pt++;
            if (s.step < STEP_COUNT - 1) {
                if (s.pt > 38) { s.step++; s.phase = 'walking'; }
            } else {
                // All 7 steps done — hold then reset
                if (s.pt > 140) s = fresh();
            }
        }

        drawCouple(s.coupleX, s.wc, s.phase === 'walking');

        requestAnimationFrame(tick);
    }

    setTimeout(() => requestAnimationFrame(tick), 600);
})();
