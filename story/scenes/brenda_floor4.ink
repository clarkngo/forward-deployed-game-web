// === FORWARD DEPLOYED ===
// Act 1, Scene 3: Floor 4 — Brenda's Desk
// First contact with the shadow workflow.

// --- SCENE FLAGS ---
// Read by later scenes. brenda_trust also feeds situational bonuses.
VAR brenda_trust = false
VAR column_g_seen = false
VAR pii_flagged = false
VAR pii_buried = false

=== brenda_desk_arrival ===
~ spend_burn(4)

Brenda looks up over her reading glasses as you approach. Her hand hovers over the 'Delete' key like a sniper taking aim.

Brenda: "Can I help you, suit, or are you just admiring the carpet?"

// --- PASSIVE VOICES (deterministic, no roll) ---
{ SHADOW_AUDIT >= 2:
    SHADOW AUDIT: "Look at screen 2. She has a private Excel sheet open with color-coded tabs. That's the real workflow, not the official ERP." #voice #shadow_audit
}

{ LEGACY_WHISPERER >= 2:
    LEGACY WHISPERER: "Her terminal emulator is running on an unpatched IBM port. Speak carefully." #voice #legacy_whisperer
}

{ PROCUREMENT_ARMOR >= 3:
    PROCUREMENT ARMOR: "Nothing on that desk went through security review. Not the sheet, not the macro, not the USB stick under the monitor stand." #voice #procurement_armor
}

-> brenda_hub

=== brenda_hub ===
+ [Basic] "Just looking around."
    Brenda: "Then look somewhere else."
    -> brenda_hub

// --- WHITE CHECK: retryable. Come back with more Shadow Audit. ---
+ { SHADOW_AUDIT >= 2 and not passed(brenda_open_up) } [SHADOW AUDIT — Medium] "I see that custom spreadsheet on your second monitor."
    {roll_detail_line(white_check(brenda_open_up, SHADOW_AUDIT, MEDIUM, 0))}
    { passed(brenda_open_up):
        Brenda winces, then narrows her eyes. Something in her posture gives up.
        Brenda: "Management doesn't know about that file. Keep your mouth shut about it if you know what's good for you."
        ~ brenda_trust = true
    - else:
        Brenda: "That's my lunch order tracker."
        It is very obviously not a lunch order tracker. But you said it like an auditor, and she heard an auditor, and the window is closed.
        ~ lose_credibility(1)
    }
    -> brenda_hub

+ { ROI_RHETORIC >= 3 and not passed(brenda_open_up) } [ROI RHETORIC — Easy] "Whatever you're doing by hand costs this company about ninety grand a year in salary hours."
    {roll_detail_line(white_check(brenda_open_up, ROI_RHETORIC, EASY, 0))}
    { passed(brenda_open_up):
        Brenda: "Ninety-four. I did the math in 2019. Nobody read it."
        ~ brenda_trust = true
    - else:
        Brenda: "So I'm a line item."
        She turns back to her monitor. You have just told a woman that she is expensive.
        ~ lose_credibility(1)
    }
    -> brenda_hub

// --- WHITE CHECK: gated on stat AND boosted by trust from above. ---
+ { HUMAN_IN_THE_LOOP >= 2 and not passed(brenda_column_g) } [HUMAN-IN-THE-LOOP — Medium] "I'm not here to automate your job, Brenda. I'm here to stop the mainframe crashes."
    {roll_detail_line(white_check(brenda_column_g, HUMAN_IN_THE_LOOP, MEDIUM, trust_bonus()))}
    { passed(brenda_column_g):
        Brenda studies you for a moment, then turns her secondary monitor toward you.
        Brenda: "Fine. Look at column G. That's where the real manifest data lives."
        ~ column_g_seen = true
        -> brenda_deep_dive
    - else:
        Brenda: "That's what the last one said. He had a badge like yours and a laptop like yours and eleven people don't work here anymore."
        The monitor stays where it is.
        ~ lose_credibility(1)
    }
    -> brenda_hub

+ { LEGACY_WHISPERER >= 2 and not passed(brenda_terminal) } [LEGACY WHISPERER — Easy] "That's a 3270 emulator. You're keying into the mainframe directly, aren't you."
    {roll_detail_line(white_check(brenda_terminal, LEGACY_WHISPERER, EASY, 0))}
    { passed(brenda_terminal):
        Brenda's hand comes off the Delete key.
        Brenda: "Twenty-two years. You're the first one they sent who knew what it was."
        ~ brenda_trust = true
    - else:
        Brenda: "It's a terminal."
        She says it the way you'd say it to a child asking what a door is.
    }
    -> brenda_hub

// Any route to trust opens the real content. Without this convergence the
// scene is only playable by a Human-in-the-Loop build.
+ { brenda_trust and not column_g_seen } [Ask] "Show me what you're actually keeping track of."
    She looks at you for a long moment, then turns her secondary monitor toward you.
    Brenda: "Column G. That's where the real manifest data lives."
    ~ column_g_seen = true
    -> brenda_deep_dive

+ [Leave] Say nothing. Walk away.
    { brenda_trust:
        Brenda: "...Hey. Suit. Come back when you've got a badge that opens the fourth floor."
    - else:
        She's already typing again. You've been dismissed.
    }
    -> scene_end

=== brenda_deep_dive ===
Column G is 4,200 rows of freeform text. Ship dates, part numbers, and what appear to be personal phone numbers, all jammed into one cell each, separated by whatever delimiter Brenda felt like using that morning.

{ PROMPT_SYNTAX >= 2:
    PROMPT SYNTAX: "There's no schema here. There's a dialect. Every row is a sentence in a language exactly one person speaks." #voice #prompt_syntax
}

{ PROCUREMENT_ARMOR >= 2:
    PROCUREMENT ARMOR: "Those are customer mobile numbers in an unencrypted local file. That is a reportable finding, and you are now a witness to it." #voice #procurement_armor
}

- (deep_dive_hub)
+ [Basic] "How long has this been the process?"
    Brenda: "Since the ERP migration. Eleven years. They kept the training budget, though."
    -> deep_dive_hub

+ { LEGACY_WHISPERER >= 3 and not passed(mainframe_root_cause) } [LEGACY WHISPERER — Challenging] "The ERP can't store this, can it. The field is capped at 40 characters."
    {roll_detail_line(white_check(mainframe_root_cause, LEGACY_WHISPERER, CHALLENGING, trust_bonus()))}
    { passed(mainframe_root_cause):
        Brenda stops typing for the first time since you arrived.
        Brenda: "Thirty-two. And it strips slashes. So I stopped using it."
        There it is. Eleven years of institutional workaround, caused by a field width nobody has looked at since the Bush administration.
        ~ brenda_trust = true
        ~ gain_credibility(1)
    - else:
        Brenda: "It stores it fine."
        She is lying, but not to protect the ERP. She's protecting the eleven years.
    }
    -> deep_dive_hub

+ { PROMPT_SYNTAX >= 3 and not passed(brenda_dialect) } [PROMPT SYNTAX — Medium] "If I can read your delimiters, a model can too. Walk me through one row."
    {roll_detail_line(white_check(brenda_dialect, PROMPT_SYNTAX, MEDIUM, trust_bonus()))}
    { passed(brenda_dialect):
        She pulls up a row. You start writing the extraction rules in your head before she finishes the sentence.
        ~ gain_credibility(1)
    - else:
        Brenda: "There's no rule. I just know."
        And she does. That's the whole problem, and it does not fit in a system prompt.
    }
    -> deep_dive_hub

// --- RED CHECK: one attempt. Both outcomes are permanent and playable. ---
+ { PROCUREMENT_ARMOR >= 3 and red_available(brenda_pii) } [RED · PROCUREMENT ARMOR — Challenging] "Brenda. There's PII in column G. I have to flag it, and I'd rather flag it with you than about you."
    {roll_detail_line(red_check(brenda_pii, PROCUREMENT_ARMOR, CHALLENGING, trust_bonus()))}
    { passed(brenda_pii):
        A long pause. Then, quietly:
        Brenda: "...Do it that way. The second way."
        ~ pii_flagged = true
        ~ gain_credibility(2)
    - else:
        Brenda: "You'll do what you were always going to do."
        She closes the sheet. Not minimizes — closes. When you write the finding, it will be about her, and both of you know it now.
        ~ pii_buried = true
        ~ brenda_trust = false
        ~ lose_credibility(2)
    }
    -> deep_dive_hub

+ { SHADOW_AUDIT >= 4 and not passed(thursday_triage) } [SHADOW AUDIT — Challenging] "You're not the only one. There are four other sheets like this in the building, aren't there?"
    {roll_detail_line(white_check(thursday_triage, SHADOW_AUDIT, CHALLENGING, trust_bonus()))}
    { passed(thursday_triage):
        Brenda: "Six. And one of them is the reason the mainframe falls over every Thursday."
        ~ gain_credibility(1)
    - else:
        Brenda: "Wouldn't know. I keep to my floor."
        Everyone on this floor keeps to their floor. That is also the problem.
    }
    -> deep_dive_hub

+ [Leave] "That's what I needed. Thank you, Brenda."
    Brenda: "Don't thank me. Fix Thursday."
    -> scene_end

// --- HELPERS ---

// Trust earned earlier in the scene makes later checks easier.
// This is the mechanic that makes prior scenes matter.
=== function trust_bonus() ===
    { brenda_trust:
        ~ return 2
    }
    ~ return 0

// Prints the arithmetic on its own tagged line, then passes the result through
// so it can be read back with passed()/failed().
=== function roll_detail_line(result) ===
    { result:
        ✓ {roll_detail()} #roll #success
    - else:
        ✗ {roll_detail()} #roll #failure
    }
