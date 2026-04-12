/**
 * music-sync.js
 * Keeps background music playing continuously across page navigations
 * by saving/restoring the playback position via sessionStorage.
 */
(function () {
    const KEY = 'bgMusicTime';

    document.addEventListener('DOMContentLoaded', function () {
        const music = document.getElementById('bg-music');
        if (!music) return;

        // ── Restore saved position ────────────────────────────────
        const saved = parseFloat(sessionStorage.getItem(KEY) || '0');

        function seekTo() {
            if (saved > 0.3) music.currentTime = saved;
        }

        if (music.readyState >= 2) {
            seekTo();
        } else {
            music.addEventListener('canplay', seekTo, { once: true });
        }

        // ── Save position just before leaving ────────────────────
        window.addEventListener('beforeunload', function () {
            sessionStorage.setItem(KEY, music.currentTime.toFixed(3));
        });
    });
})();
