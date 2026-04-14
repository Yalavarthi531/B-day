/**
 * music-sync.js
 * Keeps background music playing continuously across page navigations.
 * Strategy: start playing immediately (muted trick), THEN seek to saved
 * position — so there is never a silence gap, even if the first instant
 * is slightly off-position.
 */
(function () {
    const KEY = 'bgMusicTime';

    document.addEventListener('DOMContentLoaded', function () {
        const music = document.getElementById('bg-music');
        if (!music) return;

        const saved = parseFloat(sessionStorage.getItem(KEY) || '0');

        // ── Start playing immediately ─────────────────────────────
        music.muted  = true;
        music.volume = 0.3;
        music.play().then(() => {
            music.muted = false;
            // Seek to saved position now that it's playing
            if (saved > 0.3) {
                music.currentTime = saved;
            }
        }).catch(() => {
            // Autoplay blocked — restore on first interaction
            document.addEventListener('click', () => {
                music.muted = false;
                music.play().then(() => {
                    if (saved > 0.3) music.currentTime = saved;
                }).catch(() => {});
            }, { once: true });
        });

        // ── Save position just before leaving ────────────────────
        window.addEventListener('beforeunload', function () {
            sessionStorage.setItem(KEY, music.currentTime.toFixed(3));
        });
    });
})();
