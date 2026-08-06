// === FORWARD DEPLOYED ===
// A high-stakes enterprise AI integration RPG.
// One client. One deployment. Five acts.

INCLUDE system/checks.ink
INCLUDE system/stats.ink
INCLUDE scenes/brenda_floor4.ink

-> title

=== title ===
FORWARD DEPLOYED #title

The contract is signed. The badge is printed. Somewhere on the fourth floor, a mainframe is going to fall over on Thursday, and nobody in this building knows why.

-> character_creation ->
-> act_1

// === ACT 1 — THURSDAY ===
=== act_1 ===
// Scenes 1, 2 and 4-8 to be written. Scene 3 is playable.
-> brenda_desk_arrival

// === SCENE ROUTER ===
// Every scene ends here. Checks the fail states, then routes onward.
=== scene_end ===
{ engagement_over(): -> engagement_ends }
-> act_1_end

=== act_1_end ===
You take the elevator down. Behind you, on four, Brenda is still typing.

{ column_g_seen:
    You know where the manifest data lives now. That is more than anyone who signed your contract knows.
- else:
    You have a badge, a laptop, and nothing anyone would call a finding.
}

{ pii_flagged:
    And you have a disclosure to write, with her name on it as a source rather than a subject.
}
{ pii_buried:
    And you have a disclosure to write that Brenda will read as a betrayal, because it is one.
}

BURN {BURN} · CREDIBILITY {CREDIBILITY} #meters

-> milestone ->
-> END

// === FAIL STATE ===
=== engagement_ends ===
{ BURN <= 0:
    The budget is gone. There is a version of this engagement where you found the answer first, and this is not it. #ending
}
{ CREDIBILITY <= 0:
    Security walks you out at 3pm. Your badge stops working before you reach the parking structure. Nobody says the word "fired" because you were never an employee. #ending
}
-> END
