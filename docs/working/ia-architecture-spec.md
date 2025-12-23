---
title: Information Architecture Specification
description: Information architecture specification defining documentation structure and taxonomy
category: explanation
tags: [architecture, documentation, information-architecture]
last_updated: 2025-12-23
---

# Information Architecture Specification
**Project:** Nostr-BBS Documentation
**Version:** 1.0
**Date:** 2025-12-20
**Author:** IA Architect Agent

## Executive Summary

Based on comprehensive corpus analysis (December 2025) revealing 51 documentation files totaling 112,831 words, this specification proposes a unified 7-section information architecture following the Diataxis framework. The current structure achieves an **80.5% quality score** with excellent content uniqueness but critical tutorial gaps.

**Key Metrics (Updated 2025-12-23):**
- Total documentation files: 51 markdown files
- Total word count: 112,831 words (average 2,212 words/doc)
- Category distribution: 52.9% reference, 15.7% uncategorized, 13.7% howto, 9.8% explanation, **2% tutorial (CRITICAL GAP)**
- Orphaned files: 0 (excellent coverage via INDEX.md)
- Duplicate content: 0 groups detected
- Link health: 19 documents with zero internal links need improvement
- Largest files: link-validation-report.md (10,240 words), 09-semantic-search-risks.md (8,793 words)
- Tag coverage: 47 unique tags, 84.3% of documents tagged
- Quality score: **80.5/100** (B+ grade)

## 1. Proposed Directory Structure (Diataxis Framework)

### 1.1 Four Quadrants of Diataxis

```
docs/
├── 00-index/                           # Navigation hub
│   ├── INDEX.md                        # Master table of contents
│   ├── GETTING_STARTED.md              # Quick start guide
│   ├── GLOSSARY.md                     # Terms and definitions
│   └── ROADMAP.md                      # Project roadmap
│
├── 01-tutorials/                       # Learning-oriented (hands-on)
│   ├── 01-setup-local-development.md
│   ├── 02-first-channel-message.md
│   ├── 03-send-encrypted-dm.md
│   ├── 04-create-calendar-event.md
│   ├── 05-install-as-pwa.md
│   └── 06-semantic-search-basics.md
│
├── 02-how-to-guides/                   # Task-oriented (problem-solving)
│   ├── deployment/
│   │   ├── deploy-github-pages.md
│   │   ├── deploy-cloud-run.md
│   │   ├── setup-gcp-account.md
│   │   └── configure-secrets.md
│   ├── administration/
│   │   ├── manage-users.md
│   │   ├── create-channels.md
│   │   ├── moderate-content.md
│   │   └── rotate-admin-keys.md
│   ├── development/
│   │   ├── add-new-nip.md
│   │   ├── extend-search.md
│   │   └── customize-ui.md
│   └── troubleshooting/
│       ├── common-errors.md
│       ├── relay-connection-issues.md
│       └── pwa-installation-problems.md
│
├── 03-reference/                       # Information-oriented (lookup)
│   ├── api/
│   │   ├── cloud-run-endpoints.md
│   │   ├── embedding-service.md
│   │   └── relay-websocket.md
│   ├── components/
│   │   ├── auth-components.md
│   │   ├── chat-components.md
│   │   ├── dm-components.md
│   │   ├── events-components.md
│   │   └── ui-components.md
│   ├── stores/
│   │   ├── auth-store.md
│   │   ├── channels-store.md
│   │   ├── messages-store.md
│   │   ├── dm-store.md
│   │   └── pwa-store.md
│   ├── nips/
│   │   ├── nip-01-basic.md
│   │   ├── nip-17-private-dm.md
│   │   ├── nip-28-channels.md
│   │   ├── nip-44-encryption.md
│   │   └── nip-52-calendar.md
│   ├── configuration/
│   │   ├── environment-variables.md
│   │   ├── github-actions.md
│   │   └── gcp-settings.md
│   └── cli-commands.md
│
├── 04-explanation/                     # Understanding-oriented (concepts)
│   ├── architecture/
│   │   ├── system-overview.md
│   │   ├── deployment-architecture.md
│   │   ├── data-flow.md
│   │   └── free-tier-design.md
│   ├── features/
│   │   ├── semantic-search-deep-dive.md
│   │   ├── encryption-model.md
│   │   ├── cohort-access-control.md
│   │   └── offline-pwa-strategy.md
│   ├── nostr-protocol/
│   │   ├── nostr-fundamentals.md
│   │   ├── event-kinds.md
│   │   └── relay-communication.md
│   └── design-decisions/
│       ├── why-serverless.md
│       ├── why-sveltekit.md
│       └── why-hnsw-search.md
│
├── 05-sparc/                           # SPARC methodology docs
│   ├── 01-specification.md
│   ├── 02-architecture.md
│   ├── 03-pseudocode.md
│   ├── 04-refinement.md
│   ├── 05-completion.md
│   └── semantic-search/
│       ├── 06-spec.md
│       ├── 07-architecture.md
│       ├── 08-pseudocode.md
│       └── 09-risks.md
│
├── 06-security/                        # Security documentation
│   ├── security-overview.md
│   ├── threat-model.md
│   ├── audit-reports/
│   │   ├── 2024-q4-audit.md
│   │   └── sql-injection-fix.md
│   ├── key-management.md
│   └── admin-key-rotation.md
│
├── 07-testing/                         # Testing documentation
│   ├── testing-strategy.md
│   ├── unit-testing.md
│   ├── e2e-testing.md
│   ├── performance-testing.md
│   ├── test-coverage-reports/
│   │   ├── api-contract-validation.md
│   │   ├── semantic-test-coverage.md
│   │   └── code-quality-report.md
│   └── quickstart-e2e.md
│
├── 08-maintenance/                     # Operational docs
│   ├── CHANGELOG.md
│   ├── migration-guides/
│   │   ├── v1-to-v2.md
│   │   └── gcp-migration.md
│   ├── monitoring/
│   │   ├── metrics.md
│   │   └── alerts.md
│   └── backup-restore.md
│
└── assets/                             # Shared assets
    ├── diagrams/
    │   ├── system-architecture.mmd
    │   ├── data-flow.mmd
    │   └── user-flows.mmd
    ├── screenshots/
    │   ├── homepage.png
    │   ├── messages.png
    │   └── [existing screenshots]
    └── templates/
        ├── feature-doc-template.md
        └── adr-template.md
```

## 2. File Placement Mapping (43 Existing Files)

### 2.1 Current `/docs` Structure Analysis

| Current Location | New Location | Rationale |
|------------------|--------------|-----------|
| **Architecture (9 files)** | | |
| `architecture/01-specification.md` | `05-sparc/01-specification.md` | SPARC methodology docs |
| `architecture/02-architecture.md` | `05-sparc/02-architecture.md` | SPARC methodology docs |
| `architecture/03-pseudocode.md` | `05-sparc/03-pseudocode.md` | SPARC methodology docs |
| `architecture/04-refinement.md` | `05-sparc/04-refinement.md` | SPARC methodology docs |
| `architecture/05-completion.md` | `05-sparc/05-completion.md` | SPARC methodology docs |
| `architecture/06-semantic-search-spec.md` | `05-sparc/semantic-search/06-spec.md` | SPARC semantic search |
| `architecture/07-semantic-search-architecture.md` | `05-sparc/semantic-search/07-architecture.md` | SPARC semantic search |
| `architecture/08-semantic-search-pseudocode.md` | `05-sparc/semantic-search/08-pseudocode.md` | SPARC semantic search |
| `architecture/09-semantic-search-risks.md` | `05-sparc/semantic-search/09-risks.md` | SPARC semantic search |
| **Deployment (5 files)** | | |
| `deployment/DEPLOYMENT.md` | `02-how-to-guides/deployment/deploy-overview.md` | How-to guide |
| `deployment/GCP_DEPLOYMENT.md` | `02-how-to-guides/deployment/deploy-cloud-run.md` | How-to guide |
| `deployment/gcp-architecture.md` | `04-explanation/architecture/gcp-architecture.md` | Conceptual explanation |
| `deployment/github-workflows.md` | `03-reference/configuration/github-workflows.md` | Reference |
| `deployment/DEPLOYMENT_CHECKLIST.yaml` | `02-how-to-guides/deployment/checklist.yaml` | How-to artifact |
| **Features (20 files)** | | |
| `features/accessibility-improvements.md` | `04-explanation/features/accessibility.md` | Conceptual |
| `features/channel-stats-usage.md` | `02-how-to-guides/analytics/channel-stats.md` | How-to guide |
| `features/dm-implementation.md` | `03-reference/components/dm-implementation.md` | Reference |
| `features/drafts-implementation.md` | `03-reference/components/drafts-implementation.md` | Reference |
| `features/export-implementation.md` | `03-reference/components/export-implementation.md` | Reference |
| `features/icon-integration-guide.md` | `02-how-to-guides/development/integrate-icons.md` | How-to guide |
| `features/link-preview-implementation.md` | `03-reference/components/link-preview-implementation.md` | Reference |
| `features/mute-implementation-summary.md` | `03-reference/components/mute-implementation.md` | Reference |
| `features/mute-quick-reference.md` | `03-reference/components/mute-reference.md` | Reference |
| `features/nip-25-reactions-implementation.md` | `03-reference/nips/nip-25-reactions.md` | Reference |
| `features/notification-system-phase1.md` | `03-reference/components/notifications.md` | Reference |
| `features/pinned-messages-implementation.md` | `03-reference/components/pinned-messages.md` | Reference |
| `features/pwa-implementation.md` | `04-explanation/features/pwa-architecture.md` | Conceptual |
| `features/pwa-quick-start.md` | `01-tutorials/05-install-as-pwa.md` | Tutorial |
| `features/search-implementation-summary.md` | `03-reference/components/search-implementation.md` | Reference |
| `features/search-implementation.md` | `04-explanation/features/search-deep-dive.md` | Conceptual |
| `features/search-usage-guide.md` | `01-tutorials/06-semantic-search-basics.md` | Tutorial |
| `features/threading-implementation.md` | `03-reference/components/threading-implementation.md` | Reference |
| `features/threading-quick-reference.md` | `03-reference/components/threading-reference.md` | Reference |
| **Reports (2 files)** | | |
| `diagram-audit-report.md` | `08-maintenance/reports/diagram-audit-2024-12.md` | Maintenance |
| `link-validation-report.md` | `08-maintenance/reports/link-validation-2024-12.md` | Maintenance |
| **Screenshots (10 files)** | | |
| `screenshots/*.png` | `assets/screenshots/*.png` | Shared assets |

### 2.2 Scattered Files Outside `/docs` (14 files)

| Current Location | New Location | Rationale |
|------------------|--------------|-----------|
| `.github/workflows/GCP_MIGRATION_SUMMARY.md` | `08-maintenance/migration-guides/gcp-migration-2024.md` | Migration guide |
| `.github/workflows/SECRETS_SETUP.md` | `02-how-to-guides/deployment/setup-github-secrets.md` | How-to guide |
| `services/embedding-api/README.md` | `03-reference/api/embedding-service.md` | API reference |
| `services/nostr-relay/README.md` | `03-reference/api/relay-setup.md` | API reference |
| `services/nostr-relay/docs/CLOUD_RUN_DEPLOYMENT.md` | `02-how-to-guides/deployment/relay-cloud-run.md` | How-to guide |
| `services/nostr-relay/docs/MIGRATION_SUMMARY.md` | `08-maintenance/migration-guides/relay-migration.md` | Migration guide |
| `src/docs/toast-*.md` (5 files) | `03-reference/components/toast-system/` | Component reference |
| `src/lib/components/auth/README.md` | `03-reference/components/auth-components.md` | Component reference |
| `src/lib/nostr/README.md` | `03-reference/api/nostr-client.md` | API reference |
| `tests/TEST_SUMMARY.md` | `07-testing/test-summary-2024-12.md` | Testing docs |
| `tests/api-contract-validation-report.md` | `07-testing/test-coverage-reports/api-contract-validation.md` | Test report |
| `tests/e2e/QUICKSTART.md` | `07-testing/quickstart-e2e.md` | Testing how-to |
| `tests/e2e/E2E_TEST_SUMMARY.md` | `07-testing/e2e-summary-2024-12.md` | Test report |
| `tests/e2e/README.md` | `07-testing/e2e-testing.md` | Testing guide |
| `tests/performance/PERFORMANCE_REPORT.md` | `07-testing/test-coverage-reports/performance-report.md` | Test report |
| `tests/semantic/TEST_COVERAGE.md` | `07-testing/test-coverage-reports/semantic-coverage.md` | Test report |
| `tests/semantic/code-quality-report.md` | `07-testing/test-coverage-reports/code-quality-report.md` | Test report |
| `tests/semantic/integration-validation.md` | `07-testing/test-coverage-reports/integration-validation.md` | Test report |

## 3. Files to Consolidate or Split

### 3.1 Files to Split

**HIGH PRIORITY:**

1. **`README.md` (1,290 lines)** → Split into:
   - Root `README.md` (300 lines max) - Project overview, quick start, links
   - `00-index/GETTING_STARTED.md` - Comprehensive getting started guide
   - `04-explanation/architecture/system-overview.md` - Architecture diagrams
   - `03-reference/nips/nip-overview.md` - NIP implementation table
   - `04-explanation/features/semantic-search-deep-dive.md` - Semantic search details
   - `01-tutorials/01-setup-local-development.md` - Local dev tutorial
   - `02-how-to-guides/deployment/deploy-overview.md` - Deployment overview

2. **`architecture/09-semantic-search-risks.md` (2,494 lines)** → Split into:
   - `05-sparc/semantic-search/09-risks.md` (keep core risks)
   - `04-explanation/features/semantic-search-integration.md` (integration concepts)
   - `02-how-to-guides/troubleshooting/semantic-search-issues.md` (troubleshooting)

3. **`architecture/07-semantic-search-architecture.md` (1,659 lines)** → Split into:
   - `05-sparc/semantic-search/07-architecture.md` (core architecture)
   - `03-reference/api/embedding-pipeline.md` (API reference)
   - `04-explanation/features/vector-indexing.md` (HNSW concepts)

4. **`architecture/08-semantic-search-pseudocode.md` (1,208 lines)** → Split into:
   - `05-sparc/semantic-search/08-pseudocode.md` (algorithmic pseudocode)
   - `02-how-to-guides/development/extend-search.md` (how to extend)

### 3.2 Files to Consolidate

**MEDIUM PRIORITY:**

1. **Mute/Block Feature (2 files):**
   - `features/mute-implementation-summary.md` + `features/mute-quick-reference.md`
   - → `03-reference/components/mute-system.md` (single reference doc)

2. **Threading Feature (2 files):**
   - `features/threading-implementation.md` + `features/threading-quick-reference.md`
   - → `03-reference/components/threading-system.md` (single reference doc)

3. **Search Feature (3 files):**
   - `features/search-implementation.md` + `features/search-implementation-summary.md` + `features/search-usage-guide.md`
   - → Split properly:
     - `03-reference/components/search-implementation.md` (implementation reference)
     - `01-tutorials/06-semantic-search-basics.md` (tutorial)

4. **PWA Feature (2 files):**
   - `features/pwa-implementation.md` + `features/pwa-quick-start.md`
   - → Split properly:
     - `04-explanation/features/pwa-architecture.md` (concepts)
     - `01-tutorials/05-install-as-pwa.md` (tutorial)

5. **Toast Component (5 files in `src/docs/`):**
   - Consolidate into `03-reference/components/toast-system/` with subpages:
     - `architecture.md`
     - `usage.md`
     - `migration-guide.md`

6. **Test Reports (8 files):**
   - Consolidate into `07-testing/test-coverage-reports/` with:
     - `current-coverage-dashboard.md` (single source of truth)
     - `historical/` subdirectory for dated reports

### 3.3 Files to Create (Missing Docs)

**CRITICAL GAPS:**

1. **`06-security/security-overview.md`** - Security model overview (currently missing)
2. **`06-security/threat-model.md`** - Threat modeling document (currently missing)
3. **`08-maintenance/CHANGELOG.md`** - Project changelog (currently missing)
4. **`00-index/INDEX.md`** - Master table of contents (currently missing)
5. **`00-index/GLOSSARY.md`** - Nostr/BBS terminology (currently missing)
6. **`03-reference/api/cloud-run-endpoints.md`** - API reference (API docs 10%)
7. **`03-reference/components/component-overview.md`** - Component architecture (Component docs 19%)
8. **`03-reference/stores/store-architecture.md`** - Store documentation (Store docs 11%)

## 4. Master INDEX.md Structure

```markdown
# Nostr-BBS Documentation Index

**Version:** 2.0
**Last Updated:** 2025-12-20
**Total Pages:** 72

## Quick Navigation

| I want to... | Go to... |
|--------------|----------|
| Get started quickly | [Getting Started Guide](00-index/GETTING_STARTED.md) |
| Learn step-by-step | [Tutorials](01-tutorials/) |
| Solve a specific problem | [How-To Guides](02-how-to-guides/) |
| Look up syntax/API | [Reference](03-reference/) |
| Understand concepts | [Explanation](04-explanation/) |
| Deploy to production | [Deployment Guides](02-how-to-guides/deployment/) |
| Understand security | [Security Docs](06-security/) |
| Run tests | [Testing Guides](07-testing/) |

## 📚 Documentation Quadrants (Diataxis)

### 1️⃣ Tutorials (Learning-Oriented)
**"Teach me to fish"** - Step-by-step lessons for beginners.

- [Setup Local Development](01-tutorials/01-setup-local-development.md)
- [Send Your First Channel Message](01-tutorials/02-first-channel-message.md)
- [Send Encrypted Direct Message](01-tutorials/03-send-encrypted-dm.md)
- [Create Calendar Event](01-tutorials/04-create-calendar-event.md)
- [Install as PWA](01-tutorials/05-install-as-pwa.md)
- [Semantic Search Basics](01-tutorials/06-semantic-search-basics.md)

### 2️⃣ How-To Guides (Task-Oriented)
**"Give me a fish"** - Practical recipes for common tasks.

#### Deployment
- [Deploy to GitHub Pages](02-how-to-guides/deployment/deploy-github-pages.md)
- [Deploy Cloud Run Service](02-how-to-guides/deployment/deploy-cloud-run.md)
- [Setup GCP Account](02-how-to-guides/deployment/setup-gcp-account.md)
- [Configure GitHub Secrets](02-how-to-guides/deployment/configure-secrets.md)
- [Deployment Checklist](02-how-to-guides/deployment/checklist.yaml)

#### Administration
- [Manage Users & Cohorts](02-how-to-guides/administration/manage-users.md)
- [Create Channels](02-how-to-guides/administration/create-channels.md)
- [Moderate Content](02-how-to-guides/administration/moderate-content.md)
- [Rotate Admin Keys](02-how-to-guides/administration/rotate-admin-keys.md)

#### Development
- [Add New NIP Support](02-how-to-guides/development/add-new-nip.md)
- [Extend Semantic Search](02-how-to-guides/development/extend-search.md)
- [Customize UI Components](02-how-to-guides/development/customize-ui.md)

#### Troubleshooting
- [Common Errors](02-how-to-guides/troubleshooting/common-errors.md)
- [Relay Connection Issues](02-how-to-guides/troubleshooting/relay-connection-issues.md)
- [PWA Installation Problems](02-how-to-guides/troubleshooting/pwa-installation-problems.md)

### 3️⃣ Reference (Information-Oriented)
**"Show me the facts"** - Technical documentation for lookup.

#### API Reference
- [Cloud Run Endpoints](03-reference/api/cloud-run-endpoints.md)
- [Embedding Service API](03-reference/api/embedding-service.md)
- [Relay WebSocket API](03-reference/api/relay-websocket.md)
- [Nostr Client API](03-reference/api/nostr-client.md)

#### Components
- [Auth Components](03-reference/components/auth-components.md)
- [Chat Components](03-reference/components/chat-components.md)
- [DM Components](03-reference/components/dm-components.md)
- [Events Components](03-reference/components/events-components.md)
- [UI Components](03-reference/components/ui-components.md)

#### Stores
- [Auth Store](03-reference/stores/auth-store.md)
- [Channels Store](03-reference/stores/channels-store.md)
- [Messages Store](03-reference/stores/messages-store.md)
- [DM Store](03-reference/stores/dm-store.md)
- [PWA Store](03-reference/stores/pwa-store.md)

#### NIPs
- [NIP-01: Basic Protocol](03-reference/nips/nip-01-basic.md)
- [NIP-17: Private DMs](03-reference/nips/nip-17-private-dm.md)
- [NIP-28: Public Channels](03-reference/nips/nip-28-channels.md)
- [NIP-44: Encryption](03-reference/nips/nip-44-encryption.md)
- [NIP-52: Calendar Events](03-reference/nips/nip-52-calendar.md)

#### Configuration
- [Environment Variables](03-reference/configuration/environment-variables.md)
- [GitHub Actions](03-reference/configuration/github-workflows.md)
- [GCP Settings](03-reference/configuration/gcp-settings.md)

### 4️⃣ Explanation (Understanding-Oriented)
**"Tell me why"** - Conceptual knowledge and design decisions.

#### Architecture
- [System Overview](04-explanation/architecture/system-overview.md)
- [Deployment Architecture](04-explanation/architecture/deployment-architecture.md)
- [Data Flow](04-explanation/architecture/data-flow.md)
- [Free Tier Design](04-explanation/architecture/free-tier-design.md)
- [GCP Architecture](04-explanation/architecture/gcp-architecture.md)

#### Features
- [Semantic Search Deep Dive](04-explanation/features/semantic-search-deep-dive.md)
- [Encryption Model](04-explanation/features/encryption-model.md)
- [Cohort Access Control](04-explanation/features/cohort-access-control.md)
- [Offline PWA Strategy](04-explanation/features/offline-pwa-strategy.md)

#### Nostr Protocol
- [Nostr Fundamentals](04-explanation/nostr-protocol/nostr-fundamentals.md)
- [Event Kinds](04-explanation/nostr-protocol/event-kinds.md)
- [Relay Communication](04-explanation/nostr-protocol/relay-communication.md)

#### Design Decisions
- [Why Serverless?](04-explanation/design-decisions/why-serverless.md)
- [Why SvelteKit?](04-explanation/design-decisions/why-sveltekit.md)
- [Why HNSW Search?](04-explanation/design-decisions/why-hnsw-search.md)

## 🏗️ Additional Sections

### 5️⃣ SPARC Methodology
- [01 Specification](05-sparc/01-specification.md)
- [02 Architecture](05-sparc/02-architecture.md)
- [03 Pseudocode](05-sparc/03-pseudocode.md)
- [04 Refinement](05-sparc/04-refinement.md)
- [05 Completion](05-sparc/05-completion.md)
- **Semantic Search:** [Spec](05-sparc/semantic-search/06-spec.md) | [Architecture](05-sparc/semantic-search/07-architecture.md) | [Pseudocode](05-sparc/semantic-search/08-pseudocode.md) | [Risks](05-sparc/semantic-search/09-risks.md)

### 6️⃣ Security
- [Security Overview](06-security/security-overview.md)
- [Threat Model](06-security/threat-model.md)
- [Key Management](06-security/key-management.md)
- [Admin Key Rotation](06-security/admin-key-rotation.md)
- **Audit Reports:** [2024-Q4 Audit](06-security/audit-reports/2024-q4-audit.md) | [SQL Injection Fix](06-security/audit-reports/sql-injection-fix.md)

### 7️⃣ Testing
- [Testing Strategy](07-testing/testing-strategy.md)
- [Unit Testing](07-testing/unit-testing.md)
- [E2E Testing](07-testing/e2e-testing.md)
- [Performance Testing](07-testing/performance-testing.md)
- [E2E Quickstart](07-testing/quickstart-e2e.md)
- **Coverage Reports:** [API Contract](07-testing/test-coverage-reports/api-contract-validation.md) | [Semantic Coverage](07-testing/test-coverage-reports/semantic-coverage.md) | [Code Quality](07-testing/test-coverage-reports/code-quality-report.md)

### 8️⃣ Maintenance
- [CHANGELOG](08-maintenance/CHANGELOG.md)
- **Migration Guides:** [v1 to v2](08-maintenance/migration-guides/v1-to-v2.md) | [GCP Migration](08-maintenance/migration-guides/gcp-migration-2024.md)
- **Monitoring:** [Metrics](08-maintenance/monitoring/metrics.md) | [Alerts](08-maintenance/monitoring/alerts.md)
- [Backup & Restore](08-maintenance/backup-restore.md)

## 📖 Glossary

See [GLOSSARY.md](00-index/GLOSSARY.md) for Nostr and BBS terminology.

## 🗺️ Roadmap

See [ROADMAP.md](00-index/ROADMAP.md) for planned features and milestones.

## 🔗 External Resources

- [Nostr Protocol](https://github.com/nostr-protocol/nostr)
- [NIPs Repository](https://github.com/nostr-protocol/nips)
- [SvelteKit Docs](https://kit.svelte.dev)
- [Google Cloud Platform](https://cloud.google.com)

---

**Navigation Tips:**
- **New users:** Start with [Getting Started](00-index/GETTING_STARTED.md)
- **Developers:** Jump to [Reference](03-reference/) or [How-To Guides](02-how-to-guides/)
- **Architects:** Read [Explanation](04-explanation/) and [SPARC](05-sparc/)
- **DevOps:** See [Deployment Guides](02-how-to-guides/deployment/) and [Security](06-security/)
```

## 5. Navigation Paths by User Role

### 5.1 User Role: End User (Non-Technical)

**Goal:** Use the Nostr-BBS application.

**Entry Point:** Root `README.md` → `00-index/GETTING_STARTED.md`

**Primary Path:**
1. `00-index/GETTING_STARTED.md` - Quick start guide
2. `01-tutorials/05-install-as-pwa.md` - Install as app
3. `01-tutorials/02-first-channel-message.md` - Send first message
4. `01-tutorials/03-send-encrypted-dm.md` - Private messaging
5. `02-how-to-guides/troubleshooting/common-errors.md` - If issues arise

**Secondary Resources:**
- `00-index/GLOSSARY.md` - Understand Nostr terms
- `04-explanation/nostr-protocol/nostr-fundamentals.md` - Learn Nostr basics

### 5.2 User Role: Developer (Frontend/Backend)

**Goal:** Contribute code, extend features, fix bugs.

**Entry Point:** Root `README.md` → `01-tutorials/01-setup-local-development.md`

**Primary Path:**
1. `01-tutorials/01-setup-local-development.md` - Local environment setup
2. `03-reference/api/` - API documentation
3. `03-reference/components/` - Component reference
4. `03-reference/stores/` - State management
5. `02-how-to-guides/development/` - Development guides
6. `07-testing/` - Testing strategy

**Feature Development Path:**
1. `04-explanation/architecture/system-overview.md` - Understand architecture
2. `03-reference/nips/` - NIP specifications
3. `02-how-to-guides/development/add-new-nip.md` - Implement new NIP
4. `07-testing/unit-testing.md` - Write tests
5. `08-maintenance/CHANGELOG.md` - Document changes

**Debugging Path:**
1. `02-how-to-guides/troubleshooting/` - Common issues
2. `07-testing/test-coverage-reports/` - Test failures
3. `06-security/audit-reports/` - Security issues

### 5.3 User Role: System Architect

**Goal:** Understand design decisions, evaluate architecture, plan changes.

**Entry Point:** Root `README.md` → `04-explanation/architecture/system-overview.md`

**Primary Path:**
1. `04-explanation/architecture/system-overview.md` - High-level architecture
2. `04-explanation/architecture/deployment-architecture.md` - Deployment model
3. `04-explanation/architecture/data-flow.md` - Data flow patterns
4. `04-explanation/design-decisions/` - Design rationale
5. `05-sparc/` - SPARC methodology docs
6. `06-security/threat-model.md` - Security architecture

**Deep Dive Path:**
1. `04-explanation/features/semantic-search-deep-dive.md` - Semantic search
2. `04-explanation/features/encryption-model.md` - Encryption design
3. `04-explanation/features/cohort-access-control.md` - Access control
4. `05-sparc/semantic-search/` - Semantic search SPARC

**Evaluation Path:**
1. `04-explanation/architecture/free-tier-design.md` - Cost optimization
2. `07-testing/test-coverage-reports/` - Quality metrics
3. `08-maintenance/migration-guides/` - Evolution history

### 5.4 User Role: DevOps/SRE

**Goal:** Deploy, monitor, maintain, secure production systems.

**Entry Point:** Root `README.md` → `02-how-to-guides/deployment/deploy-overview.md`

**Primary Path:**
1. `02-how-to-guides/deployment/setup-gcp-account.md` - GCP setup
2. `02-how-to-guides/deployment/deploy-cloud-run.md` - Backend deployment
3. `02-how-to-guides/deployment/deploy-github-pages.md` - Frontend deployment
4. `02-how-to-guides/deployment/configure-secrets.md` - Secrets management
5. `02-how-to-guides/deployment/checklist.yaml` - Deployment checklist

**Security Path:**
1. `06-security/security-overview.md` - Security model
2. `06-security/key-management.md` - Key management
3. `02-how-to-guides/administration/rotate-admin-keys.md` - Key rotation
4. `06-security/audit-reports/` - Security audits

**Monitoring Path:**
1. `08-maintenance/monitoring/metrics.md` - Metrics setup
2. `08-maintenance/monitoring/alerts.md` - Alerting
3. `08-maintenance/backup-restore.md` - Disaster recovery

**Troubleshooting Path:**
1. `02-how-to-guides/troubleshooting/relay-connection-issues.md` - Relay issues
2. `02-how-to-guides/troubleshooting/common-errors.md` - Common errors
3. `07-testing/performance-testing.md` - Performance debugging

### 5.5 User Role: Administrator

**Goal:** Manage users, moderate content, configure channels.

**Entry Point:** Root `README.md` → `02-how-to-guides/administration/`

**Primary Path:**
1. `02-how-to-guides/administration/manage-users.md` - User management
2. `02-how-to-guides/administration/create-channels.md` - Channel creation
3. `02-how-to-guides/administration/moderate-content.md` - Content moderation
4. `04-explanation/features/cohort-access-control.md` - Access control concepts

**Security Path:**
1. `06-security/key-management.md` - Admin key management
2. `02-how-to-guides/administration/rotate-admin-keys.md` - Key rotation
3. `06-security/threat-model.md` - Threat awareness

## 6. Implementation Recommendations

### 6.1 Migration Strategy (Phased Approach)

**Phase 1: Critical Restructuring (Week 1)**
1. Create new directory structure in `/docs`
2. Move SPARC docs to `05-sparc/`
3. Move security docs to `06-security/`
4. Move testing docs to `07-testing/`
5. Create `00-index/INDEX.md` with navigation
6. Update all internal links

**Phase 2: Consolidation (Week 2)**
1. Split root `README.md` (1,290 lines → 300 lines max)
2. Split `architecture/09-semantic-search-risks.md` (2,494 lines)
3. Split `architecture/07-semantic-search-architecture.md` (1,659 lines)
4. Consolidate mute/threading/search feature docs
5. Create missing critical docs (security-overview.md, CHANGELOG.md)

**Phase 3: Reference Documentation (Week 3)**
1. Document all API endpoints (Cloud Run, Relay WebSocket)
2. Document all components (auth, chat, dm, events, ui)
3. Document all stores (auth, channels, messages, dm, pwa)
4. Create component/store architecture overviews

**Phase 4: How-To Guides (Week 4)**
1. Create deployment how-to guides
2. Create administration how-to guides
3. Create development how-to guides
4. Create troubleshooting guides

**Phase 5: Tutorials & Explanation (Week 5)**
1. Create step-by-step tutorials for key workflows
2. Create conceptual explanation docs
3. Create design decision documents
4. Create Nostr fundamentals guide

**Phase 6: Maintenance & Polish (Week 6)**
1. Validate all links (fix broken references)
2. Update diagrams (fix orphaned diagrams)
3. Create CHANGELOG.md
4. Create GLOSSARY.md
5. Final review and audit

### 6.2 Link Migration Strategy

**Automated Link Updates:**
1. Create mapping file: `old_path → new_path`
2. Use `sed` script to update all `.md` files:
   ```bash
   find docs -name "*.md" -exec sed -i 's|docs/features/pwa-implementation.md|04-explanation/features/pwa-architecture.md|g' {} +
   ```
3. Use link checker to validate: `markdown-link-check docs/**/*.md`

**Manual Link Reviews:**
1. Root `README.md` - Update all doc links
2. `00-index/INDEX.md` - Comprehensive link review
3. Navigation components (if in codebase)

### 6.3 Tooling Recommendations

**Documentation Tools:**
- **Link Checker:** `markdown-link-check` (validate all links)
- **Linter:** `markdownlint` (enforce style consistency)
- **Diagram Generator:** `mermaid-cli` (generate diagrams from `.mmd` files)
- **Search:** `algolia/docsearch` or `lunr.js` for documentation search

**CI/CD Integration:**
1. Add GitHub Action: Validate links on every PR
2. Add GitHub Action: Lint markdown on every PR
3. Add GitHub Action: Generate diagrams on commit
4. Add GitHub Action: Check for broken internal references

### 6.4 Documentation Standards

**File Naming Convention:**
- Use kebab-case: `semantic-search-deep-dive.md`
- Date stamped reports: `gcp-migration-2024.md`
- Versioned guides: `v1-to-v2-migration.md`

**Document Template Structure:**
```markdown
# [Document Title]

**Category:** [Tutorial/How-To/Reference/Explanation]
**Last Updated:** YYYY-MM-DD
**Audience:** [User/Developer/Architect/DevOps]

[← Back to Index](../00-index/INDEX.md)

## Overview
[Brief 2-3 sentence summary]

## Table of Contents
- [Overview](#overview)
- [Proposed Directory Structure](#1-proposed-directory-structure-diataxis-framework)
- [File Placement Mapping](#2-file-placement-mapping-43-existing-files)

## Main Content

## Related Documents
- [Documentation Index](../INDEX.md)
- [Navigation Design Spec](navigation-design-spec.md)

## See Also
- [External Link](https://example.com)
```

**Front Matter Standard (Optional):**
```yaml
---
title: Semantic Search Deep Dive
category: explanation
audience: [developer, architect]
tags: [semantic-search, ml, hnsw, embeddings]
last_updated: 2025-12-20
version: 1.0
---
```

## 7. Success Metrics

### 7.1 Documentation Quality Metrics (Target 90/100)

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| **Coverage Score** | 52/100 | 90/100 | % of codebase with docs |
| **API Documentation** | 10% | 95% | % of endpoints documented |
| **Component Docs** | 19% | 95% | % of components documented |
| **Store Docs** | 11% | 95% | % of stores documented |
| **Link Integrity** | Unknown | 100% | `markdown-link-check` pass rate |
| **Orphaned Files** | 7 files | 0 files | Files not linked in INDEX.md |
| **Broken References** | Multiple | 0 | Dead links to security docs |
| **Average Doc Length** | 450 lines | <300 lines | Lines per .md file |
| **Navigation Depth** | 3-4 clicks | 2-3 clicks | Clicks to find info |
| **Search Relevance** | N/A | 85%+ | User satisfaction with search |

### 7.2 User Experience Metrics

| User Role | Current Time to Info | Target Time | Key Metric |
|-----------|----------------------|-------------|------------|
| End User | Unknown | <2 min | Time to find install guide |
| Developer | Unknown | <3 min | Time to find API reference |
| Architect | Unknown | <5 min | Time to understand architecture |
| DevOps | Unknown | <4 min | Time to find deployment guide |

### 7.3 Maintenance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Stale Docs** | <5% | Last updated >6 months ago |
| **Duplicate Content** | <2% | Same content in multiple files |
| **CI/CD Failures** | <1% | Failed link checks in CI |
| **Contributor Friction** | <10% | PRs with doc update requests |

## 8. Open Issues and Risks

### 8.1 Critical Issues (Updated from Corpus Analysis)

1. **Tutorial Content Gap (HIGHEST PRIORITY):**
   - Only **1 tutorial document** (2% of corpus vs. 15-25% Diataxis target)
   - Current: `pwa-quick-start.md` (731 words)
   - **Need**: 5-7 learning-oriented guides (~7,000 additional words)
   - **Recommended tutorials**: Getting Started, First Channel, First Message, Custom Relay Setup, Understanding Nostr Events
   - **Risk:** High barrier to entry for new users and developers

2. **Zero-Link Documents (19 files):**
   - 19 documents have **no internal links** including major documents:
     - `09-semantic-search-risks.md` (8,793 words) - should reference security and architecture
     - `gcp-architecture.md` (3,424 words) - should link to deployment guides
     - `github-workflows.md` (1,253 words) - should link to deployment docs
   - **Risk:** Poor discoverability, isolated knowledge silos

3. **Missing Topic Coverage:**
   - **Performance & Optimization**: No caching, tuning, or optimization guides
   - **Troubleshooting**: No debugging guide, common issues FAQ, or error reference
   - **Migration & Upgrades**: No version upgrade guide or breaking changes documentation
   - **Accessibility**: Only 1 document (needs keyboard navigation, screen reader guides)
   - **Internationalization**: No i18n/l10n documentation
   - **Risk:** Critical operational knowledge gaps

4. **Tag Vocabulary Gaps:**
   - Missing tags for: performance, optimization, monitoring, troubleshooting, mobile, i18n
   - Current: 47 unique tags (need ~60 for comprehensive coverage)
   - **Risk:** Poor searchability and categorization

### 8.2 Migration Risks

1. **Link Breakage:**
   - 43+ files being moved
   - Potential for broken internal links
   - **Mitigation:** Automated link updating script + CI validation

2. **External Links:**
   - README.md is linked from GitHub, npm, etc.
   - Moving content could break external references
   - **Mitigation:** Keep root README.md lightweight, add redirects

3. **Search Indexing:**
   - Moving files may break existing search indexes (Google, algolia)
   - **Mitigation:** Add redirects, submit new sitemap

4. **In-Code Documentation Links:**
   - Code comments may link to old doc paths
   - **Mitigation:** Search codebase for `docs/` references, update

### 8.3 Constraints

1. **Backwards Compatibility:**
   - Cannot break existing external links to `README.md`
   - Solution: Keep root README.md, split content to new locations

2. **GitHub Pages:**
   - Documentation may be served via GitHub Pages
   - Directory structure must be web-friendly
   - Solution: Diataxis structure is web-compatible

3. **Search Engine Indexing:**
   - Moving files changes URLs
   - Solution: Add 301 redirects if serving docs via web server

## 9. Appendices

### Appendix A: Diataxis Framework Summary

**Four Documentation Types:**

| Type | Purpose | Audience State | Form | Example |
|------|---------|----------------|------|---------|
| **Tutorial** | Learning | Studying | Lesson | "Build your first app" |
| **How-To** | Problem-Solving | Working | Recipe | "How to deploy to GCP" |
| **Reference** | Information | Working | Lookup | "API endpoint reference" |
| **Explanation** | Understanding | Studying | Essay | "Why we chose serverless" |

**Key Principles:**
- Tutorials: Hands-on, step-by-step, beginner-friendly
- How-To: Goal-oriented, practical, assumes knowledge
- Reference: Dry, factual, structured for lookup
- Explanation: Conceptual, theoretical, design rationale

### Appendix B: File Size Analysis

| File | Lines | Category | Action |
|------|-------|----------|--------|
| `architecture/09-semantic-search-risks.md` | 2,494 | SPARC | **Split** into 3 docs |
| `architecture/07-semantic-search-architecture.md` | 1,659 | SPARC | **Split** into 3 docs |
| `README.md` | 1,290 | Root | **Split** into 6 docs |
| `architecture/08-semantic-search-pseudocode.md` | 1,208 | SPARC | **Split** into 2 docs |
| `tests/semantic/code-quality-report.md` | 1,092 | Testing | **Move** to reports/ |
| `deployment/gcp-architecture.md` | 1,018 | Deployment | **Move** to explanation/ |

**Target:** No file >600 lines (improves readability and navigation)

### Appendix C: Corpus Analysis Findings (December 2025)

**Current State Assessment:**
- **Strengths**:
  - ✅ Zero orphaned files (excellent INDEX.md coverage)
  - ✅ No duplicate content detected
  - ✅ 84.3% of documents have metadata tags
  - ✅ Comprehensive reference documentation (52.9% of corpus)
  - ✅ Shallow 2-level directory hierarchy (easy navigation)
  - ✅ Quality score: 80.5/100 (B+ grade)

- **Critical Gaps**:
  - ❌ Tutorial content: Only 2% (need 15-25%)
  - ❌ 19 documents with zero internal links
  - ❌ Missing topics: performance, troubleshooting, migration, i18n
  - ❌ Tag vocabulary gaps (47 vs. 60 needed)
  - ❌ 8 uncategorized working documents need organization

**Top 20 Most-Used Tags** (from corpus analysis):
1. features (13), 2. architecture (11), 3. ui (10), 4. deployment (9), 5. search (7), 6. development (7), 7. messages (7), 8. sparc-methodology (6), 9. pwa (5), 10. nostr-protocol (4), 11. semantic-search (4), 12. setup (4), 13. components (4), 14. serverless (3), 15. testing (3), 16. nip-44 (3), 17. nostr (3), 18. nip-17 (3), 19. channels (3), 20. chat (3)

**Link Health Summary**:
- **Well-connected** (7+ inbound): 4 docs (02-architecture.md, dm-implementation.md, 01-specification.md, pwa-quick-start.md)
- **Moderately connected** (3-6 inbound): 27 docs
- **Poorly connected** (1-2 inbound): 19 docs
- **Single weakly-connected**: navigation-enhancement-spec.md (0 inbound)

**Addressed in this IA:**
- ✅ Orphaned files: Already at 0, maintain with INDEX.md updates
- ✅ Document organization: Proposed 7-section Diataxis structure
- ⚠️ Tutorial gap: Create `01-tutorials/` directory with 5-7 guides
- ⚠️ Zero-link documents: Add cross-references to 19 isolated docs
- ⚠️ Missing topics: Add troubleshooting, performance, migration guides
- ⚠️ Tag expansion: Add 13 new tags (performance, mobile, i18n, etc.)

---

**Next Steps:**
1. Review and approve this IA specification
2. Review [Corpus Analysis Report](corpus-analysis.md) for detailed metrics
3. Execute Phase 1: Critical Restructuring (Week 1)
4. Create migration scripts for automated link updates
5. Set up CI/CD validation for links and markdown linting
6. Proceed with Phase 2-6 as outlined in Section 6.1
7. **PRIORITY**: Create 5-7 tutorial documents to address critical 2% tutorial gap

**Questions for Review:**
- Approval to proceed with 7-section structure?
- Approval to split root README.md?
- Approval to consolidate duplicate feature docs?
- Approval to create 8+ missing critical docs?
- Timeline acceptable (6-week phased approach)?
- **NEW**: Approval to prioritize tutorial creation (critical gap)?

**Related Documentation:**
- [Corpus Analysis Report](corpus-analysis.md) - Comprehensive documentation analysis and metrics
- [Tag Vocabulary](tag-vocabulary.md) - Current tag definitions and usage
- [Navigation Design Spec](navigation-design-spec.md) - Navigation patterns and UI
