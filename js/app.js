(function initPortfolio() {
    document.addEventListener('DOMContentLoaded', () => {
        setupTheme();
        setupNavbarState();
        setupSmoothScroll();
        setupRevealAnimations();
        setupCounters();
        setupContactForm();
    });
})();

function setupTheme() {
    const root = document.documentElement;
    const toggle = document.getElementById('themeToggle');
    const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
    const lightMedia = window.matchMedia('(prefers-color-scheme: light)');
    const storageKey = 'theme';

    const applyTheme = theme => {
        root.setAttribute('data-theme', theme);
        if (toggle) {
            toggle.innerHTML = theme === 'dark'
                ? '<i class="fa-solid fa-sun"></i>'
                : '<i class="fa-solid fa-moon"></i>';
            toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
            toggle.setAttribute('aria-pressed', String(theme === 'light'));
        }
    };

    const getSystemTheme = () => {
        if (darkMedia.matches) return 'dark';
        if (lightMedia.matches) return 'light';
        return 'dark';
    };

    const getStoredTheme = () => localStorage.getItem(storageKey);

    const syncWithSystemTheme = () => {
        if (!getStoredTheme()) {
            applyTheme(getSystemTheme());
        }
    };

    const bindMediaListener = mediaQueryList => {
        if (typeof mediaQueryList.addEventListener === 'function') {
            mediaQueryList.addEventListener('change', syncWithSystemTheme);
            return;
        }
        mediaQueryList.addListener(syncWithSystemTheme);
    };

    applyTheme(getStoredTheme() || getSystemTheme());

    bindMediaListener(darkMedia);
    bindMediaListener(lightMedia);

    toggle?.addEventListener('click', () => {
        const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        localStorage.setItem(storageKey, nextTheme);
        applyTheme(nextTheme);
    });
}

function setupNavbarState() {
    const navbar = document.getElementById('siteNavbar');
    if (!navbar) return;

    const toggleNavbar = () => {
        navbar.classList.toggle('navbar-scrolled', window.scrollY > 30);
    };

    toggleNavbar();
    window.addEventListener('scroll', toggleNavbar, { passive: true });
}

function setupSmoothScroll() {
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const bsCollapse = navbarCollapse ? bootstrap.Collapse.getOrCreateInstance(navbarCollapse, { toggle: false }) : null;

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', event => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            event.preventDefault();
            const navbarHeight = document.getElementById('siteNavbar')?.offsetHeight || 0;
            const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight + 1;

            window.scrollTo({ top, behavior: 'smooth' });

            if (window.innerWidth < 992 && navbarCollapse?.classList.contains('show')) {
                bsCollapse?.hide();
            }
        });
    });
}

function setupRevealAnimations() {
    const elements = document.querySelectorAll('.reveal-up');
    if (!elements.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.16 });

    elements.forEach((element, index) => {
        element.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
        observer.observe(element);
    });
}

function setupCounters() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    const animateCounter = counter => {
        const target = Number(counter.dataset.target || 0);
        const duration = 1400;
        const startTime = performance.now();

        const step = currentTime => {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.round(target * eased);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.8 });

    counters.forEach(counter => observer.observe(counter));
}

function setupContactForm() {
    const form = document.getElementById('contactForm');
    const feedback = document.querySelector('.form-feedback');
    if (!form || !feedback) return;

    form.addEventListener('submit', event => {
        event.preventDefault();
        feedback.textContent = 'Use the email or LinkedIn links here and I will respond directly.';
        form.reset();
    });
}
