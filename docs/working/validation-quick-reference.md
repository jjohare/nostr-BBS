---
title: Documentation Validation Quick Reference
description: Quick reference guide for running documentation validation tools and interpreting results
category: howto
tags: [validation, tools, documentation, reference]
last_updated: 2025-12-23
---

# Documentation Validation Quick Reference

## Running Validations Locally

### All Validators
```bash
npm run validate:docs
```

### Individual Validators
```bash
# Link validation
npm run validate:docs:links

# YAML frontmatter
npm run validate:docs:frontmatter

# Mermaid diagrams
npm run validate:docs:mermaid

# UK English spelling
npm run validate:docs:spelling
```

### Full Project Validation
```bash
npm run validate  # Runs: lint + typecheck + test + validate:docs
```

## Required YAML Frontmatter

Every documentation file must include:

```yaml
---
title: Document Title
description: Brief description of content
status: draft  # draft|review|approved|deprecated
last_updated: 2025-12-23  # YYYY-MM-DD format
category: guide  # Optional: guide|api|reference|feature
---
```

**Category-Specific Requirements:**
- Guides: Must include `difficulty: beginner|intermediate|advanced`
- API docs: Must include `api_version: 1.0`

## Common Validation Errors

### Broken Links
**Error:** `❌ Broken link: ./missing-file.md`

**Fix:**
- Create the missing file
- Update the link path
- Remove the broken link

### Invalid Frontmatter
**Error:** `❌ Missing required field: last_updated`

**Fix:**
```yaml
---
title: My Document
description: Description here
status: draft
last_updated: 2025-12-23  # Add this line
---
```

### Mermaid Syntax Error
**Error:** `❌ Block 2: Invalid Mermaid syntax`

**Fix:**
- Test in [Mermaid Live Editor](https://mermaid.live/)
- Check for missing quotes in labels
- Verify arrow syntax (-->, ->>)

### US Spelling
**Error:** `❌ Line 42: Use 'colour' instead of 'color'`

**Fix:**
- Change US spelling to UK English
- If technical term, wrap in backticks: \`color\`
- Update spelling exceptions in validate-spelling.sh if needed

## UK English Spelling Rules

| US | UK |
|----|-----|
| color | colour |
| behavior | behaviour |
| organize | organise |
| analyze | analyse |
| center | centre |
| license (noun) | licence |

**Exceptions:**
- Code properties: `backgroundColor`, `color:`
- Technical terms: API, JSON, HTTP
- Package names: `npm`, `node_modules`

## File Organisation

```
docs/
├── features/          # Feature documentation
├── guides/           # User guides
├── reference/        # API and configuration reference
├── architecture/     # System architecture
├── scripts/          # Validation scripts
└── working/          # Temporary/draft files (excluded from validation)
```

## GitHub Actions

Validation runs automatically on:
- **Pull Requests** - Validates changed documentation
- **Push to main** - Full validation
- **Weekly** - External link checking (Mondays 9 AM UTC)
- **Manual** - Via GitHub Actions UI

## Validation Reports

Generated in `docs/working/`:
- `link-validation-report.md` - Broken link details
- Uploaded as CI artifacts (30-day retention)

## Pre-commit Hook (Optional)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
STAGED_MD=$(git diff --cached --name-only --diff-filter=ACM | grep '\.md$')

if [ -n "$STAGED_MD" ]; then
    echo "Running documentation validation..."
    npm run validate:docs || exit 1
fi
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Troubleshooting

### "mermaid-cli not found"
```bash
npm install -g @mermaid-js/mermaid-cli
```

### "Scripts not executable"
```bash
chmod +x docs/scripts/*.sh
```

### Test Single File
```bash
# Extract Mermaid blocks
grep -A 20 '```mermaid' docs/your-file.md

# Check frontmatter
head -20 docs/your-file.md
```

## Resources

- [CONTRIBUTING.md](/home/devuser/workspace/nostr-BBS/CONTRIBUTING.md)
- [Automation Setup Report](/home/devuser/workspace/nostr-BBS/docs/working/automation-setup-report.md)
- [Mermaid Documentation](https://mermaid.js.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
