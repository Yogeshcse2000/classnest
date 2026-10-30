// Shared GSAP animations. Everything still works if GSAP fails to load,
// and animations are skipped for people who turned on "reduce motion" on their computer.

const motionOK = Boolean(window.gsap) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Smooth hover lift on buttons and on cards with the "lift" class
function addHoverLift(root = document) {
  if (!motionOK) return;
  root.querySelectorAll('.btn, .lift').forEach((el) => {
    if (el.dataset.liftReady) return; // don't add the same listeners twice
    el.dataset.liftReady = 'yes';
    el.addEventListener('mouseenter', () => gsap.to(el, { y: -2, duration: 0.3, ease: 'power2.out' }));
    el.addEventListener('mouseleave', () => gsap.to(el, { y: 0, duration: 0.3, ease: 'power2.out' }));
  });
}

// Fade and rise elements into place, one after another
function enterAnimation(targets) {
  if (!motionOK) return;
  gsap.from(targets, {
    opacity: 0,
    y: 16,
    duration: 0.45,
    stagger: 0.06,
    ease: 'power3.out',
    clearProps: 'opacity,transform',
  });
}

document.addEventListener('DOMContentLoaded', () => addHoverLift());
