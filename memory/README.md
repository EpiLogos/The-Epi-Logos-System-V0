# Memory Folder — Development Tracking Protocol

Purpose
- Provide a simple, consistent way to track active work, feature-level progress, broader sprint fruits/insights, and evolving architecture — in tandem with docs/stories.

What lives where
- active_sprint/: Per-sprint planning and in-flight feature notes
  - sprint-{n}/
    - sprint-plan.md — One file linking in-flight features + story docs
    - features/ — Short, tactical planning docs per feature (optional)
    - ad-hoc/ — Notes that may crystallize into stories later
- sprint_tracking/: Per-sprint tracking beyond plans
  - sprint-{n}/
    - tracking/ — story-{ID}-{slug}-tracking.md (feature-level execution tracking)
    - fruits/ — project-level insights and emergent developments (beyond features)
    - claude-insights/ — implementation learnings, pitfalls, fixes → feeds AGENTS.md/CLAUDE.md
- system_architecture/: Evolving architecture (descriptive + diagrams) by layer
- foundational/: System-wide briefs and research (kept minimal; link to system_architecture)
- diagrams/: Legacy diagrams (prefer system_architecture/diagrams/*)
- DEVELOPMENT_LOG.md — Ongoing, high-level log across sprints

Relationship to docs/stories
- docs/stories/ — Canonical story specifications
- docs/stories/sprint-{n}/ — Organizational view with per-sprint plan + index stubs
- memory/active_sprint/ — Day-to-day planning and ad-hoc notes for the current sprint
- memory/sprint_tracking/ — The narrative of execution (feature tracking, fruits, insights)

Naming conventions
- Story docs: docs/stories/{ID}.{slug}.md (canonical)
- Tracking docs: memory/sprint_tracking/sprint-{n}/tracking/story-{ID}-{slug}-tracking.md
- Active sprint features: memory/active_sprint/sprint-{n}/features/{short-slug-or-ID}.md
- Fruits: memory/sprint_tracking/sprint-{n}/fruits/{short-title}.md
- Claude insights: memory/sprint_tracking/sprint-{n}/claude-insights/{short-title}.md

Suggested workflow
1. Planning:
   - Add/update sprint-{n}-plan.md in docs/stories/sprint-{n}/
   - Create active_sprint/sprint-{n}/sprint-plan.md linking key features and stories
2. Execution:
   - For each story/feature needing tracking, create a tracking doc (tracking/story-{ID}-{slug}-tracking.md)
   - Keep feature-level notes (if needed) in active_sprint/sprint-{n}/features/
3. Insights:
   - Capture broader project learnings in fruits/
   - Capture code-level insights in claude-insights/ (bugs, fixes, patterns)
4. Closeout (end of sprint):
   - Regenerate/update system_architecture/{descriptive,diagrams}/ with deltas
   - Update DEVELOPMENT_LOG.md with a high-level sprint overview and links
   - Extract stable Claude insights → update AGENTS.md and CLAUDE.md
   - Finalize sprint plan status in docs/stories/sprint-{n}-plan.md
   - Archive completed sprint’s stories under docs/stories/DONE/ if desired

Principles
- Keep plans short; keep canonical story docs clean; keep tracking actionable.
- Prefer linking over duplication; stubs point to canonical docs.
