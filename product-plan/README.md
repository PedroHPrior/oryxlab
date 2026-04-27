# OryxLab — UI Design Handoff Package

This is the export package for **OryxLab**, a DPS calculator and build comparator for Realm of the Mad God. It contains the planning artifacts, screen designs, and implementation guidance you need to build the product in your own codebase.

## What's inside

```
product-plan/
├── README.md                          # this file
├── product-overview.md                # what we're building, and why
├── prompts/                           # ready-to-use coding-agent prompts
│   ├── one-shot-prompt.md             # build the entire product
│   └── section-prompt.md              # template for one section at a time
├── instructions/                      # implementation guides
│   ├── one-shot-instructions.md       # all milestones combined
│   └── incremental/                   # one file per milestone
│       ├── 01-shell.md
│       ├── 02-comparator.md
│       ├── 03-build-editor.md
│       ├── 04-catalog.md
│       ├── 05-optimizer.md
│       └── 06-inventory.md
├── design-system/                     # color tokens + fonts
│   ├── colors.json
│   └── typography.json
├── data-shapes/                       # TypeScript types per section
├── shell/                             # AppShell components
└── sections/                          # one folder per section, with components + tests
```

## Quick start

1. Open `prompts/one-shot-prompt.md` and paste it into a coding agent (Claude Code, Cursor, Copilot Chat). The prompt tells the agent how to ask you about your tech stack and then build the whole thing.
2. Or pick a single section: copy `prompts/section-prompt.md`, fill in the section name, and paste.

## Important notes

- **This is a UI design handoff.** Backend architecture, data sourcing, and persistence are intentionally left for the implementer. The prompts guide the agent to ask the right questions about your stack.
- **Components are props-based and portable.** Each section accepts data and callbacks via props — no global stores hard-wired in.
- **Sample data lives next to each section** in `sections/[name]/data.json`. Use it for local development; replace with real data in production.
- **Each section has `tests.md`** describing the UI behaviors to verify. Treat it as a checklist for manual or automated tests.

Realm of the Mad God is © Deca Games. OryxLab is an unofficial fan tool.
