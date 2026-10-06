// Page behaviour: BibTeX copy, scroll-to-top, nav state, scroll reveal.

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    if (!bibtexElement) return;

    const done = function() {
        button.classList.add('copied');
        copyText.textContent = 'Copied';
        setTimeout(function() {
            button.classList.remove('copied');
            copyText.textContent = 'Copy';
        }, 2000);
    };
    const fallback = function() {
        const textArea = document.createElement('textarea');
        textArea.value = bibtexElement.textContent;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        done();
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(done, fallback);
    } else {
        fallback();
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Figure panels: the paper's figures and tables behind accessible tabs.
// Without JS every panel stays visible, stacked (CSS hides the tab bar).
function initFigurePanels() {
    document.querySelectorAll('.figpanel').forEach(function(panel, p) {
        const tabs = Array.from(panel.querySelectorAll('[role="tab"]'));
        const items = Array.from(panel.querySelectorAll('.figitem'));
        if (!tabs.length || tabs.length !== items.length) return;

        const select = function(index, moveFocus) {
            tabs.forEach(function(tab, i) {
                const on = i === index;
                tab.setAttribute('aria-selected', String(on));
                tab.tabIndex = on ? 0 : -1;
                items[i].hidden = !on;
            });
            if (moveFocus) tabs[index].focus();
        };

        tabs.forEach(function(tab, i) {
            tab.id = 'figtab-' + p + '-' + i;
            items[i].id = 'figpanel-' + p + '-' + i;
            tab.setAttribute('aria-controls', items[i].id);
            items[i].setAttribute('role', 'tabpanel');
            items[i].setAttribute('aria-labelledby', tab.id);
            tab.addEventListener('click', function() { select(i, false); });
            tab.addEventListener('keydown', function(event) {
                const last = tabs.length - 1;
                let next = null;
                if (event.key === 'ArrowRight') next = i === last ? 0 : i + 1;
                if (event.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
                if (event.key === 'Home') next = 0;
                if (event.key === 'End') next = last;
                if (next === null) return;
                event.preventDefault();
                select(next, true);
            });
        });

        select(0, false);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initFigurePanels();

    const nav = document.getElementById('site-nav');
    const scrollButton = document.querySelector('.scroll-to-top');

    // Show the scroll-to-top button and the nav hairline once the page has scrolled
    const onScroll = function() {
        const y = window.pageYOffset;
        scrollButton.classList.toggle('visible', y > 600);
        nav.classList.toggle('is-scrolled', y > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mark the nav link of the section currently in view
    const links = Array.from(document.querySelectorAll('.nav-links a'));
    const targets = links
        .map(function(a) { return document.querySelector(a.getAttribute('href')); })
        .filter(Boolean);
    if ('IntersectionObserver' in window && targets.length) {
        const sectionObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function(a) {
                    a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        targets.forEach(function(t) { sectionObserver.observe(t); });
    }

    // Reveal blocks as they scroll into view (CSS only hides them when html.js is set)
    const reveals = document.querySelectorAll('.reveal');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
        reveals.forEach(function(el) { el.classList.add('is-visible'); });
        return;
    }
    const revealObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function(el) { revealObserver.observe(el); });
});
