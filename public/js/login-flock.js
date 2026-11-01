// Login page birds, drawn on a <canvas> (a blank area that JavaScript paints on, like a tiny TV screen).
// Every bird follows three simple rules, known as "boids": keep a little apart, fly the same way as your neighbours,
// and stay near them. Nothing tells them where to go as a group, yet together they move like a real flock.
// On top of that, each bird drifts gently towards the mouse.

function createFlock(canvas, nest) {
  const ctx = canvas.getContext('2d');
  const panel = canvas.parentElement;
  const wideScreen = window.matchMedia('(min-width: 861px)'); // no birds on tablets and phones (same width as style.css)

  const BIRD_COUNT = 50;
  const LEAVE_GAP = 0.03; // seconds between one bird leaving the nest and the next
  const FADE_IN = 3; // how fast a new bird appears
  const COLOUR_CHANGE = 5; // how fast the flock changes colour
  const PIXEL_LIMIT = 2; // sharp enough, and sharper screens would only cost speed
  const LONGEST_STEP = 1 / 20; // after a stutter, birds carry on instead of jumping across the screen

  const MIN_SPEED = 50; // pixels per second
  const MAX_SPEED = 135;
  const NEIGHBOUR_DISTANCE = 80; // a bird only notices others this close
  const PERSONAL_SPACE = 20; // and it moves away from anyone closer than this
  const APART = 700; // the strength of each rule
  const ALIGN = 1.1;
  const TOGETHER = 0.5;
  const FOLLOW = 38;
  const RESTLESS = 260; // a small random push, so the flock never settles into neat rows
  const EDGE_MARGIN = 70; // birds start turning back this far from the edge of the panel
  const EDGE_TURN = 160;

  const BIRD_SHAPE = new Path2D('M5.5 0Q.8-.7-3-4.6-1.6-1.4-3.6 0-1.6 1.4-3 4.6 .8 .7 5.5 0Z'); // a small swallow, pointing right
  const GLOW_RADIUS = 8;
  const GLOW_SHAPE = new Path2D();
  GLOW_SHAPE.arc(0, 0, GLOW_RADIUS, 0, Math.PI * 2);

  // The colours live in tokens.css, as #rrggbb. A canvas can't use CSS variables, so they are read here.
  const styles = getComputedStyle(document.documentElement);
  function readColour(token) {
    const hex = styles.getPropertyValue(token).trim();
    return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  }
  const COLOURS = { neutral: readColour('--bird'), admin: readColour('--bird-admin'), student: readColour('--bird-student') };

  const colour = [...COLOURS.neutral]; // the colour right now, which moves towards the chosen one
  const wantedColour = () => COLOURS[document.body.dataset.accent] || COLOURS.neutral;

  const birds = [];
  let width = 0;
  let height = 0;
  let pixels = 1;
  let clock = 0; // seconds of flying so far
  let mouse = null; // where the mouse is inside the panel, or null
  let frameRequest = 0;
  let lastFrame = 0;
  let mode = 'waiting'; // 'waiting', 'flying' or 'still'

  // ---------- Size ----------

  function resize() {
    const box = panel.getBoundingClientRect();
    width = box.width;
    height = box.height;
    pixels = Math.min(window.devicePixelRatio || 1, PIXEL_LIMIT);
    canvas.width = width * pixels;
    canvas.height = height * pixels;
    if (mode === 'still') placeStill();
  }

  // ---------- The three rules ----------

  // With no mouse in the panel, the flock follows a point that slowly wanders around
  function target() {
    if (mouse) return mouse;
    return {
      x: width * (0.5 + 0.34 * Math.sin(clock * 0.23)),
      y: height * (0.5 + 0.36 * Math.cos(clock * 0.31)),
    };
  }

  function steer(bird, goal, seconds) {
    let ax = 0;
    let ay = 0;
    let neighbours = 0;
    let sameWayX = 0;
    let sameWayY = 0;
    let middleX = 0;
    let middleY = 0;

    for (const other of birds) {
      if (other === bird || !other.flying) continue;
      const dx = other.x - bird.x;
      const dy = other.y - bird.y;
      const distance = Math.hypot(dx, dy);
      if (distance > NEIGHBOUR_DISTANCE || distance === 0) continue;

      neighbours += 1;
      sameWayX += other.vx;
      sameWayY += other.vy;
      middleX += other.x;
      middleY += other.y;
      if (distance < PERSONAL_SPACE) {
        ax -= (dx / distance) * (APART / distance);
        ay -= (dy / distance) * (APART / distance);
      }
    }

    if (neighbours) {
      ax += (sameWayX / neighbours - bird.vx) * ALIGN;
      ay += (sameWayY / neighbours - bird.vy) * ALIGN;
      ax += (middleX / neighbours - bird.x) * TOGETHER;
      ay += (middleY / neighbours - bird.y) * TOGETHER;
    }

    const toGoal = Math.hypot(goal.x - bird.x, goal.y - bird.y) || 1;
    ax += ((goal.x - bird.x) / toGoal) * FOLLOW;
    ay += ((goal.y - bird.y) / toGoal) * FOLLOW;

    if (bird.x < EDGE_MARGIN) ax += EDGE_TURN;
    if (bird.x > width - EDGE_MARGIN) ax -= EDGE_TURN;
    if (bird.y < EDGE_MARGIN) ay += EDGE_TURN;
    if (bird.y > height - EDGE_MARGIN) ay -= EDGE_TURN;

    bird.vx += (ax + (Math.random() - 0.5) * RESTLESS) * seconds;
    bird.vy += (ay + (Math.random() - 0.5) * RESTLESS) * seconds;
  }

  function leaveNest(bird) {
    const nestBox = nest.getBoundingClientRect();
    const panelBox = panel.getBoundingClientRect();
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4; // out of the top of the nest, in a wide fan
    const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    bird.x = nestBox.left - panelBox.left + nestBox.width * (0.3 + Math.random() * 0.4);
    bird.y = nestBox.top - panelBox.top + nestBox.height * 0.4;
    bird.vx = Math.cos(angle) * speed;
    bird.vy = Math.sin(angle) * speed;
    bird.flying = true;
  }

  function step(seconds) {
    clock += seconds;
    const goal = target();

    for (const bird of birds) {
      if (!bird.flying) {
        if (clock >= bird.leavesAt) leaveNest(bird);
        continue;
      }

      steer(bird, goal, seconds);

      const speed = Math.hypot(bird.vx, bird.vy) || 1;
      const limited = Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed)) / speed;
      bird.vx *= limited;
      bird.vy *= limited;
      bird.x += bird.vx * seconds;
      bird.y += bird.vy * seconds;
      bird.wing += seconds * (9 + speed * 0.03);
      bird.alpha = Math.min(1, bird.alpha + seconds * FADE_IN);
    }

    const wanted = wantedColour();
    const change = Math.min(1, seconds * COLOUR_CHANGE);
    colour.forEach((value, index) => (colour[index] = value + (wanted[index] - value) * change));
  }

  // ---------- Drawing ----------

  function draw() {
    const [red, green, blue] = colour.map(Math.round);
    ctx.setTransform(pixels, 0, 0, pixels, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // The soft glow. It is one gradient used for every bird, because a blur on each one would be slow.
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, GLOW_RADIUS);
    glow.addColorStop(0, `rgb(${red} ${green} ${blue} / 0.3)`);
    glow.addColorStop(1, `rgb(${red} ${green} ${blue} / 0)`);
    const solid = `rgb(${red} ${green} ${blue})`;

    for (const bird of birds) {
      if (!bird.alpha) continue;
      const speed = Math.hypot(bird.vx, bird.vy) || 1;
      const cos = (bird.vx / speed) * pixels;
      const sin = (bird.vy / speed) * pixels;

      ctx.globalAlpha = bird.alpha;
      ctx.setTransform(cos, sin, -sin, cos, bird.x * pixels, bird.y * pixels); // moves and turns the pen to this bird
      ctx.fillStyle = glow;
      ctx.fill(GLOW_SHAPE);
      ctx.scale(bird.size, bird.size * (0.7 + 0.3 * Math.sin(bird.wing))); // the wings beat
      ctx.fillStyle = solid;
      ctx.fill(BIRD_SHAPE);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- Running and pausing ----------

  function frame(now) {
    step(Math.min((now - lastFrame) / 1000, LONGEST_STEP));
    lastFrame = now;
    draw();
    frameRequest = requestAnimationFrame(frame);
  }

  function pause() {
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
  }

  // Only runs while there is something to see: never on a hidden tab or on a phone
  function run() {
    if (mode !== 'flying' || frameRequest || document.hidden || !wideScreen.matches) return;
    lastFrame = performance.now();
    frameRequest = requestAnimationFrame(frame);
  }

  function makeBirds() {
    birds.length = 0;
    for (let index = 0; index < BIRD_COUNT; index += 1) {
      birds.push({
        x: 0,
        y: 0,
        vx: 1,
        vy: 0,
        size: 0.75 + Math.random() * 0.45,
        wing: Math.random() * 6,
        alpha: 0,
        flying: false,
        leavesAt: index * LEAVE_GAP,
      });
    }
  }

  // ---------- What the intro can ask for ----------

  // The full intro: the birds leave the nest one after another
  function flyFromNest() {
    makeBirds();
    mode = 'flying';
    run();
  }

  // The quick version: the flock is already in the air, and simply fades in
  function flyAtOnce() {
    makeBirds();
    for (const bird of birds) {
      const angle = Math.random() * Math.PI * 2;
      bird.x = width * (0.25 + Math.random() * 0.5);
      bird.y = height * (0.2 + Math.random() * 0.6);
      bird.vx = Math.cos(angle) * MIN_SPEED;
      bird.vy = Math.sin(angle) * MIN_SPEED;
      bird.flying = true;
    }
    mode = 'flying';
    run();
  }

  // Reduced motion: a still flock above the logo, with no animation at all.
  // Turning by the same angle for each bird spreads them evenly, the way seeds sit in a sunflower.
  function placeStill() {
    const SUNFLOWER_ANGLE = 2.4;
    makeBirds();
    birds.forEach((bird, index) => {
      const distance = Math.sqrt(index / BIRD_COUNT);
      bird.x = width * (0.5 + Math.cos(index * SUNFLOWER_ANGLE) * distance * 0.3);
      bird.y = height * (0.17 + Math.sin(index * SUNFLOWER_ANGLE) * distance * 0.1);
      bird.vx = 1;
      bird.vy = -0.3 + (index % 5) * 0.08;
      bird.alpha = 1;
      bird.wing = index;
    });
    colour.splice(0, 3, ...wantedColour());
    draw();
  }

  function showStill() {
    mode = 'still';
    placeStill();
  }

  // ---------- Listening ----------

  new ResizeObserver(resize).observe(panel);
  resize();

  panel.addEventListener('pointermove', (event) => {
    const box = panel.getBoundingClientRect();
    mouse = { x: event.clientX - box.left, y: event.clientY - box.top };
  });
  panel.addEventListener('pointerleave', () => (mouse = null));

  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : run()));
  wideScreen.addEventListener('change', () => {
    if (wideScreen.matches) {
      run();
      if (mode === 'still') placeStill();
    } else {
      pause();
    }
  });

  // login.js changes the page's accent. A still flock has no next frame, so it is repainted here.
  new MutationObserver(() => {
    if (mode !== 'still') return;
    colour.splice(0, 3, ...wantedColour());
    draw();
  }).observe(document.body, { attributeFilter: ['data-accent'] });

  return { flyFromNest, flyAtOnce, showStill };
}
