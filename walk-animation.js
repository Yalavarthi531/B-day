(function () {
    const canvas = document.getElementById('walkCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = Math.min(480, (window.innerWidth || 480) - 24);
    const H = 180;
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    // ── Layout ────────────────────────────────────────────────────
    const HORIZON_Y = H * 0.48;   // where sky meets ground
    const ROAD_TOP  = H * 0.54;   // top edge of road strip
    const GROUND_Y  = H * 0.74;   // where figures stand (feet level)

    // Sun — distant backdrop, upper-center
    const SX = W / 2, SY = H * 0.18;

    // Figure base dimensions
    const LEG = 24, BODY = 22, ARM = 15, HEAD = 9;

    // ── Animation state ───────────────────────────────────────────
    function makeState() {
        return {
            boyX:  -50,
            girlX: W + 50,
            posY:  GROUND_Y,
            wc:    0,
            phase: 1,
            pt:    0,
            ha:    0, hs: 0,
            sglow: 0,
        };
    }
    let s = makeState();
    let raf;

    const GAP      = 50;              // separation when walking side-by-side
    const MEET_SEP = 26;              // half-gap when they first meet

    // ── Scene drawing ─────────────────────────────────────────────
    function drawScene() {
        // Sky
        const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
        sky.addColorStop(0, '#050215');
        sky.addColorStop(1, '#2d1060');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, HORIZON_Y);

        // Ground (below horizon)
        const gnd = ctx.createLinearGradient(0, HORIZON_Y, 0, H);
        gnd.addColorStop(0, '#1a0845');
        gnd.addColorStop(1, '#0a0220');
        ctx.fillStyle = gnd;
        ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);

        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        [[0.09,0.07],[0.22,0.04],[0.38,0.12],[0.53,0.03],
         [0.67,0.09],[0.80,0.05],[0.93,0.11],[0.45,0.16]
        ].forEach(([fx,fy]) => {
            ctx.beginPath();
            ctx.arc(fx*W, fy*H, 0.8, 0, Math.PI*2);
            ctx.fill();
        });
    }

    function drawSun(gl) {
        // Ambient glow halos
        [65, 45, 28].forEach((r, i) => {
            ctx.fillStyle = `rgba(255,200,40,${(0.04 + gl * 0.06) / (i + 1)})`;
            ctx.beginPath(); ctx.arc(SX, SY, r + gl * 18, 0, Math.PI*2); ctx.fill();
        });
        // Core
        ctx.fillStyle = `rgba(255,230,60,${0.75 + gl * 0.25})`;
        ctx.beginPath(); ctx.arc(SX, SY, 10 + gl * 5, 0, Math.PI*2); ctx.fill();
        // Rays
        ctx.strokeStyle = `rgba(251,191,36,${0.25 + gl * 0.45})`;
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 10; i++) {
            const a = i / 10 * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(SX + Math.cos(a)*14, SY + Math.sin(a)*14);
            ctx.lineTo(SX + Math.cos(a)*(22 + gl*8), SY + Math.sin(a)*(22 + gl*8));
            ctx.stroke();
        }
    }

    function drawRoad() {
        // Perspective road: trapezoid wider at bottom, narrowing toward horizon
        const bL = 0, bR = W;                    // road fills full width at bottom
        const tL = W*0.22, tR = W*0.78;          // narrows at horizon

        const rg = ctx.createLinearGradient(0, ROAD_TOP, 0, H);
        rg.addColorStop(0, '#0e0630');
        rg.addColorStop(1, '#1a0a40');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(bL, H); ctx.lineTo(tL, ROAD_TOP);
        ctx.lineTo(tR, ROAD_TOP); ctx.lineTo(bR, H);
        ctx.closePath(); ctx.fill();

        // Road edges
        ctx.strokeStyle = 'rgba(192,132,252,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bL, H); ctx.lineTo(tL, ROAD_TOP); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bR, H); ctx.lineTo(tR, ROAD_TOP); ctx.stroke();

        // Dashed centre lane
        ctx.strokeStyle = 'rgba(251,191,36,0.28)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 14]);
        ctx.beginPath(); ctx.moveTo(W/2, H); ctx.lineTo(W/2, ROAD_TOP + 4); ctx.stroke();
        ctx.setLineDash([]);
    }

    // ── Stick figure (hip = translate origin, legs go DOWN) ───────
    function drawFig(cx, wc, isBoy, facingRight) {
        // feet are at GROUND_Y; place hip one leg-length above
        const hipY = GROUND_Y - LEG * 0.15;   // hip slightly above ground

        const ls = Math.sin(wc) * 0.44;
        const as = -Math.sin(wc) * 0.36;

        const bodyC = isBoy ? '#a78bfa' : '#f472b6';
        const pantC = isBoy ? '#5b21b6' : '#9d174d';

        ctx.save();
        ctx.translate(cx, hipY);
        if (!facingRight) ctx.scale(-1, 1);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';

        // ── Back leg ──
        ctx.strokeStyle = pantC; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-Math.sin(ls) * LEG, Math.cos(Math.abs(ls)) * LEG);
        ctx.stroke();

        // ── Body ──
        ctx.strokeStyle = bodyC; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -BODY); ctx.stroke();

        // ── Girl skirt ──
        if (!isBoy) {
            ctx.fillStyle = '#db2777'; ctx.strokeStyle = '#9d174d'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-5, -BODY*0.65); ctx.lineTo(-12, 0);
            ctx.lineTo(12, 0);          ctx.lineTo( 5, -BODY*0.65);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }

        // ── Front leg ──
        ctx.strokeStyle = pantC; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(ls) * LEG, Math.cos(Math.abs(ls)) * LEG);
        ctx.stroke();

        // ── Back arm ──
        ctx.strokeStyle = bodyC; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -BODY);
        ctx.lineTo(-Math.sin(as) * ARM, -BODY + Math.cos(Math.abs(as)) * ARM * 0.8);
        ctx.stroke();

        // ── Front arm ──
        ctx.beginPath();
        ctx.moveTo(0, -BODY);
        ctx.lineTo( Math.sin(as) * ARM, -BODY + Math.cos(Math.abs(as)) * ARM * 0.8);
        ctx.stroke();

        // ── Head ──
        const hcy = -BODY - HEAD - 2;
        ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, hcy, HEAD, 0, Math.PI*2); ctx.fill(); ctx.stroke();

        // ── Hair ──
        ctx.fillStyle = isBoy ? '#78350f' : '#6b1a0a';
        ctx.beginPath();
        ctx.arc(0, hcy - HEAD, isBoy ? HEAD*0.72 : HEAD + 2, Math.PI, 0, false);
        ctx.closePath(); ctx.fill();

        // ── Eyes ──
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath(); ctx.arc(-HEAD*0.28, hcy - HEAD*0.14, HEAD*0.19, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( HEAD*0.28, hcy - HEAD*0.14, HEAD*0.19, 0, Math.PI*2); ctx.fill();

        // ── Smile ──
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, hcy + HEAD*0.22, HEAD*0.36, 0.18, Math.PI-0.18); ctx.stroke();

        ctx.restore();
    }

    function drawHeart(cx, cy, sc, al) {
        if (al <= 0 || sc <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = Math.min(1, al);
        ctx.translate(cx, cy); ctx.scale(sc*0.62, sc*0.62);
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(0, -7, -15, -9, -15, 0);
        ctx.bezierCurveTo(-15, 9, 0, 19, 0, 25);
        ctx.bezierCurveTo(0, 19, 15, 9, 15, 0);
        ctx.bezierCurveTo(15, -9, 0, -7, 0, 4);
        ctx.fill();
        ctx.restore();
    }

    // ── Animation loop ────────────────────────────────────────────
    function tick() {
        ctx.clearRect(0, 0, W, H);
        drawScene();
        drawSun(s.sglow);
        drawRoad();

        s.wc += 0.09;

        if (s.phase === 1) {
            // Walk toward each other — stay on road (same Y)
            s.boyX  = Math.min(s.boyX  + 1.5, W/2 - MEET_SEP);
            s.girlX = Math.max(s.girlX - 1.5, W/2 + MEET_SEP);

            drawFig(s.boyX,  s.wc,           true,  true);
            drawFig(s.girlX, s.wc + Math.PI, false, false);

            if (s.boyX >= W/2 - MEET_SEP) { s.phase = 2; s.pt = 0; }

        } else if (s.phase === 2) {
            // Pause — heart blooms
            s.pt++;
            s.ha  = Math.min(1, s.pt / 22);
            s.hs  = s.pt < 18 ? s.pt / 18 : 1 + Math.sin(s.pt * 0.13) * 0.1;
            s.sglow = Math.min(0.8, s.pt / 60);

            drawFig(W/2 - MEET_SEP, 0, true,  true);
            drawFig(W/2 + MEET_SEP, 0, false, true);

            const heartY = GROUND_Y - LEG - BODY - HEAD - 14;
            drawHeart(W/2, heartY, s.hs, s.ha);

            if (s.pt > 85) { s.phase = 3; s.pt = 0; }

        } else {
            // Stay together at meeting point — heart pulses, then loop resets
            s.pt++;
            s.sglow = Math.min(1, s.sglow + 0.004);
            // Heart gently pulses
            s.hs = 1 + Math.sin(s.pt * 0.1) * 0.12;
            s.ha = Math.min(1, s.ha);

            drawFig(W/2 - MEET_SEP, 0, true,  true);
            drawFig(W/2 + MEET_SEP, 0, false, true);

            const heartY = GROUND_Y - LEG - BODY - HEAD - 14;
            drawHeart(W/2, heartY, s.hs, s.ha);

            // After ~3 seconds of holding, reset and loop
            if (s.pt > 180) {
                s = makeState();
            }
        }

        raf = requestAnimationFrame(tick);
    }

    setTimeout(() => { raf = requestAnimationFrame(tick); }, 2000);
})();
