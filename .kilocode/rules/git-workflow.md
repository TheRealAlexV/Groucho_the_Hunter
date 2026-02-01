# Git Workflow: Groucho the Hunter

## When This Applies

These rules apply when:
- Creating branches for new features
- Making commits
- Submitting code for review
- Managing version control workflow
- Collaborating with other developers

## Branch Strategy

### Branch Types

| Branch | Purpose | Naming Pattern |
|--------|---------|----------------|
| `main` | Production-ready code | - |
| `develop` | Integration branch | - |
| Feature | New functionality | `feature/description` |
| Bugfix | Bug fixes | `bugfix/description` |
| Hotfix | Critical production fixes | `hotfix/description` |
| Release | Release preparation | `release/vX.Y.Z` |

### Branch Naming Conventions

- Use kebab-case (lowercase with hyphens)
- Include issue/ticket number when applicable
- Be descriptive but concise

```bash
# GOOD
feature/player-controller
git commit -m "feat(player): add sprint mechanics"
feature/scene-manager
bugfix/collision-wall-clipping

# BAD
feature/new-stuff
branch1
my-changes
```

## Commit Guidelines

### Commit Message Format

Use **Conventional Commits** specification:

```
type(scope): subject

[optional body]

[optional footer(s)]
```

### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(player): add double-jump ability` |
| `fix` | Bug fix | `fix(collision): prevent wall clipping` |
| `docs` | Documentation | `docs(readme): update setup instructions` |
| `style` | Formatting | `style(lint): fix eslint warnings` |
| `refactor` | Code restructuring | `refactor(systems): simplify state manager` |
| `test` | Adding tests | `test(puzzles): add unit tests for log analysis` |
| `chore` | Maintenance | `chore(deps): update three.js to r171` |
| `perf` | Performance | `perf(rendering): optimize draw calls` |

### Commit Best Practices

- Keep commits atomic (one logical change per commit)
- Write commit messages in present tense
- First line max 50 characters
- Reference issues/tickets in footer when applicable

```bash
# GOOD
git commit -m "feat(player): add sprint mechanics

- Implements stamina system with regeneration
- Adds sprint multiplier to movement speed
- Includes UI feedback for stamina depletion

Closes #42"

# BAD
git commit -m "changes"
git commit -m "fixed stuff"
git commit -m "WIP - will finish later"
```

## Workflow Process

### Feature Development Workflow

```bash
# 1. Start from updated main branch
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/player-controller

# 3. Make changes and commit regularly
git add src/player/Player.js
git commit -m "feat(player): implement basic movement"

git add src/player/Camera.js
git commit -m "feat(camera): add FPS camera controller"

# 4. Push branch to remote
git push -u origin feature/player-controller

# 5. Create Pull Request via GitHub/GitLab

# 6. After approval, merge to main
git checkout main
git pull origin main
git merge --no-ff feature/player-controller
git push origin main

# 7. Clean up
git branch -d feature/player-controller
git push origin --delete feature/player-controller
```

### Before Committing Checklist

- [ ] Code follows project style guidelines
- [ ] ESLint passes with no errors
- [ ] Tests pass (if applicable)
- [ ] Documentation updated (if applicable)
- [ ] Commit message follows convention
- [ ] Only relevant files are committed

## Pull Request Guidelines

### PR Title Format

Same as commit format:
```
type(scope): Brief description
```

### PR Description Template

```markdown
## Summary
Brief description of changes

## Changes
- List of specific changes made
- New features added
- Bugs fixed

## Testing
How the changes were tested

## Screenshots/Videos
If applicable

## Related Issues
Closes #123
```

### PR Review Requirements

- Minimum 1 approval required
- All CI checks must pass
- No merge conflicts
- Code review comments addressed

## Git Configuration

### Recommended Settings

```bash
# Set default branch name
git config --global init.defaultBranch main

# Set pull behavior
git config --global pull.rebase false

# Enable colorful output
git config --global color.ui auto

# Set default editor
git config --global core.editor "code --wait"

# Set user info
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### .gitignore Template

```
# Dependencies
node_modules/

# Build output
dist/
*.tgz

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/

# Cache
.cache/
.parcel-cache/
```

## Common Git Operations

### Stashing Changes

```bash
# Stash current changes
git stash push -m "work in progress on player controller"

# List stashes
git stash list

# Apply most recent stash
git stash pop

# Apply specific stash
git stash apply stash@{1}
```

### Viewing History

```bash
# Compact log
git log --oneline --graph -10

# Detailed log with diffs
git log -p -2

# Log for specific file
git log --oneline -- src/player/Player.js
```

### Undoing Changes

```bash
# Unstage files
git restore --staged <file>

# Discard local changes
git restore <file>

# Amend last commit
git commit --amend -m "New commit message"

# Revert a commit (creates new commit)
git revert <commit-hash>
```

## Release Management

### Version Numbering (Semantic Versioning)

```
MAJOR.MINOR.PATCH

MAJOR - Breaking changes
MINOR - New features (backward compatible)
PATCH - Bug fixes (backward compatible)
```

### Release Process

```bash
# 1. Create release branch
git checkout -b release/v1.0.0

# 2. Update version numbers
# 3. Update CHANGELOG.md
# 4. Fix any release-specific issues

# 5. Merge to main
git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

# 6. Merge to develop
git checkout develop
git merge --no-ff release/v1.0.0
```

## References

- See [`Docs/ImplementationPlan.md`](Docs/ImplementationPlan.md) for development phases
- Conventional Commits: https://www.conventionalcommits.org/
- Git Flow: https://nvie.com/posts/a-successful-git-branching-model/
