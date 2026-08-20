import { Story } from 'inkjs';

const STATS = [
  'LEGACY_WHISPERER',
  'SHADOW_AUDIT',
  'ROI_RHETORIC',
  'HUMAN_IN_THE_LOOP',
  'PROCUREMENT_ARMOR',
  'PROMPT_SYNTAX',
];
const SHORT = {
  LEGACY_WHISPERER: 'LEG',
  SHADOW_AUDIT: 'SHA',
  ROI_RHETORIC: 'ROI',
  HUMAN_IN_THE_LOOP: 'HIT',
  PROCUREMENT_ARMOR: 'PRO',
  PROMPT_SYNTAX: 'PRM',
};

const homeEl = document.getElementById('home');
const beginBtn = document.getElementById('begin');
const gameEl = document.getElementById('game');
const storyEl = document.getElementById('story');
const choicesEl = document.getElementById('choices');
const hud = document.getElementById('hud');
const rainCanvas = document.getElementById('rain');
const rainAudio = document.getElementById('rain-audio');
const rainToggle = document.getElementById('rain-toggle');

const story = new Story(await (await fetch('./story.json')).text());

/* --- Ambient rain audio ----------------------------------------------- */

const RAIN_VOLUME = 0.35;

function setRainPlaying(playing) {
  if (!rainToggle) return;
  rainToggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
  rainToggle.setAttribute('aria-label', playing ? 'Mute rain ambience' : 'Play rain ambience');
}

async function playRain() {
  if (!rainAudio) return false;
  rainAudio.volume = RAIN_VOLUME;
  try {
    await rainAudio.play();
    setRainPlaying(true);
    return true;
  } catch {
    setRainPlaying(false);
    return false;
  }
}

function pauseRain() {
  if (!rainAudio) return;
  rainAudio.pause();
  setRainPlaying(false);
}

async function fadeOutRain(ms = 700) {
  if (!rainAudio || rainAudio.paused) return;
  const start = rainAudio.volume;
  const t0 = performance.now();
  await new Promise(resolve => {
    function step(now) {
      const t = Math.min(1, (now - t0) / ms);
      rainAudio.volume = start * (1 - t);
      if (t < 1) requestAnimationFrame(step);
      else {
        pauseRain();
        rainAudio.volume = RAIN_VOLUME;
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

// Browsers block autoplay with sound — try, then unlock on first gesture.
playRain().then(started => {
  if (started || !homeEl) return;
  const unlock = async () => {
    homeEl.removeEventListener('pointerdown', unlock);
    await playRain();
  };
  homeEl.addEventListener('pointerdown', unlock);
});

rainToggle?.addEventListener('click', async e => {
  e.stopPropagation();
  if (!rainAudio) return;
  if (rainAudio.paused) await playRain();
  else pauseRain();
});

/* --- Rain on the title screen ----------------------------------------- */

function initRain() {
  if (!rainCanvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = rainCanvas.getContext('2d');
  let width = 0;
  let height = 0;
  let drops = [];
  let raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = homeEl.clientWidth;
    height = homeEl.clientHeight;
    rainCanvas.width = Math.floor(width * dpr);
    rainCanvas.height = Math.floor(height * dpr);
    rainCanvas.style.width = `${width}px`;
    rainCanvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.floor((width * height) / 9000);
    drops = Array.from({ length: count }, () => spawn(true));
  }

  function spawn(anywhere) {
    return {
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : -Math.random() * 40,
      len: 8 + Math.random() * 14,
      speed: 4.5 + Math.random() * 6.5,
      alpha: 0.12 + Math.random() * 0.28,
    };
  }

  function frame() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(214, 200, 170, 1)';
    ctx.lineWidth = 1;
    for (const d of drops) {
      ctx.globalAlpha = d.alpha;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 1.2, d.y + d.len);
      ctx.stroke();
      d.y += d.speed;
      d.x -= 0.35;
      if (d.y > height) Object.assign(d, spawn(false));
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  resize();
  frame();
  window.addEventListener('resize', resize);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
  };
}

const stopRain = initRain();

/* --- Story renderer --------------------------------------------------- */

function tagged(tags, name) {
  return tags.includes(name);
}

function render(text, tags) {
  const p = document.createElement('p');

  if (tagged(tags, 'voice')) {
    const stat = tags.find(t => t !== 'voice');
    const [who, ...rest] = text.split(':');
    p.className = 'voice';
    if (stat) p.style.color = `var(--${stat})`;
    const label = document.createElement('span');
    label.className = 'who';
    label.textContent = who.trim();
    p.append(label, rest.join(':').trim());
  } else if (tagged(tags, 'roll')) {
    p.className = `roll ${tagged(tags, 'success') ? 'success' : 'failure'}`;
    p.textContent = text;
  } else {
    for (const c of ['title', 'statblock', 'milestone', 'allocator', 'ending']) {
      if (tagged(tags, c)) p.classList.add(c);
    }
    if (tagged(tags, 'meters')) p.classList.add('meters-line');
    p.textContent = text;
  }

  storyEl.append(p);
}

function updateHud() {
  const v = story.variablesState;
  hud.hidden = false;

  const burn = v['BURN'], cred = v['CREDIBILITY'];
  const set = (id, label, val, lowAt) => {
    const el = document.getElementById(id);
    el.innerHTML = `${label} <b>${val}</b>`;
    el.classList.toggle('low', lowAt !== undefined && val <= lowAt);
  };
  set('m-burn', 'Burn', burn, 20);
  set('m-cred', 'Cred', cred, 2);
  set('m-act', 'Act', v['act']);

  document.getElementById('hud-stats').innerHTML = STATS.map(
    s => `<span>${SHORT[s]} <b>${v[s]}</b></span>`
  ).join('');
}

function renderChoice(choice, index) {
  const btn = document.createElement('button');
  btn.className = 'choice';
  btn.type = 'button';

  const text = choice.text;
  const isRed = text.startsWith('RED');
  if (isRed) btn.classList.add('red');

  const m = text.match(/^(.*?—\s*(?:Trivial|Easy|Medium|Challenging|Formidable|Impossible))\s*(.*)$/);
  if (m) {
    const tier = document.createElement('span');
    tier.className = 'tier';
    tier.textContent = m[1];
    btn.append(tier, m[2] || '');
  } else {
    btn.textContent = text;
  }

  btn.addEventListener('click', () => {
    story.ChooseChoiceIndex(index);
    choicesEl.replaceChildren();
    advance();
  });
  return btn;
}

function advance() {
  while (story.canContinue) {
    const text = story.Continue().trim();
    if (text) render(text, story.currentTags ?? []);
  }
  updateHud();

  choicesEl.replaceChildren(...story.currentChoices.map(renderChoice));
  if (!story.currentChoices.length) {
    const end = document.createElement('p');
    end.className = 'ending';
    end.textContent = '— end of available content —';
    storyEl.append(end);
  }
  storyEl.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function startGame() {
  beginBtn.disabled = true;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reveal = () => {
    stopRain?.();
    homeEl.remove();
    gameEl.hidden = false;
    advance();
  };

  const fade = fadeOutRain(reduce ? 0 : 700);

  if (reduce) {
    await fade;
    reveal();
    return;
  }

  homeEl.classList.add('is-leaving');
  await Promise.all([
    fade,
    new Promise(resolve => homeEl.addEventListener('animationend', resolve, { once: true })),
  ]);
  reveal();
}

beginBtn.addEventListener('click', startGame);

/* --- Dev panel: jump to any scene, poke stats, for testing ------------- */
// Tunnel-only knots (character_creation, milestone, allocate_points) can't
// be jumped to directly — see story/system/dev.ink for why — so they're
// listed here via their dev_* wrapper path instead.
// Add an entry whenever a new scene's entry knot is written.
const DEV_SCENES = [
  { path: 'title', label: 'Title' },
  { path: 'dev_character_creation', label: 'Character Creation' },
  { path: 'brenda_desk_arrival', label: 'Brenda — Arrival' },
  { path: 'brenda_hub', label: 'Brenda — Hub' },
  { path: 'brenda_deep_dive', label: 'Brenda — Deep Dive (Column G)' },
  { path: 'dev_milestone', label: 'Milestone (act boundary)' },
  { path: 'scene_end', label: 'Scene Router' },
  { path: 'act_1_end', label: 'Act 1 End' },
  { path: 'engagement_ends', label: 'Fail State' },
];

const devToggle = document.getElementById('devpanel-toggle');
const devBody = document.getElementById('devpanel-body');
const devScenes = document.getElementById('devpanel-scenes');
const devStats = document.getElementById('devpanel-stats');
const devApplyStats = document.getElementById('devpanel-apply-stats');
const devRestart = document.getElementById('devpanel-restart');

devToggle?.addEventListener('click', () => {
  const opening = devBody.hidden;
  devBody.hidden = !opening;
  devToggle.setAttribute('aria-expanded', String(opening));
  if (opening) renderDevStatInputs();
});

function jumpToScene(path) {
  if (document.body.contains(homeEl)) {
    stopRain?.();
    homeEl.remove();
    gameEl.hidden = false;
  }
  storyEl.replaceChildren();
  choicesEl.replaceChildren();
  story.ChoosePathString(path);
  advance();
}

for (const scene of DEV_SCENES) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'devpanel-item';
  btn.textContent = scene.label;
  btn.addEventListener('click', () => jumpToScene(scene.path));
  devScenes.append(btn);
}

function renderDevStatInputs() {
  devStats.replaceChildren();
  for (const s of STATS) {
    const row = document.createElement('label');
    row.className = 'devpanel-stat-row';
    const name = document.createElement('span');
    name.textContent = SHORT[s];
    const input = document.createElement('input');
    input.type = 'number';
    input.dataset.stat = s;
    input.value = story.variablesState[s];
    row.append(name, input);
    devStats.append(row);
  }
}

devApplyStats?.addEventListener('click', () => {
  for (const input of devStats.querySelectorAll('input[data-stat]')) {
    const n = Number(input.value);
    if (Number.isFinite(n)) story.variablesState[input.dataset.stat] = n;
  }
  if (!gameEl.hidden) updateHud();
});

devRestart?.addEventListener('click', () => location.reload());
