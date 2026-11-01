// Login page opening: "CLASSNEST" is revealed large in the middle of the whole screen, then moves into the left panel,
// where the nest, the birds and the login join it. About 3.6 seconds.
// It is made with one GSAP timeline: a list of animations, each one with its own start time.
// The word never leaves its place in the page. It only starts with a transform (a move and a zoom) that shrinks to
// nothing, so it lands exactly where the finished layout has it, with no jump at the end.
// This file only changes how the page looks. Signing in still lives in login.js.

(function () {
  const flock = createFlock(document.getElementById('flock'), document.getElementById('logo-nest'));

  if (!motionOK) {
    // No GSAP or "reduce motion" is on: the page simply shows up, already finished, with a still flock
    flock.showStill();
    return;
  }

  const INTRO_COOKIE = 'classnest-intro-seen';
  const FONT_WAIT_MS = 1000; // the screen is black meanwhile, and the word must be measured in its real font
  const MAX_INTRO_MS = 6000; // even on a very slow computer, the login appears after this much visible time

  const WORD_WIDTH_SHARE = 0.82; // how much of the screen's width the large word fills
  const WORD_HEIGHT_SHARE = 0.32; // and the most of its height, for wide, short windows
  const TAGLINE_START_SIZE = 0.6; // the tagline starts smaller than the word's zoom, so it stays quiet under it
  const PHONE_SPEED = 1.7; // phones play the same opening, faster

  const root = document.documentElement;
  const logo = document.querySelector('.logo');
  const nest = document.getElementById('logo-nest');
  const logoName = document.getElementById('logo-name');
  const word = document.getElementById('logo-word');
  const letters = gsap.utils.toArray('.word-letters span');
  const sweep = word.querySelector('.word-sweep');
  const sweepText = word.querySelector('.word-sweep-text');
  const line = document.getElementById('logo-line');
  const tagline = document.getElementById('logo-tagline');
  const loginSide = document.getElementById('auth-main');
  const tilt = document.getElementById('card-tilt');
  const wideScreen = window.matchMedia('(min-width: 861px)');

  let intro;

  // ---------- Pausing while the tab is hidden ----------

  function followTab() {
    intro.paused(document.hidden);
  }
  document.addEventListener('visibilitychange', followTab);

  function finish() {
    tilt.inert = false;
    gsap.set([logo, logoName, nest, line, tagline, loginSide, sweep, sweepText, ...letters], { clearProps: 'all' });
  }

  // ---------- The full opening ----------

  // Works out the move and zoom that put the word in the middle of the whole screen.
  // A zoom grows out of the box's own centre, so the word's distance from that centre grows with it.
  function wordInTheMiddle() {
    const nameBox = logoName.getBoundingClientRect();
    const wordBox = word.getBoundingClientRect();
    const zoom = Math.min((window.innerWidth * WORD_WIDTH_SHARE) / wordBox.width, (window.innerHeight * WORD_HEIGHT_SHARE) / wordBox.height);
    const nameMiddleX = nameBox.left + nameBox.width / 2;
    const nameMiddleY = nameBox.top + nameBox.height / 2;
    const wordMiddleX = wordBox.left + wordBox.width / 2;
    const wordMiddleY = wordBox.top + wordBox.height / 2;
    return {
      zoom,
      x: window.innerWidth / 2 - nameMiddleX - (wordMiddleX - nameMiddleX) * zoom,
      y: window.innerHeight / 2 - nameMiddleY - (wordMiddleY - nameMiddleY) * zoom,
    };
  }

  function buildFullIntro() {
    // Measure before anything moves. These are the word's own sizes, which stay true however much it is zoomed.
    const wordWidth = word.offsetWidth;
    const sweepTravel = wordWidth * 1.5;
    const { zoom, x, y } = wordInTheMiddle();

    gsap.set(logoName, { x, y, scale: zoom, pointerEvents: 'none' });
    gsap.set([nest, tagline, loginSide], { autoAlpha: 0 });
    gsap.set(letters, { autoAlpha: 0, scale: 0, y: 14, transformOrigin: '50% 70%' });
    gsap.set(line, { scaleX: 0, scaleY: 1 / zoom, transformOrigin: '0 50%' }); // stays one pixel thin at any zoom
    gsap.set(tagline, { scale: TAGLINE_START_SIZE });
    gsap.set(sweep, { x: -wordWidth * 0.45, skewX: -18 });
    gsap.set(sweepText, { x: wordWidth * 0.45, skewX: 18 });

    const timeline = gsap
      .timeline({ onComplete: finish, defaults: { ease: 'power2.out' } })

      // 0.1 - 1s: each letter springs in, a little dim, so the light has something to brighten
      .to(letters, { autoAlpha: 0.72, duration: 0.2, stagger: 0.06, ease: 'none' }, 0.1)
      .to(letters, { scale: 1, y: 0, duration: 0.85, stagger: 0.06, ease: 'elastic.out(1, 0.55)' }, 0.1)

      // 1.05 - 1.6s: one soft light passes across the word, and each letter stays bright behind it
      .to(sweep, { autoAlpha: 1, duration: 0.08, ease: 'none' }, 1.05)
      .to(sweep, { x: `+=${sweepTravel}`, duration: 0.55, ease: 'power1.inOut' }, 1.05)
      .to(sweepText, { x: `-=${sweepTravel}`, duration: 0.55, ease: 'power1.inOut' }, 1.05)
      .to(letters, { opacity: 1, duration: 0.2, stagger: 0.04, ease: 'none' }, 1.12)
      .to(sweep, { autoAlpha: 0, duration: 0.1, ease: 'none' }, 1.52)

      // 1.45 - 2s: the thin line draws from left to right, and the tagline fades in below it
      .to(line, { scaleX: 1, duration: 0.42, ease: 'power3.inOut' }, 1.45)
      .to(tagline, { autoAlpha: 1, duration: 0.38 }, 1.65)

      // 2.2 - 3s: everything shrinks and moves into the left panel
      .to(logoName, { x: 0, y: 0, scale: 1, duration: 0.8, ease: 'power3.inOut' }, 2.2)
      .to(line, { scaleY: 1, duration: 0.8, ease: 'power3.inOut' }, 2.2)
      .to(tagline, { scale: 1, duration: 0.8, ease: 'power3.inOut' }, 2.2)

      // 3 - 3.6s: once it has arrived, the nest fades in above the word and the login comes in from the right.
      // The birds leave the nest as soon as it can be seen, and carry on after the opening.
      .to(nest, { autoAlpha: 1, duration: 0.55, ease: 'none' }, 3)
      .call(flock.flyFromNest, null, 3.25);

    // A phone has no panel beside the logo, so its login simply rises into place
    if (wideScreen.matches) {
      timeline.fromTo(loginSide, { x: 56 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' }, 3);
    } else {
      timeline.fromTo(loginSide, { y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 3);
      timeline.timeScale(PHONE_SPEED);
    }
    return timeline;
  }

  async function playFull() {
    tilt.inert = true; // a click near the end of the opening shouldn't open a tile that is still moving

    // Wait for the logo's font, so the word doesn't change shape halfway through
    const fontLoaded = document.fonts.load('600 1em "Clash Display"', 'CLASSNEST');
    await Promise.race([fontLoaded, new Promise((done) => setTimeout(done, FONT_WAIT_MS))]);

    intro = buildFullIntro();
    root.classList.remove('intro-pending');
    followTab();
    startTimeLimit();
  }

  // The opening always plays to the end. This only rescues a computer so slow that the login would never appear.
  // Time spent on another tab doesn't count, because the opening is paused then.
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

  // The finished split layout, which simply fades in with the flock already in the air
  function playQuick() {
    tilt.inert = true;
    gsap.set([logo, loginSide], { autoAlpha: 0 });
    root.classList.remove('intro-pending');
    flock.flyAtOnce();

    intro = gsap
      .timeline({ onComplete: finish, defaults: { ease: 'none' } })
      .to(logo, { autoAlpha: 1, duration: 0.45 }, 0)
      .to(loginSide, { autoAlpha: 1, duration: 0.45 }, 0.05);
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
