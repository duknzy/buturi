// 📱 モバイルハンバーガーメニュー制御スクリプト
(function() {
    function initMobileNav() {
        const hamburgerBtns = document.querySelectorAll('.nav-hamburger-btn');
        hamburgerBtns.forEach((btn) => {
            if (btn.dataset.navBound === 'true') return;
            btn.dataset.navBound = 'true';

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const nav = btn.closest('nav') || btn.closest('.global-cyber-nav');
                const navLinks = nav ? nav.querySelector('.nav-links') : document.querySelector('.nav-links');
                const overlay = document.querySelector('.nav-drawer-overlay');
                if (!navLinks) return;

                const isOpen = navLinks.classList.toggle('open');
                btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                if (overlay) overlay.classList.toggle('open', isOpen);
            });
        });

        // オーバーレイクリックで閉じる
        const overlay = document.querySelector('.nav-drawer-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeAllMenus);
        }

        // メニュー外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.global-cyber-nav')) {
                closeAllMenus();
            }
        });
    }

    function closeAllMenus() {
        document.querySelectorAll('.nav-links.open').forEach((menu) => {
            menu.classList.remove('open');
        });
        document.querySelectorAll('.nav-hamburger-btn').forEach((btn) => {
            btn.setAttribute('aria-expanded', 'false');
        });
        document.querySelectorAll('.nav-drawer-overlay.open').forEach((el) => {
            el.classList.remove('open');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileNav);
    } else {
        initMobileNav();
    }
})();
