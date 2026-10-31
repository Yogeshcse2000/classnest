// Login page particles, drawn on a <canvas> (a blank area that JavaScript paints on, like a tiny TV screen).
// One set of particles does three jobs: burst out of the dot, build the nest logo, then float around the page.
// GSAP changes the numbers in `state`, and draw() paints every particle from those numbers, once per frame.

function createParticles(canvas) {
  const ctx = canvas.getContext('2d');
  const small = window.innerWidth < 720;

  // Few particles keep it smooth. Most of them fade after the logo, only the floaters stay.
  const PARTICLE_COUNT = small ? 240 : 460;
  const FLOATER_CHANCE = 0.12;
  const PIXEL_LIMIT = 1.5; // sharp enough, and sharper screens would only cost speed

  const MAX_DELAY = 0.25; // particles leave one after another, the last one leaves this late
  const BURST_PART = 0.4; // the part of the trip spent flying outwards, before turning to the logo

  // The nest logo (the same shapes as favicon.svg), in a 20 x 20 box that starts at (6, 6)
  const LOGO_BOX = 20;
  const LOGO_START = 6;
  const BOWL = 'M7 15h18a9 8 0 0 1-18 0Z';
  const EGGS = [
    [13, 12],
    [19.5, 11.5],
  ];
  const EGG_RADIUS = 3;

  const state = {
    form: 0, // 0 = in the dot, 1 = logo finished
    release: 0, // 0 = in the logo, 1 = floating around the page
    fade: 1, // brightness of everything
  };

  let particles = [];
  let width = 0;
  let height = 0;

  const clamp = (value) => Math.min(1, Math.max(0, value));
  const random = (min, max) => min + Math.random() * (max - min);
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (2 - 2 * t) ** 3 / 2);

  // Drawing one ready-made glowing dot is much faster than building a glow for every particle
  function makeSprite(colour) {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const paint = sprite.getContext('2d');
    const glow = paint.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, '#ffffff');
    glow.addColorStop(0.22, colour);
    glow.addColorStop(1, 'transparent');
    paint.fillStyle = glow;
    paint.fillRect(0, 0, 32, 32);
    return sprite;
  }
  const sprites = { lightGreen: makeSprite('#7fd0a8'), green: makeSprite('#3fae7d'), amber: makeSprite('#f0ae4b') };

  // Paint a shape on a hidden canvas, then list the pixels it covers. Those are the places particles fly to.
  function pointsInShape(paintShape, size) {
    const box = document.createElement('canvas');
    box.width = box.height = size;
    const paint = box.getContext('2d', { willReadFrequently: true });
    paint.scale(size / LOGO_BOX, size / LOGO_BOX);
    paint.translate(-LOGO_START, -LOGO_START);
    paintShape(paint);

    const { data } = paint.getImageData(0, 0, size, size);
    const points = [];
    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        if (data[(y * size + x) * 4 + 3] > 128) points.push({ x: x - size / 2, y: y - size / 2 });
      }
    }
    return points;
  }

  function resize() {
    const pixels = Math.min(window.devicePixelRatio || 1, PIXEL_LIMIT);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * pixels;
    canvas.height = height * pixels;
    ctx.setTransform(pixels, 0, 0, pixels, 0, 0);
  }

  // Make the particles. logoX and logoY are the middle of the logo on screen, logoSize is its width.
  function build(logoX, logoY, logoSize) {
    const size = Math.max(40, Math.round(logoSize));
    const bowlPoints = pointsInShape((paint) => paint.fill(new Path2D(BOWL)), size);
    const eggPoints = pointsInShape((paint) => {
      EGGS.forEach(([x, y]) => {
        paint.beginPath();
        paint.arc(x, y, EGG_RADIUS, 0, Math.PI * 2);
        paint.fill();
      });
    }, size);
    const reach = Math.min(width, height) * 0.42;

    particles = Array.from({ length: PARTICLE_COUNT }, () => {
      const isEgg = Math.random() < 0.3;
      const pool = isEgg ? eggPoints : bowlPoints;
      const point = pool[Math.floor(Math.random() * pool.length)];
      const angle = random(0, Math.PI * 2);
      const distance = reach * random(0.25, 1);
      const floatAngle = random(0, Math.PI * 2);
      const floatSpeed = random(5, 16);
      const floater = Math.random() < FLOATER_CHANCE;

      return {
        logoX: logoX + point.x,
        logoY: logoY + point.y,
        burstX: Math.cos(angle) * distance,
        burstY: Math.sin(angle) * distance,
        floatX: random(0, width),
        floatY: random(0, height),
        speedX: Math.cos(floatAngle) * floatSpeed,
        speedY: Math.sin(floatAngle) * floatSpeed,
        delay: random(0, MAX_DELAY),
        size: random(5, 10),
        sprite: isEgg ? sprites.amber : Math.random() < 0.5 ? sprites.green : sprites.lightGreen,
        floater,
        floatGlow: random(0.25, 0.7),
        twinkle: random(0, Math.PI * 2),
      };
    });

    // Use each glowing dot once, while the screen is still dark, so the first real frame has no hiccup
    Object.values(sprites).forEach((sprite) => ctx.drawImage(sprite, 0, 0, 1, 1));
  }

  // Runs on every frame. time is in seconds, deltaMs is how long the last frame took.
  function draw(time, deltaMs) {
    if (document.hidden) return;
    const seconds = Math.min(deltaMs, 50) / 1000;
    const middleX = width / 2;
    const middleY = height / 2;

    // Once the logo has dissolved only the floaters are left, so there is less to draw
    if (state.release === 1 && particles.some((p) => !p.floater)) {
      particles = particles.filter((p) => p.floater);
    }

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter'; // overlapping glows add up and look brighter

    particles.forEach((p) => {
      // Floating position, wrapping around the edges of the screen
      p.floatX = (p.floatX + p.speedX * seconds + width) % width;
      p.floatY = (p.floatY + p.speedY * seconds + height) % height;

      const trip = clamp((state.form - p.delay) / (1 - MAX_DELAY));
      if (trip === 0) return;

      let x;
      let y;
      if (trip < BURST_PART) {
        // Flying out of the dot
        const out = easeOut(trip / BURST_PART);
        x = middleX + p.burstX * out;
        y = middleY + p.burstY * out;
      } else {
        // Curving in towards the logo
        const back = easeInOut((trip - BURST_PART) / (1 - BURST_PART));
        const curve = Math.sin(back * Math.PI) * 0.3;
        const fromX = middleX + p.burstX;
        const fromY = middleY + p.burstY;
        x = fromX + (p.logoX - fromX) * back - p.burstY * curve;
        y = fromY + (p.logoY - fromY) * back + p.burstX * curve;
      }

      let alpha = 1;
      if (state.release > 0) {
        x += (p.floatX - x) * state.release;
        y += (p.floatY - y) * state.release;
        alpha = p.floater ? 1 + (p.floatGlow - 1) * state.release : 1 - state.release * 2.5;
      }
      if (alpha <= 0) return;

      ctx.globalAlpha = alpha * state.fade * (0.8 + Math.sin(time * 2 + p.twinkle) * 0.2);
      ctx.drawImage(p.sprite, x - p.size / 2, y - p.size / 2, p.size, p.size);
    });
  }

  resize();
  return { state, build, resize, draw };
}
