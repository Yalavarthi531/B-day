/**
 * music-sync.js
 * - Only plays if musicStarted flag is set (i.e. user passed both gates)
 * - Saves position every second AND on beforeunload to minimise gap between pages
 */
(function () {
    const KEY         = 'bgMusicTime';
    const STARTED_KEY = 'musicStarted';

    document.addEventListener('DOMContentLoaded', function () {
        const music = document.getElementById('bg-music');
        if (!music) return;

        // Don't play at all until the passphrase + quiz gates have been cleared
        if (!sessionStorage.getItem(STARTED_KEY)) return;

        const saved = parseFloat(sessionStorage.getItem(KEY) || '0');

        music.muted  = true;
        music.volume = 0.3;

        music.play().then(() => {
            music.muted = false;
            if (saved > 0.3) music.currentTime = saved;
        }).catch(() => {
            // Autoplay blocked — unlock on first interaction
            const unlock = () => {
                music.muted = false;
                music.play().then(() => {
                    if (saved > 0.3) music.currentTime = saved;
                }).catch(() => {});
                document.removeEventListener('touchstart', unlock);
                document.removeEventListener('click',      unlock);
            };
            document.addEventListener('touchstart', unlock, { once: true, passive: true });
            document.addEventListener('click',      unlock, { once: true });
        });

        // Save position every second — minimises the silence gap on page change
        setInterval(function () {
            if (!music.paused) {
                sessionStorage.setItem(KEY, music.currentTime.toFixed(3));
            }
        }, 1000);

        // Also save on unload as a safety net
        window.addEventListener('beforeunload', function () {
            sessionStorage.setItem(KEY, music.currentTime.toFixed(3));
        });
    });
})();
