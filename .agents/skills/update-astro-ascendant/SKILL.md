---
name: update-astro-ascendant
description: Bump astro-ascendant, regenerate API docs, verify, and commit on approval.
disable-model-invocation: true
---

# Update astro-ascendant

Roll the `astro-ascendant` dependency forward and bring the generated docs along with it.

## Steps

1. **Pin the target version.** Ask the user which version to move to when the message names none. Done when a single target version is named.
2. **Update the package.** Bump `astro-ascendant` to the target version and install with the repo's installer. Done when `package.json` plus the lockfile record the target version and the install finishes clean.
3. **Regenerate the API docs.** Run the `sync-api` make target, then the script's `--check` mode. The script owns the export-to-page mapping: an unmapped new export fails the run, so add the mapping in `scripts/sync-api.ts` and regenerate. Hand-edits inside `content/api-reference/` get overwritten on the next run, so route every fix through the script or its mapping. Done when `--check` reports the generated docs up to date.
4. **Verify.** Run each test suite the repo currently defines; when no test script or test files exist, state that and continue. Then run the `check` make target. Done when every present suite is green.
5. **Commit gate.** Show the diff stat with the generated-page summary and ask the user for commit approval, proposing a message naming the version. Commit only on an explicit yes. Done when the change is committed after a yes, or left uncommitted after any other answer.
