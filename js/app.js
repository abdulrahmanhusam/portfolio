document.addEventListener('DOMContentLoaded', () => {
    initializeAOS();
    setupNavbarScroll();
    setupSmoothScroll();
    setupTypingAnimation();
    setupProjectCards();
    setupContactForm();
});

function initializeAOS() {
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });
}

function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('navbar-scrolled', window.scrollY > 50);
    });
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.offsetTop - navbarHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

function setupTypingAnimation() {
    const typeElement = document.querySelector('.typing-text');
    if (!typeElement) return;

    const roles = ['Full-Stack Engineer', 'Problem Solver', 'Tech Enthusiast'];
    const state = {
        currentRole: 0,
        currentChar: 0,
        isDeleting: false
    };

    function typeText() {
        const role = roles[state.currentRole];
        const text = state.isDeleting
            ? role.substring(0, state.currentChar - 1)
            : role.substring(0, state.currentChar + 1);

        typeElement.textContent = text;

        const timing = determineTypingTiming(role, state);
        state.currentChar = state.isDeleting ? state.currentChar - 1 : state.currentChar + 1;

        setTimeout(typeText, timing);
    }

    function determineTypingTiming(role, state) {
        if (!state.isDeleting && state.currentChar === role.length) {
            state.isDeleting = true;
            return 2000;
        }

        if (state.isDeleting && state.currentChar === 0) {
            state.isDeleting = false;
            state.currentRole = (state.currentRole + 1) % roles.length;
            return 500;
        }

        return state.isDeleting ? 100 : 200;
    }

    typeText();
}

function setupProjectCards() {
    document.querySelectorAll('.project-card').forEach(card => {
        const overlay = card.querySelector('.project-overlay');
        const projectType = card.querySelector('.project-type');

        card.addEventListener('mouseenter', () => {
            overlay.style.opacity = '1';
            projectType.style.transform = 'translateY(0)';
        });

        card.addEventListener('mouseleave', () => {
            overlay.style.opacity = '0';
            projectType.style.transform = 'translateY(20px)';
        });
    });
}

function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', e => {
        e.preventDefault();
        contactForm.classList.add('submitted');

        setTimeout(() => {
            contactForm.classList.remove('submitted');
        }, 2000);
    });
}