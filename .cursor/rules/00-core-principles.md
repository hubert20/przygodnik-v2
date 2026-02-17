---
description: "Core development principles (KISS, YAGNI, SOLID), safety rules, and quick reference for what requires approval."
alwaysApply: true
---

# Core Principles

> **Projekt:** Warsztaty AI-First Development  
> **Metodyka:** Model 3 Faz (Biznes -> Architektura -> Implementacja)

## Everything in Local Repo
- Maintain changes and scripts in local repository
- First address changes in local configuration files
- First make changes/add scripts in local folders

## KISS (Keep It Simple, Stupid)
- Choose the simplest solution that works
- One function = one responsibility
- If it's hard to explain, it's too complex

## YAGNI (You Aren't Gonna Need It)
- Only implement what's needed NOW
- No speculative features or "just in case" code
- Delete unused code immediately - don't comment it out

## SOLID
- **S**ingle Responsibility: One reason to change per class/module
- **O**pen/Closed: Extend behavior without modifying existing code
- **L**iskov Substitution: Subtypes must be substitutable for base types
- **I**nterface Segregation: Many specific interfaces > one general interface
- **D**ependency Inversion: Depend on abstractions, not concretions

---

## Safety Rules

### ALWAYS Ask Before:
- Running destructive commands (`rm -rf`, `git push --force`, `dd`, `mkfs`)
- Modifying sensitive files (`.env`, `id_rsa`, `credentials`, `.pem`)
- Deleting files or directories
- Making architectural decisions
- Adding/removing dependencies
- Significantly refactoring code
- Modifying configuration files
- Creating new directories or major files
- Any action that cannot be easily undone

### NEVER:
- Run `rm -rf /` or `rm -rf ~` (recursive delete root or home)
- Run `rm -rf /*` (delete all files)
- Edit `.env` files or credentials
- Modify SSH keys (`id_rsa`, `id_ed25519`, `id_ecdsa`)
- Overwrite disk devices (`dd` to `/dev/sd*`)
- Format filesystems (`mkfs.*`)
- Execute fork bombs or dangerous shell patterns

### Blocked Patterns:
- `rm -rf /` (recursive delete root)
- `rm -rf /*` (recursive delete root contents)
- `rm -rf ~` or `rm -rf $HOME` (recursive delete home)
- `dd` operations targeting disk devices
- `mkfs.*` (filesystem formatting)
- Any command targeting sensitive files (`.env`, `credentials`, `id_rsa`, etc.)

---

## Quick Reference

| Action | Ask First? |
|--------|-----------|
| Read files | No |
| Small edits (<10 lines) | No |
| New functions/classes | Yes |
| New dependencies | Yes |
| Delete code | Yes |
| Architectural changes | Yes |
| Configuration changes | Yes |
