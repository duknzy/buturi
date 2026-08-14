    // ==========================================================================
// ⏱️ GLOBAL CYBER TIMER SYNC & POPOUT ENGINE
// ==========================================================================
(function() {
    function getRootPath() {
        const path = window.location.pathname;
        if (path.includes('/tokei/') || path.includes('/study/')) {
            return '../';
        }
        return './';
    }

    function updateGlobalTimerHUD() {
        const timerBadges = document.querySelectorAll('.global-timer-link');
        if (!timerBadges || timerBadges.length === 0) return;

        try {
            const rawData = localStorage.getItem('cyber_timer_state');
            if (!rawData) {
                timerBadges.forEach(badge => {
                    badge.innerHTML = '⏱️ 集中タイマー';
                    badge.classList.remove('active-timer');
                });
                return;
            }

            const state = JSON.parse(rawData);
            if (!state || !state.isRunning || !state.endTime) {
                timerBadges.forEach(badge => {
                    badge.innerHTML = '⏱️ 集中タイマー';
                    badge.classList.remove('active-timer');
                });
                return;
            }

            const now = Date.now();
            const remainingSec = Math.max(0, Math.floor((state.endTime - now) / 1000));

            if (remainingSec <= 0) {
                timerBadges.forEach(badge => {
                    badge.innerHTML = '⏱️ FINISH!';
                    badge.classList.add('active-timer');
                });
                return;
            }

            const m = String(Math.floor(remainingSec / 60)).padStart(2, '0');
            const s = String(remainingSec % 60).padStart(2, '0');
            timerBadges.forEach(badge => {
                badge.innerHTML = `⏱️ ${m}:${s}`;
                badge.classList.add('active-timer');
            });
        } catch(e) {
            console.error('Timer sync error:', e);
        }
    }

    // 1秒ごとにヘッダー表示を更新
    setInterval(updateGlobalTimerHUD, 1000);
    document.addEventListener('DOMContentLoaded', updateGlobalTimerHUD);

    // 🗔 小窓（ポップアウト）起動関数
    window.openTimerPopout = function(e) {
        if (e) e.preventDefault();
        const root = getRootPath();
        const targetUrl = root + 'tokei/index.html';
        const width = 460;
        const height = 740;
        const left = Math.max(0, window.screen.width - width - 40);
        const top = 40;

        const popout = window.open(
            targetUrl,
            'CyberTimerPopout',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no`
        );
        if (popout) popout.focus();
    };

    // 📊 24hログ小窓（ポップアウト）起動関数
    window.openLogPopout = function(e) {
        if (e) e.preventDefault();
        const root = getRootPath();
        const targetUrl = root + 'study/index.html';
        const width = 900;
        const height = 780;
        const left = Math.max(0, Math.round((window.screen.width - width) / 2));
        const top = Math.max(0, Math.round((window.screen.height - height) / 2));

        const popout = window.open(
            targetUrl,
            'LogPopout',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no`
        );
        if (popout) popout.focus();
    };
    // 📷 Google Photos小窓（ポップアウト）起動関数
    window.openGooglePhotosPopout = function(e) {
        if (e) e.preventDefault();
        const width = 1100;
        const height = 820;
        const left = Math.max(0, Math.round((window.screen.width - width) / 2));
        const top = Math.max(0, Math.round((window.screen.height - height) / 2));

        const popout = window.open(
            'https://photos.google.com',
            'GooglePhotosPopout',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no`
        );
        if (popout) popout.focus();
    };
})();
