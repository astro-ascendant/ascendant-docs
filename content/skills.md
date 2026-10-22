---
title: Skills and Plugins
description: Install the Ascendant plugins for OpenCode, Claude Code, and Codex, or the skill for any other agent.
---

## Overview

**Ascendant** saves a birth chart once, then answers astrology questions from
that stored record instead of recalled positions. It runs as an agent skill in
OpenCode, Claude Code, Codex, and any skill-compatible agent.

The workflow has two moves:

1. **Save a chart.** Give a person's birth data; the skill writes a record to
   `persons/<name>/` and generates the Vedic and KP charts, dashas, and
   Ashtakavarga its answers draw on. The birth header stays immutable, and
   confirmed past events accumulate in the record's `MEMORY.md`.
2. **Ask a question.** Ask in plain words. The reply leads with the judgment,
   then shows the method and citations underneath.

Each answer commits to one school. **KP** (KrishnamurtiVP291, Placidus,
Vimshottari) is the default for every question. **Parashari** (Lahiri,
whole-sign, Vimshottari) applies only on an explicit request, where it covers
promise, quality, yogas, and divisional charts. The two are never mixed, and
the answer states its school, ayanamsa, house system, and dasha system up
front.

Three properties keep readings consistent:

- **Cited evidence**: every claim points to a chart file (`path:field`) and a
  guidebook section, so judgments trace to the record, not memory.
- **One method per judgment**: KP placements are never read with Parashari
  rules.
- **No hedging**: when evidence is missing or conflicts block judgment, the
  skill returns `Insufficient evidence: run init or attach X`.

The skill declines to time or assert deaths, serious accidents, or severe
illnesses.

## Installation

### OpenCode Plugin

Run:

```bash
opencode plugin add opencode-ascendant
```

### Claude Code Plugin

Run these commands inside Claude Code:

```text
/plugin marketplace add astro-ascendant/skills
/plugin install ascendant@ascendant
/reload-plugins
```

### Codex Plugin

Run:

```bash
codex plugin marketplace add astro-ascendant/skills --ref main
codex plugin add ascendant@ascendant
```

### Agent Skills

From the working directory where you want to use Ascendant, run:

```bash
npx skills add astro-ascendant/skills
```
