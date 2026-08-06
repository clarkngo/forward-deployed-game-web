// Headless playthrough. Picks choices by a seeded strategy and prints the
// transcript, so scene logic can be verified without a browser.
//   node scripts/smoke.mjs [choiceIndexStrategy]
// Strategy: "last" (default) picks the deepest option, "first" picks Basic.

import { Story } from 'inkjs';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const story = new Story(readFileSync(join(root, 'web', 'story.json'), 'utf8'));

const strategy = process.argv[2] ?? 'last';
let steps = 0;

while (steps++ < 200) {
  while (story.canContinue) {
    const text = story.Continue().trim();
    const tags = story.currentTags;
    if (text) console.log(tags.length ? `${text}   [${tags.join(' ')}]` : text);
  }
  if (!story.currentChoices.length) break;

  // Prefer an untried check (a choice with a difficulty in its label);
  // fall back to Leave so the run terminates instead of looping on Basic.
  const choices = story.currentChoices;
  const checkIdx = choices.findIndex(c => /—|·/.test(c.text) && !/^Basic/.test(c.text));
  const leaveIdx = choices.findIndex(c => /^Leave/.test(c.text));
  const pick =
    strategy === 'first'
      ? 0
      : checkIdx >= 0
        ? checkIdx
        : leaveIdx >= 0
          ? leaveIdx
          : 0;

  console.log(`\n>>> ${choices[pick].text}   (of ${choices.length}: ${choices.map(c => c.text).join(' | ')})\n`);
  story.ChooseChoiceIndex(pick);
}

const v = story.variablesState;
console.log('\n--- final state ---');
console.log(`BURN ${v['BURN']}  CREDIBILITY ${v['CREDIBILITY']}  act ${v['act']}`);
console.log(`passed: ${v['checks_passed']}`);
console.log(`failed: ${v['checks_failed']}`);
console.log(`brenda_trust ${v['brenda_trust']}  column_g_seen ${v['column_g_seen']}  pii_flagged ${v['pii_flagged']}`);
