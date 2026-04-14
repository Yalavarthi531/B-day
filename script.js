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

// ── Flashcard content (one per No click) ─────────────────────────────────
const flashCards = [
    `You are the <em>first</em> girl I talked to in this whole marriage setup.<br><br>Can you make it the <em>last</em>? 🌸`,
    `Don't you like me enough to <em>convince your parents</em> on Jathakam? 🥺`,
    `Do you give more importance to <em>stars than character</em>?<br><br>Do you remember how we felt <em>before</em> Jathakam even came into the picture? 💭`,
    `I didn't make this to impress you.<br><br>I made this to <em>create a memory for you</em> —<br>one that'll always be part of your story.<br><br>Either as <em>"You know what your dad did..."</em> 🥰<br>or <em>"You know what a guy did..."</em> 😄<br><br>Either way — I'm glad I did. 💛`,
    `I'm still here after every No you just clicked.<br><br>At this point, even the stars should be impressed 😂`
]

let yesTeasedCount = 0
let noClickCount   = 0
let runawayEnabled = false
let musicPlaying   = true

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
    const unlock = () => {
        music.muted = false
        music.play().catch(() => {})
        document.removeEventListener('touchstart', unlock)
        document.removeEventListener('click', unlock)
    }
    document.addEventListener('touchstart', unlock, { once: true, passive: true })
    document.addEventListener('click', unlock, { once: true })
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

// ── Yes button: tease first, then navigate on click ───────────────────────
function handleYesClick() {
    if (!runawayEnabled) {
        const msg = yesTeasePokes[Math.min(yesTeasedCount, yesTeasePokes.length - 1)]
        yesTeasedCount++
        showTeaseMessage(msg)
        return
    }

    window.location.href = 'yes.html'
}

// ── Toast ─────────────────────────────────────────────────────────────────
function showTeaseMessage(msg) {
    const toast = document.getElementById('tease-toast')
    toast.textContent = msg
    toast.classList.add('show')
    clearTimeout(toast._timer)
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2600)
}

// ── Flashcard ─────────────────────────────────────────────────────────────
function showFlashcard(index) {
    const overlay = document.getElementById('flashcard-overlay')
    const card    = document.getElementById('flashcard')
    const text    = document.getElementById('flashcard-text')

    const content = flashCards[Math.min(index, flashCards.length - 1)]
    text.innerHTML = content

    // Reset animation by re-inserting card
    card.classList.remove('flashcard-pop')
    void card.offsetWidth
    card.classList.add('flashcard-pop')

    overlay.classList.add('show')
}

function dismissFlashcard() {
    const overlay = document.getElementById('flashcard-overlay')
    overlay.classList.remove('show')
    // Keep overlay absorbing clicks during the CSS fade-out (350ms)
    // so the tap doesn't bleed through to the No button underneath
    overlay.style.pointerEvents = 'all'
    setTimeout(() => { overlay.style.pointerEvents = '' }, 400)
}

// ── No button logic ───────────────────────────────────────────────────────
function handleNoClick() {
    noClickCount++

    const msgIndex = Math.min(noClickCount, noMessages.length - 1)
    noBtn.textContent = noMessages[msgIndex]

    // Show flashcard for this click (1-indexed → 0-indexed)
    showFlashcard(noClickCount - 1)

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
