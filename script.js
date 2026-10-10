(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('a[href^="#"]')
  );

  if (!navLinks.length) return;

  function scrollToTarget(target) {
    var headerHeight = 0;
    if (header) {
      var styles = window.getComputedStyle(header);
      if (styles.position === 'fixed' || styles.position === 'sticky') {
        headerHeight = header.offsetHeight;
      }
    }
    var top =
      target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;

    var prefersReduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if ('scrollBehavior' in document.documentElement.style && !prefersReduced) {
      window.scrollTo({ top: top, behavior: 'smooth' });
    } else {
      window.scrollTo(0, top);
    }
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var hash = link.getAttribute('href');
      if (!hash || hash === '#' || hash.charAt(0) !== '#') return;

      var target = document.getElementById(hash.slice(1));
      if (!target) return;

      event.preventDefault();
      scrollToTarget(target);

      if (history && typeof history.pushState === 'function') {
        history.pushState(null, '', hash);
      }

      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
    });
  });

  // Highlight the navigation link of the section currently in view.
  var menuLinks = Array.prototype.slice.call(
    document.querySelectorAll('.site-nav a[href^="#"]')
  );
  var sections = menuLinks
    .map(function (link) {
      return document.getElementById(link.getAttribute('href').slice(1));
    })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var setActive = function (id) {
      menuLinks.forEach(function (link) {
        if (link.getAttribute('href') === '#' + id) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };

    var observer = new IntersectionObserver(
      function (entries) {
        var visible = entries
          .filter(function (entry) {
            return entry.isIntersecting;
          })
          .sort(function (a, b) {
            return b.intersectionRatio - a.intersectionRatio;
          })[0];

        if (visible && visible.target.id) {
          setActive(visible.target.id);
        }
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }
})();