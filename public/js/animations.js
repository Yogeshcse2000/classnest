// Shared GSAP animations. Everything still works if GSAP fails to load,
// and animations are skipped for people who turned on "reduce motion" on their computer.

const motionOK = Boolean(window.gsap) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Smooth hover lift on buttons and on cards with the "lift" class
function addHoverLift(root = document) {
  if (!motionOK) return;
  root.querySelectorAll('.btn, .lift').forEach((el) => {
    if (el.dataset.liftReady) return; // don't add the same listeners twice
    el.dataset.liftReady = 'yes';
    el.addEventListener('mouseenter', () => gsap.to(el, { y: -2, duration: 0.2, ease: 'power2.out' }));
    el.addEventListener('mouseleave', () => gsap.to(el, { y: 0, duration: 0.2, ease: 'power2.out' }));
  });
}

// Fade and rise elements into place, one after another
function enterAnimation(targets) {
  if (!motionOK) return;
  gsap.from(targets, {
    opacity: 0,
    y: 12,
    duration: 0.3,
    stagger: 0.04,
    ease: 'power3.out',
    clearProps: 'opacity,transform',
  });
}

// A pop-up fades in while its content rises a little.
// Never move or scale the <dialog> itself: to read its transform, GSAP lifts it out of the page for a moment,
// and a dialog that leaves the page stops being a pop-up (it drops to the bottom of the page instead).
function popIn(dialog) {
  if (!motionOK) return;
  gsap.from(dialog, { opacity: 0, duration: 0.2, ease: 'none' });
  gsap.from(dialog.children, { y: 6, duration: 0.2, ease: 'power2.out', clearProps: 'transform' });
}

// A number counts up from 0 when it appears
function countUp(element, value) {
  if (!motionOK) {
    element.textContent = value;
    return;
  }
  const counter = { value: 0 };
  gsap.to(counter, {
    value,
    duration: 0.3,
    ease: 'power2.out',
    snap: { value: 1 },
    onUpdate: () => (element.textContent = counter.value),
  });
}

// The ring around each "Live now" dot grows and fades, over and over
function pulseLiveDots(root = document) {
  if (!motionOK) return;
  root.querySelectorAll('.live-dot i').forEach((ring) => {
    gsap.fromTo(ring, { scale: 1, opacity: 0.7 }, { scale: 2.8, opacity: 0, duration: 1.3, ease: 'power2.out', repeat: -1 });
  });
}

// Stops the pulses inside a list that is about to be replaced
function stopLiveDots(root = document) {
  if (motionOK) gsap.killTweensOf(root.querySelectorAll('.live-dot i'));
}

// The two background glows slowly grow and fade, like breathing. GSAP stops by itself while the tab is hidden.
function breathe(glows) {
  gsap.to(glows, { opacity: 0.6, scale: 1.08, duration: 5, stagger: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
}

// One soft light follows the mouse across whichever card it is on. Only its position (transform) changes.
function addSpotlight() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return; // phones have no mouse

  const spot = document.createElement('span');
  spot.className = 'spot';
  spot.innerHTML = '<span></span>';
  const moveX = gsap.quickSetter(spot.firstChild, 'x', 'px');
  const moveY = gsap.quickSetter(spot.firstChild, 'y', 'px');
  const LIGHT_RADIUS = 210;

  document.addEventListener('pointermove', (event) => {
    const card = event.target.closest?.('.card');
    if (!card) return;
    if (spot.parentElement !== card) card.appendChild(spot);
    const box = card.getBoundingClientRect();
    moveX(event.clientX - box.left - LIGHT_RADIUS);
    moveY(event.clientY - box.top - LIGHT_RADIUS);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  addHoverLift();

  // Only the inner pages have the ambient background
  const glows = document.querySelectorAll('.ambient-glow');
  if (motionOK && glows.length) {
    breathe(glows);
    addSpotlight();
  }
});
