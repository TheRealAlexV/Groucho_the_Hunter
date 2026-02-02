# Execution Policy: Docker-Only Development

> ⚠️ **HARD RULE: All development, testing, and execution MUST use Docker via grouchocli. NEVER run `npm run dev` directly on the host.**

---

## Policy Statement

This document establishes the **mandatory execution policy** for the Groucho the Hunter project. All team members, contributors, and automated systems **MUST** adhere to these rules without exception.

---

## The Hard Rule

### Absolute Prohibitions

| Action | Status | Consequence |
|--------|--------|-------------|
| `npm run dev` on host | ❌ **STRICTLY PROHIBITED** | Environment inconsistency |
| `npm start` on host | ❌ **STRICTLY PROHIBITED** | Dependency conflicts |
| `node` scripts on host | ❌ **STRICTLY PROHIBITED** | Version mismatches |
| Direct host execution | ❌ **STRICTLY PROHIBITED** | Reproducibility loss |

### Only Approved Method

| Action | Status | Command |
|--------|--------|---------|
| Development server | ✅ **ONLY APPROVED** | `groucho start --dev` |
| Production server | ✅ **ONLY APPROVED** | `groucho start --prod` |
| Running tests | ✅ **ONLY APPROVED** | Inside container via `groucho shell` |
| Debugging | ✅ **ONLY APPROVED** | Inside container via `groucho shell` |

---

## Command Hierarchy

When executing the application, commands MUST be used in this priority order:

### 1. grouchocli (HIGHEST PRIORITY - ALWAYS USE THIS)

```bash
# Development
groucho start --dev              # ✅ CORRECT
groucho stop --dev               # ✅ CORRECT
groucho restart --dev            # ✅ CORRECT
groucho logs --dev --follow      # ✅ CORRECT
groucho shell --dev              # ✅ CORRECT

# Production
groucho start --prod             # ✅ CORRECT
groucho stop --prod              # ✅ CORRECT

# Utility
groucho status                   # ✅ CORRECT
groucho menu                     # ✅ CORRECT
groucho build --dev              # ✅ CORRECT
groucho build --prod             # ✅ CORRECT
groucho clean --force            # ✅ CORRECT
```

**When to use**: ALWAYS. This is the primary and only approved method for running the application.

### 2. docker-compose (Emergency/Fallback)

```bash
# Development
docker-compose up --build        # ⚠️ Only if grouchocli unavailable
docker-compose up -d             # ⚠️ Only if grouchocli unavailable
docker-compose down              # ⚠️ Only if grouchocli unavailable

# Production
docker-compose -f docker-compose.prod.yml up -d --build  # ⚠️ Only if grouchocli unavailable
```

**When to use**: Only when grouchocli is unavailable, broken, or being debugged. Document any direct docker-compose usage.

### 3. npm (REFERENCE ONLY - NEVER USE DIRECTLY)

```bash
npm run dev                      # ❌ NEVER - Runs INSIDE container only
npm run build                    # ❌ NEVER on host - Used in CI/CD only
npm run lint                     # ❌ NEVER - Use groucho shell, then run inside
npm run format                   # ❌ NEVER - Use groucho shell, then run inside
```

**When to use**: NEVER directly on the host. These commands are documented for reference only and run **INSIDE** the container as part of the Docker workflow.

---

## Why Docker-Only?

### 1. Consistency
All developers use the exact same:
- Node.js version (controlled in Dockerfile)
- Dependency versions (locked in container image)
- System libraries and configurations
- Environment variables and settings

### 2. Isolation
- No conflicts with host system Node.js/npm installations
- No pollution of host PATH or global packages
- Clean separation between projects
- No "works on my machine" issues

### 3. Reproducibility
- Identical environment across development, testing, and production
- Version-controlled Docker configuration
- Deterministic builds and execution
- Easy CI/CD integration

### 4. Safety
- Container boundaries prevent accidental system modifications
- Limited access to host filesystem
- Network isolation by default
- Easy cleanup and reset

---

## Consequences of Violation

### Individual Impact
- **Wasted Time**: Debugging environment-specific issues
- **Inconsistent Behavior**: Code works locally but fails in containers
- **CI/CD Failures**: Builds pass locally but fail in pipeline
- **Onboarding Friction**: New team members hit environment issues

### Team Impact
- **Unreproducible Bugs**: Issues that can't be reproduced by other team members
- **Review Difficulties**: Code review becomes harder with environment differences
- **Documentation Drift**: Instructions become inaccurate over time
- **Velocity Loss**: Time spent on environment issues instead of features

### Project Impact
- **Deployment Risk**: Untested container configuration
- **Security Exposure**: Host system modifications
- **Technical Debt**: Accumulation of workarounds and hacks
- **Quality Degradation**: Inconsistent testing and validation

---

## Compliance Verification

### Before Starting Work

```bash
# Verify you're using Docker
groucho status

# Should show container status
# If container not running, use:
groucho start --dev
```

### During Development

```bash
# Check logs to ensure container is active
groucho logs --dev --follow

# All file changes should trigger hot reload via Docker volumes
# If hot reload doesn't work, restart container:
groucho restart --dev
```

### Before Committing

```bash
# Verify production build works in Docker
groucho start --prod
# Test at http://localhost:8080
groucho stop --prod

# Check no local node processes are running
ps aux | grep node  # Should show nothing or only system processes
```

---

## Violation Recovery

### If You Accidentally Ran npm run dev

```bash
# Step 1: Stop any local Node processes
killall node
# Or on Windows:
taskkill /F /IM node.exe

# Step 2: Verify no Node processes remain
ps aux | grep node

# Step 3: Start with proper Docker command
groucho start --dev

# Step 4: Verify container is running
groucho status
```

### If Environment Seems Broken

```bash
# Nuclear option - clean everything
groucho clean --force

# Fresh start
groucho start --dev
```

---

## Exceptions

There are **NO** exceptions to this policy. All execution must happen via Docker containers managed by grouchocli.

If you believe you have a legitimate use case that requires host execution:

1. Document the use case in detail
2. Propose a solution that maintains Docker isolation
3. Get approval from the team lead
4. Update this policy if approved

---

## References

- [Docker Workflow](docker-workflow.md) - Complete Docker workflow documentation
- [Project Context](memory-bank/context.md) - Current project state and execution policy
- [README.md](../../README.md) - Project overview and quick start
- [grouchocli/README.md](../../grouchocli/README.md) - CLI tool documentation

---

## Policy Updates

This policy is enforced by:
- Code review checklists
- CI/CD pipeline validation
- Team onboarding materials
- Automated compliance checks (future)

Updates to this policy require:
1. Team discussion and consensus
2. Documentation updates in all affected files
3. Communication to all team members
4. Migration plan for any workflow changes

---

**Last Updated**: 2026-02-02  
**Policy Version**: 1.0  
**Enforcement**: Immediate and mandatory
