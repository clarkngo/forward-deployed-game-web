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

const storyEl = document.getElementById('story');
const choicesEl = document.getElementById('choices');
const hud = document.getElementById('hud');

const story = new Story(await (await fetch('./story.json')).text());

function tagged(tags, name) {
  return tags.includes(name);
}

function render(text, tags) {
  const p = document.createElement('p');

  if (tagged(tags, 'voice')) {
    // Line format: "SHADOW AUDIT: "…"" — split the speaker off.
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

// Choice labels arrive as "SHADOW AUDIT — Medium" or "RED · PROCUREMENT ARMOR — Challenging".
// Split the skill/difficulty prefix out so it can be styled separately.
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

advance();
