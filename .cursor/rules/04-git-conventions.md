---
description: "Git commit conventions (Conventional Commits format), types, and rules."
alwaysApply: true
---

# Git Commits

Use **Conventional Commits** format for all commit messages.

## Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no code change
- `refactor` - Code restructuring, no feature change
- `test` - Adding/updating tests
- `chore` - Maintenance, dependencies, config
- `perf` - Performance improvement

## Rules
- Use imperative mood ("add" not "added")
- Keep first line under 72 characters
- Scope is optional but recommended
- Reference issues in footer: `Closes #123`
