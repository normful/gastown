# Add "pi" Agent Preset Implementation Plan

> **For coding agents:** REQUIRED SKILL: Use the `executing-plans` skill to implement this plan task-by-task.

**Goal:** Add the `pi` AI coding assistant as a built-in agent preset in Gas Town, enabling users to run `gt config agent list` and see `pi` alongside claude, gemini, codex, etc.

**Architecture:** Add a new agent preset to the builtinPresets map in `internal/config/agents.go`. The `pi` CLI supports non-interactive mode via `--print`, session resumption via `--continue`, and uses standard environment variables.

**Tech Stack:** Go, Gas Town configuration system

---

### Task 1: Add AgentPi constant definition

**Files:**
- Modify: `internal/config/agents.go:19-31`

**Step 1: Add the AgentPi constant**

Add after line 31 (after `AgentOpenCode`):

```go
// AgentPi is pi CLI.
AgentPi AgentPreset = "pi"
```

**Step 2: Run test to verify it compiles**

Run: `go build ./...`
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add internal/config/agents.go
git commit -m "feat: add AgentPi constant definition"
```

---

### Task 2: Add pi preset to builtinPresets map

**Files:**
- Modify: `internal/config/agents.go:106-200`

**Step 1: Add the pi preset entry**

After the `AgentOpenCode` entry (around line 200), add:

```go
AgentPi: {
    Name:         AgentPi,
    Command:      "pi",
    Args:         []string{"--print"}, // Non-interactive mode
    ProcessNames: []string{"pi", "bun"}, // pi runs as Bun process
    SessionIDEnv: "",                           // pi uses session files
    ResumeFlag:   "--continue",
    ResumeStyle:  "flag",
    SupportsHooks: false,                       // Verify if pi supports hooks
    SupportsForkSession: false,
    NonInteractive: &NonInteractiveConfig{
        Subcommand: "", // pi uses --print flag
        PromptFlag: "", // pi accepts positional args
        OutputFlag: "--mode json",
    },
},
```

**Step 2: Run test to verify it compiles**

Run: `go build ./...`
Expected: BUILD SUCCESS

**Step 3: Run the agent list command to verify**

Run: `./gt config agent list`
Expected: Should show `pi [built-in]` in the list

**Step 4: Commit**

```bash
git add internal/config/agents.go
git commit -m "feat: add pi agent preset to builtinPresets"
```

---

### Task 3: Verify pi agent works

**Files:**
- Test: Manual verification

**Step 1: Test pi appears in agent list**

Run: `./gt config agent list | grep pi`
Expected: Shows `pi [built-in]`

**Step 2: Test pi agent configuration display**

Run: `./gt config agent get pi`
Expected: Shows pi's configuration (command, args, etc.)

**Step 3: (Optional) Test actually spawning a pi polecat**

This would require a configured rig and is optional for initial implementation.

**Step 4: Commit**

```bash
git commit --allow-empty -m "test: verify pi agent preset works"
```

---

### Task 4: Update documentation (optional)

**Files:**
- Modify: `README.md` (if agent list is documented)
- Modify: `docs/` (if agent docs exist)

**Step 1: Check if agents are documented**

Run: `grep -r "claude\|gemini\|codex" README.md | head -5`
If agents are documented, consider adding pi to the list.

**Step 2: Commit (if changes made)**

```bash
git add README.md
git commit -m "docs: add pi to supported agents list"
```

---

## Summary

| Task | Files | Steps |
|------|-------|-------|
| 1 | `internal/config/agents.go` | Add `AgentPi` constant |
| 2 | `internal/config/agents.go` | Add pi to `builtinPresets` map |
| 3 | Manual test | Verify `./gt config agent list` shows pi |
| 4 | Docs (optional) | Update README if needed |

**Total estimated time:** 15-20 minutes

---

## Notes for Future Enhancement

Once pi is added as a preset, advanced users can:
- Set pi as default: `gt config default-agent pi`
- Use pi for specific roles: Configure `role_agents` in settings
- Override per-rig: Set agent in rig's config.json

If pi proves stable, consider:
- Adding `--extensions` support for pi extensions
- Testing session resumption with `--continue`
- Verifying hook support if pi gains hook capability
