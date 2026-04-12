const gifStages = [
    "https://media.tenor.com/EBV7OT7ACfwAAAAj/u-u-qua-qua-u-quaa.gif",    // 0 normal
    "https://media1.tenor.com/m/uDugCXK4vI4AAAAd/chiikawa-hachiware.gif",  // 1 confused
    "https://media.tenor.com/f_rkpJbH1s8AAAAj/somsom1012.gif",             // 2 pleading
    "https://media.tenor.com/OGY9zdREsVAAAAAj/somsom1012.gif",             // 3 sad
    "https://media1.tenor.com/m/WGfra-Y_Ke0AAAAd/chiikawa-sad.gif",       // 4 sadder
    "https://media.tenor.com/CivArbX7NzQAAAAj/somsom1012.gif",             // 5 devastated
    "https://media.tenor.com/5_tv1HquZlcAAAAj/chiikawa.gif",               // 6 very devastated
    "https://media1.tenor.com/m/uDugCXK4vI4AAAAC/chiikawa-hachiware.gif"  // 7 crying runaway
]

const noMessages = [
    "No",
    "Really? On your birthday? 😶",
    "Ugh... you're making me write 'patience' again 😩",
    "Fine... I'll wait. Like I always do. 😮‍💨",
    "Nuvvu call cheyyaledu, nenu wait chesanu... still here 😭",
    "Neha... the GMAT can wait, this can't 😅",
    "14/36 lo kuda love untundi... okasari aalochinchu 🥺",
    "Button paaripo'taundi... like you from this decision 👀",
    "You can't catch me anyway 😜"
]

const yesTeasePokes = [
    "Aren't you curious what happens when you click No first? 😏",
    "Come on... hit No once. I dare you 👀",
    "The drama hasn't even started yet 🎭",
    "Neha... click No first, I promise it'll be worth it 😄"
]

let yesTeasedCount = 0
let noClickCount   = 0
let runawayEnabled = false
let musicPlaying   = true

// ── Detect touch device ───────────────────────────────────────────────────
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)

const catGif = document.getElementById('cat-gif')
const yesBtn = document.getElementById('yes-btn')
const noBtn  = document.getElementById('no-btn')
const music  = document.getElementById('bg-music')

// ── Autoplay with muted trick ─────────────────────────────────────────────
music.muted  = true
music.volume = 0.3
music.play().then(() => {
    music.muted = false
}).catch(() => {
    document.addEventListener('click', () => {
        music.muted = false
        music.play().catch(() => {})
    }, { once: true })
})

function toggleMusic() {
    if (musicPlaying) {
        music.pause()
        musicPlaying = false
        document.getElementById('music-toggle').textContent = '🔇'
    } else {
        music.muted = false
        music.play()
        musicPlaying = true
        document.getElementById('music-toggle').textContent = '🔊'
    }
}

// ── Yes button: desktop = click, mobile = swipe up ────────────────────────
function handleYesClick() {
    if (!runawayEnabled) {
        const msg = yesTeasePokes[Math.min(yesTeasedCount, yesTeasePokes.length - 1)]
        yesTeasedCount++
        showTeaseMessage(msg)
        return
    }

    if (isTouchDevice) {
        // Mobile: don't navigate on plain tap — hint to swipe up
        showTeaseMessage('↑ Swipe me up to say Haan! 😄')
    } else {
        // Desktop: plain click works fine
        window.location.href = 'yes.html'
    }
}

// ── Mobile swipe-up to confirm ────────────────────────────────────────────
let swipeTouchStartY = null

yesBtn.addEventListener('touchstart', function (e) {
    if (!runawayEnabled) return          // tease handled by onclick
    swipeTouchStartY = e.touches[0].clientY
    yesBtn.style.transition = 'transform 0.05s'
}, { passive: true })

yesBtn.addEventListener('touchmove', function (e) {
    if (swipeTouchStartY === null || !runawayEnabled) return
    const dy = swipeTouchStartY - e.touches[0].clientY   // positive = upward
    if (dy > 0) {
        const lift = Math.min(dy * 0.65, 110)
        const scale = 1 + dy * 0.0015
        yesBtn.style.transform = `translateY(-${lift}px) scale(${scale})`
    }
}, { passive: true })

yesBtn.addEventListener('touchend', function (e) {
    if (swipeTouchStartY === null) return
    const dy = swipeTouchStartY - e.changedTouches[0].clientY
    swipeTouchStartY = null

    if (dy >= 60 && runawayEnabled) {
        // ✅ Confirmed — fly it off and navigate
        yesBtn.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1)'
        yesBtn.style.transform  = 'translateY(-350px) scale(1.4)'
        setTimeout(() => { window.location.href = 'yes.html' }, 380)
    } else {
        // ↩ Not enough — bounce back
        yesBtn.style.transition = 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)'
        yesBtn.style.transform  = 'translateY(0) scale(1)'
        setTimeout(() => { yesBtn.style.transition = '' }, 350)
    }
}, { passive: true })

// ── Toast ─────────────────────────────────────────────────────────────────
function showTeaseMessage(msg) {
    const toast = document.getElementById('tease-toast')
    toast.textContent = msg
    toast.classList.add('show')
    clearTimeout(toast._timer)
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2600)
}

// ── No button logic ───────────────────────────────────────────────────────
function handleNoClick() {
    noClickCount++

    const msgIndex = Math.min(noClickCount, noMessages.length - 1)
    noBtn.textContent = noMessages[msgIndex]

    // Grow Yes button
    const currentSize = parseFloat(window.getComputedStyle(yesBtn).fontSize)
    yesBtn.style.fontSize = `${currentSize * 1.35}px`
    const padY = Math.min(18 + noClickCount * 5, 60)
    const padX = Math.min(45 + noClickCount * 10, 120)
    yesBtn.style.padding = `${padY}px ${padX}px`

    // Shrink No button
    if (noClickCount >= 2) {
        const noSize = parseFloat(window.getComputedStyle(noBtn).fontSize)
        noBtn.style.fontSize = `${Math.max(noSize * 0.85, 10)}px`
    }

    // Swap GIF
    swapGif(gifStages[Math.min(noClickCount, gifStages.length - 1)])

    // Enable runaway at click 5
    if (noClickCount >= 5 && !runawayEnabled) {
        enableRunaway()
        runawayEnabled = true

        // On mobile: update button label to hint swipe gesture
        if (isTouchDevice) {
            yesBtn.innerHTML = 'Haan! ✨<span class="swipe-hint">↑ swipe up ↑</span>'
        }
    }
}

function swapGif(src) {
    catGif.style.opacity = '0'
    setTimeout(() => {
        catGif.src = src
        catGif.style.opacity = '1'
    }, 200)
}

function enableRunaway() {
    noBtn.addEventListener('mouseover',   runAway)
    noBtn.addEventListener('touchstart',  runAway, { passive: true })
}

function runAway() {
    const margin = 20
    const btnW   = noBtn.offsetWidth
    const btnH   = noBtn.offsetHeight
    const maxX   = window.innerWidth  - btnW - margin
    const maxY   = window.innerHeight - btnH - margin

    noBtn.style.position = 'fixed'
    noBtn.style.left     = `${Math.random() * maxX + margin / 2}px`
    noBtn.style.top      = `${Math.random() * maxY + margin / 2}px`
    noBtn.style.zIndex   = '50'
}
