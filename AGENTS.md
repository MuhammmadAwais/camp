<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Read Strategy (Token-Efficient & Domain-Specific)

Do not read all 9 context files on every task. Read strictly what your current task touches:

1. **Always Check First:**
   - `context/progress-tracker.md` — Current phase, next feature, completed items.
   - `context/architecture.md` — Folder boundaries, data flow patterns, BFF proxy structure.

2. **When Building or Styling UI:**
   - `context/ui-tokens.md` — Exact Tailwind v4 `@theme` tokens (Light Porcelain vs Dark Obsidian).
   - `context/ui-rules.md` — Font Trinity (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`), layout grids, countdown rules.
   - `context/ui-registry.md` — Existing components to reuse before creating new ones.

3. **When Writing Logic, Forms, State, or API Calls:**
   - `context/library-docs.md` — Strict code recipes (TanStack Query v5, Zustand, RHF + Zod, SSE, S3 Direct Upload).
   - `context/code-standards.md` — TypeScript strictness, naming rules, integer CAD cents, error handling.

4. **When Starting a New Phase or Verifying Scope:**
   - `context/build-plan.md` — The immutable step-by-step feature specification.
   - `context/project-overview.md` — Canadian regulatory compliance (PIPEDA, Law 25, OMVIC/AMVIC/VSA) & RBAC matrix.

---

## Rules That Never Change

- **No Floating-Point Currency:** All CAD monetary values MUST be processed, stored, and sent as **integer cents**.
- **No Hardcoded Colors:** Never use hardcoded hex values or raw Tailwind color classes (e.g., `bg-blue-500`) — use `@theme` tokens only.
- **Sealed Bid Invariant:** The UI must NEVER display live bid CAD amounts to sellers or competing dealers while an auction is `ACTIVE`.
- **Living Registry & Tracking:** Update `progress-tracker.md` and run `/imprint` after completing any component.
- **Decoupled API Boundary:** No Next.js Server Actions for standard CRUD — mutations use TanStack `useMutation` via `api-client.ts`.
- **Break Doom-Loops:** If the same problem persists after one corrective prompt — stop immediately and run `/recover`.

---

## Available Skills

- `/architect` — before any complex feature. Think before building.
- `/imprint` — after any new UI component. Capture patterns to `ui-registry.md`.
- `/review` — before demo or when something feels off.
- `/recover` — when something breaks after one failed correction.
- `/remember save` — when a feature spans multiple sessions.
- `/remember restore` — when returning after a multi-session feature.