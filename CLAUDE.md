@AGENTS.md

Two rules worth repeating, because they are the two that get skipped:

1. **Proposals before features.** Any new route, collection, field, client
   component or design token goes through an OpenSpec proposal first, and
   proposing and applying are separate turns. Bug fixes, copy and dependency
   bumps do not.

2. **The gate before done.** `pnpm run ci:quality` passes, and the real result
   is reported, including the failures. A gate nobody runs is decoration.
