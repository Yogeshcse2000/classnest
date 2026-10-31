// Login page intro: a short "launch video" made with one GSAP timeline.
// A timeline is a list of animations, each one with its own start time.
// This file only changes how the page looks. Signing in still lives in login.js.

(function () {
  if (!motionOK) return; // no GSAP or "reduce motion" is on: the page simply shows up, already finished

  const INTRO_COOKIE = 'classnest-intro-seen';
  const FONT_WAIT_MS = 600;
  const MAX_INTRO_MS = 6000; // even on a very slow computer, the login appears after this much visible time
  const LOGO_ZOOM = 1.9; // how much bigger the logo and word are in the middle of the screen
  const MAX_TILT = 4; // degrees
  const ALMOST_INVISIBLE = 0.001;

  const root = document.documentElement;
  const canvas = document.getElementById('stage-particles');
  const dot = document.getElementById('stage-dot');
  const light = document.getElementById('stage-light');
  const arc = document.getElementById('stage-arc');
  const arcGlows = [document.getElementById('arc-glow'), document.getElementById('arc-amber')];
  const columns = gsap.utils.toArray('.grid-col');
  const hero = document.getElementById('hero');
  const logo = document.getElementById('hero-logo');
  const word = document.getElementById('hero-word');
  const taglineParts = gsap.utils.toArray('#hero-tagline span');
  const tilt = document.getElementById('card-tilt');
  const rolePicker = document.getElementById('role-picker');
  const pickerParts = rolePicker.querySelectorAll('#role-title, .role-card');

  const particles = createParticles(canvas);
  const motion = []; // every animation that must stop while the tab is hidden

  // ---------- Pausing while the tab is hidden ----------

  function followTab() {
    motion.forEach((animation) => animation.paused(document.hidden));
  }
  document.addEventListener('visibilitychange', followTab);

  // ---------- After the intro: the background stays alive ----------

  function startTilt() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return; // phones have no mouse

    gsap.set(tilt, { transformPerspective: 1000 });
    const turnX = gsap.quickTo(tilt, 'rotationX', { duration: 0.6, ease: 'power3' });
    const turnY = gsap.quickTo(tilt, 'rotationY', { duration: 0.6, ease: 'power3' });

    window.addEventListener('pointermove', (event) => {
      turnY((event.clientX / window.innerWidth - 0.5) * 2 * MAX_TILT);
      turnX((event.clientY / window.innerHeight - 0.5) * -2 * MAX_TILT);
    });
    root.addEventListener('mouseleave', () => {
      turnX(0);
      turnY(0);
    });
  }

  function goLive() {
    gsap.set(hero, { clearProps: 'transform' });
    gsap.set(rolePicker, { clearProps: 'all' }); // from here on, the stylesheet decides when it shows
    tilt.inert = false;

    motion.push(gsap.to(arcGlows, { opacity: 0.65, scale: 1.015, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    columns.forEach((column, index) => {
      const direction = index % 2 ? 1 : -1;
      motion.push(gsap.to(column, { y: direction * 36, duration: 18, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    });
    followTab();
    startTilt();
  }

  let intro;

  // ---------- The full intro (about 4 seconds) ----------

  // Put each letter in its own box so they can appear one by one, and add a bright copy of the word for the light sweep
  function splitWord() {
    const text = word.textContent;
    word.setAttribute('aria-label', text);
    word.innerHTML = `
      <span class="word-letters" aria-hidden="true">${[...text].map((letter) => `<span>${letter}</span>`).join('')}</span>
      <span class="word-sweep" aria-hidden="true"><span class="word-sweep-text">${text}</span></span>`;
    return {
      letters: word.querySelectorAll('.word-letters span'),
      sweep: word.querySelector('.word-sweep'),
      sweepText: word.querySelector('.word-sweep-text'),
    };
  }

  function buildFullIntro() {
    const { letters, sweep, sweepText } = splitWord();

    // Measure where the logo and word end up, then work out how to start them big in the middle of the screen
    const heroBox = hero.getBoundingClientRect();
    const logoBox = logo.getBoundingClientRect();
    const wordBox = word.getBoundingClientRect();
    const zoom = Math.min(LOGO_ZOOM, (window.innerWidth * 0.86) / wordBox.width);
    const middle = window.innerHeight / 2;
    const logoInMiddle = middle - heroBox.top - (logoBox.height / 2) * zoom;
    const wordInMiddle = middle - heroBox.top - ((wordBox.bottom - heroBox.top) / 2) * zoom;
    const sweepTravel = wordBox.width * 1.5;

    particles.build(logoBox.left + logoBox.width / 2, middle, logoBox.width * zoom);

    gsap.set([logo, ...taglineParts, ...letters, rolePicker, sweep], { autoAlpha: 0 });
    // Almost invisible, not hidden: the browser paints these huge layers now, in the dark, instead of halfway through scene 3
    gsap.set([arc, light, ...columns], { opacity: ALMOST_INVISIBLE });
    gsap.set(hero, { y: logoInMiddle, scale: zoom, transformOrigin: '50% 0' });
    gsap.set(sweep, { x: -wordBox.width * 0.45, skewX: -18 });
    gsap.set(sweepText, { x: wordBox.width * 0.45, skewX: 18 });

    return (
      gsap
        .timeline({ onComplete: goLive, defaults: { ease: 'power2.out' } })

        // Scene 1 (0 - 0.8s): a heartbeat in the dark, and light slowly spreads out
        .set(dot, { autoAlpha: 1 }, 0)
        .fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.16 }, 0)
        .to(dot, { keyframes: { scale: [1, 1.7, 1.15, 2, 1] }, duration: 0.64, ease: 'none' }, 0.16)
        .fromTo(light, { scale: 0.12 }, { opacity: 0.7, scale: 0.5, duration: 0.8, ease: 'sine.out' }, 0)

        // Scene 2 (0.8 - 2s): the dot bursts, the particles build the logo, and the "camera" moves in
        .to(dot, { scale: 5, autoAlpha: 0, duration: 0.22 }, 0.8)
        .to(particles.state, { form: 1, duration: 1.1, ease: 'none' }, 0.8)
        .fromTo(canvas, { scale: 0.88 }, { scale: 1, duration: 1.1 }, 0.8)
        .to(light, { opacity: 1, scale: 1, duration: 1.2 }, 0.8)
        .to(logo, { autoAlpha: 1, duration: 0.2, ease: 'none' }, 1.8)

        // Scene 3 (2 - 3.2s): the arc rises, the grid drifts in, the word appears with a light sweep
        .to(particles.state, { release: 1, duration: 1.2, ease: 'power2.inOut' }, 1.95)
        .fromTo(arc, { y: window.innerHeight * 0.5 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 2)
        .fromTo(columns, { y: 160 }, { opacity: 1, y: 0, duration: 1, stagger: 0.06 }, 2)
        .to(hero, { y: wordInMiddle, duration: 0.5, ease: 'power2.inOut' }, 2.05)
        .fromTo(letters, { y: 18 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'back.out(1.6)' }, 2.2)
        .to(sweep, { autoAlpha: 1, duration: 0.1, ease: 'none' }, 2.72)
        .to(sweep, { x: `+=${sweepTravel}`, duration: 0.48, ease: 'power1.inOut' }, 2.72)
        .to(sweepText, { x: `-=${sweepTravel}`, duration: 0.48, ease: 'power1.inOut' }, 2.72)
        .to(sweep, { autoAlpha: 0, duration: 0.1, ease: 'none' }, 3.1)

        // Scene 4 (3.2 - 4s): the heading moves up, the glass role cards and the tagline appear
        .to(hero, { y: 0, scale: 1, duration: 0.65, ease: 'power3.inOut' }, 3.2)
        .fromTo(rolePicker, { scale: 0.93, y: 28 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 3.3)
        .from(pickerParts, { opacity: 0, y: 10, duration: 0.3, stagger: 0.06, clearProps: 'opacity,transform' }, 3.45)
        .fromTo(taglineParts, { y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.1 }, 3.45)
    );
  }

  async function playFull() {
    tilt.inert = true; // a click near the end of the intro shouldn't open a card that is still moving

    // Wait a moment for the heading font, so the word doesn't change shape halfway through
    const fontLoaded = document.fonts.load('700 1em Outfit', 'ClassNest');
    await Promise.race([fontLoaded, new Promise((done) => setTimeout(done, FONT_WAIT_MS))]);

    intro = buildFullIntro();
    motion.push(intro);
    root.classList.remove('intro-pending');
    gsap.ticker.add(particles.draw);
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
    const scenery = [light, arc, ...columns];
    particles.build(0, 0, 0);
    Object.assign(particles.state, { form: 1, release: 1, fade: 0 });

    tilt.inert = true;
    gsap.set([...scenery, hero, rolePicker], { autoAlpha: 0 });
    root.classList.remove('intro-pending');
    gsap.ticker.add(particles.draw);

    intro = gsap
      .timeline({ onComplete: goLive, defaults: { ease: 'power2.out' } })
      .to(scenery, { autoAlpha: 1, duration: 0.3 }, 0)
      .to(particles.state, { fade: 1, duration: 0.5 }, 0)
      .fromTo(hero, { y: -10 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0.05)
      .fromTo(rolePicker, { scale: 0.97, y: 12 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.1);
    motion.push(intro);
    followTab();
  }

  // ---------- Start ----------

  // A cookie with no expiry date is forgotten when the browser closes, and all its tabs share it
  function isFirstVisit() {
    if (document.cookie.includes(INTRO_COOKIE)) return false;
    document.cookie = `${INTRO_COOKIE}=yes; path=/; SameSite=Lax`;
    return document.cookie.includes(INTRO_COOKIE); // if cookies are blocked, nobody has to sit through the long version every time
  }

  window.addEventListener('resize', particles.resize);

  if (isFirstVisit()) {
    playFull();
  } else {
    playQuick();
  }
})();
