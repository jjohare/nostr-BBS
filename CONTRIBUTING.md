# Contributing to nostr-BBS

Thank you for your interest in contributing to nostr-BBS! This document provides guidelines and workflows for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Documentation Workflow](#documentation-workflow)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:
- Be respectful and constructive in all interactions
- Provide helpful feedback during code reviews
- Focus on what is best for the community

## Getting Started

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/nostr-BBS.git
   cd nostr-BBS
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Pre-commit Hooks** (recommended)
   ```bash
   # Install hooks for automatic validation
   cp .github/hooks/pre-commit .git/hooks/
   chmod +x .git/hooks/pre-commit
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the [Style Guidelines](#style-guidelines)
   - Write tests for new functionality
   - Update documentation as needed

3. **Validate Your Changes**
   ```bash
   # Run all validators
   npm run validate

   # Or run specific checks
   npm run lint
   npm run test
   npm run validate:docs
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Test updates
   - `refactor:` - Code refactoring
   - `style:` - Code style changes
   - `chore:` - Maintenance tasks

## Documentation Workflow

Our documentation follows strict quality standards to ensure consistency and accuracy.

### Documentation Standards

All documentation must include YAML frontmatter:

```yaml
---
title: Your Document Title
description: Brief description of the document
status: draft  # draft|review|approved|deprecated
last_updated: 2025-12-23
category: guide  # guide|api|reference|feature
difficulty: intermediate  # beginner|intermediate|advanced (for guides)
---
```

### Local Validation

Before submitting documentation changes:

```bash
# Validate all documentation
./docs/scripts/validate-all.sh

# Or run individual validators
./docs/scripts/validate-links.sh docs
./docs/scripts/validate-frontmatter.sh docs
./docs/scripts/validate-mermaid.sh docs
./docs/scripts/validate-spelling.sh docs
```

### Validation Checks

1. **Link Validation** (`validate-links.sh`)
   - Checks all internal markdown links
   - Verifies file paths and anchors
   - Skips external links (checked weekly by CI)

2. **Frontmatter Validation** (`validate-frontmatter.sh`)
   - Ensures required YAML fields are present
   - Validates status values (draft/review/approved/deprecated)
   - Checks date format (YYYY-MM-DD)
   - Verifies category-specific fields

3. **Mermaid Diagram Validation** (`validate-mermaid.sh`)
   - Compiles all Mermaid diagrams
   - Catches syntax errors
   - Requires `@mermaid-js/mermaid-cli` installation

4. **UK English Spelling** (`validate-spelling.sh`)
   - Enforces UK English spelling conventions
   - Common checks: colour, behaviour, organise, centre
   - Excludes code blocks and technical terms

### Writing Documentation

**File Organisation:**
```
docs/
├── features/          # Feature documentation
├── guides/           # User guides
├── reference/        # API and configuration reference
├── architecture/     # System architecture
├── scripts/          # Validation scripts
└── working/          # Temporary/draft files
```

**Best Practices:**
- Use descriptive titles and headings
- Include code examples where applicable
- Add Mermaid diagrams for complex workflows
- Use UK English spelling consistently
- Link to related documentation
- Keep files focused and under 500 lines

**Mermaid Diagrams:**
```markdown
\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[Alternative]
\`\`\`
```

### Automated Documentation Checks

GitHub Actions automatically validate documentation on:
- Pull requests affecting `docs/**` or `*.md`
- Pushes to `main` branch
- Weekly schedule (Mondays at 9 AM UTC)
- Manual workflow dispatch

Failed validations will:
- Block PR merging (if configured)
- Post comments on PRs with error details
- Upload validation reports as artifacts

## Testing Requirements

### Unit Tests

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Run Playwright tests
npm run test:integration

# Run specific test suite
npm run test:integration -- tests/chat.spec.ts
```

### Test Guidelines

- Aim for 80% code coverage minimum
- Write descriptive test names
- Test both happy path and edge cases
- Mock external dependencies
- Keep tests fast and isolated

## Pull Request Process

### Before Submitting

1. ✅ All tests pass locally
2. ✅ Documentation is updated
3. ✅ Code follows style guidelines
4. ✅ Commits follow conventional commits
5. ✅ Branch is up to date with `main`

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Testing
Describe testing performed

## Screenshots (if applicable)

## Checklist
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] Code follows style guide
- [ ] Self-review completed
```

### Review Process

1. Automated checks run on all PRs
2. At least one maintainer review required
3. Address review feedback
4. Squash or rebase as appropriate
5. Merge when approved and checks pass

## Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for new code
- Follow ESLint configuration
- Use functional components for React
- Prefer `const` over `let`
- Use arrow functions
- Add JSDoc comments for public APIs

### CSS/Styling

- Use CSS modules or styled-components
- Follow BEM naming convention
- Mobile-first responsive design
- Support dark mode

### Documentation

- UK English spelling
- Clear, concise language
- Code examples with syntax highlighting
- Diagrams for complex concepts
- Consistent formatting

## npm Scripts Reference

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run preview            # Preview production build

# Testing
npm test                   # Run unit tests
npm run test:integration   # Run Playwright tests
npm run test:coverage      # Generate coverage report

# Quality Checks
npm run lint               # Run ESLint
npm run typecheck          # TypeScript type checking
npm run validate:docs      # Validate documentation

# Documentation
npm run docs:validate      # Run all doc validators
npm run docs:links         # Check internal links
npm run docs:spelling      # UK English check
```

## Additional Resources

- [Project README](/home/devuser/workspace/nostr-BBS/README.md)
- [Architecture Documentation](/home/devuser/workspace/nostr-BBS/docs/architecture/)
- [API Reference](/home/devuser/workspace/nostr-BBS/docs/reference/api-reference.md)
- [Feature Guides](/home/devuser/workspace/nostr-BBS/docs/features/)

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Check existing issues before creating new ones

## Licence

By contributing, you agree that your contributions will be licenced under the same licence as the project.

---

Thank you for contributing to nostr-BBS! 🚀
