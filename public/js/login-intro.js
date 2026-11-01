// Login page intro: the nest draws itself, the name springs in, then the birds fly out. About 2 seconds.
// It is made with one GSAP timeline: a list of animations, each one with its own start time.
// This file only changes how the page looks. Signing in still lives in login.js.

(function () {
  const flock = createFlock(document.getElementById('flock'), document.getElementById('logo-nest'));

  if (!motionOK) {
    // No GSAP or "reduce motion" is on: the page simply shows up, already finished, with a still flock
    flock.showStill();
    return;
  }

  const INTRO_COOKIE = 'classnest-intro-seen';
  const FONT_WAIT_MS = 600;
  const MAX_INTRO_MS = 3500; // even on a very slow computer, the login appears after this much visible time
  const LINE_END = 1.02; // a twig's dash finishes just past its start, so its round tip doesn't show as a dot

  const root = document.documentElement;
  const logoParts = document.querySelector('.logo');
  const twigs = gsap.utils.toArray('#logo-nest path');
  const letters = gsap.utils.toArray('.word-letters span');
  const word = document.getElementById('logo-word');
  const sweep = word.querySelector('.word-sweep');
  const sweepText = word.querySelector('.word-sweep-text');
  const line = document.getElementById('logo-line');
  const tagline = document.getElementById('logo-tagline');
  const loginSide = document.querySelector('.auth-panel');
  const tilt = document.getElementById('card-tilt');

  let intro;

  // ---------- Pausing while the tab is hidden ----------

  function followTab() {
    intro.paused(document.hidden);
  }
  document.addEventListener('visibilitychange', followTab);

  function finish() {
    tilt.inert = false;
    gsap.set(twigs, { clearProps: 'strokeDasharray,strokeDashoffset' });
    gsap.set([logoParts, loginSide], { clearProps: 'all' });
  }

  // ---------- The full intro (about 2 seconds) ----------

  function buildFullIntro() {
    const wordWidth = word.getBoundingClientRect().width;
    const sweepTravel = wordWidth * 1.5;

    // Each twig is drawn with one long dash. Sliding the dash along makes the twig seem to grow.
    twigs.forEach((twig) => twig.setAttribute('pathLength', 1));
    gsap.set(twigs, { strokeDasharray: `1 ${LINE_END + 0.1}`, strokeDashoffset: LINE_END });

    gsap.set([...letters, tagline, loginSide], { autoAlpha: 0 });
    gsap.set(line, { scaleX: 0 });
    gsap.set(sweep, { x: -wordWidth * 0.45, skewX: -18 });
    gsap.set(sweepText, { x: wordWidth * 0.45, skewX: 18 });

    return (
      gsap
        .timeline({ onComplete: finish, defaults: { ease: 'power2.out' } })

        // 0 - 0.9s: the nest draws itself, twig by twig
        .to(twigs, { strokeDashoffset: 0, duration: 0.42, stagger: { amount: 0.48 }, ease: 'power1.inOut' }, 0)

        // 0.6 - 1.3s: each letter springs in
        .fromTo(letters, { y: 20, scale: 0.72 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, stagger: 0.04, ease: 'back.out(2.4)' }, 0.6)

        // 1.15 - 1.8s: a soft light passes over the word, a thin line draws under it, the tagline fades in
        .to(sweep, { autoAlpha: 1, duration: 0.08, ease: 'none' }, 1.15)
        .to(sweep, { x: `+=${sweepTravel}`, duration: 0.5, ease: 'power1.inOut' }, 1.15)
        .to(sweepText, { x: `-=${sweepTravel}`, duration: 0.5, ease: 'power1.inOut' }, 1.15)
        .to(sweep, { autoAlpha: 0, duration: 0.1, ease: 'none' }, 1.56)
        .to(line, { scaleX: 1, duration: 0.42, ease: 'power3.inOut' }, 1.2)
        .to(tagline, { autoAlpha: 1, duration: 0.36 }, 1.44)

        // 1.3 - 2s: the login appears, and the birds leave the nest (they carry on after the intro)
        .fromTo(loginSide, { x: 14 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' }, 1.4)
        .call(flock.flyFromNest, null, 1.6)
    );
  }

  async function playFull() {
    tilt.inert = true; // a click near the end of the intro shouldn't open a tile that is still moving

    // Wait a moment for the logo's font, so the word doesn't change shape halfway through
    const fontLoaded = document.fonts.load('600 1em Jost', 'CLASSNEST');
    await Promise.race([fontLoaded, new Promise((done) => setTimeout(done, FONT_WAIT_MS))]);

    intro = buildFullIntro();
    root.classList.remove('intro-pending');
    followTab();
    startTimeLimit();
  }

  // The intro always plays to the end. This only rescues a computer so slow that the login would never appear.
  // Time spent on another tab doesn't count, because the intro is paused then.
  function startTimeLimit() {
    let timer;
    function restart() {
      clearTimeout(timer);
      if (document.hidden || intro.progress() === 1) return;
      timer = setTimeout(() => intro.progress(1), MAX_INTRO_MS - intro.time() * 1000);
    }
    document.addEventListener('visibilitychange', restart);
    restart();
  }

  // ---------- The quick version (0.5 seconds, for every later visit in this browser session) ----------

  function playQuick() {
    tilt.inert = true;
    gsap.set([logoParts, loginSide], { autoAlpha: 0 });
    root.classList.remove('intro-pending');
    flock.flyAtOnce();

    intro = gsap
      .timeline({ onComplete: finish, defaults: { ease: 'power2.out' } })
      .to(logoParts, { autoAlpha: 1, duration: 0.35 }, 0)
      .fromTo(loginSide, { y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.1);
    followTab();
  }

  // ---------- Start ----------

  // A cookie with no expiry date is forgotten when the browser closes, and all its tabs share it
  function isFirstVisit() {
    if (document.cookie.includes(INTRO_COOKIE)) return false;
    document.cookie = `${INTRO_COOKIE}=yes; path=/; SameSite=Lax`;
    return document.cookie.includes(INTRO_COOKIE); // if cookies are blocked, nobody has to sit through the long version every time
  }

  if (isFirstVisit()) {
    playFull();
  } else {
    playQuick();
  }
})();
