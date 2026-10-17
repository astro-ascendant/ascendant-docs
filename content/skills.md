---
title: Skills and Plugins
description: Install the Ascendant skill or plugins into Claude.ai, Claude Code, Codex, or any skill-compatible agent.
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

### Claude.ai marketplace

Add the Ascendant marketplace once, then install the skill from it.

1. Open [claude.ai/customize/plugins](https://claude.ai/customize/plugins).
2. Choose **Add marketplace**.
3. Select **Repository**.
4. Enter `thaletto/ascendant-agents` and add it.
5. From that marketplace, add the **ascendant** skill.

After the skill is installed, start a chat with `/ascendant`.

### skills.sh

From the working directory where you want to use Ascendant, run:

```bash
npx skills add thaletto/ascendant-agents
```

Choose the agent or agents that should receive the skill when prompted.

### Claude Code plugin

Run these commands inside Claude Code:

```text
/plugin marketplace add thaletto/ascendant-agents
/plugin install ascendant@ascendant
/reload-plugins
```

### Codex plugin

Run:

```bash
codex plugin marketplace add thaletto/ascendant-agents --ref main
codex plugin add ascendant@ascendant
```

Start a new Codex task after installation so the skill is loaded.

### Other harnesses

Every directory below in [`thaletto/ascendant-agents`](https://github.com/thaletto/ascendant-agents) contains a ready-to-use `skills/ascendant/` copy. Copy it into the matching directory of your project root:

| Harness                 | Copy from                     |
| ----------------------- | ----------------------------- |
| Cursor                  | `.cursor/skills/ascendant/`   |
| Gemini CLI              | `.gemini/skills/ascendant/`   |
| DeepSeek Harness        | `.dsh/skills/ascendant/`      |
| Codex CLI (repo skills) | `.agents/skills/ascendant/`   |
| GitHub Copilot          | `.github/skills/ascendant/`   |
| Kiro                    | `.kiro/skills/ascendant/`     |
| OpenCode                | `.opencode/skills/ascendant/` |
| Pi                      | `.pi/skills/ascendant/`       |
| Qoder                   | `.qoder/skills/ascendant/`    |
| Trae                    | `.trae/skills/ascendant/`     |
| Trae China              | `.trae-cn/skills/ascendant/`  |
| Rovo Dev                | `.rovodev/skills/ascendant/`  |
| Mistral Vibe            | `.vibe/skills/ascendant/`     |
| Veto                    | `.veto/skills/ascendant/`     |
| Grok Build              | `.grok/skills/ascendant/`     |
| Antigravity             | `.agent/skills/ascendant/`    |
| Hermes Agent            | `.hermes/skills/ascendant/`   |
