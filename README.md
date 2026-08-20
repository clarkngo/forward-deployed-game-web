# FORWARD DEPLOYED

A high-stakes enterprise AI integration RPG, in the Disco Elysium tradition.
One client. One deployment. Five acts.

Written in [Ink](https://www.inklestudios.com/ink/), compiled with inkjs,
played in the browser.

```bash
npm install
npm run dev        # compile ink + serve the player
npm test           # archetype coverage check
```

## Layout

```
story/
  main.ink            entry point, INCLUDEs, act routing
  system/checks.ink   dice, difficulty ladder, white/red checks
  system/stats.ink    the six stats, point-buy, milestones, meters
  system/dev.ink      tunnel wrappers so the dev panel can jump anywhere
  scenes/*.ink        one file per scene
scripts/
  build-ink.mjs       story/main.ink -> web/public/story.json
  smoke.mjs           headless playthrough, prints a transcript
  coverage.mjs        plays every archetype N times; fails if one is locked out
web/                  vite player, tag-aware renderer, dev panel
```

## The six stats

| Stat | Domain |
|---|---|
| `LEGACY_WHISPERER` | Backend tech debt, APIs, monoliths |
| `SHADOW_AUDIT` | Human workarounds, informal workflows |
| `ROI_RHETORIC` | Business value, token costs, finance |
| `HUMAN_IN_THE_LOOP` | UX, frontline empathy, adoption |
| `PROCUREMENT_ARMOR` | Compliance, SOC2, data privacy |
| `PROMPT_SYNTAX` | Agent logic, JSON, system prompts |

Everyone starts at 1 in all six. A stat of 0 would mean that voice never speaks.

## Progression

6 points at character creation (cap 4 per stat), then 2 points at each of the
four act boundaries — 14 placed points across a full run, hard cap 6 per stat.
Six archetypes offer pre-built spreads; `Build your own` opens the allocator.

## Checks

**Passive voices** are deterministic. No roll:

```ink
{ SHADOW_AUDIT >= 2:
    SHADOW AUDIT: "That's the real workflow, not the official ERP." #voice #shadow_audit
}
```

**Active checks** roll `2d6 + stat + situational bonus` against a difficulty:

| | Trivial | Easy | Medium | Challenging | Formidable | Impossible |
|---|---|---|---|---|---|---|
| target | 7 | 9 | 11 | 13 | 15 | 17 |

*White checks* are retryable. Each failure costs `RETRY_BURN` (2 BURN), so
grinding a check costs budget rather than nothing. Write them as **sticky**
choices gated on not-yet-passed — `*` would consume the option on failure and
make the retry impossible:

```ink
+ { SHADOW_AUDIT >= 2 and not passed(brenda_open_up) } [SHADOW AUDIT — Medium] "..."
    {roll_detail_line(white_check(brenda_open_up, SHADOW_AUDIT, MEDIUM, 0))}
    { passed(brenda_open_up):
        ...success...
    - else:
        ...failure, written as content...
    }
```

*Red checks* fire once, ever. Gate on `red_available(id)`:

```ink
+ { PROCUREMENT_ARMOR >= 3 and red_available(brenda_pii) } [RED · PROCUREMENT ARMOR — Challenging] "..."
    {roll_detail_line(red_check(brenda_pii, PROCUREMENT_ARMOR, CHALLENGING, trust_bonus()))}
```

Every check needs an id in the `CheckID` list in `system/checks.ink` so its
outcome survives across scenes.

**Situational bonuses are the point.** A scene flag earned earlier feeds the
roll (`trust_bonus()` returns +2 once Brenda trusts you). This is what makes
prior scenes mechanically matter rather than just narratively.

## Meters

- **BURN** — engagement budget, starts at 100. Scenes and failed retries cost it.
- **CREDIBILITY** — client belief, starts at 6, caps at 10. Failed checks cost it.

Either hitting zero ends the engagement. Failure costs credibility rather than
blocking progress, so a failed check stays playable.

## Scene conventions

- One knot per scene, hub-and-spoke: a labelled gather, choices that divert
  back to it, and an always-available `[Leave]` so no build can be trapped.
- Every scene ends at `-> scene_end`, the router in `main.ink`, which checks
  the fail states before moving on.
- **Every scene needs at least two routes into its main content.** A scene
  gated on one stat is unplayable for most builds — `npm test` enforces this
  by playing all six archetypes and failing if any never reaches the content.

## Dev panel

The "Dev" tab (bottom-right, in the running app) jumps straight to any scene
instead of replaying from the title screen, and lets you poke stat values
before jumping so gated checks are reachable on demand.

- **Jump to scene** calls `story.ChoosePathString(path)`, which resets the
  call stack. That's safe for ordinary knots, but a **tunnel-only** knot
  (entered via `-> knot ->`, returning via `->->`) crashes on that final
  `->->` if jumped to directly — there's no call frame to pop. `character_creation`,
  `milestone`, and `allocate_points` are all tunnel-only, so they're not
  listed directly; `system/dev.ink` wraps each in a `dev_*` knot that calls it
  properly and diverts to `END` after. **When you add a new tunnel-only
  knot, add a wrapper for it there** — and add the entry point (wrapped or
  not) to `DEV_SCENES` in `web/main.js`.
- **Stats** sets `story.variablesState[...]` directly. Applying doesn't
  re-render the current choice list (Ink only evaluates gates at a divert
  point) — jump to the scene again after applying to see gated choices appear.
- **Restart** is just `location.reload()`.

## Renderer tags

| Tag | Effect |
|---|---|
| `#voice #<stat_lowercase>` | Passive skill insert, tinted per stat |
| `#roll #success` / `#roll #failure` | Dice result box |
| `#statblock` `#meters` | Monospace rule-bounded line |
| `#title` `#milestone` `#allocator` `#ending` | Accent styling |

## Status

Act 1 scene 3 (Brenda, Floor 4) is written and playable. Acts 1–5 remain to
be scripted; `main.ink` routes to Act 1 only.
