// === DEV JUMP WRAPPERS ===
//
// The web player's dev panel jumps around the story with ChoosePathString,
// which resets the call stack. That's fine for ordinary knots, but any
// tunnel-only knot (entered via `-> knot ->`, returning via `->->`) crashes
// if jumped to directly — its closing `->->` has no call frame to pop.
//
// These wrappers supply one. Add a wrapper here whenever a new tunnel-only
// knot needs to be reachable from the dev panel.

=== dev_character_creation ===
-> character_creation ->
-> END

=== dev_milestone ===
-> milestone ->
-> END

=== dev_allocate_points ===
-> allocate_points ->
-> END
