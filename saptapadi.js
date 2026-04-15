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
    const BOY_GAP    = 14;   // girl trails this many px behind boy
    const SPEED_BOY  = 2.0;
    const SPEED_GIRL = 1.6;

    const stepX = Array.from({ length: STEP_COUNT },
        (_, i) => PAD + (i / (STEP_COUNT - 1)) * (W - 2 * PAD));

    // ── Particle pools ─────────────────────────────────────────
    const petals  = [];
    const ripples = [];
    const hearts  = [];

    function spawnPetal(x, y) {
        petals.push({
            x, y,
            vx: -0.3 - Math.random() * 0.8,   // drift leftward/backward
            vy: -0.4 - Math.random() * 0.6,
            alpha: 0.85,
            size: 2.5 + Math.random() * 2.5,
            color: ['#f472b6','#fbbf24','#fde68a','#c084fc'][Math.floor(Math.random()*4)],
            rot: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.12,
        });
    }

    function spawnRipple(x) {
        ripples.push({ x, y: STEP_Y + 6, r: 2, alpha: 0.9 });
    }

    function spawnHeart(x) {
        hearts.push({
            x: x + (Math.random() - 0.5) * 22,
            y: STEP_Y - 28,
            alpha: 1,
            vy: -0.55 - Math.random() * 0.4,
            size: 9 + Math.random() * 5,
        });
    }

    // ── State ──────────────────────────────────────────────────
    function fresh() {
        return {
            boyX:      -55,
            girlX:     -78,
            step:      0,
            boyDone:   false,
            girlDone:  false,
            pt:        0,
            wc:        0,
            done:      [],
            petalT:    0,
            celebT:    0,
        };
    }
    let s = fresh();

    // ── Draw step stone ────────────────────────────────────────
    function drawStep(x, idx) {
        const done   = s.done.includes(idx);
        const active = !done && idx === s.step && s.boyDone;
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

    // ── Draw one stick figure ──────────────────────────────────
    function drawFig(cx, baseY, wc, isBoy, walking) {
        const LEG = 13, BODY = 12, HEAD = 5.5;
        const ls = walking ? Math.sin(wc) * 0.38 : 0;
        const bodyC = isBoy ? '#a78bfa' : '#f472b6';
        const pantC = isBoy ? '#5b21b6' : '#9d174d';

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

        // Clothing detail
        if (!isBoy) {
            // Saree / skirt
            ctx.fillStyle = '#be185d';
            ctx.beginPath();
            ctx.moveTo(-4, -BODY * 0.55); ctx.lineTo(-8, 0);
            ctx.lineTo(8, 0);             ctx.lineTo(4, -BODY * 0.55);
            ctx.closePath(); ctx.fill();
            // Dupatta flutter
            if (walking) {
                ctx.globalAlpha = 0.55;
                ctx.strokeStyle = '#fda4af'; ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(-2, -BODY * 0.85);
                ctx.quadraticCurveTo(-9 - Math.sin(wc) * 4, -BODY * 0.5, -6, -BODY * 0.05);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        } else {
            // Kurta collar line
            ctx.strokeStyle = 'rgba(167,139,250,0.55)'; ctx.lineWidth = 1.2;
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

        // Arms — swing opposite to legs
        const armSwing = walking ? Math.sin(wc + Math.PI) * 0.3 : 0;
        ctx.strokeStyle = bodyC; ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -BODY * 0.78);
        ctx.lineTo(-5 - Math.sin(armSwing) * 3, -BODY * 0.28);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -BODY * 0.78);
        ctx.lineTo(5 + Math.sin(armSwing) * 3, -BODY * 0.28);
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

        // Girl: bindi
        if (!isBoy) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(0, hcy - 1.2, 1.3, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }

    // ── Animation tick ─────────────────────────────────────────
    function tick() {
        ctx.clearRect(0, 0, W, H);

        // Ground line
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD * 0.3, STEP_Y + 12);
        ctx.lineTo(W - PAD * 0.3, STEP_Y + 12);
        ctx.stroke();
        ctx.restore();

        // Dotted path between steps
        ctx.save();
        ctx.strokeStyle = 'rgba(251,191,36,0.13)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(stepX[0], STEP_Y + 5);
        for (let i = 1; i < STEP_COUNT; i++) ctx.lineTo(stepX[i], STEP_Y + 5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Draw steps
        for (let i = 0; i < STEP_COUNT; i++) drawStep(stepX[i], i);

        // Ripples
        for (let i = ripples.length - 1; i >= 0; i--) {
            const r = ripples[i];
            r.r += 1.6; r.alpha -= 0.022;
            if (r.alpha <= 0) { ripples.splice(i, 1); continue; }
            ctx.save();
            ctx.strokeStyle = `rgba(251,191,36,${r.alpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, r.r, r.r * 0.28, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Petals
        s.petalT++;
        const anyWalking = !s.boyDone || !s.girlDone;
        if (anyWalking && s.petalT % 3 === 0) {
            spawnPetal(s.girlX, STEP_Y - 4);
        }
        for (let i = petals.length - 1; i >= 0; i--) {
            const p = petals[i];
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.035; p.alpha -= 0.013; p.rot += p.spin;
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
            ctx.font = `${h.size}px serif`;
            ctx.textAlign = 'center';
            ctx.fillText('❤️', h.x, h.y);
            ctx.restore();
        }

        // ── Logic ─────────────────────────────────────────────
        const boyTarget  = stepX[s.step];
        const girlTarget = stepX[s.step] - BOY_GAP;

        if (!s.boyDone) {
            s.wc += 0.18;
            const dx = boyTarget - s.boyX;
            if (Math.abs(dx) < 2) {
                s.boyX   = boyTarget;
                s.boyDone = true;
                spawnRipple(boyTarget);
                // Boy waits; girl still walking
            } else {
                s.boyX += dx > 0 ? Math.min(SPEED_BOY, dx) : Math.max(-SPEED_BOY, dx);
            }
        }

        if (s.boyDone && !s.girlDone) {
            // Boy waiting — gentle bob
            s.wc += 0.06;
            const dx = girlTarget - s.girlX;
            if (Math.abs(dx) < 2) {
                s.girlX   = girlTarget;
                s.girlDone = true;
                s.pt       = 0;
                s.done.push(s.step);
                for (let i = 0; i < 5; i++) spawnHeart(boyTarget - BOY_GAP / 2);
            } else {
                s.wc += 0.1;   // girl walking counter
                s.girlX += dx > 0 ? Math.min(SPEED_GIRL, dx) : Math.max(-SPEED_GIRL, dx);
            }
        }

        if (s.boyDone && s.girlDone) {
            s.pt++;
            if (s.step < STEP_COUNT - 1) {
                if (s.pt > 50) {
                    s.step++;
                    s.boyDone  = false;
                    s.girlDone = false;
                }
            } else {
                // All 7 done — rain hearts, then loop
                s.celebT++;
                if (s.celebT % 10 === 0) {
                    for (let i = 0; i < 2; i++)
                        spawnHeart(s.girlX + Math.random() * (s.boyX - s.girlX));
                }
                if (s.pt > 180) {
                    s = fresh();
                    petals.length = 0;
                    hearts.length = 0;
                    ripples.length = 0;
                }
            }
        }

        // Draw: girl first (behind), then boy (in front / leading)
        const girlWalking = !s.girlDone;
        const boyWalking  = !s.boyDone;

        drawFig(s.girlX, STEP_Y - 2, s.wc + Math.PI * 0.9, false, girlWalking);
        drawFig(s.boyX,  STEP_Y - 2, s.wc,                  true,  boyWalking);

        // Held hands when both at step
        if (s.boyDone && s.girlDone) {
            const armY = STEP_Y - 2 - 19;
            ctx.save();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth   = 2;
            ctx.lineCap     = 'round';
            ctx.beginPath();
            ctx.moveTo(s.boyX - 5, armY);
            ctx.lineTo(s.girlX + 5, armY);
            ctx.stroke();
            ctx.font      = '9px serif';
            ctx.textAlign = 'center';
            ctx.fillText('❤️', (s.boyX + s.girlX) / 2, armY - 2);
            ctx.restore();
        }

        requestAnimationFrame(tick);
    }

    setTimeout(() => requestAnimationFrame(tick), 600);
})();
