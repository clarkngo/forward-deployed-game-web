// === FORWARD DEPLOYED — CHECK SYSTEM ===
//
// Passive voices are deterministic: { STAT >= N }. No roll, no failure.
// Active checks roll 2d6 + STAT + situational bonus against a difficulty.
//
//   WHITE checks are retryable. Fail one, raise the stat, come back.
//   RED checks fire once. Pass or fail, that door is closed for the run.
//
// Scenes never roll dice directly. They call white_check() / red_check().

// --- DIFFICULTY LADDER ---
// 2d6 averages 7. A stat of 1 clears TRIVIAL about half the time;
// a stat of 4 clears CHALLENGING about half the time.
CONST TRIVIAL = 7
CONST EASY = 9
CONST MEDIUM = 11
CONST CHALLENGING = 13
CONST FORMIDABLE = 15
CONST IMPOSSIBLE = 17

// --- CHECK REGISTRY ---
// Every active check in the game needs an id here so its outcome can be
// remembered across scenes. Add new ids as scenes are written.
LIST CheckID =
    brenda_open_up,
    brenda_terminal,
    brenda_column_g,
    brenda_dialect,
    brenda_pii,
    kickoff_scope,
    mainframe_root_cause,
    thursday_triage,
    readout_final

VAR checks_passed = ()
VAR checks_failed = ()

// --- LAST ROLL (for display) ---
VAR last_dice = 0
VAR last_stat = 0
VAR last_bonus = 0
VAR last_total = 0
VAR last_target = 0

=== function d6() ===
    ~ return RANDOM(1, 6)

=== function roll(stat, difficulty, bonus) ===
    ~ last_dice = d6() + d6()
    ~ last_stat = stat
    ~ last_bonus = bonus
    ~ last_target = difficulty
    ~ last_total = last_dice + stat + bonus
    ~ return last_total >= difficulty

// Renders the arithmetic so the player can see why they lost.
=== function roll_detail() ===
    {last_dice} + {last_stat}{last_bonus > 0: + {last_bonus}}{last_bonus < 0: - {0 - last_bonus}} = {last_total} vs {last_target}

// --- WHITE: retryable, but never free ---
// Once passed, stays passed — re-entering the scene won't re-roll it.
// Every failure burns engagement hours, so grinding a check until it lands
// costs budget instead of costing nothing. This is what stops the player
// re-rolling a Formidable check twenty times.
CONST RETRY_BURN = 2

=== function white_check(id, stat, difficulty, bonus) ===
    { checks_passed ? id:
        ~ return true
    }
    ~ temp ok = roll(stat, difficulty, bonus)
    { ok:
        ~ checks_passed += id
        ~ checks_failed -= id
    - else:
        ~ checks_failed += id
        ~ spend_burn(RETRY_BURN)
    }
    ~ return ok

// --- RED: one attempt, ever ---
=== function red_check(id, stat, difficulty, bonus) ===
    ~ temp ok = roll(stat, difficulty, bonus)
    { ok:
        ~ checks_passed += id
    - else:
        ~ checks_failed += id
    }
    ~ return ok

// Gate red-check choices on this so they vanish after one attempt.
=== function red_available(id) ===
    ~ return not (checks_passed ? id) and not (checks_failed ? id)

=== function passed(id) ===
    ~ return checks_passed ? id

=== function failed(id) ===
    ~ return checks_failed ? id
