// Compiles story/main.ink -> web/public/story.json using inkjs's JS compiler.
// No .NET / inklecate dependency.
//
// Written into web/public so Vite copies it verbatim into the build output
// (files fetched at runtime by URL, rather than imported, must live in
// Vite's publicDir to survive `vite build`).

import { Compiler, CompilerOptions } from 'inkjs/full';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entry = join(root, 'story', 'main.ink');
const out = join(root, 'web', 'public', 'story.json');

// Resolves INCLUDE paths relative to the including file's directory.
class FileHandler {
  ResolveInkFilename(filename) {
    return resolve(dirname(entry), filename);
  }
  LoadInkFileContents(filename) {
    return readFileSync(filename, 'utf8');
  }
}

const errors = [];
const options = new CompilerOptions(
  entry,
  [],
  false,
  (message, type) => {
    // type 0 = author (TODO), 1 = warning, 2 = error
    if (type === 2) errors.push(message);
    else console.warn(message.trim());
  },
  new FileHandler()
);

const source = readFileSync(entry, 'utf8');
let story;
try {
  story = new Compiler(source, options).Compile();
} catch (e) {
  console.error('Compile threw:', e.message);
  process.exit(1);
}

if (errors.length) {
  console.error(`\n${errors.length} error(s):\n`);
  for (const e of errors) console.error('  ' + e.trim());
  process.exit(1);
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, story.ToJson());
console.log(`compiled -> web/public/story.json`);
