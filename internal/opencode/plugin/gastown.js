// =============================================================================
// Gas Town OpenCode Plugin
// =============================================================================
// This plugin integrates OpenCode with the Gas Town multi-agent system by:
// 1. Injecting role context when a session starts or is compacted
// 2. Recording session costs on session deletion
// 3. Adding custom context to compaction prompts
// =============================================================================

/**
 * Gas Town Plugin - Main export for OpenCode plugin system
 * 
 * OpenCode passes these parameters to plugins (see docs):
 * - $: Shell execution helper (like Bun's $)
 * - directory: Current working directory
 * - project: Project info
 * - client: OpenCode client API
 * - worktree: Git worktree info
 * 
 * We use: $, directory (from process.env.GT_ROLE for role detection)
 */
export const GasTown = async ({ $, directory }) => {
  // Read the Gas Town role from environment variable
  // GT_ROLE determines what type of agent this session is running as
  const role = (process.env.GT_ROLE || "").toLowerCase();
  
  // Roles that should receive mail injections (autonomous agents)
  // These agents check their "mailbox" for work assignments
  const autonomousRoles = new Set(["polecat", "witness", "refinery", "deacon"]);
  
  // Track if we've already initialized to prevent duplicate initialization
  // on multiple session.created events (OpenCode may fire this event once)
  let didInit = false;

  /**
   * Execute a shell command with error handling
   * 
   * Uses OpenCode's $ (Bun shell) for command execution
   * .cwd(directory) ensures commands run in the correct project directory
   * .catch() is handled internally to prevent plugin crashes
   * 
   * @param {string} cmd - Command to execute
   */
  const run = async (cmd) => {
    try {
      // -l: Login shell (loads .profile, .bashrc, etc.)
      // -c: Command string follows
      await $`/bin/sh -lc ${cmd}`.cwd(directory);
    } catch (err) {
      // Log errors but don't throw - plugin errors can break OpenCode
      console.error(`[gastown] ${cmd} failed`, err?.message || err);
    }
  };

  /**
   * Inject Gas Town context into the session
   * 
   * This is called on:
   * - session.created: Initial role context injection
   * - session.compacted: Re-inject context after context compression
   * 
   * Actions performed:
   * 1. gt prime: Loads role-specific AGENTS.md context
   * 2. gt mail check --inject: For autonomous roles, check for new work
   */
  const injectContext = async () => {
    // gt prime: Injects AGENTS.md context based on GT_ROLE
    // This gives the LLM knowledge of its role, protocols, and available tools
    await run("gt prime");
    
    // For autonomous agents, check for work in their "mailbox"
    // This enables the "pull" model where agents check for new tasks
    if (autonomousRoles.has(role)) {
      await run("gt mail check --inject");
    }
    
    // NOTE: session-started nudge to deacon removed — it interrupted
    // the deacon's await-signal backoff. Deacon wakes on beads activity.
  };

  /**
   * Event Hook Handler
   * 
   * OpenCode fires various events during a session lifecycle:
   * - session.created: New session started
   * - session.compacted: Context was compressed (compaction)
   * - session.deleted: Session was deleted/closed
   * 
   * Plugin returns an "event" handler that receives all events
   */
  return {
    /**
     * Handle session lifecycle events
     * 
     * @param {Object} params - Event parameters from OpenCode
     * @param {Object} params.event - The event object with type and properties
     */
    event: async ({ event }) => {
      // session.created: Fires when OpenCode starts a new session
      // This is where we inject initial context (role, protocols)
      if (event?.type === "session.created") {
        // Prevent re-initialization on duplicate events
        if (didInit) return;
        didInit = true;
        await injectContext();
      }

      // session.compacted: Fires after OpenCode compresses context
      // After compaction, we need to re-inject context that may have been lost
      if (event?.type === "session.compacted") {
        await injectContext();
      }

      // session.deleted: Fires when a session ends
      // Record cost data for this session before it's gone
      if (event?.type === "session.deleted") {
        const sessionID = event.properties?.info?.id;
        if (sessionID) {
          // Record session costs asynchronously, don't block
          // .catch() here is unnecessary due to run() handling, but explicit
          await $`gt costs record --session ${sessionID}`.catch(() => {});
        }
      }
    },

    /**
     * Compaction Hook - experimental.session.compacting
     * 
     * This hook fires BEFORE OpenCode generates the continuation summary.
     * It allows plugins to inject additional context that should persist
     * through the compaction process.
     * 
     * @param {Object} input - Input parameters
     * @param {string} input.sessionID - The session being compacted
     * @param {Object} output - Output that can be modified
     * @param {string[]} output.context - Array of context strings to inject
     * @param {string} [output.prompt] - Can replace entire prompt (optional)
     * 
     * We add guidance about Gas Town protocols to help the LLM understand
     * what to do after context is compressed.
     */
    "experimental.session.compacting": async ({ sessionID }, output) => {
      // Display role in context for clarity
      const roleDisplay = role || "unknown";
      
      // Inject Gas Town system context into the compaction prompt
      // This tells the LLM how to behave after compaction:
      // - Run gt prime to restore full context
      // - Check hook for immediate work (GUPP principle)
      // - Know what role this agent is playing
      output.context.push(`
## Gas Town Multi-Agent System

**After Compaction:** Run \`gt prime\` to restore full context.
**Check Hook:** \`gt hook\` - if work present, execute immediately (GUPP).
**Role:** ${roleDisplay}
`);
    },
  };
};
