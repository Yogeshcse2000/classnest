// Login page birds, drawn on a <canvas> (a blank area that JavaScript paints on, like a tiny TV screen).
// Every bird follows three simple rules, known as "boids": keep a little apart, fly the same way as your neighbours,
// and stay near them. Nothing tells them where to go as a group, yet together they move like a real flock.
// On top of that, they glide around the logo and softly follow the mouse.

function createFlock(canvas, nest) {
  const ctx = canvas.getContext('2d');
  const panel = canvas.parentElement;
  const logo = nest.closest('.logo');
  const wideScreen = window.matchMedia('(min-width: 861px)'); // no birds on tablets and phones (same width as style.css)

  const BIRD_COUNT = 30;
  const LEAVE_GAP = 0.06; // seconds between one bird leaving the nest and the next
  const FADE_IN = 1.4; // how fast a new bird appears
  const COLOUR_CHANGE = 3; // how fast the flock changes colour
  const PIXEL_LIMIT = 2; // sharp enough, and sharper screens would only cost speed
  const LONGEST_STEP = 1 / 20; // after a stutter, birds carry on instead of jumping across the screen

  // Calm flight. A rule never turns a bird directly: it changes what the bird wants, and the bird eases towards that.
  const MIN_SPEED = 26; // pixels per second
  const MAX_SPEED = 62;
  const EASE_STEERING = 2.2; // how quickly a bird starts to act on a new wish
  const MAX_TURN = 1.5; // the fastest a bird can turn, in radians a second (about 85 degrees), so it can only fly in arcs
  const NEIGHBOUR_DISTANCE = 120; // a bird only notices others this close
  const PERSONAL_SPACE = 40; // and it moves away from anyone closer than this
  const APART = 46; // the strength of each rule
  const ALIGN = 0.5;
  const TOGETHER = 0.11;
  const FOLLOW = 15;
  const DRIFT = 13; // each bird also leans slowly from side to side, so the flock never settles into neat rows
  const EDGE_MARGIN = 80; // birds start turning back this far from the edge of the panel
  const EDGE_TURN = 42;
  const AROUND_LOGO = 34; // birds are pushed gently out of the logo's area, so they glide around it
  const ORBIT_SPEED = 0.14; // how fast the point they follow circles the logo, when the mouse isn't in the panel
  const ORBIT_SIZE = 0.37; // and how far out it goes, as a share of the panel
  const EASE_GOAL = 1.3; // the point they follow eases towards the mouse, so a quick mouse never startles them

  // Depth: birds at the back are smaller, fainter and a little slower
  const FAR_SIZE = 0.55;
  const NEAR_SIZE = 1.1;
  const FAR_BRIGHTNESS = 0.36;
  const FAR_SPEED = 0.78;

  const GLOW_RADIUS = 13;
  const GLOW_STRENGTH = 0.2;
  const GLOW_SHAPE = new Path2D();
  GLOW_SHAPE.arc(0, 0, GLOW_RADIUS, 0, Math.PI * 2);

  const TRAIL_POINTS = 9;
  const TRAIL_SPACING = 4; // pixels between two points of a trail
  const TRAIL_STRENGTH = 0.15;

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
  let goal = null; // the point the flock is following
  let logoArea = { x: 0, y: 0, reachX: 1, reachY: 1 };
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

    const logoBox = logo.getBoundingClientRect();
    logoArea = {
      x: logoBox.left - box.left + logoBox.width / 2,
      y: logoBox.top - box.top + logoBox.height / 2,
      reachX: logoBox.width * 0.62,
      reachY: logoBox.height * 0.62,
    };
    if (mode === 'still') placeStill();
  }

  // ---------- The rules ----------

  // With no mouse in the panel, the flock follows a point that slowly circles the logo
  function nextGoal(seconds) {
    const wanted = mouse || {
      x: logoArea.x + Math.cos(clock * ORBIT_SPEED) * width * ORBIT_SIZE,
      y: logoArea.y + Math.sin(clock * ORBIT_SPEED) * height * ORBIT_SIZE,
    };
    if (!goal) goal = { ...wanted };
    const ease = Math.min(1, seconds * EASE_GOAL);
    goal.x += (wanted.x - goal.x) * ease;
    goal.y += (wanted.y - goal.y) * ease;
  }

  function steer(bird, seconds) {
    let wishX = 0;
    let wishY = 0;
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
        const push = APART * (1 - distance / PERSONAL_SPACE);
        wishX -= (dx / distance) * push;
        wishY -= (dy / distance) * push;
      }
    }

    if (neighbours) {
      wishX += (sameWayX / neighbours - bird.vx) * ALIGN;
      wishY += (sameWayY / neighbours - bird.vy) * ALIGN;
      wishX += (middleX / neighbours - bird.x) * TOGETHER;
      wishY += (middleY / neighbours - bird.y) * TOGETHER;
    }

    const toGoal = Math.hypot(goal.x - bird.x, goal.y - bird.y) || 1;
    wishX += ((goal.x - bird.x) / toGoal) * FOLLOW;
    wishY += ((goal.y - bird.y) / toGoal) * FOLLOW;

    // A slow lean to one side, then the other, across the bird's own path
    const speed = Math.hypot(bird.vx, bird.vy) || 1;
    const lean = Math.sin(clock * bird.driftRate + bird.driftStart) * DRIFT;
    wishX += (-bird.vy / speed) * lean;
    wishY += (bird.vx / speed) * lean;

    // Out of the logo's area. The further in a bird is, the stronger the push.
    const fromLogoX = (bird.x - logoArea.x) / logoArea.reachX;
    const fromLogoY = (bird.y - logoArea.y) / logoArea.reachY;
    const inside = Math.hypot(fromLogoX, fromLogoY) || 1;
    if (inside < 1) {
      wishX += (fromLogoX / inside) * AROUND_LOGO * (1 - inside);
      wishY += (fromLogoY / inside) * AROUND_LOGO * (1 - inside);
    }

    if (bird.x < EDGE_MARGIN) wishX += EDGE_TURN * (1 - bird.x / EDGE_MARGIN);
    if (bird.x > width - EDGE_MARGIN) wishX -= EDGE_TURN * (1 - (width - bird.x) / EDGE_MARGIN);
    if (bird.y < EDGE_MARGIN) wishY += EDGE_TURN * (1 - bird.y / EDGE_MARGIN);
    if (bird.y > height - EDGE_MARGIN) wishY -= EDGE_TURN * (1 - (height - bird.y) / EDGE_MARGIN);

    const ease = Math.min(1, seconds * EASE_STEERING);
    bird.pushX += (wishX - bird.pushX) * ease;
    bird.pushY += (wishY - bird.pushY) * ease;
  }

  // The rules only say where a bird would like to go. It turns that way no faster than MAX_TURN, and the short way round.
  function fly(bird, seconds) {
    const wantX = bird.vx + bird.pushX * seconds;
    const wantY = bird.vy + bird.pushY * seconds;
    const wanted = Math.atan2(wantY, wantX);
    const gap = Math.atan2(Math.sin(wanted - bird.heading), Math.cos(wanted - bird.heading));
    const mostTurn = MAX_TURN * seconds;
    bird.heading += Math.max(-mostTurn, Math.min(mostTurn, gap));

    const speed = Math.min(MAX_SPEED * bird.pace, Math.max(MIN_SPEED * bird.pace, Math.hypot(wantX, wantY)));
    bird.vx = Math.cos(bird.heading) * speed;
    bird.vy = Math.sin(bird.heading) * speed;
    bird.x += bird.vx * seconds;
    bird.y += bird.vy * seconds;
  }

  function leaveNest(bird) {
    const nestBox = nest.getBoundingClientRect();
    const panelBox = panel.getBoundingClientRect();
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2; // out of the top of the nest, in a wide fan
    const speed = (MIN_SPEED + MAX_SPEED) / 2;
    bird.x = nestBox.left - panelBox.left + nestBox.width * (0.3 + Math.random() * 0.4);
    bird.y = nestBox.top - panelBox.top + nestBox.height * 0.6; // the top line of the nest
    bird.vx = Math.cos(angle) * speed;
    bird.vy = Math.sin(angle) * speed;
    bird.heading = angle;
    bird.flying = true;
  }

  function addToTrail(bird) {
    const last = bird.trail[0];
    if (last && Math.hypot(bird.x - last.x, bird.y - last.y) < TRAIL_SPACING) return;
    bird.trail.unshift({ x: bird.x, y: bird.y });
    if (bird.trail.length > TRAIL_POINTS) bird.trail.pop();
  }

  function step(seconds) {
    clock += seconds;
    nextGoal(seconds);

    for (const bird of birds) {
      if (!bird.flying) {
        if (clock >= bird.leavesAt) leaveNest(bird);
        continue;
      }

      steer(bird, seconds);
      fly(bird, seconds);
      bird.flap += seconds * bird.flapRate;
      bird.alpha = Math.min(1, bird.alpha + seconds * FADE_IN);
      addToTrail(bird);
    }

    const wanted = wantedColour();
    const change = Math.min(1, seconds * COLOUR_CHANGE);
    colour.forEach((value, index) => (colour[index] = value + (wanted[index] - value) * change));
  }

  // ---------- Drawing ----------

  // A swallow seen from above, pointing right: a slim body, two long crescent wings swept back, and a forked tail.
  // `open` is how far the wings are spread, so the same shape can beat its wings.
  function traceBird(open) {
    const tipX = -9 + open * 4;
    const tipY = 5.5 + open * 7;
    ctx.beginPath();
    ctx.moveTo(6.2, 0);
    ctx.bezierCurveTo(4.6, -0.9, 3.2, -1, 2.4, -1);
    ctx.bezierCurveTo(3.4, -tipY * 0.42, 0.2, -tipY * 0.82, tipX, -tipY);
    ctx.bezierCurveTo(-1.6, -tipY * 0.62, 0.4, -tipY * 0.26, -1.6, -0.75);
    ctx.quadraticCurveTo(-4, -0.6, -7.6, -2.1);
    ctx.quadraticCurveTo(-5.4, -0.45, -5, 0);
    ctx.quadraticCurveTo(-5.4, 0.45, -7.6, 2.1);
    ctx.quadraticCurveTo(-4, 0.6, -1.6, 0.75);
    ctx.bezierCurveTo(0.4, tipY * 0.26, -1.6, tipY * 0.62, tipX, tipY);
    ctx.bezierCurveTo(0.2, tipY * 0.82, 3.4, tipY * 0.42, 2.4, 1);
    ctx.bezierCurveTo(3.2, 1, 4.6, 0.9, 6.2, 0);
    ctx.closePath();
  }

  // A very faint line along the bird's last few positions, fading towards its end
  function drawTrail(bird, stroke) {
    const points = bird.trail;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.9 * bird.size;
    for (let index = 1; index < points.length; index += 1) {
      ctx.globalAlpha = TRAIL_STRENGTH * bird.brightness * bird.alpha * (1 - index / points.length);
      ctx.beginPath();
      ctx.moveTo(points[index - 1].x, points[index - 1].y);
      ctx.lineTo(points[index].x, points[index].y);
      ctx.stroke();
    }
  }

  function draw() {
    const [red, green, blue] = colour.map(Math.round);
    const solid = `rgb(${red} ${green} ${blue})`;
    ctx.setTransform(pixels, 0, 0, pixels, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // The soft glow. It is one gradient used for every bird, because a blur on each one would be slow.
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, GLOW_RADIUS);
    glow.addColorStop(0, `rgb(${red} ${green} ${blue} / ${GLOW_STRENGTH})`);
    glow.addColorStop(1, `rgb(${red} ${green} ${blue} / 0)`);

    ctx.lineCap = 'round';
    for (const bird of birds) {
      if (bird.alpha) drawTrail(bird, solid);
    }

    for (const bird of birds) {
      if (!bird.alpha) continue;
      const cos = Math.cos(bird.heading) * pixels * bird.size;
      const sin = Math.sin(bird.heading) * pixels * bird.size;

      ctx.globalAlpha = bird.brightness * bird.alpha;
      ctx.setTransform(cos, sin, -sin, cos, bird.x * pixels, bird.y * pixels); // moves and turns the pen to this bird
      ctx.fillStyle = glow;
      ctx.fill(GLOW_SHAPE);
      ctx.fillStyle = solid;
      traceBird(0.65 + 0.35 * Math.sin(bird.flap));
      ctx.fill();
    }
    ctx.setTransform(pixels, 0, 0, pixels, 0, 0);
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

  // The list runs from the back to the front, so nearer birds are painted over further ones
  function makeBirds() {
    birds.length = 0;
    for (let index = 0; index < BIRD_COUNT; index += 1) {
      const nearness = index / (BIRD_COUNT - 1);
      birds.push({
        x: 0,
        y: 0,
        vx: 1,
        vy: 0,
        pushX: 0,
        pushY: 0,
        heading: 0,
        size: FAR_SIZE + (NEAR_SIZE - FAR_SIZE) * nearness,
        brightness: FAR_BRIGHTNESS + (1 - FAR_BRIGHTNESS) * nearness,
        pace: FAR_SPEED + (1 - FAR_SPEED) * nearness,
        flap: Math.random() * 6,
        flapRate: 3.4 + Math.random() * 2.2, // every bird beats its wings at its own speed
        driftRate: 0.25 + Math.random() * 0.35,
        driftStart: Math.random() * 6,
        trail: [],
        alpha: 0,
        flying: false,
        leavesAt: Math.random() * BIRD_COUNT * LEAVE_GAP, // the order is shuffled, so near and far birds leave mixed
      });
    }
  }

  // ---------- What the intro can ask for ----------

  // The full opening: the birds leave the nest one after another
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
      const aroundLogo = Math.random() * Math.PI * 2;
      bird.x = logoArea.x + Math.cos(aroundLogo) * width * (0.28 + Math.random() * 0.14);
      bird.y = logoArea.y + Math.sin(aroundLogo) * height * (0.3 + Math.random() * 0.12);
      bird.vx = Math.cos(angle) * MIN_SPEED;
      bird.vy = Math.sin(angle) * MIN_SPEED;
      bird.heading = angle;
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
      bird.heading = -0.3 + (index % 5) * 0.08;
      bird.alpha = 1;
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
