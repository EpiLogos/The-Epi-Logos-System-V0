# Essay Content

This directory contains the markdown files for the three main Epi-Logos essays.

## Files

- `epi-logos.md` - The Epi-Logos & Bimba Map essay
- `ql.md` - Quaternal Logic (QL) essay
- `mef.md` - Meta-Epistemic Framework (MEF) essay

## Updating Essays

To update essay content:

1. Edit the source files in `/texts/`:
   - `texts/Epi-Logos-Essay-Rewrite.md`
   - `texts/QL-Essay-Rewrite.md`
   - `texts/MEF-flagship-Essay-Rewrite.md`

2. Run the update script from project root:
   ```bash
   ./scripts/update-essays.sh
   ```

3. Refresh the browser - changes are immediate!

## LaTeX Math Notation

The essays support LaTeX math notation. Just write LaTeX commands on their own lines:

```markdown
\mathrm{Trika} := \; (0/1) \quad,\quad (1/0) \quad,\quad \frac{(0/1)}{(1/0)} .
```

The EssayReader component automatically wraps these in `$$...$$` for proper KaTeX rendering.

## Architecture

Essays are loaded dynamically via `fetch()` in the EssayReader component from `/essays/*.md`, so:
- ✅ No TypeScript compilation needed for updates
- ✅ No escaping nightmares
- ✅ Files can be edited directly in `/texts/` and synced
- ✅ Mathematical notation works out of the box
- ✅ Static files served correctly by Next.js from `frontend/public/`
