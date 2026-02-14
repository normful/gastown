# AgentPresetInfo Field Usage Report

## Overview

This report documents how each field in `AgentPresetInfo` is used throughout the Gas Town codebase.

---

## 1. SessionIDEnv

**Type:** `string`  
**Current pi value:** `""` (empty - pi uses session files)

### Usage

Used to inform other parts of the system about the environment variable that holds the session ID:

| File | Usage |
|------|-------|
| `config/env.go:113` | Sets `GT_SESSION_ID_ENV` in env map |
| `daemon/lifecycle.go:488` | Exports to defaultEnv |
| `daemon/lifecycle.go:498` | Used to retrieve session ID |
| `handoff.go:481-482` | Exports to shell scripts |

### Recommendation

If pi uses session files rather than an env var, `""` is correct. However, if pi sets some environment variable that Gas Town could use, it should be documented here. Check if pi sets any session-related env vars.

---

## 2. ResumeFlag

**Type:** `string`  
**Current pi value:** `"--continue"`

### Usage

Used by `BuildResumeCommand` (agents.go:403-426) to construct a resume command:

```go
// Style: flag (default)
args = append(args, info.ResumeFlag, sessionID)
return info.Command + " " + strings.Join(args, " ")

// Style: subcommand
return info.Command + " " + info.ResumeFlag + " " + sessionID + " " + strings.Join(args, " ")
```

Also displayed in `gt config agent get` output.

### Verification Needed

- [ ] Confirm pi's `--continue` flag works as expected
- [ ] Verify the style is correct (flag vs subcommand)

---

## 3. ResumeStyle

**Type:** `string`  
**Current pi value:** `"flag"`

### Values

| Value | Example |
|-------|---------|
| `"flag"` | `claude --resume <id>` |
| `"subcommand"` | `codex resume <id>` |

### Usage

Only used in `BuildResumeCommand` to determine how to append the resume flag/session ID.

---

## 4. SupportsHooks

**Type:** `bool`  
**Current pi value:** `false`

### Usage

**Currently only used for display** in `gt config agent get`:
```go
// config.go:309
fmt.Printf("Supports Hooks: %v\n", preset.SupportsHooks)
```

### Notes

- Not used for any functional logic elsewhere in the codebase
- May be intended for future hook-based features
- Claude, Gemini, and OpenCode have `true`; others have `false`

---

## 5. SupportsForkSession

**Type:** `bool`  
**Current pi value:** `false`

### Usage

**Only used in tests** (`agents_test.go:715`) to verify the field is set correctly.

Only Claude has this set to `true` (for the `seance` command).

---

## 6. NonInteractive (Subconfig)

**Type:** `*NonInteractiveConfig`  
**Current pi value:** All fields set (Subcommand="", PromptFlag="", OutputFlag="--mode json")

### NonInteractiveConfig Fields

| Field | Type | Description |
|-------|------|-------------|
| Subcommand | `string` | Subcommand for non-interactive exec (e.g., "exec" for codex) |
| PromptFlag | `string` | Flag for passing prompts (e.g., "-p" for gemini) |
| OutputFlag | `string` | Flag for structured output (e.g., "--json") |

### Usage

**Not currently read or used anywhere in the codebase** (outside of tests and the preset definition itself).

This appears to be:
- Reserved for future use
- Documentation/reference for users
- Potential integration with non-interactive agent execution

---

## Summary

| Field | Status | Recommendation |
|-------|--------|----------------|
| SessionIDEnv | ✅ Set appropriately | Verify pi doesn't set a session env var |
| ResumeFlag | ✅ Set | Verify `--continue` works |
| ResumeStyle | ✅ Set | Already "flag" which is correct |
| SupportsHooks | ✅ Set | Could be `true` if pi gains hooks |
| SupportsForkSession | ✅ Set | Correct as `false` |
| NonInteractive | ⚠️ Not used | Could remove or document intent |

---

## Action Items

1. **Verify pi's `--continue` flag** - Test that session resumption works
2. **Check if pi sets session env vars** - If so, update `SessionIDEnv`
3. **Consider adding "bun" to ProcessNames** - Since pi runs on Bun, detection may need `["pi", "bun"]`

## Verification Results (2026-02-14)

Ran `pi --help` and examined `~/.pi/agent/settings.json` to verify field values:

| Field | Current Value | Verified? |
|-------|---------------|-----------|
| SessionIDEnv | `""` | ✅ Confirmed - pi uses session files in `~/.pi/agent/sessions/`, no env var |
| ResumeFlag | `"--continue"` | ✅ Confirmed - also supports `--resume` for specific session |
| ResumeStyle | `"flag"` | ✅ Confirmed - `--continue` is a flag |
| SupportsHooks | `false` | ✅ Confirmed - no hooks system |
| SupportsForkSession | `false` | ✅ Confirmed - no fork/seance feature |
| NonInteractive.Subcommand | `""` | ✅ Confirmed - uses flags, not subcommands |
| NonInteractive.PromptFlag | `""` | ✅ Confirmed - uses positional arguments |
| NonInteractive.OutputFlag | `"--mode json"` | ✅ Confirmed - `--mode json` flag exists |

**Conclusion:** All preset field values are correct. No changes needed.
