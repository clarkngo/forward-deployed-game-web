// === FORWARD DEPLOYED — STATS, PROGRESSION, METERS ===

// --- THE SIX ---
// Everyone starts at 1. A stat of 0 would mean the voice never speaks at all.
VAR LEGACY_WHISPERER = 1     // Backend tech debt, APIs, monoliths
VAR SHADOW_AUDIT = 1         // Human workarounds, informal workflows
VAR ROI_RHETORIC = 1         // Business value, token costs, finance
VAR HUMAN_IN_THE_LOOP = 1    // UX, frontline empathy, adoption
VAR PROCUREMENT_ARMOR = 1    // Compliance, SOC2, data privacy
VAR PROMPT_SYNTAX = 1        // Agent logic, JSON, system prompts

// --- PROGRESSION BUDGET (5 acts) ---
// 6 points at creation + 2 at each of 4 act boundaries = 14 placed points.
CONST CREATION_POINTS = 6
CONST MILESTONE_POINTS = 2
CONST CREATION_CAP = 4       // no stat above 4 before play starts
CONST ABSOLUTE_CAP = 6

VAR points_left = 0
VAR stat_cap = 4
VAR act = 1

// --- PRESSURE METERS ---
// BURN is the engagement's budget. Scenes cost it; zero ends the contract.
// CREDIBILITY is the client's belief in you. Failed red checks cost it;
// zero and you get walked out of the building.
VAR BURN = 100
VAR CREDIBILITY = 6

=== function spend_burn(n) ===
    ~ BURN -= n
    { BURN < 0:
        ~ BURN = 0
    }

=== function lose_credibility(n) ===
    ~ CREDIBILITY -= n
    { CREDIBILITY < 0:
        ~ CREDIBILITY = 0
    }

=== function gain_credibility(n) ===
    ~ CREDIBILITY += n
    { CREDIBILITY > 10:
        ~ CREDIBILITY = 10
    }

=== function engagement_over() ===
    ~ return BURN <= 0 or CREDIBILITY <= 0

// === CHARACTER CREATION ===
// Called as a tunnel: -> character_creation ->
=== character_creation ===
Before the badge, before the lobby, before Brenda — there is the question of what kind of consultant walks through that door.

Six ways of seeing a broken company. You get to be good at some of them.

+ [The Recovering Backend Engineer] You have touched the monolith. It touched you back.
    ~ LEGACY_WHISPERER += 3
    ~ PROMPT_SYNTAX += 2
    ~ ROI_RHETORIC += 1
    -> creation_done

+ [The Refugee from Consulting] Four years of slide decks. You know what a number has to look like to survive a steering committee.
    ~ ROI_RHETORIC += 3
    ~ PROCUREMENT_ARMOR += 2
    ~ SHADOW_AUDIT += 1
    -> creation_done

+ [The Escalation Survivor] You worked the support queue. You have been screamed at by the people this software is for.
    ~ HUMAN_IN_THE_LOOP += 3
    ~ SHADOW_AUDIT += 2
    ~ LEGACY_WHISPERER += 1
    -> creation_done

+ [The Compliance Defector] You wrote the policies. You know exactly which ones are theater.
    ~ PROCUREMENT_ARMOR += 3
    ~ ROI_RHETORIC += 2
    ~ PROMPT_SYNTAX += 1
    -> creation_done

+ [The Prompt Mystic] You believe, sincerely, that most problems are badly specified rather than hard.
    ~ PROMPT_SYNTAX += 3
    ~ LEGACY_WHISPERER += 2
    ~ HUMAN_IN_THE_LOOP += 1
    -> creation_done

+ [The Ethnographer] You don't read the documentation. You watch what people actually do.
    ~ SHADOW_AUDIT += 3
    ~ HUMAN_IN_THE_LOOP += 2
    ~ PROCUREMENT_ARMOR += 1
    -> creation_done

+ [Build your own] Distribute {CREATION_POINTS} points yourself.
    ~ points_left = CREATION_POINTS
    ~ stat_cap = CREATION_CAP
    -> allocate_points ->
    -> creation_done

= creation_done
{stat_block()}
->->

// === MILESTONE ===
// Called at act boundaries as a tunnel: -> milestone ->
=== milestone ===
~ act += 1
~ points_left = MILESTONE_POINTS
~ stat_cap = ABSOLUTE_CAP

The engagement moves. Something you did last week has changed what you notice this week. #milestone

-> allocate_points ->
{stat_block()}
->->

// === POINT ALLOCATOR ===
// Shared by creation and milestones. Tunnel: -> allocate_points ->
=== allocate_points ===
- (top)
{ points_left == 0: -> done }
{points_left} point{points_left > 1:s} remaining. #allocator

+ { LEGACY_WHISPERER < stat_cap } [Legacy Whisperer — {LEGACY_WHISPERER}]
    ~ LEGACY_WHISPERER += 1
    ~ points_left -= 1
    -> top
+ { SHADOW_AUDIT < stat_cap } [Shadow Audit — {SHADOW_AUDIT}]
    ~ SHADOW_AUDIT += 1
    ~ points_left -= 1
    -> top
+ { ROI_RHETORIC < stat_cap } [ROI Rhetoric — {ROI_RHETORIC}]
    ~ ROI_RHETORIC += 1
    ~ points_left -= 1
    -> top
+ { HUMAN_IN_THE_LOOP < stat_cap } [Human-in-the-Loop — {HUMAN_IN_THE_LOOP}]
    ~ HUMAN_IN_THE_LOOP += 1
    ~ points_left -= 1
    -> top
+ { PROCUREMENT_ARMOR < stat_cap } [Procurement Armor — {PROCUREMENT_ARMOR}]
    ~ PROCUREMENT_ARMOR += 1
    ~ points_left -= 1
    -> top
+ { PROMPT_SYNTAX < stat_cap } [Prompt Syntax — {PROMPT_SYNTAX}]
    ~ PROMPT_SYNTAX += 1
    ~ points_left -= 1
    -> top

- (done)
->->

=== function stat_block() ===
    LEGACY WHISPERER {LEGACY_WHISPERER} · SHADOW AUDIT {SHADOW_AUDIT} · ROI RHETORIC {ROI_RHETORIC} · HUMAN-IN-THE-LOOP {HUMAN_IN_THE_LOOP} · PROCUREMENT ARMOR {PROCUREMENT_ARMOR} · PROMPT SYNTAX {PROMPT_SYNTAX} #statblock
