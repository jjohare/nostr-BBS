# Link Infrastructure Specification
**Version**: 1.0
**Date**: 2025-12-20
**Status**: Draft
**Project**: nostr-BBS Documentation

---

## Executive Summary

This specification defines a comprehensive bidirectional link infrastructure for the nostr-BBS documentation system, addressing critical navigation and discoverability issues identified in the current documentation corpus.

### Critical Findings
- **100% orphaned files**: All 58 documentation files have zero inbound links
- **46.6% isolated files**: 27 files have no outbound links
- **0% bidirectional connectivity**: No files have both inbound and outbound links
- **135 broken links**: 69.2% of internal links point to non-existent files
- **15 critical missing hubs**: Primary hub `docs/README.md` referenced 15 times but does not exist

---

## 1. Current State Analysis

### 1.1 Documentation Corpus Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| Total markdown files | 58 | 100% |
| Files with internal links | 31 | 53.4% |
| Files without links | 27 | 46.6% |
| Total internal links | 195 | - |
| Total external links | 82 | - |
| Broken internal links | 135 | 69.2% |
| Valid internal links | 60 | 30.8% |

### 1.2 Directory Breakdown

| Directory | Files | Links Out | Links In | Broken |
|-----------|-------|-----------|----------|--------|
| `docs/features/` | 19 | 13 | 0 | 13 |
| `docs/architecture/` | 9 | 12 | 0 | 0 |
| `docs/deployment/` | 4 | 8 | 10 | 2 |
| `docs/working/` | 1 | 107 | 0 | 107 |
| `tests/semantic/` | 3 | 4 | 0 | 4 |
| Project root | 1 | 41 | 17 | 5 |

### 1.3 Most Critical Broken Links

#### Priority 1: Missing Hub Documents
1. **`docs/README.md`** - Referenced 15 times (all feature docs)
2. **`docs/working/00-index/GETTING_STARTED.md`** - Referenced 2 times
3. **`docs/deployment/MIGRATION.md`** - Referenced 1 time

#### Priority 2: Missing Category Indices
- `docs/working/01-tutorials/` (7 tutorials planned, 0 exist)
- `docs/working/02-how-to-guides/` (15+ guides planned, 0 exist)
- `docs/working/03-reference/` (20+ reference docs planned, 0 exist)
- `docs/working/04-explanation/` (10+ explanation docs planned, 0 exist)

#### Priority 3: Missing Security Documentation
- `docs/security/SECURITY_AUDIT.md`
- `docs/security/ADMIN_KEY_ROTATION.md`
- `docs/security/security-fix-sql-injection.md`

---

## 2. Link Relationship Matrix

### 2.1 Inbound Link Analysis

**Top Referenced Files** (files that others link to):
```
17 inbound ← README.md (project root)
15 inbound ← docs/README.md (missing - critical)
 4 inbound ← docs/deployment/gcp-architecture.md
 3 inbound ← docs/deployment/GCP_DEPLOYMENT.md
 2 inbound ← docs/deployment/DEPLOYMENT.md
```

### 2.2 Outbound Link Analysis

**Most Linking Files**:
```
107 outbound → docs/working/ia-architecture-spec.md
 41 outbound → README.md
  6 outbound → docs/link-validation-report.md
  5 outbound → docs/deployment/DEPLOYMENT.md
  4 outbound → tests/semantic/TEST_COVERAGE.md
```

### 2.3 Link Patterns Identified

#### Pattern A: Feature Documentation Links
**Current**: `[← Back to Main README](../README.md)`
**Status**: Broken (15 occurrences)
**Target**: Missing `docs/README.md` hub

#### Pattern B: Architecture Documentation Links
**Current**: `[← Back to Main README](../../README.md)`
**Status**: Valid (points to project root)
**Target**: Existing `README.md`

#### Pattern C: Deployment Cross-References
**Current**: `[GCP Architecture](./gcp-architecture.md)`
**Status**: Valid (internal deployment links work)
**Target**: Existing files

---

## 3. Bidirectional Link Generation Strategy

### 3.1 Link Types

#### 3.1.1 Structural Navigation Links
**Purpose**: Enable hierarchical traversal
**Implementation**: Breadcrumb navigation in header

```markdown
[Home](../../README.md) → [Docs](../README.md) → [Features](./README.md) → Current Doc
```

**Required in**:
- All feature documentation (19 files)
- All architecture documentation (9 files)
- All deployment documentation (4 files)
- All tutorial/how-to/reference/explanation docs (planned)

#### 3.1.2 Related Content Links
**Purpose**: Enable lateral navigation between related topics
**Implementation**: "See Also" sections at document end

```markdown
## Related Documentation

### Same Topic
- [Implementation Guide](./implementation.md) - Detailed implementation
- [Quick Reference](./quick-reference.md) - Quick lookup guide

### Related Features
- [Threading System](./threading-implementation.md) - Message threading
- [Notifications](./notification-system-phase1.md) - Reply notifications

### Architecture References
- [NIP-29 Specification](../architecture/01-specification.md#nip-29) - Protocol spec
```

**Required in**: All documentation files (58 files)

#### 3.1.3 Prerequisite Links
**Purpose**: Surface dependencies and learning paths
**Implementation**: "Prerequisites" section at document start

```markdown
## Prerequisites

Before reading this document, you should understand:
- [Nostr Fundamentals](../explanation/nostr-protocol/nostr-fundamentals.md)
- [Basic Setup](../tutorials/01-setup-local-development.md)
- [Authentication](../how-to-guides/authentication/login-flow.md)
```

**Required in**: Advanced tutorials, implementation guides, architecture docs

#### 3.1.4 Reverse Links (Backlinks)
**Purpose**: Show what documents reference current page
**Implementation**: Automated backlink generation at build time

```markdown
## Referenced By

This document is referenced by:
- [Semantic Search Implementation](../features/search-implementation.md)
- [Search Usage Guide](../features/search-usage-guide.md)
- [Architecture Overview](../architecture/02-architecture.md)
```

**Required in**: All documentation files (generated automatically)

### 3.2 Similarity Algorithms for Related Documents

#### 3.2.1 Content-Based Similarity
**Algorithm**: TF-IDF with cosine similarity
**Threshold**: ≥ 0.3 similarity score

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def find_similar_documents(current_doc, all_docs, threshold=0.3):
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform([current_doc] + all_docs)
    similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    return [(doc, score) for doc, score in zip(all_docs, similarity_scores) if score >= threshold]
```

**Use case**: Auto-generate "Related Documentation" sections

#### 3.2.2 Directory Proximity Scoring
**Algorithm**: Path distance with category weighting

```python
def directory_proximity_score(doc1_path, doc2_path):
    path1_parts = Path(doc1_path).parts
    path2_parts = Path(doc2_path).parts

    # Same directory = high relevance
    if path1_parts[:-1] == path2_parts[:-1]:
        return 1.0

    # Same parent category = medium relevance
    if len(path1_parts) >= 2 and len(path2_parts) >= 2:
        if path1_parts[-2] == path2_parts[-2]:
            return 0.7

    # Same top-level section = low relevance
    if path1_parts[0] == path2_parts[0]:
        return 0.4

    return 0.1
```

**Use case**: Prioritize local navigation links

#### 3.2.3 Link Graph Centrality
**Algorithm**: PageRank-style importance scoring

```python
import networkx as nx

def calculate_link_centrality(link_graph):
    G = nx.DiGraph()
    for source, targets in link_graph.items():
        for target in targets:
            G.add_edge(source, target)

    pagerank = nx.pagerank(G)
    return sorted(pagerank.items(), key=lambda x: x[1], reverse=True)
```

**Use case**: Identify hub documents that should be prominently linked

#### 3.2.4 Topic Modeling (Advanced)
**Algorithm**: Latent Dirichlet Allocation (LDA)
**Implementation**: Group documents by detected topics

```python
from sklearn.decomposition import LatentDirichletAllocation

def extract_topics(documents, n_topics=10):
    vectorizer = TfidfVectorizer(max_df=0.95, min_df=2, stop_words='english')
    tfidf = vectorizer.fit_transform(documents)
    lda = LatentDirichletAllocation(n_components=n_topics, random_state=42)
    lda.fit(tfidf)
    return lda, vectorizer

def get_similar_by_topic(doc_text, lda_model, vectorizer, all_docs):
    doc_vector = vectorizer.transform([doc_text])
    doc_topics = lda_model.transform(doc_vector)[0]

    all_vectors = vectorizer.transform(all_docs)
    all_topics = lda_model.transform(all_vectors)

    topic_similarity = cosine_similarity([doc_topics], all_topics).flatten()
    return sorted(zip(all_docs, topic_similarity), key=lambda x: x[1], reverse=True)
```

**Use case**: Cross-category topic-based navigation

---

## 4. Validation Rules

### 4.1 Link Validity Checks

#### Rule 1: Internal Link Existence
```yaml
rule: internal-link-exists
severity: error
description: All internal markdown links must point to existing files
check: |
  for link in markdown_links:
    if link.is_internal and not link.target_exists():
      raise ValidationError(f"Broken link: {link.target}")
```

#### Rule 2: No Circular References
```yaml
rule: no-circular-links
severity: warning
description: Detect and report circular link chains
check: |
  def detect_cycles(graph):
    visited = set()
    stack = set()

    def dfs(node):
      visited.add(node)
      stack.add(node)
      for neighbour in graph[node]:
        if neighbour not in visited:
          if dfs(neighbour):
            return True
        elif neighbour in stack:
          return True  # Cycle detected
      stack.remove(node)
      return False

    for node in graph:
      if node not in visited:
        if dfs(node):
          raise ValidationWarning(f"Circular reference detected at {node}")
```

#### Rule 3: Orphan Detection
```yaml
rule: no-orphaned-docs
severity: warning
description: All documentation files must have at least one inbound link
check: |
  for doc in all_docs:
    if not has_inbound_links(doc) and doc not in ['README.md', 'index.md']:
      raise ValidationWarning(f"Orphaned document: {doc}")
```

#### Rule 4: Link Text Quality
```yaml
rule: descriptive-link-text
severity: warning
description: Link text must be descriptive, not generic
forbidden_texts:
  - "click here"
  - "here"
  - "this"
  - "link"
check: |
  for link in markdown_links:
    if link.text.lower() in forbidden_texts:
      raise ValidationWarning(f"Non-descriptive link text: '{link.text}' in {link.source}")
```

#### Rule 5: External Link Health
```yaml
rule: external-link-alive
severity: warning
description: External links should return 200 OK
check: |
  import requests
  for link in external_links:
    try:
      response = requests.head(link.url, timeout=5, allow_redirects=True)
      if response.status_code >= 400:
        raise ValidationWarning(f"Dead external link: {link.url} ({response.status_code})")
    except Exception as e:
      raise ValidationWarning(f"External link check failed: {link.url} - {e}")
```

### 4.2 Structural Validation Rules

#### Rule 6: Required Sections
```yaml
rule: required-sections
severity: error
description: Documentation files must contain required sections
required_sections:
  - "## Prerequisites" (for tutorials/how-to guides)
  - "## Related Documentation" (for all docs)
  - "## See Also" (for all docs)
check: |
  for doc in all_docs:
    sections = extract_sections(doc)
    missing = [s for s in required_sections if s not in sections]
    if missing:
      raise ValidationError(f"{doc} missing sections: {missing}")
```

#### Rule 7: Breadcrumb Navigation
```yaml
rule: breadcrumb-present
severity: warning
description: All non-root docs should have breadcrumb navigation
check: |
  breadcrumb_pattern = r'\[.*?\]\([^)]+\)\s*[→>]\s*\[.*?\]\([^)]+\)'
  for doc in all_docs:
    if doc not in root_docs and not re.search(breadcrumb_pattern, doc.content):
      raise ValidationWarning(f"Missing breadcrumb navigation: {doc}")
```

#### Rule 8: Bidirectional Link Symmetry
```yaml
rule: bidirectional-symmetry
severity: info
description: If A links to B, B should link back to A (or reference A in "Referenced By")
check: |
  for source, targets in link_graph.items():
    for target in targets:
      if source not in reverse_graph[target]:
        log_info(f"Unidirectional link: {source} → {target} (no backlink)")
```

### 4.3 Content Quality Rules

#### Rule 9: Anchor Link Validity
```yaml
rule: anchor-links-valid
severity: error
description: Anchor links must point to existing headings
check: |
  for link in markdown_links:
    if link.has_anchor:
      target_headings = extract_headings(link.target_file)
      anchor_slug = link.anchor.lower().replace(' ', '-')
      if anchor_slug not in target_headings:
        raise ValidationError(f"Invalid anchor: {link.target}#{link.anchor}")
```

#### Rule 10: Link Density
```yaml
rule: appropriate-link-density
severity: info
description: Documents should have 3-10 internal links per 1000 words
check: |
  for doc in all_docs:
    word_count = count_words(doc)
    link_count = count_internal_links(doc)
    density = (link_count / word_count) * 1000

    if density < 3:
      log_info(f"Low link density in {doc}: {density:.1f} links/1000 words")
    elif density > 10:
      log_info(f"High link density in {doc}: {density:.1f} links/1000 words")
```

---

## 5. CI/CD Integration

### 5.1 GitHub Actions Workflow

```yaml
name: Documentation Link Validation

on:
  pull_request:
    paths:
      - 'docs/**/*.md'
      - 'README.md'
  push:
    branches: [main]

jobs:
  validate-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r docs/requirements.txt
          # markdown-link-check, broken-link-checker, etc.

      - name: Run link validation
        run: |
          python scripts/validate_links.py --strict

      - name: Check for orphaned files
        run: |
          python scripts/check_orphans.py

      - name: Generate link report
        run: |
          python scripts/generate_link_report.py > link-report.md

      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: link-validation-report
          path: link-report.md

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('link-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Link Validation Report\n\n${report}`
            });
```

### 5.2 Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running documentation link validation..."

# Find all staged markdown files
STAGED_MD=$(git diff --cached --name-only --diff-filter=ACM | grep '\.md$')

if [ -z "$STAGED_MD" ]; then
  exit 0
fi

# Run validation on staged files
python scripts/validate_links.py $STAGED_MD

if [ $? -ne 0 ]; then
  echo "❌ Link validation failed. Fix broken links before committing."
  exit 1
fi

echo "✅ Link validation passed"
exit 0
```

---

## 6. Cross-Reference System Design

### 6.1 Automated Backlink Generation

#### Build-time Script
```python
#!/usr/bin/env python3
"""Generate backlinks for all documentation files."""

import os
import re
from pathlib import Path
from collections import defaultdict

def extract_links(filepath):
    """Extract all internal markdown links from a file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    links = re.findall(r'\[([^\]]+)\]\(([^\)]+)\)', content)
    internal_links = []

    for text, target in links:
        if not target.startswith('http://') and not target.startswith('https://'):
            # Resolve relative path
            target_path = os.path.normpath(os.path.join(os.path.dirname(filepath), target.split('#')[0]))
            if target_path.endswith('.md'):
                internal_links.append((text, target_path))

    return internal_links

def build_backlink_graph(docs_dir):
    """Build reverse link graph (target -> sources)."""
    backlinks = defaultdict(list)

    for root, dirs, files in os.walk(docs_dir):
        for file in files:
            if file.endswith('.md'):
                filepath = os.path.join(root, file)
                links = extract_links(filepath)

                for text, target in links:
                    if os.path.exists(target):
                        backlinks[target].append((filepath, text))

    return backlinks

def inject_backlinks(filepath, backlinks):
    """Inject backlink section into a markdown file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove existing backlink section
    content = re.sub(r'<!-- AUTO-GENERATED BACKLINKS -->.+?<!-- END AUTO-GENERATED BACKLINKS -->', '', content, flags=re.DOTALL)

    if filepath in backlinks and backlinks[filepath]:
        backlink_section = "\n\n<!-- AUTO-GENERATED BACKLINKS -->\n## Referenced By\n\n"
        backlink_section += "This document is referenced by:\n"

        for source, link_text in sorted(backlinks[filepath]):
            rel_path = os.path.relpath(source, os.path.dirname(filepath))
            backlink_section += f"- [{os.path.basename(source)}]({rel_path}) - \"{link_text}\"\n"

        backlink_section += "\n<!-- END AUTO-GENERATED BACKLINKS -->\n"

        # Append before final line
        content = content.rstrip() + backlink_section

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    docs_dir = 'docs'
    backlinks = build_backlink_graph(docs_dir)

    # Inject backlinks into all docs
    for root, dirs, files in os.walk(docs_dir):
        for file in files:
            if file.endswith('.md'):
                filepath = os.path.join(root, file)
                inject_backlinks(filepath, backlinks)

    print(f"✅ Generated backlinks for {len(backlinks)} documents")
```

### 6.2 Related Documents Recommendation

```python
#!/usr/bin/env python3
"""Generate related documents section using similarity algorithms."""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
import re

def extract_text(filepath):
    """Extract text content from markdown."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove code blocks
    content = re.sub(r'```.*?```', '', content, flags=re.DOTALL)
    # Remove frontmatter
    content = re.sub(r'^---.*?---', '', content, flags=re.DOTALL)
    # Remove links
    content = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', content)

    return content

def find_related_docs(current_file, all_files, top_n=5):
    """Find top N related documents using TF-IDF similarity."""
    current_text = extract_text(current_file)
    all_texts = [extract_text(f) for f in all_files if f != current_file]

    vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
    tfidf_matrix = vectorizer.fit_transform([current_text] + all_texts)

    similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    # Combine with directory proximity bonus
    scored_docs = []
    for i, (score, doc) in enumerate(zip(similarity_scores, [f for f in all_files if f != current_file])):
        proximity_bonus = directory_proximity_score(current_file, doc)
        final_score = score * 0.7 + proximity_bonus * 0.3
        scored_docs.append((doc, final_score))

    return sorted(scored_docs, key=lambda x: x[1], reverse=True)[:top_n]

def directory_proximity_score(doc1, doc2):
    """Calculate proximity score based on directory structure."""
    parts1 = Path(doc1).parts
    parts2 = Path(doc2).parts

    if parts1[:-1] == parts2[:-1]:  # Same directory
        return 1.0
    elif len(parts1) >= 2 and len(parts2) >= 2 and parts1[-2] == parts2[-2]:  # Same parent
        return 0.7
    elif parts1[0] == parts2[0]:  # Same top-level
        return 0.4
    return 0.1

def inject_related_docs(filepath, related_docs):
    """Inject 'Related Documentation' section."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove existing section
    content = re.sub(r'<!-- AUTO-GENERATED RELATED DOCS -->.+?<!-- END AUTO-GENERATED RELATED DOCS -->', '', content, flags=re.DOTALL)

    if related_docs:
        related_section = "\n\n<!-- AUTO-GENERATED RELATED DOCS -->\n## Related Documentation\n\n"

        for doc, score in related_docs:
            rel_path = os.path.relpath(doc, os.path.dirname(filepath))
            title = os.path.basename(doc).replace('-', ' ').replace('.md', '').title()
            related_section += f"- [{title}]({rel_path}) (similarity: {score:.2f})\n"

        related_section += "\n<!-- END AUTO-GENERATED RELATED DOCS -->\n"

        content = content.rstrip() + related_section

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Priority**: Critical infrastructure

1. ✅ Create missing hub documents
   - [ ] `docs/README.md` (feature directory index)
   - [ ] `docs/architecture/README.md` (SPARC workflow guide)
   - [ ] `docs/deployment/README.md` (deployment options)
   - [ ] `docs/features/README.md` (feature list)

2. ✅ Fix broken links
   - [ ] Update all `../README.md` references to point to correct hub
   - [ ] Create `docs/deployment/MIGRATION.md` or remove broken reference
   - [ ] Fix security document links in root README.md

3. ✅ Implement validation script
   - [ ] `scripts/validate_links.py` (check all internal links)
   - [ ] `scripts/check_orphans.py` (detect files with no inbound links)
   - [ ] Add to CI/CD pipeline

### Phase 2: Bidirectional Links (Week 2)
**Priority**: Navigation enhancement

4. ✅ Add breadcrumb navigation
   - [ ] Template: `[Home](../../README.md) → [Docs](../README.md) → [Category](./README.md) → Current`
   - [ ] Apply to all 58 documentation files
   - [ ] Validate breadcrumb correctness

5. ✅ Generate backlinks
   - [ ] Implement `scripts/generate_backlinks.py`
   - [ ] Add "Referenced By" sections to all docs
   - [ ] Automate in build process

6. ✅ Add "See Also" sections
   - [ ] Manual curation for top 20 most-referenced docs
   - [ ] Automated suggestions using TF-IDF similarity
   - [ ] Review and approve automated suggestions

### Phase 3: Related Content (Week 3)
**Priority**: Discoverability

7. ✅ Implement similarity algorithms
   - [ ] TF-IDF content similarity
   - [ ] Directory proximity scoring
   - [ ] PageRank centrality scoring
   - [ ] Combine scores for final recommendations

8. ✅ Auto-generate related docs
   - [ ] `scripts/generate_related_docs.py`
   - [ ] Add "Related Documentation" sections
   - [ ] Manual review of recommendations

9. ✅ Add prerequisite links
   - [ ] Identify learning dependencies
   - [ ] Add "Prerequisites" sections to tutorials/guides
   - [ ] Validate prerequisite chains

### Phase 4: Advanced Features (Week 4)
**Priority**: Optimization

10. ✅ External link health monitoring
    - [ ] Implement periodic external link checker
    - [ ] Add to nightly CI/CD job
    - [ ] Create report for broken external links

11. ✅ Link analytics
    - [ ] Track most-clicked documentation links
    - [ ] Identify navigation patterns
    - [ ] Optimize based on usage data

12. ✅ Interactive documentation graph
    - [ ] Visualize link relationships
    - [ ] Interactive navigation map
    - [ ] Integration with documentation site

---

## 8. Metrics and Success Criteria

### 8.1 Quantitative Metrics

| Metric | Current | Target | Success Threshold |
|--------|---------|--------|-------------------|
| Orphaned files | 58 (100%) | 0 (0%) | < 5 (8.6%) |
| Isolated files | 27 (46.6%) | 0 (0%) | < 10 (17.2%) |
| Broken internal links | 135 (69.2%) | 0 (0%) | < 3 (1.5%) |
| Bidirectionally connected | 0 (0%) | 40 (69%) | > 30 (51.7%) |
| Avg links per doc | 3.4 | 8.0 | > 5.0 |
| Avg inbound links | 0 | 3.5 | > 2.0 |

### 8.2 Qualitative Metrics

#### User Experience
- [ ] Users can navigate from any doc to related docs without returning to root
- [ ] All feature docs have clear "next steps" navigation
- [ ] Tutorials have clear prerequisite indicators
- [ ] Reference docs are discoverable from implementation guides

#### Maintainability
- [ ] Broken links detected in CI/CD before merge
- [ ] New docs automatically integrated into link graph
- [ ] Backlinks update automatically when references change
- [ ] Documentation structure changes trigger link validation

#### Discoverability
- [ ] Related documents surface relevant content
- [ ] Search results include link context
- [ ] Hub pages effectively categorize content
- [ ] Topic-based navigation enables cross-category exploration

---

## 9. Tools and Scripts

### 9.1 Required Scripts

#### `/scripts/validate_links.py`
```python
#!/usr/bin/env python3
"""Validate all internal markdown links."""
import sys
from pathlib import Path
from link_validator import LinkValidator

def main():
    validator = LinkValidator('.')
    broken_links = validator.check_all_links()

    if broken_links:
        print(f"❌ Found {len(broken_links)} broken links:")
        for source, target in broken_links:
            print(f"  {source} → {target}")
        sys.exit(1)
    else:
        print("✅ All links valid")
        sys.exit(0)

if __name__ == '__main__':
    main()
```

#### `/scripts/check_orphans.py`
```python
#!/usr/bin/env python3
"""Detect orphaned documentation files."""
import sys
from pathlib import Path
from link_graph import LinkGraph

def main():
    graph = LinkGraph('.')
    orphans = graph.find_orphaned_files()

    if orphans:
        print(f"⚠️  Found {len(orphans)} orphaned files:")
        for filepath in orphans:
            print(f"  {filepath}")
        sys.exit(1)
    else:
        print("✅ No orphaned files")
        sys.exit(0)

if __name__ == '__main__':
    main()
```

#### `/scripts/generate_backlinks.py`
```python
#!/usr/bin/env python3
"""Generate 'Referenced By' sections for all docs."""
from link_graph import LinkGraph
from backlink_injector import BacklinkInjector

def main():
    graph = LinkGraph('.')
    injector = BacklinkInjector(graph)
    injector.inject_all_backlinks()
    print("✅ Backlinks generated for all documents")

if __name__ == '__main__':
    main()
```

#### `/scripts/generate_related_docs.py`
```python
#!/usr/bin/env python3
"""Generate 'Related Documentation' sections."""
from similarity_engine import SimilarityEngine
from related_docs_injector import RelatedDocsInjector

def main():
    engine = SimilarityEngine('.')
    injector = RelatedDocsInjector(engine)
    injector.inject_all_related_docs()
    print("✅ Related documentation sections generated")

if __name__ == '__main__':
    main()
```

### 9.2 Configuration File

#### `/docs/link-config.yaml`
```yaml
# Link Infrastructure Configuration

validation:
  internal_links:
    enabled: true
    severity: error

  external_links:
    enabled: true
    severity: warning
    timeout: 5

  orphan_detection:
    enabled: true
    severity: warning
    exclude:
      - README.md
      - index.md

  circular_references:
    enabled: true
    severity: warning
    max_depth: 10

related_docs:
  similarity_threshold: 0.3
  max_suggestions: 5
  algorithms:
    - name: tfidf
      weight: 0.4
    - name: directory_proximity
      weight: 0.3
    - name: pagerank
      weight: 0.2
    - name: manual
      weight: 0.1

backlinks:
  auto_generate: true
  marker_start: "<!-- AUTO-GENERATED BACKLINKS -->"
  marker_end: "<!-- END AUTO-GENERATED BACKLINKS -->"

breadcrumbs:
  enabled: true
  separator: "→"
  format: "[{title}]({path})"

ci_cd:
  github_actions:
    enabled: true
    workflow: .github/workflows/link-validation.yml
  pre_commit_hook:
    enabled: true
    hook: .git/hooks/pre-commit
```

---

## 10. Migration Plan

### 10.1 Backwards Compatibility

#### Preserve Existing Links
All current valid links must continue working:
- Root README.md links to docs
- Architecture docs linking to project README
- Deployment cross-references

#### Gradual Migration Strategy
1. Add new infrastructure without removing old links
2. Run both systems in parallel for 1 week
3. Validate that all navigation paths still work
4. Deprecate old patterns with warnings
5. Remove old patterns after validation

### 10.2 Content Migration

#### Existing Documents (58 files)
- [x] Audit current state (completed)
- [ ] Add breadcrumbs to all docs
- [ ] Generate backlinks for all docs
- [ ] Add related docs sections
- [ ] Manual review and cleanup

#### Missing Hub Documents (15+ files)
- [ ] Create `docs/README.md` with feature index
- [ ] Create category README files
- [ ] Link new hubs to existing docs
- [ ] Update navigation from features to hubs

#### Planned Documentation (100+ files)
- [ ] Define Diataxis structure (tutorials/how-to/reference/explanation)
- [ ] Create document templates with link infrastructure
- [ ] Implement auto-linking for new documents

---

## 11. Appendix

### 11.1 Link Pattern Reference

#### Pattern: Feature Documentation
```markdown
---
# Breadcrumb navigation
[Home](../../README.md) → [Documentation](../README.md) → [Features](./README.md) → Current Page

# Document content
...

## Prerequisites
- [Nostr Fundamentals](../explanation/nostr-fundamentals.md)
- [Setup Guide](../tutorials/setup-local-development.md)

## Related Documentation

### Implementation
- [Implementation Details](./implementation-details.md)
- [Quick Reference](./quick-reference.md)

### Architecture
- [Architecture Spec](../architecture/01-specification.md)

## See Also
- [Related Feature](./related-feature.md)
- [API Reference](../reference/api/feature-api.md)

<!-- AUTO-GENERATED BACKLINKS -->
## Referenced By
This document is referenced by:
- [Search Implementation](./search-implementation.md) - "Feature Overview"
- [API Documentation](../reference/api.md) - "Feature Support"
<!-- END AUTO-GENERATED BACKLINKS -->

<!-- AUTO-GENERATED RELATED DOCS -->
## Related Documentation
- [Similar Feature A](./similar-feature-a.md) (similarity: 0.85)
- [Similar Feature B](./similar-feature-b.md) (similarity: 0.72)
<!-- END AUTO-GENERATED RELATED DOCS -->
```

### 11.2 Glossary

**Orphaned Document**: A file with zero inbound links (unreachable through navigation)

**Isolated Document**: A file with zero outbound links (dead-end navigation)

**Bidirectional Link**: A pair of documents that reference each other (A → B and B → A)

**Backlink**: An automatically generated reverse reference showing what documents link to the current page

**Breadcrumb Navigation**: Hierarchical path showing document location in site structure

**Link Density**: Number of internal links per 1000 words of content

**Hub Document**: A high-centrality document that many other documents link to (e.g., README.md, index pages)

**Similarity Score**: Computed metric (0-1) indicating content relatedness between documents

**Link Graph**: Directed graph representation of all documentation links (nodes = docs, edges = links)

### 11.3 References

- [Diataxis Documentation Framework](https://diataxis.fr/)
- [TF-IDF Algorithm](https://en.wikipedia.org/wiki/Tf%E2%80%93idf)
- [PageRank Algorithm](https://en.wikipedia.org/wiki/PageRank)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Markdown Link Specification](https://spec.commonmark.org/0.30/#links)

---

**Document Status**: Draft
**Next Review**: 2025-12-27
**Assigned To**: Documentation Infrastructure Team
**Approval Required**: Technical Lead, Documentation Lead
