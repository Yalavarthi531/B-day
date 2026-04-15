(function () {
    const canvas = document.getElementById('saptapadiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = Math.min(480, (window.innerWidth || 480) - 48);
    const H = 185;
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    const STEP_COUNT = 7;
    const STEP_Y     = H * 0.66;
    const PAD        = W * 0.07;
    const GAP        = 16;   // side-by-side spacing between figures
    const SPEED      = 1.8;

    const stepX = Array.from({ length: STEP_COUNT },
        (_, i) => PAD + (i / (STEP_COUNT - 1)) * (W - 2 * PAD));

    // ── Particle pools ──────────────────────────────────────────
    const petals  = [];
    const ripples = [];
    const hearts  = [];

    function spawnPetal(x, y) {
        petals.push({
            x, y,
            vx: (Math.random() - 0.5) * 1.0,
            vy: -0.5 - Math.random() * 0.7,
            alpha: 0.85,
            size:  2.5 + Math.random() * 2.5,
            color: ['#f472b6','#fbbf24','#fde68a','#c084fc'][Math.floor(Math.random() * 4)],
            rot:   Math.random() * Math.PI * 2,
            spin:  (Math.random() - 0.5) * 0.12,
        });
    }

    function spawnRipple(x) {
        ripples.push({ x, y: STEP_Y + 6, r: 2, alpha: 0.9 });
    }

    function spawnHeart(x) {
        hearts.push({
            x: x + (Math.random() - 0.5) * 24,
            y: STEP_Y - 30,
            alpha: 1,
            vy: -0.55 - Math.random() * 0.4,
            size: 9 + Math.random() * 5,
        });
    }

    // ── State ───────────────────────────────────────────────────
    function fresh() {
        return {
            coupleX: -65,   // center between the two figures
            step:    0,
            atStep:  false,
            pt:      0,
            wc:      0,
            done:    [],
            petalT:  0,
            celebT:  0,
        };
    }
    let s = fresh();

    // ── Draw step stone ─────────────────────────────────────────
    function drawStep(x, idx) {
        const done   = s.done.includes(idx);
        const active = !done && idx === s.step && s.atStep;
        const W_S = 30, H_S = 11, R = 5;

        ctx.save();
        if (active) {
            ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 22;
            ctx.fillStyle   = '#fde68a';
        } else if (done) {
            ctx.shadowColor = 'rgba(251,191,36,0.5)'; ctx.shadowBlur = 8;
            ctx.fillStyle   = 'rgba(251,191,36,0.6)';
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.11)';
        }

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

        ctx.shadowBlur   = 0;
        ctx.fillStyle    = (active || done) ? '#1a1030' : '#475569';
        ctx.font         = 'bold 8px Nunito, sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(idx + 1, x, STEP_Y + H_S / 2);

        if (done) {
            ctx.font = '10px serif';
            ctx.fillText('👣', x, STEP_Y - 15);
        }
        ctx.restore();
    }

    // ── Draw one stick figure ────────────────────────────────────
    function drawFig(cx, baseY, wc, isBoy, walking) {
        const LEG = 13, BODY = 12, HEAD = 5.5;
        const ls = walking ? Math.sin(wc) * 0.38 : 0;
        const bodyC = isBoy ? '#a78bfa' : '#f472b6';
        const pantC = isBoy ? '#5b21b6' : '#9d174d';
        // Inner side = right for boy (toward girl), left for girl (toward boy)
        const innerSign = isBoy ? 1 : -1;

        ctx.save();
        ctx.translate(cx, baseY);
        ctx.lineCap = 'round';

        // Back leg
        ctx.strokeStyle = pantC; ctx.lineWidth = 2.3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-Math.sin(ls) * LEG, Math.cos(Math.abs(ls)) * LEG);
        ctx.stroke();

        // Body
        ctx.strokeStyle = bodyC; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -BODY); ctx.stroke();

        // Clothing
        if (!isBoy) {
            ctx.fillStyle = '#be185d';
            ctx.beginPath();
            ctx.moveTo(-4, -BODY * 0.55); ctx.lineTo(-8, 0);
            ctx.lineTo(8, 0);             ctx.lineTo(4, -BODY * 0.55);
            ctx.closePath(); ctx.fill();
            if (walking) {
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = '#fda4af'; ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(-2, -BODY * 0.85);
                ctx.quadraticCurveTo(-9 - Math.sin(wc) * 3, -BODY * 0.5, -5, -BODY * 0.05);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        } else {
            ctx.strokeStyle = 'rgba(167,139,250,0.5)'; ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-3, -BODY * 0.9); ctx.lineTo(-3, -BODY * 0.3);
            ctx.stroke();
        }

        // Front leg
        ctx.strokeStyle = pantC; ctx.lineWidth = 2.3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(ls) * LEG, Math.cos(Math.abs(ls)) * LEG);
        ctx.stroke();

        // Outer arm swings freely
        const armSwing = walking ? Math.sin(wc + Math.PI) * 0.28 : 0;
        ctx.strokeStyle = bodyC; ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -BODY * 0.78);
        ctx.lineTo(-innerSign * (5 + Math.sin(armSwing) * 3), -BODY * 0.3);
        ctx.stroke();

        // Inner arm extended toward partner (held-hand side)
        ctx.beginPath();
        ctx.moveTo(0, -BODY * 0.78);
        ctx.lineTo(innerSign * 6, -BODY * 0.52);   // reaches toward partner
        ctx.stroke();

        // Head
        const hcy = -BODY - HEAD - 1.5;
        ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.arc(0, hcy, HEAD, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Hair
        ctx.fillStyle = isBoy ? '#78350f' : '#6b1a0a';
        ctx.beginPath();
        ctx.arc(0, hcy - HEAD * 0.6, isBoy ? HEAD * 0.75 : HEAD + 1.2, Math.PI, 0, false);
        ctx.closePath(); ctx.fill();

        if (!isBoy) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(0, hcy - 1.2, 1.3, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }

    // ── Draw couple walking hand-in-hand ────────────────────────
    function drawCouple(cx, wc, walking) {
        const boyX  = cx - GAP / 2;
        const girlX = cx + GAP / 2;
        const armY  = STEP_Y - 2 - STEP_Y * 0 - 20;   // hand height

        // Held-hands connector line (always visible)
        ctx.save();
        ctx.strokeStyle = walking ? 'rgba(251,191,36,0.7)' : '#fbbf24';
        ctx.lineWidth   = 2;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(boyX + 5, armY);
        ctx.lineTo(girlX - 5, armY);
        ctx.stroke();

        // Small ❤️ between hands
        ctx.font      = walking ? '7px serif' : '9px serif';
        ctx.textAlign = 'center';
        ctx.fillText('❤️', cx, armY - 1);
        ctx.restore();

        // Girl drawn first (rendered behind boy)
        drawFig(girlX, STEP_Y - 2, wc + Math.PI * 0.9, false, walking);
        drawFig(boyX,  STEP_Y - 2, wc,                  true,  walking);
    }

    // ── Animation tick ───────────────────────────────────────────
    function tick() {
        ctx.clearRect(0, 0, W, H);

        // Ground line
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD * 0.3, STEP_Y + 12); ctx.lineTo(W - PAD * 0.3, STEP_Y + 12);
        ctx.stroke();
        ctx.restore();

        // Dotted path
        ctx.save();
        ctx.strokeStyle = 'rgba(251,191,36,0.13)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(stepX[0], STEP_Y + 5);
        for (let i = 1; i < STEP_COUNT; i++) ctx.lineTo(stepX[i], STEP_Y + 5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Steps
        for (let i = 0; i < STEP_COUNT; i++) drawStep(stepX[i], i);

        // Ripples
        for (let i = ripples.length - 1; i >= 0; i--) {
            const r = ripples[i];
            r.r += 1.6; r.alpha -= 0.022;
            if (r.alpha <= 0) { ripples.splice(i, 1); continue; }
            ctx.save();
            ctx.strokeStyle = `rgba(251,191,36,${r.alpha})`; ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, r.r, r.r * 0.28, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Petals — trail behind the couple
        s.petalT++;
        if (!s.atStep && s.petalT % 3 === 0) spawnPetal(s.coupleX, STEP_Y - 4);
        for (let i = petals.length - 1; i >= 0; i--) {
            const p = petals[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.035;
            p.alpha -= 0.013; p.rot += p.spin;
            if (p.alpha <= 0) { petals.splice(i, 1); continue; }
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Floating hearts
        for (let i = hearts.length - 1; i >= 0; i--) {
            const h = hearts[i];
            h.y += h.vy; h.alpha -= 0.01;
            if (h.alpha <= 0) { hearts.splice(i, 1); continue; }
            ctx.save();
            ctx.globalAlpha = h.alpha;
            ctx.font = `${h.size}px serif`; ctx.textAlign = 'center';
            ctx.fillText('❤️', h.x, h.y);
            ctx.restore();
        }

        // ── Logic ────────────────────────────────────────────────
        const target = stepX[s.step];

        if (!s.atStep) {
            s.wc += 0.18;
            const dx = target - s.coupleX;
            if (Math.abs(dx) < 2) {
                s.coupleX = target;
                s.atStep  = true;
                s.pt      = 0;
                s.done.push(s.step);
                spawnRipple(target);
                for (let i = 0; i < 5; i++) spawnHeart(target);
            } else {
                s.coupleX += dx > 0 ? Math.min(SPEED, dx) : Math.max(-SPEED, dx);
            }
        } else {
            s.pt++;
            if (s.step < STEP_COUNT - 1) {
                if (s.pt > 50) { s.step++; s.atStep = false; }
            } else {
                s.celebT++;
                if (s.celebT % 10 === 0) spawnHeart(s.coupleX + (Math.random() - 0.5) * 20);
                if (s.pt > 180) {
                    s = fresh();
                    petals.length = 0;
                    hearts.length = 0;
                    ripples.length = 0;
                }
            }
        }

        drawCouple(s.coupleX, s.wc, !s.atStep);

        requestAnimationFrame(tick);
    }

    setTimeout(() => requestAnimationFrame(tick), 600);
})();
