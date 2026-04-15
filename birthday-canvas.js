(function () {
    const canvas = document.getElementById('birthdayCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const COLORS = [
        '#f9a8d4','#fbbf24','#c084fc','#34d399',
        '#60a5fa','#fb7185','#a78bfa','#f472b6','#38bdf8'
    ];

    // ── Balloon ───────────────────────────────────────────────
    class Balloon {
        constructor(initial) { this.reset(initial); }
        reset(initial = false) {
            this.x      = Math.random() * canvas.width;
            this.y      = initial
                ? canvas.height * 0.3 + Math.random() * canvas.height * 0.8
                : canvas.height + 90;
            this.r      = 20 + Math.random() * 18;
            this.color  = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.speed  = 0.35 + Math.random() * 0.55;
            this.sway   = Math.random() * Math.PI * 2;
            this.swaySpd= 0.005 + Math.random() * 0.008;
            this.swayAmt= 0.5 + Math.random() * 1.0;
            this.strLen = 32 + Math.random() * 24;
            this.alpha  = 0.78 + Math.random() * 0.2;
        }
        update() {
            this.y -= this.speed;
            this.sway += this.swaySpd;
            this.x += Math.sin(this.sway) * this.swayAmt;
            if (this.y < -this.r * 3 - this.strLen) this.reset();
        }
        draw() {
            const { x, y, r, color, strLen, alpha } = this;
            ctx.save();
            // String
            ctx.strokeStyle = 'rgba(255,255,255,0.22)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y + r + 3);
            ctx.quadraticCurveTo(x + 6, y + r + strLen * 0.55, x - 2, y + r + strLen);
            ctx.stroke();

            // Glow
            const grd = ctx.createRadialGradient(x, y - r * 0.2, r * 0.1, x, y, r * 1.4);
            grd.addColorStop(0, color + 'aa');
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.globalAlpha = alpha * 0.4;
            ctx.beginPath();
            ctx.ellipse(x, y, r * 1.4, r * 1.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(x, y, r * 0.82, r, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shine
            ctx.fillStyle = 'rgba(255,255,255,0.38)';
            ctx.beginPath();
            ctx.ellipse(x - r * 0.26, y - r * 0.3, r * 0.2, r * 0.28, -0.4, 0, Math.PI * 2);
            ctx.fill();

            // Knot
            ctx.globalAlpha = 1;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y + r + 2, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // ── Confetti piece ────────────────────────────────────────
    class Confetti {
        constructor(initial) { this.reset(initial); }
        reset(initial = false) {
            this.x       = Math.random() * canvas.width;
            this.y       = initial ? Math.random() * canvas.height - canvas.height : -16;
            this.w       = 5 + Math.random() * 9;
            this.h       = 3 + Math.random() * 5;
            this.color   = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.speed   = 1.2 + Math.random() * 2.2;
            this.angle   = Math.random() * Math.PI * 2;
            this.spin    = (Math.random() - 0.5) * 0.14;
            this.drift   = (Math.random() - 0.5) * 1.4;
            this.wobble  = Math.random() * Math.PI * 2;
            this.wobbleSpd = 0.04 + Math.random() * 0.06;
            this.shape   = Math.random() < 0.25 ? 'circle' : 'rect';
            this.alpha   = 0.7 + Math.random() * 0.3;
        }
        update() {
            this.y += this.speed;
            this.x += this.drift + Math.sin(this.wobble) * 0.6;
            this.angle  += this.spin;
            this.wobble += this.wobbleSpd;
            if (this.y > canvas.height + 20) this.reset();
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle   = this.color;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            if (this.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, this.w * 0.45, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Ribbon — squash vertically with wobble for shimmer
                ctx.scale(1, Math.abs(Math.cos(this.wobble)) * 0.8 + 0.2);
                ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
            }
            ctx.restore();
        }
    }

    // ── Sparkle star ──────────────────────────────────────────
    class Sparkle {
        constructor() { this.reset(); }
        reset() {
            this.x       = Math.random() * canvas.width;
            this.y       = Math.random() * canvas.height;
            this.size    = 0.8 + Math.random() * 2.2;
            this.alpha   = 0;
            this.speed   = 0.008 + Math.random() * 0.02;
            this.growing = true;
            this.color   = Math.random() < 0.5 ? '#fbbf24' : '#fff';
        }
        update() {
            if (this.growing) {
                this.alpha += this.speed;
                if (this.alpha >= 1) this.growing = false;
            } else {
                this.alpha -= this.speed;
                if (this.alpha <= 0) this.reset();
            }
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle   = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur  = 6;
            // 4-point star
            const s = this.size;
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2;
                const b = a + Math.PI / 4;
                ctx.lineTo(Math.cos(a) * s * 2.5, Math.sin(a) * s * 2.5);
                ctx.lineTo(Math.cos(b) * s * 0.7, Math.sin(b) * s * 0.7);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    // ── Firework burst (on load) ──────────────────────────────
    class Particle {
        constructor(x, y, color) {
            this.x = x; this.y = y; this.color = color;
            const a = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 5;
            this.vx = Math.cos(a) * spd;
            this.vy = Math.sin(a) * spd;
            this.alpha = 1;
            this.size  = 2 + Math.random() * 3;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            this.vy += 0.08;   // gravity
            this.vx *= 0.97;
            this.alpha -= 0.018;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle   = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    let fireworkParticles = [];
    function launchFirework() {
        const x = canvas.width * (0.2 + Math.random() * 0.6);
        const y = canvas.height * (0.1 + Math.random() * 0.4);
        const c = COLORS[Math.floor(Math.random() * COLORS.length)];
        for (let i = 0; i < 55; i++) fireworkParticles.push(new Particle(x, y, c));
    }
    // Launch a few bursts on load
    setTimeout(() => launchFirework(), 300);
    setTimeout(() => launchFirework(), 700);
    setTimeout(() => launchFirework(), 1200);
    setInterval(() => {
        if (Math.random() < 0.35) launchFirework();
    }, 3000);

    // ── Build particles ───────────────────────────────────────
    const balloons = Array.from({ length: 16 }, (_, i) => new Balloon(true));
    const confetti = Array.from({ length: 80 }, ()  => new Confetti(true));
    const sparkles = Array.from({ length: 50 }, ()  => new Sparkle());

    // ── Main loop ─────────────────────────────────────────────
    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        sparkles.forEach(s => { s.update(); s.draw(); });
        confetti.forEach(c => { c.update(); c.draw(); });
        balloons.forEach(b => { b.update(); b.draw(); });

        fireworkParticles = fireworkParticles.filter(p => p.alpha > 0);
        fireworkParticles.forEach(p => { p.update(); p.draw(); });

        requestAnimationFrame(tick);
    }
    tick();
})();
