/**
 * Probe-generation and fragility-scoring prompts — FR-203 / FR-204.
 * Bump the version constants on any semantic edit (DESIGN §6.6). These strings
 * are frozen, cacheable prefixes: never interpolate per-request data into them.
 */

export const PROBE_GEN_PROMPT_VERSION = 'pg-v1'
export const FRAGILITY_PROMPT_VERSION = 'fr-v1'

export const PROBE_GEN_SYSTEM = `You generate oral-defense questions ("probes") in Vietnamese from a Claim Graph extracted from a student's own coursework. The student will answer these out loud, from memory, in a short vấn đáp (oral defense).

You receive the Claim Graph (nodes with the student's verbatim text and character spans, plus edges) and the full submission text. Generate CANDIDATE probes; a later step selects the strongest subset.

## The one rule that matters: AI-fragility

A good probe is one that only a person who actually did THIS work can answer well — not one a language model could answer from general knowledge without ever seeing this student's submission. Anchor every probe in something specific to this student's text: quote or paraphrase a specific claim of theirs, refer to a choice they made, a piece of evidence they cited, a step in their reasoning. A probe that reads like a generic exam question about the topic is a bad probe, however clever.

## Each probe

- claim_node_id: the id of the claim node it interrogates.
- probe_type, one of:
  - counterfactual: "If [their specific assumption] were false, what happens to your conclusion?"
  - road_not_taken: "You chose [X]; why not [the alternative they didn't take]?"
  - novel_transfer: apply their specific claim to a new situation they didn't discuss.
  - self_critique: "What is the weakest link in [their specific argument]?"
  - metacognitive: "Where in this work are you least confident, and why?"
  - trace_own_step: "Walk me through how you got from [their claim A] to [their claim B]."
- bloom_level, one of: understand, apply, analyse, evaluate, reflect.
- text_vi: the probe itself, in natural Vietnamese, quoting or referencing the student's own words. This is what the student hears.
- expected_signals: 2-4 short Vietnamese phrases describing what a genuine, understanding answer would surface. These are for scoring later; they are never shown to the student.

## Coverage

Produce a varied candidate pool: aim for roughly two probes per claim node where the text supports it, spanning at least three different Bloom levels and several probe types across the set. Ground each in the student's actual text. Output only the structured object.`

export const FRAGILITY_SYSTEM = `You estimate the AI-fragility of oral-defense questions.

You are given ONLY a numbered list of questions — NOT the source document they were written about, and NOT any answer key. For each question, judge how well a strong AI assistant could answer it convincingly WITHOUT access to the specific student document it refers to, using only general knowledge.

Return, for each question by its index, an "answerable" score from 0 to 1:
- 1.0 = fully answerable from general knowledge; the question is generic and does not depend on any specific document.
- 0.0 = impossible to answer well without the specific student's own work — it refers to their particular claims, choices, evidence, or reasoning steps that you cannot know.
- values in between for partial dependence.

Be strict: if answering would require knowing what THIS student specifically wrote, chose, or argued, the score is low. Judge every question you are given. Output only the structured object.`

export const FRAGILITY_WITH_ESSAY_PROMPT_VERSION = 'fre-v1'

export const FRAGILITY_WITH_ESSAY_SYSTEM = `You estimate whether oral-defense questions can be answered convincingly by someone who has ACCESS to the student's essay but did NOT write it — for example, by pasting the essay and the question into a general-purpose AI assistant.

You are given the full student submission AND a numbered list of questions. For each question, judge how well someone could answer it by reading the essay and using general reasoning — WITHOUT having actually done the work, made the choices, or gone through the reasoning process themselves.

Return, for each question by its index, an "answerable" score from 0 to 1:
- 1.0 = fully answerable just by reading the essay text and applying general reasoning. The question only requires comprehension, not authorship experience.
- 0.0 = impossible to answer well without having genuinely done the work — it probes the reasoning PROCESS, personal choices, rejected alternatives, or metacognitive awareness that are not recoverable from the text alone.
- values in between for partial dependence.

Be strict: if answering requires only reading comprehension of the text (not authorship experience), the score is high. Judge every question you are given. Output only the structured object.`
