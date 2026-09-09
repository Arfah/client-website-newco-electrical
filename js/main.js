/* Newco Electrical — main.js
   Nav, mobile menu, scroll spy, reveal observer, count-ups, parallax.
   Everything renders visible without this file; it only adds motion and the menu. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 960px)');

  /* ---- Hero load sequence ------------------------------------------------ */
  function startHero() {
    // Two frames so the initial (hidden) state paints before transitions run.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.add('is-loaded'); });
    });
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startHero();
  } else {
    document.addEventListener('DOMContentLoaded', startHero);
  }

  /* ---- Sticky nav: shadow and tighter height past the hero -------------- */
  var nav = document.querySelector('.site-nav');
  var hero = document.querySelector('.hero');
  var navTicking = false;
  function updateNav() {
    var threshold = hero ? Math.max(hero.offsetHeight - nav.offsetHeight, 80) : 80;
    nav.classList.toggle('is-scrolled', window.scrollY > threshold);
    navTicking = false;
  }
  window.addEventListener('scroll', function () {
    if (!navTicking) { navTicking = true; requestAnimationFrame(updateNav); }
  }, { passive: true });
  updateNav();

  /* ---- Mobile menu -------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    toggle.querySelector('span:last-child').textContent = open ? 'Close' : 'Menu';
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
    desktop.addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ---- Scroll spy: highlight the current section in the desktop nav ----- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var spied = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && spied.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    spied.forEach(function (s) { spy.observe(s); });
  }

  /* ---- Count-ups ----------------------------------------------------------- */
  var baseDuration = parseFloat(getComputedStyle(root).getPropertyValue('--d-base')) || 600;
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var start = null;
    var duration = baseDuration * 1.6; // long enough to read, still tied to the token
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      el.textContent = (target * easeOut(p)).toFixed(decimals);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(frame);
  }

  /* ---- Section arrival: fires once, unobserves ---------------------------- */
  var sections = document.querySelectorAll('[data-reveal]');
  function arrive(section) {
    section.classList.add('is-in');
    if (!reduceMotion) {
      section.querySelectorAll('.count').forEach(function (el) {
        el.textContent = (0).toFixed(parseInt(el.getAttribute('data-decimals') || '0', 10));
        // Start once the conductor has closed, matching the reveal delay.
        setTimeout(function () { countUp(el); }, baseDuration * 0.6);
      });
    }
  }
  if (reduceMotion || !('IntersectionObserver' in window)) {
    sections.forEach(function (s) { s.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          arrive(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---- Hero parallax: desktop only, a few percent of travel -------------- */
  var heroImg = document.querySelector('.hero-photo img');
  if (heroImg && !reduceMotion) {
    var parallaxTicking = false;
    function parallax() {
      parallaxTicking = false;
      if (!desktop.matches) { heroImg.style.transform = ''; return; }
      var y = window.scrollY;
      if (y > window.innerHeight) return;
      heroImg.style.transform = 'translateY(' + (y * 0.08).toFixed(1) + 'px)';
    }
    // Wait for the settle animation to finish before taking over the transform.
    setTimeout(function () {
      window.addEventListener('scroll', function () {
        if (!parallaxTicking) { parallaxTicking = true; requestAnimationFrame(parallax); }
      }, { passive: true });
    }, 1600);
  }

  /* ---- Footer year ---------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
