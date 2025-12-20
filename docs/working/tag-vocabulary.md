# Standardised Tag Vocabulary for Nostr-BBS Documentation

**Version:** 1.0
**Date:** 2025-12-20
**Status:** Active

## Purpose

This document defines the canonical 45-tag vocabulary for consistent metadata tagging across all Nostr-BBS documentation files.

## Tag Categories

### Protocol & NIPs (12 tags)
- `nostr-protocol` - Nostr protocol fundamentals
- `nip-01` - Basic protocol events
- `nip-02` - Contact lists
- `nip-09` - Event deletion
- `nip-11` - Relay information
- `nip-17` - Private DMs
- `nip-25` - Reactions
- `nip-28` - Public channels
- `nip-42` - Authentication
- `nip-44` - Encryption
- `nip-52` - Calendar events
- `nip-59` - Gift wrap

### Architecture & System (8 tags)
- `architecture` - System design
- `specification` - Requirements and specs
- `pseudocode` - Algorithms
- `refinement` - Implementation details
- `completion` - Integration
- `sparc-methodology` - SPARC framework
- `serverless` - Serverless architecture
- `pwa` - Progressive Web App

### Features & Functionality (10 tags)
- `chat` - Messaging features
- `direct-messages` - Private messaging
- `channels` - Public channels
- `calendar` - Event management
- `search` - Search functionality
- `semantic-search` - AI-powered search
- `reactions` - Message reactions
- `threading` - Message threads
- `notifications` - Notification system
- `accessibility` - WCAG compliance

### Security & Privacy (5 tags)
- `security` - Security measures
- `encryption` - Cryptographic features
- `authentication` - User auth
- `privacy` - Privacy protection
- `access-control` - Permission systems

### Infrastructure & Deployment (5 tags)
- `deployment` - Deployment guides
- `gcp` - Google Cloud Platform
- `github-actions` - CI/CD
- `docker` - Containerization
- `cloud-run` - Cloud Run service

### Development & Testing (5 tags)
- `testing` - Test documentation
- `e2e-tests` - End-to-end tests
- `api` - API documentation
- `components` - UI components
- `stores` - State management

## Usage Guidelines

### Required Fields
Every documentation file MUST include:
```yaml
---
title: Document Title
description: Brief summary (1-2 sentences)
category: tutorial|howto|reference|explanation
tags: [tag1, tag2, tag3]
---
```

### Optional Fields
```yaml
difficulty: beginner|intermediate|advanced
related-docs:
  - path/to/related-doc.md
  - path/to/another-doc.md
version: 1.0
date: 2025-12-20
status: draft|active|deprecated
```

### Tag Selection Rules

1. **Maximum 5 tags per document** - Focus on most relevant
2. **Minimum 2 tags per document** - Provide context
3. **Primary tag first** - Most important tag comes first
4. **Use canonical names** - Exact match from vocabulary
5. **No custom tags** - Only use defined vocabulary

### Category Definitions

#### tutorial
Learning-oriented documents that guide users through a complete task from start to finish. Example: "Setting up local development environment"

#### howto
Problem-oriented documents that solve specific issues. Example: "How to deploy to GCP"

#### reference
Information-oriented documents with technical details. Example: "API reference"

#### explanation
Understanding-oriented documents that explain concepts. Example: "Architecture overview"

## Tag Matrix by Document Type

| Document Type | Typical Tags |
|--------------|--------------|
| Architecture docs | architecture, specification, sparc-methodology |
| Feature docs | Relevant feature tags + implementation tags |
| Deployment docs | deployment, gcp, github-actions |
| Security docs | security, encryption, privacy |
| Test docs | testing, e2e-tests, api |
| API docs | api, reference, components/stores |

## Examples

### Architecture Document
```yaml
---
title: Nostr-BBS System Architecture
description: Complete system design for the Nostr-BBS platform
category: explanation
tags: [architecture, nostr-protocol, serverless, pwa]
difficulty: intermediate
related-docs:
  - docs/architecture/01-specification.md
---
```

### Feature Implementation
```yaml
---
title: Direct Messages Implementation
description: NIP-17/59 gift-wrapped DM implementation guide
category: reference
tags: [direct-messages, nip-17, nip-59, encryption]
difficulty: advanced
---
```

### Tutorial
```yaml
---
title: Local Development Setup
description: Step-by-step guide to setting up Nostr-BBS locally
category: tutorial
tags: [deployment, docker, pwa]
difficulty: beginner
---
```

### How-to Guide
```yaml
---
title: How to Deploy to Google Cloud Platform
description: Deploy Nostr-BBS backend to GCP Cloud Run
category: howto
tags: [deployment, gcp, cloud-run]
difficulty: intermediate
---
```

## Version History

- **1.0** (2025-12-20): Initial 45-tag vocabulary
