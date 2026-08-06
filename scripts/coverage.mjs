// Archetype coverage test.
//
// Plays every character-creation archetype through Act 1 many times and
// reports how often each one reaches the scene's main content. A build that
// can never reach column G is a content bug, not a difficulty setting.
//
//   node scripts/coverage.mjs [runsPerArchetype]

import { Story } from 'inkjs';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const json = readFileSync(join(root, 'web', 'story.json'), 'utf8');
const RUNS = Number(process.argv[2] ?? 200);

const ARCHETYPES = [
  'The Recovering Backend Engineer',
  'The Refugee from Consulting',
  'The Escalation Survivor',
  'The Compliance Defector',
  'The Prompt Mystic',
  'The Ethnographer',
];

// Greedy player: always takes an available check, leaves only when none remain.
function play(archetypeIdx) {
  const story = new Story(json);
  let guard = 0;
  while (guard++ < 400) {
    while (story.canContinue) story.Continue();
    const choices = story.currentChoices;
    if (!choices.length) break;

    const byText = t => choices.findIndex(c => c.text.startsWith(t));
    let pick = byText(ARCHETYPES[archetypeIdx]);
    if (pick < 0) pick = choices.findIndex(c => /—\s(Trivial|Easy|Medium|Challenging|Formidable)/.test(c.text));
    if (pick < 0) pick = byText('Ask');
    if (pick < 0) pick = byText('RED');
    if (pick < 0) pick = byText('Leave');
    if (pick < 0) pick = 0; // allocator / fallthrough
    story.ChooseChoiceIndex(pick);
  }
  const v = story.variablesState;
  return {
    reachedColumnG: v['column_g_seen'] === true,
    trust: v['brenda_trust'] === true,
    burn: v['BURN'],
    cred: v['CREDIBILITY'],
  };
}

console.log(`${RUNS} runs per archetype\n`);
console.log('archetype'.padEnd(34) + 'reaches column G   trust   avg BURN   avg CRED');
let anyDead = false;

for (let i = 0; i < ARCHETYPES.length; i++) {
  let reached = 0, trusted = 0, burn = 0, cred = 0;
  for (let r = 0; r < RUNS; r++) {
    const out = play(i);
    if (out.reachedColumnG) reached++;
    if (out.trust) trusted++;
    burn += out.burn;
    cred += out.cred;
  }
  const pct = ((reached / RUNS) * 100).toFixed(0);
  if (reached === 0) anyDead = true;
  console.log(
    ARCHETYPES[i].padEnd(34) +
      `${pct}%`.padEnd(19) +
      `${((trusted / RUNS) * 100).toFixed(0)}%`.padEnd(8) +
      (burn / RUNS).toFixed(1).padEnd(11) +
      (cred / RUNS).toFixed(1)
  );
}

if (anyDead) {
  console.error('\nFAIL: at least one archetype can never reach the main content.');
  process.exit(1);
}
console.log('\nOK: every archetype has a route in.');
