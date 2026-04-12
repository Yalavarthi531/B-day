(function () {
    const canvas = document.getElementById('walkCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = Math.min(480, (window.innerWidth || 480) - 24);
    const H = 230;
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    // ── Key positions ─────────────────────────────────────────────
    const GY = H * 0.84;          // ground level (near camera)
    const SX = W / 2;             // sun at horizontal center
    const SY = H * 0.13;          // sun near top-center
    const ROAD_W = W * 0.40;      // road width at bottom

    // Base figure dimensions (at scale 1.0, i.e. at ground level)
    const B_LEG = 26, B_BODY = 24, B_ARM = 16, B_HEAD = 10;

    // ── State ────────────────────────────────────────────────────
    let bx = -50,  girlX0 = W + 50;   // phase-1 X positions
    let boyX  = -50,  gx = W + 50;
    let walkY = GY;                    // shared Y for phase 3
    let wc = 0;                        // walk cycle
    let phase = 1, pt = 0;
    let ha = 0, hs = 0, sglow = 0;
    let raf;

    const MEET_SEP = 28;               // half-gap when they meet at bottom

    // perspective scale: 1.0 at GY → 0 near SY
    function scaleAt(y) {
        const t = Math.max(0, Math.min(1, (GY - y) / (GY - SY)));
        return Math.max(0.01, 1.0 - t * 0.93);
    }

    // ── Scene ─────────────────────────────────────────────────────
    function drawSky() {
        const g = ctx.createLinearGradient(0, 0, 0, GY);
        g.addColorStop(0,   '#04010f');
        g.addColorStop(0.4, '#130740');
        g.addColorStop(1,   '#2d1060');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // Static stars
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        [[0.08,0.06],[0.18,0.03],[0.32,0.10],[0.50,0.04],[0.62,0.08],
         [0.78,0.05],[0.90,0.11],[0.42,0.02],[0.55,0.14],[0.25,0.07]
        ].forEach(([fx,fy]) => {
            ctx.beginPath();
            ctx.arc(fx*W, fy*H, 0.9 + Math.random()*0.5, 0, Math.PI*2);
            ctx.fill();
        });

        // Ground strip
        const g2 = ctx.createLinearGradient(0, GY, 0, H);
        g2.addColorStop(0, '#1a0845'); g2.addColorStop(1, '#060112');
        ctx.fillStyle = g2;
        ctx.fillRect(0, GY, W, H - GY);
    }

    function drawRoad() {
        // Road trapezoid (perspective converging to sun)
        const bL = SX - ROAD_W / 2, bR = SX + ROAD_W / 2;  // bottom corners
        const tL = SX - 4,          tR = SX + 4;            // top corners (at sun)

        // Road fill
        const rg = ctx.createLinearGradient(0, SY, 0, GY);
        rg.addColorStop(0, 'rgba(40,10,100,0.0)');
        rg.addColorStop(1, 'rgba(40,10,100,0.75)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(bL, GY); ctx.lineTo(tL, SY);
        ctx.lineTo(tR, SY); ctx.lineTo(bR, GY);
        ctx.closePath(); ctx.fill();

        // Edge lines
        ctx.strokeStyle = 'rgba(192,132,252,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bL, GY); ctx.lineTo(tL, SY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bR, GY); ctx.lineTo(tR, SY); ctx.stroke();

        // Centre dashed line (perspective dashes)
        ctx.strokeStyle = 'rgba(251,191,36,0.22)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 10]);
        ctx.beginPath(); ctx.moveTo(SX, GY); ctx.lineTo(SX, SY + 8); ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawSun(gl) {
        // Radial halos
        [80, 55, 36, 22].forEach((r, i) => {
            const a = (0.035 + gl * 0.07) / (i * 0.5 + 1);
            ctx.fillStyle = `rgba(255,200,40,${a})`;
            ctx.beginPath(); ctx.arc(SX, SY, r + gl * 25, 0, Math.PI * 2); ctx.fill();
        });
        // Core
        const coreR = 11 + gl * 7;
        const cg = ctx.createRadialGradient(SX, SY, 0, SX, SY, coreR);
        cg.addColorStop(0,   `rgba(255,255,200,${0.95 + gl * 0.05})`);
        cg.addColorStop(0.5, `rgba(255,210,50,0.9)`);
        cg.addColorStop(1,   `rgba(251,140,20,0.7)`);
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(SX, SY, coreR, 0, Math.PI * 2); ctx.fill();

        // Rays
        const rayAlpha = 0.28 + gl * 0.5;
        ctx.strokeStyle = `rgba(251,191,36,${rayAlpha})`;
        for (let i = 0; i < 12; i++) {
            const a  = i / 12 * Math.PI * 2;
            const r1 = 15 + gl * 5, r2 = 24 + gl * 12;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(SX + Math.cos(a)*r1, SY + Math.sin(a)*r1);
            ctx.lineTo(SX + Math.cos(a)*r2, SY + Math.sin(a)*r2);
            ctx.stroke();
        }
    }

    // ── Stick figure (drawn relative to (0,0) = hip position) ──
    function drawFig(cx, cy, wc, isBoy, facingRight) {
        const sc = scaleAt(cy);
        if (sc < 0.03) return;

        const LEG  = B_LEG  * sc;
        const BODY = B_BODY * sc;
        const ARM  = B_ARM  * sc;
        const HEAD = B_HEAD * sc;

        const ls = Math.sin(wc) * 0.44;
        const as = -Math.sin(wc) * 0.37;

        const bodyC = isBoy ? '#a78bfa' : '#f472b6';
        const pantC = isBoy ? '#5b21b6' : '#9d174d';

        ctx.save();
        ctx.translate(cx, cy);
        if (!facingRight) ctx.scale(-1, 1);
        ctx.globalAlpha = Math.min(1, sc * 4);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';

        const lw = (w) => Math.max(0.6, w * sc);

        // Back leg
        ctx.strokeStyle = pantC; ctx.lineWidth = lw(4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-Math.sin(ls)*LEG, Math.cos(Math.abs(ls))*(LEG-1.5*sc));
        ctx.stroke();

        // Body
        ctx.strokeStyle = bodyC; ctx.lineWidth = lw(4.5);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -BODY); ctx.stroke();

        // Girl skirt
        if (!isBoy) {
            ctx.fillStyle = '#db2777'; ctx.strokeStyle = '#9d174d'; ctx.lineWidth = lw(1);
            ctx.beginPath();
            ctx.moveTo(-4.5*sc, -BODY*0.65); ctx.lineTo(-11*sc, 0);
            ctx.lineTo( 11*sc,  0);          ctx.lineTo(  4.5*sc, -BODY*0.65);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }

        // Front leg
        ctx.strokeStyle = pantC; ctx.lineWidth = lw(4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(ls)*LEG, Math.cos(Math.abs(ls))*(LEG-1.5*sc));
        ctx.stroke();

        // Back arm
        ctx.strokeStyle = bodyC; ctx.lineWidth = lw(3);
        ctx.beginPath();
        ctx.moveTo(0, -BODY);
        ctx.lineTo(-Math.sin(as)*ARM, -BODY + Math.cos(Math.abs(as))*ARM*0.8);
        ctx.stroke();

        // Front arm
        ctx.beginPath();
        ctx.moveTo(0, -BODY);
        ctx.lineTo( Math.sin(as)*ARM, -BODY + Math.cos(Math.abs(as))*ARM*0.8);
        ctx.stroke();

        // Head
        const hcy = -BODY - HEAD - 1.5*sc;
        ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = lw(1.5);
        ctx.beginPath(); ctx.arc(0, hcy, HEAD, 0, Math.PI*2); ctx.fill(); ctx.stroke();

        // Hair
        ctx.fillStyle = isBoy ? '#78350f' : '#6b1a0a';
        ctx.beginPath();
        if (isBoy) {
            ctx.arc(0, hcy - HEAD, HEAD*0.72, Math.PI, 0, false);
        } else {
            ctx.arc(0, hcy, HEAD + 3*sc, Math.PI, 0, false);
        }
        ctx.closePath(); ctx.fill();

        // Eyes
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath(); ctx.arc(-HEAD*0.29, hcy - HEAD*0.14, HEAD*0.19, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( HEAD*0.29, hcy - HEAD*0.14, HEAD*0.19, 0, Math.PI*2); ctx.fill();

        // Smile
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = lw(1.5);
        ctx.beginPath(); ctx.arc(0, hcy + HEAD*0.22, HEAD*0.36, 0.18, Math.PI - 0.18); ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    function drawHeart(cx, cy, sc, al) {
        if (al <= 0 || sc <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = Math.min(1, al);
        ctx.translate(cx, cy); ctx.scale(sc * 0.62, sc * 0.62);
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
        drawSky();
        drawRoad();
        drawSun(sglow);
        wc += 0.09;

        if (phase === 1) {
            // Walk toward each other at ground level
            boyX = Math.min(boyX + 1.5, SX - MEET_SEP);
            gx   = Math.max(gx   - 1.5, SX + MEET_SEP);
            drawFig(boyX, GY, wc,            true,  true);
            drawFig(gx,   GY, wc + Math.PI,  false, false);
            if (boyX >= SX - MEET_SEP) { phase = 2; pt = 0; }

        } else if (phase === 2) {
            // Pause — heart blooms
            pt++;
            ha = Math.min(1, pt / 22);
            hs = pt < 18 ? pt / 18 : 1 + Math.sin(pt * 0.13) * 0.1;
            drawFig(SX - MEET_SEP, GY, 0, true,  true);
            drawFig(SX + MEET_SEP, GY, 0, false, true);
            const heartY = GY - (B_BODY + B_LEG + B_HEAD) - 12;
            drawHeart(SX, heartY, hs, ha);
            if (pt > 90) { phase = 3; pt = 0; walkY = GY; }

        } else {
            // Walk TOGETHER toward the sun — 3-D perspective shrink
            pt++;
            walkY  -= 0.85;
            sglow   = Math.min(1, pt / 95);
            ha      = Math.max(0, ha - 0.011);

            const sc  = scaleAt(walkY);
            const sep = MEET_SEP * sc;        // separation shrinks with distance

            if (walkY <= SY + 6) { cancelAnimationFrame(raf); return; }

            drawFig(SX - sep, walkY, wc,           true,  true);
            drawFig(SX + sep, walkY, wc + Math.PI, false, true);

            if (ha > 0) {
                const hsc  = sc;
                const hY   = walkY - (B_BODY + B_LEG + B_HEAD) * sc - 10 * sc;
                drawHeart(SX, hY, hs * hsc, ha);
            }
        }

        raf = requestAnimationFrame(tick);
    }

    setTimeout(() => { raf = requestAnimationFrame(tick); }, 2000);
})();
