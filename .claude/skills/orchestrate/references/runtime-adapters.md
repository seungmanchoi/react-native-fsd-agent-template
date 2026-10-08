# Runtime Adapters — Claude Code ↔ Codex

The agents and skills are written once (`.claude/`) and copied to Codex by `npm run sync:codex`. Their text names Claude Code tools. When you run in **Codex**, read each name as the right-hand column.

| Written in the docs | Claude Code | Codex CLI |
|---|---|---|
| "spawn / delegate to agent `X`", `Agent` tool, `subagent_type: X` | `Agent` tool with `subagent_type: "X"` (definition: `.claude/agents/X.md`) | Spawn a subagent with role `X` (definition: `.codex/agents/X.toml`). If subagents are unavailable, read `.codex/agents/X.toml` and do the work yourself, one role at a time |
| `SendMessage` to a running agent | `SendMessage` with the agent ID | Send the follow-up to the same subagent thread, or re-spawn it with the previous output file from `_workspace/` |
| `AskUserQuestion` | `AskUserQuestion` (choices UI) | Ask in chat as a short numbered list with a recommended option. In `codex exec` (non-interactive) take the recommended option and log it to `_workspace/decisions.log` |
| `/skill-name`, "invoke skill X", `Skill` tool | `/X` or the `Skill` tool (`.claude/skills/X/`) | `$X` or select it in `/skills` (`.agents/skills/X/`), or just describe the task — skills trigger from their description |
| `/loop /iterate-app` | `/loop` wraps a skill in a repeating loop | No `/loop`. Ask for N cycles: "Run iterate-app for 3 cycles; stop on a FAIL verify gate or when the backlog is empty" |
| `/store-deploy`, `store-deploy:*` skills | Plugin from `.claude/settings.json` (`seungmanchoi/store-deploy-plugin`) | `codex plugin marketplace add seungmanchoi/store-deploy-plugin`, then `codex plugin add store-deploy@store-deploy-marketplace` |
| `mcp__playwright__browser_*` | Playwright MCP server | Any configured browser tool (Playwright MCP if added to `~/.codex/config.toml`). With none, hand the console steps to the user and continue |
| `mcp__codegraph__*` | CodeGraph MCP | Same server if configured, else `codegraph` CLI, else grep |
| `TodoWrite` / task list | Built-in | Codex plan tool (`update_plan`) |
| Stop hook → `npm run verify` | `.claude/settings.json` `hooks.Stop` | `.codex/hooks.json` (trust it once in `/hooks`) |

## Rules that do not change between runtimes

- Hard Thresholds (CLAUDE.md) and `npm run verify` are the pass/fail gate in both runtimes. A hook that is not installed or not trusted does not lift the gate — run `npm run verify` yourself before reporting done.
- Inter-agent artifacts go through files in `_workspace/`, never through chat memory, so either runtime can resume the other's work.
- Simulator checks use `sim-use` in both runtimes.
