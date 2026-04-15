let musicPlaying = false

window.addEventListener('load', () => {
    launchConfetti()

    // Autoplay music (works since user clicked Yes to get here)
    const music = document.getElementById('bg-music')
    music.volume = 0.3
    music.play().catch(() => {})
    musicPlaying = true
    document.getElementById('music-toggle').textContent = '🔊'
})

function launchConfetti() {
    const colors = ['#f9a8d4','#fbbf24','#c084fc','#34d399','#60a5fa','#fb7185','#fff','#fde68a']

    // ── Wave 1: big center burst ─────────────────────────────
    confetti({ particleCount: 200, spread: 130, origin: { x: 0.5, y: 0.15 }, colors, startVelocity: 45 })

    // ── Wave 2: side cannons fire for 7 seconds ──────────────
    const end = Date.now() + 7000
    const interval = setInterval(() => {
        if (Date.now() > end) { clearInterval(interval); return }
        confetti({ particleCount: 50, angle: 55,  spread: 65, origin: { x: 0,   y: 0.65 }, colors })
        confetti({ particleCount: 50, angle: 125, spread: 65, origin: { x: 1,   y: 0.65 }, colors })
    }, 280)

    // ── Wave 3: star-shaped bursts at 1s and 2.5s ───────────
    setTimeout(() => {
        confetti({ particleCount: 100, spread: 100, origin: { x: 0.3, y: 0.3 }, colors, shapes: ['star'] })
    }, 1000)
    setTimeout(() => {
        confetti({ particleCount: 100, spread: 100, origin: { x: 0.7, y: 0.3 }, colors, shapes: ['star'] })
    }, 2500)

    // ── Wave 4: gentle rain every 8s to keep it lively ──────
    setInterval(() => {
        confetti({ particleCount: 40, spread: 90, origin: { x: Math.random(), y: 0 },
            colors, startVelocity: 20, gravity: 0.6 })
    }, 8000)
}

function toggleMusic() {
    const music = document.getElementById('bg-music')
    if (musicPlaying) {
        music.pause()
        musicPlaying = false
        document.getElementById('music-toggle').textContent = '🔇'
    } else {
        music.play()
        musicPlaying = true
        document.getElementById('music-toggle').textContent = '🔊'
    }
}
