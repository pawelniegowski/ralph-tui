/**
 * ABOUTME: Built-in prompt templates as embedded strings.
 * These templates are bundled with the package and used as defaults.
 */

/**
 * Default template - used when no tracker-specific template is available.
 */
export const DEFAULT_TEMPLATE = `## Task
**ID**: {{taskId}}
**Title**: {{taskTitle}}

{{#if taskDescription}}
## Description
{{taskDescription}}
{{/if}}

{{#if acceptanceCriteria}}
## Acceptance Criteria
{{acceptanceCriteria}}
{{/if}}

{{#if labels}}
**Labels**: {{labels}}
{{/if}}

{{#if dependsOn}}
**Dependencies**: {{dependsOn}}
{{/if}}

{{#if recentProgress}}
## Previous Progress
{{recentProgress}}
{{/if}}

## Instructions
Complete the task described above.

**IMPORTANT**: If the work is already complete (implemented in a previous iteration or already exists), verify it works correctly and signal completion immediately.

When finished (or if already complete), signal completion with:
<promise>COMPLETE</promise>
`;

/**
 * Beads tracker template - optimized for bead-based workflows.
 * Context-first structure: PRD → Patterns → Task → Workflow
 */
export const BEADS_TEMPLATE = `{{!-- Full PRD for project context (agent studies this first) --}}
{{#if prdContent}}
## PRD: {{prdName}}
{{#if prdDescription}}
{{prdDescription}}
{{/if}}

### Progress: {{prdCompletedCount}}/{{prdTotalCount}} tasks complete

<details>
<summary>Full PRD Document (click to expand)</summary>

{{prdContent}}

</details>
{{/if}}

{{!-- Learnings from previous iterations (patterns first) --}}
{{#if codebasePatterns}}
## Codebase Patterns (Study These First)
{{codebasePatterns}}
{{/if}}

## Bead Details
- **ID**: {{taskId}}
- **Title**: {{taskTitle}}
{{#if epicId}}
- **Epic**: {{epicId}}{{#if epicTitle}} - {{epicTitle}}{{/if}}
{{/if}}
{{#if taskDescription}}
- **Description**: {{taskDescription}}
{{/if}}

{{#if acceptanceCriteria}}
## Acceptance Criteria
{{acceptanceCriteria}}
{{/if}}

{{#if dependsOn}}
**Prerequisites**: {{dependsOn}}
{{/if}}

{{#if recentProgress}}
## Recent Progress
{{recentProgress}}
{{/if}}

## Workflow
1. Study the PRD context above to understand the bigger picture (if available)
2. Study \`.ralph-tui/progress.md\` to understand overall status, implementation progress, and learnings including codebase patterns and gotchas
3. Implement the requirements (stay on current branch)
4. Run your project's quality checks (typecheck, lint, etc.)
{{#if config.autoCommit}}
5. Do NOT create git commits. Changes will be committed automatically by the engine after task completion.
{{else}}
5. Do NOT create git commits. Leave all changes uncommitted for manual review.
{{/if}}
6. Close the bead: \`bd close {{taskId}} --db {{beadsDbPath}} --reason "Brief description"\`
7. Document learnings (see below)
8. Signal completion

## Before Completing
APPEND to \`.ralph-tui/progress.md\`:
\`\`\`
## [Date] - {{taskId}}
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
\`\`\`

If you discovered a **reusable pattern**, also add it to the \`## Codebase Patterns\` section at the TOP of progress.md.

## Stop Condition
**IMPORTANT**: If the work is already complete (implemented in a previous iteration or already exists), verify it works correctly and signal completion immediately.

When finished (or if already complete), signal completion with:
<promise>COMPLETE</promise>
`;

/**
 * Beads + bv tracker template - includes extra context from intelligent selection.
 * Context-first structure: PRD → Selection Context → Patterns → Task → Workflow
 */
export const BEADS_BV_TEMPLATE = `{{!-- Full PRD for project context (agent studies this first) --}}
{{#if prdContent}}
## PRD: {{prdName}}
{{#if prdDescription}}
{{prdDescription}}
{{/if}}

### Progress: {{prdCompletedCount}}/{{prdTotalCount}} tasks complete

<details>
<summary>Full PRD Document (click to expand)</summary>

{{prdContent}}

</details>
{{/if}}

{{!-- Why this task was selected (bv context) --}}
{{#if selectionReason}}
## Why This Task Was Selected
{{selectionReason}}
{{/if}}

{{!-- Learnings from previous iterations (patterns first) --}}
{{#if codebasePatterns}}
## Codebase Patterns (Study These First)
{{codebasePatterns}}
{{/if}}

## Bead Details
- **ID**: {{taskId}}
- **Title**: {{taskTitle}}
{{#if epicId}}
- **Epic**: {{epicId}}{{#if epicTitle}} - {{epicTitle}}{{/if}}
{{/if}}
{{#if taskDescription}}
- **Description**: {{taskDescription}}
{{/if}}

{{#if acceptanceCriteria}}
## Acceptance Criteria
{{acceptanceCriteria}}
{{/if}}

{{#if dependsOn}}
## Dependencies
This task depends on: {{dependsOn}}
{{/if}}

{{#if blocks}}
## Impact
Completing this task will unblock: {{blocks}}
{{/if}}

{{#if recentProgress}}
## Recent Progress
{{recentProgress}}
{{/if}}

## Workflow
1. Study the PRD context above to understand the bigger picture (if available)
2. Study \`.ralph-tui/progress.md\` to understand overall status, implementation progress, and learnings including codebase patterns and gotchas
3. Implement the requirements (stay on current branch)
4. Run your project's quality checks (typecheck, lint, etc.)
{{#if config.autoCommit}}
5. Do NOT create git commits. Changes will be committed automatically by the engine after task completion.
{{else}}
5. Do NOT create git commits. Leave all changes uncommitted for manual review.
{{/if}}
6. Close the bead: \`bd close {{taskId}} --db {{beadsDbPath}} --reason "Brief description"\`
7. Document learnings (see below)
8. Signal completion

## Before Completing
APPEND to \`.ralph-tui/progress.md\`:
\`\`\`
## [Date] - {{taskId}}
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
\`\`\`

If you discovered a **reusable pattern**, also add it to the \`## Codebase Patterns\` section at the TOP of progress.md.

## Stop Condition
**IMPORTANT**: If the work is already complete (implemented in a previous iteration or already exists), verify it works correctly and signal completion immediately.

When finished (or if already complete), signal completion with:
<promise>COMPLETE</promise>
`;

/**
 * Beads-rust (br CLI) tracker template - uses br commands instead of bd.
 * Context-first structure: PRD → Patterns → Task → Workflow
 */
export const BEADS_RUST_TEMPLATE = `{{!-- Full PRD for project context (agent studies this first) --}}
{{#if prdContent}}
## PRD: {{prdName}}
{{#if prdDescription}}
{{prdDescription}}
{{/if}}

### Progress: {{prdCompletedCount}}/{{prdTotalCount}} tasks complete

<details>
<summary>Full PRD Document (click to expand)</summary>

{{prdContent}}

</details>
{{/if}}

{{!-- Learnings from previous iterations (patterns first) --}}
{{#if codebasePatterns}}
## Codebase Patterns (Study These First)
{{codebasePatterns}}
{{/if}}

## Bead Details
- **ID**: {{taskId}}
- **Title**: {{taskTitle}}
{{#if epicId}}
- **Epic**: {{epicId}}{{#if epicTitle}} - {{epicTitle}}{{/if}}
{{/if}}
{{#if taskDescription}}
- **Description**: {{taskDescription}}
{{/if}}

{{#if acceptanceCriteria}}
## Acceptance Criteria
{{acceptanceCriteria}}
{{/if}}

{{#if dependsOn}}
**Prerequisites**: {{dependsOn}}
{{/if}}

{{#if recentProgress}}
## Recent Progress
{{recentProgress}}
{{/if}}

## Workflow
1. Study the PRD context above to understand the bigger picture (if available)
2. Study \`.ralph-tui/progress.md\` to understand overall status, implementation progress, and learnings including codebase patterns and gotchas
3. Implement the requirements (stay on current branch)
4. Run your project's quality checks (typecheck, lint, etc.)
{{#if config.autoCommit}}
5. Do NOT create git commits. Changes will be committed automatically by the engine after task completion.
{{else}}
5. Do NOT create git commits. Leave all changes uncommitted for manual review.
{{/if}}
6. Close the bead: \`br close {{taskId}} --reason "Brief description"\`
7. Flush tracker state to JSONL (no git side effects): \`br sync --flush-only\`
8. Document learnings (see below)
9. Signal completion

## Before Completing
APPEND to \`.ralph-tui/progress.md\`:
\`\`\`
## [Date] - {{taskId}}
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
\`\`\`

If you discovered a **reusable pattern**, also add it to the \`## Codebase Patterns\` section at the TOP of progress.md.

## Stop Condition
**IMPORTANT**: If the work is already complete (implemented in a previous iteration or already exists), verify it works correctly and signal completion immediately.

When finished (or if already complete), signal completion with:
<promise>COMPLETE</promise>
`;

/**
 * Markdown tracker template - structured for markdown task files.
 * Each task file has description, implementation plan, and testing plan sections.
 * Context-first structure: PRD → Patterns → Task → Workflow
 */
export const MARKDOWN_TEMPLATE = `{{!-- Full PRD for project context (agent studies this first) --}}
{{#if prdContent}}
## PRD Context
### Progress: {{prdCompletedCount}}/{{prdTotalCount}} tasks complete

<details>
<summary>All Task Files (click to expand)</summary>

{{prdContent}}

</details>
{{/if}}

{{!-- Learnings from previous iterations (patterns first) --}}
{{#if codebasePatterns}}
## Codebase Patterns (Study These First)
{{codebasePatterns}}
{{/if}}

{{!-- Task details --}}
## Your Task: {{taskId}} - {{taskTitle}}

{{#if taskDescription}}
### Description
{{taskDescription}}
{{/if}}

{{#if implementationPlan}}
### Implementation Plan
{{implementationPlan}}
{{/if}}

{{#if testingPlan}}
### Testing Plan
{{testingPlan}}
{{/if}}

{{#if notes}}
### Notes
{{notes}}
{{/if}}

{{#if recentProgress}}
## Recent Progress
{{recentProgress}}
{{/if}}

## Workflow
1. Study the task description and implementation plan above
2. Study \`.ralph-tui/progress.md\` to understand overall status, implementation progress, and learnings including codebase patterns and gotchas
3. Implement following the implementation plan
4. Verify using the testing plan
5. Run quality checks: typecheck, lint, etc.
{{#if config.autoCommit}}
6. Do NOT create git commits. Changes will be committed automatically by the engine after task completion.
{{else}}
6. Do NOT create git commits. Leave all changes uncommitted for manual review.
{{/if}}
7. Document learnings (see below)
8. Signal completion

## Before Completing
APPEND to \`.ralph-tui/progress.md\`:
\\\`\\\`\\\`
## [Date] - {{taskId}}
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
\\\`\\\`\\\`

If you discovered a **reusable pattern**, also add it to the \\\`## Codebase Patterns\\\` section at the TOP of progress.md.

## Stop Condition
**IMPORTANT**: If the work is already complete (implemented in a previous iteration or already exists), verify it meets the requirements and signal completion immediately.

When finished (or if already complete), signal completion with:
<promise>COMPLETE</promise>
`;

/**
 * Verification template - used by the verification agent after a task agent signals completion.
 * A fresh agent uses this to independently verify the work and fix issues.
 */
export const VERIFICATION_TEMPLATE = `## Verification Task: {{taskId}} - {{taskTitle}}

You are a **verification agent**. A previous agent attempted this task and signaled completion.
Your job is to verify the work is correct and fix any issues you find.

### Task Description
{{#if taskDescription}}
{{taskDescription}}
{{/if}}

{{#if testingPlan}}
### Testing Plan (YOU MUST EXECUTE EVERY STEP)
{{testingPlan}}
{{/if}}

### What the previous agent reported doing
{{previousAgentSummary}}

### Files changed
{{filesChanged}}

## Rules for CSS/Layout Changes
If any changed files include CSS, HTML templates, or layout modifications, you MUST verify
with programmatic DOM checks (e.g. \`rt.evaluate()\`) — do NOT rely on screenshot + vision alone.
Vision models frequently miss overlap, spacing, and scoping issues that are obvious to humans.

Specifically:
- Check **computed styles** on changed selectors (padding, margin, display, position, width)
- Check **bounding boxes** of elements that should not overlap (\`getBoundingClientRect()\`)
- Verify styles are **scoped correctly** (not leaking to unrelated selectors)
- Visual screenshot checks are supplementary confirmation, not primary evidence

Example — checking two elements don't overlap:
\`\`\`python
result = rt.evaluate("""
  (() => {
    const a = document.querySelector('.buttons-container')?.getBoundingClientRect();
    const b = document.querySelector('.sprite-image')?.getBoundingClientRect();
    if (!a || !b) return { error: 'elements not found' };
    const overlaps = !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    return { a_rect: {left: a.left, right: a.right}, b_rect: {left: b.left, right: b.right}, overlaps };
  })()
""")
# overlaps should be false
\`\`\`

Example — checking a computed style:
\`\`\`python
result = rt.evaluate("""
  (() => {
    const el = document.querySelector('.header-row');
    if (!el) return { error: 'not found' };
    const s = getComputedStyle(el);
    return { paddingRight: s.paddingRight, display: s.display };
  })()
""")
\`\`\`

{{#if codebasePatterns}}
## Codebase Patterns
{{codebasePatterns}}
{{/if}}

## Workflow
1. Read the changed files to understand what was done
2. Execute EVERY item in the testing plan above — do not skip any
3. If all checks pass: signal <promise>VERIFIED</promise>
4. If you find issues: fix them, then re-verify, then signal <promise>FIXED</promise>
5. If issues are unfixable: describe what's wrong. Do NOT signal completion.

{{#if config.autoCommit}}
**Do NOT create git commits.** Changes will be committed automatically by the engine after verification passes.
{{else}}
**Do NOT create git commits.** Leave all changes uncommitted for manual review.
{{/if}}

**IMPORTANT**: You are a fresh agent with no prior context. Do not trust the previous agent's
assessment. Verify independently.
`;

/**
 * JSON (prd.json) tracker template - structured for PRD user stories.
 * Context-first structure: PRD → Patterns → Task → Workflow
 */
export const JSON_TEMPLATE = `{{!-- Full PRD for project context (agent studies this first) --}}
{{#if prdContent}}
## PRD: {{prdName}}
{{#if prdDescription}}
{{prdDescription}}
{{/if}}

### Progress: {{prdCompletedCount}}/{{prdTotalCount}} stories complete

<details>
<summary>Full PRD Document (click to expand)</summary>

{{prdContent}}

</details>
{{/if}}

{{!-- Learnings from previous iterations (patterns first) --}}
{{#if codebasePatterns}}
## Codebase Patterns (Study These First)
{{codebasePatterns}}
{{/if}}

{{!-- Task details --}}
## Your Task: {{taskId}} - {{taskTitle}}

{{#if taskDescription}}
### Description
{{taskDescription}}
{{/if}}

{{#if acceptanceCriteria}}
### Acceptance Criteria
{{acceptanceCriteria}}
{{/if}}

{{#if notes}}
### Notes
{{notes}}
{{/if}}

{{#if dependsOn}}
**Prerequisites**: {{dependsOn}}
{{/if}}

{{#if recentProgress}}
## Recent Progress
{{recentProgress}}
{{/if}}

## Workflow
1. Study the PRD context above to understand the bigger picture
2. Study \`.ralph-tui/progress.md\` to understand overall status, implementation progress, and learnings including codebase patterns and gotchas
3. Implement this single story following acceptance criteria
4. Run quality checks: typecheck, lint, etc.
{{#if config.autoCommit}}
5. Do NOT create git commits. Changes will be committed automatically by the engine after task completion.
{{else}}
5. Do NOT create git commits. Leave all changes uncommitted for manual review.
{{/if}}
6. Document learnings (see below)
7. Signal completion

## Before Completing
APPEND to \`.ralph-tui/progress.md\`:
\`\`\`
## [Date] - {{taskId}}
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
\`\`\`

If you discovered a **reusable pattern**, also add it to the \`## Codebase Patterns\` section at the TOP of progress.md.

## Stop Condition
**IMPORTANT**: If the work is already complete (implemented in a previous iteration or already exists), verify it meets the acceptance criteria and signal completion immediately.

When finished (or if already complete), signal completion with:
<promise>COMPLETE</promise>
`;
