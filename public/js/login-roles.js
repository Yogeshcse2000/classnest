// Login page: the chosen role card grows into the login form, and Back shrinks it again.
// This file only moves between the two views. Picking the role and signing in still live in login.js.

(function () {
  const MORPH_SECONDS = 0.4;

  const panel = document.getElementById('card-tilt');
  const loginCard = document.getElementById('login-card');
  const formParts = [...loginCard.children];
  const roleTitle = document.getElementById('role-title');
  const roleCards = [...document.querySelectorAll('.role-card')];
  const backButton = document.getElementById('role-back');

  let morphing = false;

  // How to place the form so it sits exactly over a role card. It then animates back to its own spot.
  // Only transform changes, so the size change stays smooth.
  function formOverCard(roleCard) {
    const from = roleCard.getBoundingClientRect();
    const to = loginCard.getBoundingClientRect();
    return {
      x: from.left - to.left,
      y: from.top - to.top,
      scaleX: from.width / to.width,
      scaleY: from.height / to.height,
    };
  }

  function finish(step, focusTarget) {
    gsap.set([roleTitle, ...roleCards, loginCard, ...formParts], { clearProps: 'all' });
    panel.dataset.step = step;
    morphing = false;
    focusTarget.focus();
  }

  function openForm(roleCard) {
    if (morphing) return;

    if (!motionOK) {
      panel.dataset.step = 'form';
      identifierInput.focus();
      return;
    }

    morphing = true;
    const start = formOverCard(roleCard);
    panel.dataset.step = 'morph';

    gsap
      .timeline({ onComplete: () => finish('form', identifierInput) })
      .set(roleCard, { opacity: 0 }, 0)
      .to([roleTitle, ...roleCards.filter((other) => other !== roleCard)], { opacity: 0, duration: 0.15, ease: 'none' }, 0)
      .fromTo(loginCard, { ...start, transformOrigin: '0 0' }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: MORPH_SECONDS, ease: 'power3.inOut' }, 0)
      .fromTo(formParts, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2, stagger: 0.02, ease: 'power2.out' }, 0.22);
  }

  function backToRoles() {
    if (morphing) return;

    hideError();
    passwordInput.value = '';
    const roleCard = document.querySelector('.role-card[aria-pressed="true"]');

    if (!motionOK) {
      panel.dataset.step = 'role';
      roleCard.focus();
      return;
    }

    morphing = true;
    gsap.set(loginCard, { transformOrigin: '0 0' });
    const end = formOverCard(roleCard);
    const others = [roleTitle, ...roleCards.filter((other) => other !== roleCard)];
    gsap.set([roleCard, ...others], { opacity: 0 });
    panel.dataset.step = 'morph';

    gsap
      .timeline({ onComplete: () => finish('role', roleCard) })
      .to(formParts, { opacity: 0, duration: 0.12, ease: 'none' }, 0)
      .to(loginCard, { ...end, duration: MORPH_SECONDS, ease: 'power3.inOut' }, 0)
      .to(others, { opacity: 1, duration: 0.2, ease: 'none' }, 0.2)
      .set(roleCard, { opacity: 1 }, MORPH_SECONDS);
  }

  roleCards.forEach((roleCard) => roleCard.addEventListener('click', () => openForm(roleCard)));
  backButton.addEventListener('click', backToRoles);
})();
