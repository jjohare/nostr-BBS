# Structure Normalisation Report

**Generated:** 2025-12-20
**Agent:** Structure Normaliser
**Scope:** Documentation file naming and organization audit

## Executive Summary

The documentation structure has **moderate compliance** with naming conventions. Most files follow kebab-case naming, but several issues exist:

- **2 files violate naming conventions** (UPPERCASE)
- **2 files misplaced at root level** (should be in subdirectories)
- **Directory depth is compliant** (max 2 levels, well within 3-level limit)
- **No duplicate filenames detected**

## Audit Results

### 1. Directory Structure Analysis

```
docs/
├── architecture/        [9 files]  ✓ Compliant
├── deployment/          [4 files]  ⚠ Mixed case files
├── features/           [19 files]  ✓ Compliant
├── screenshots/         [9 files]  ✓ Compliant (images)
├── working/             [3 files]  ✓ Compliant
├── diagram-audit-report.md         ⚠ Root level
└── link-validation-report.md       ⚠ Root level
```

**Directory Depth:** Maximum 2 levels (docs/subdirectory/file.md)
**Status:** ✓ PASS (within 3-level limit)

### 2. File Naming Convention Violations

#### Critical Issues (UPPERCASE violations)

| Current Name | Location | Issue | Recommended Name |
|-------------|----------|-------|------------------|
| `DEPLOYMENT.md` | `/docs/deployment/` | All-caps filename | `deployment.md` or `deployment-guide.md` |
| `GCP_DEPLOYMENT.md` | `/docs/deployment/` | All-caps with underscores | `gcp-deployment.md` |

#### Misplaced Files (Root Level)

| Current Location | Issue | Recommended Location |
|-----------------|-------|---------------------|
| `/docs/diagram-audit-report.md` | Should be in working/ or reports/ | `/docs/working/diagram-audit-report.md` |
| `/docs/link-validation-report.md` | Should be in working/ or reports/ | `/docs/working/link-validation-report.md` |

### 3. Compliant Files

The following directories have **100% compliant** file naming:

- **architecture/** (9 files) - All use numbered prefixes with kebab-case
- **features/** (19 files) - All use kebab-case consistently
- **working/** (3 files) - All use kebab-case consistently

### 4. File Naming Patterns

#### Excellent Patterns (Recommend Maintaining)

```
✓ Numbered prefixes for sequential docs:
  - 01-specification.md
  - 02-architecture.md
  - 03-pseudocode.md

✓ Feature-specific naming:
  - pwa-implementation.md
  - pwa-quick-start.md
  - threading-implementation.md

✓ Descriptive kebab-case:
  - search-implementation-summary.md
  - notification-system-phase1.md
  - accessibility-improvements.md
```

#### Patterns to Avoid

```
✗ All-caps filenames:
  - DEPLOYMENT.md
  - GCP_DEPLOYMENT.md

✗ Underscores instead of hyphens:
  - GCP_DEPLOYMENT.md
```

### 5. Directory Organization Assessment

| Directory | File Count | Purpose | Assessment |
|-----------|------------|---------|------------|
| architecture/ | 9 | System design & SPARC docs | ✓ Well organized |
| deployment/ | 4 | Deployment guides | ⚠ Needs naming fixes |
| features/ | 19 | Feature documentation | ✓ Excellent organization |
| working/ | 3 | In-progress/draft docs | ✓ Appropriate use |
| screenshots/ | 9 | Visual assets | ✓ Compliant (images) |

## Recommended Actions

### Priority 1: Critical Fixes (Naming Violations)

```bash
# Fix UPPERCASE violations in deployment/
mv docs/deployment/DEPLOYMENT.md docs/deployment/deployment-guide.md
mv docs/deployment/GCP_DEPLOYMENT.md docs/deployment/gcp-deployment.md
```

**Impact:** Ensures consistent kebab-case naming across all documentation.

### Priority 2: Organizational Improvements (Root Files)

```bash
# Move report files to working/ directory
mv docs/diagram-audit-report.md docs/working/diagram-audit-report.md
mv docs/link-validation-report.md docs/working/link-validation-report.md
```

**Impact:** Cleans root directory, consolidates working documents.

### Priority 3: Consider Creating Reports Directory (Optional)

```bash
# Alternative: Create dedicated reports directory
mkdir -p docs/reports
mv docs/working/diagram-audit-report.md docs/reports/
mv docs/working/link-validation-report.md docs/reports/
mv docs/working/structure-normalisation-report.md docs/reports/
```

**Impact:** Separates audit reports from in-progress documentation.

## Link Update Requirements

After renaming files, the following links must be updated:

### Files Referencing `DEPLOYMENT.md`

```bash
# Search for references
grep -r "DEPLOYMENT\.md" docs/ --include="*.md"
```

### Files Referencing `GCP_DEPLOYMENT.md`

```bash
# Search for references
grep -r "GCP_DEPLOYMENT\.md" docs/ --include="*.md"
```

### Files Referencing Root-Level Reports

```bash
# Search for references to reports
grep -r "diagram-audit-report\.md\|link-validation-report\.md" docs/ --include="*.md"
```

## Compliance Summary

### Current State

| Metric | Count | Percentage |
|--------|-------|------------|
| Total markdown files | 37 | 100% |
| Compliant naming | 35 | 94.6% |
| Naming violations | 2 | 5.4% |
| Misplaced files | 2 | 5.4% |
| Directory depth violations | 0 | 0% |

### Post-Fix Projection

| Metric | Count | Percentage |
|--------|-------|------------|
| Compliant naming | 37 | 100% |
| Naming violations | 0 | 0% |
| Misplaced files | 0 | 0% |
| Directory depth violations | 0 | 0% |

## Implementation Plan

### Phase 1: Safe Renames (No Link Impact)

These files have minimal external references and can be renamed immediately:

1. `DEPLOYMENT.md` → `deployment-guide.md`
2. `GCP_DEPLOYMENT.md` → `gcp-deployment.md`

### Phase 2: Move Reports to Working

These files are recently created and likely have few references:

1. `diagram-audit-report.md` → `working/diagram-audit-report.md`
2. `link-validation-report.md` → `working/link-validation-report.md`

### Phase 3: Link Validation

After each phase, run link validation:

```bash
# Check for broken links
grep -r "DEPLOYMENT\.md\|GCP_DEPLOYMENT\.md" docs/ --include="*.md"
grep -r "\.\./diagram-audit-report\.md\|\.\./link-validation-report\.md" docs/
```

## Naming Convention Reference

### Standard: Kebab-Case

```
✓ Correct:
  - getting-started.md
  - api-reference.md
  - user-guide.md
  - deployment-guide.md

✗ Incorrect:
  - GettingStarted.md (PascalCase)
  - getting_started.md (snake_case)
  - GETTING-STARTED.md (UPPERCASE)
  - GetStarted.md (mixed case)
```

### Directory Naming

```
✓ Correct:
  - architecture/
  - how-to-guides/
  - api-reference/

✗ Incorrect:
  - Architecture/ (capital first letter)
  - how_to_guides/ (underscores)
  - API-Reference/ (mixed case)
```

### File Type Patterns

```
Implementation docs:    feature-name-implementation.md
Quick references:       feature-name-quick-reference.md
Usage guides:          feature-name-usage-guide.md
Architecture docs:     numbered-prefix-name.md (e.g., 01-specification.md)
Reports:              report-type-report.md
```

## Risk Assessment

### Low Risk Changes

- Renaming files in `deployment/` directory (limited scope)
- Moving report files to `working/` (recent additions)

### Medium Risk Changes

- None identified (all changes are low-risk)

### High Risk Changes

- None identified

## Conclusion

The documentation structure is **largely compliant** with naming conventions. Only 4 files require attention:

1. **2 naming violations** in deployment/ directory (UPPERCASE)
2. **2 organizational issues** with root-level report files

All recommended fixes are **low-risk** and can be applied safely. The directory depth is well within limits, and no duplicate filenames exist.

### Next Steps

1. Apply Priority 1 fixes (rename UPPERCASE files)
2. Apply Priority 2 fixes (move reports to working/)
3. Run link validation to identify broken references
4. Update any affected links
5. Consider creating `docs/reports/` directory for future audit reports

---

**Compliance Status:** 94.6% → 100% (after fixes)
**Risk Level:** Low
**Recommended Timeline:** Immediate (all changes are safe)
