import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const thisExtMessageType = "gastown";
const autonomousRoles = new Set(["polecat", "witness", "refinery", "deacon"]);

export default function (pi: ExtensionAPI) {
  const role = (process.env.GT_ROLE || "").toLowerCase();

  const gastownPrime = async () => {
    let primeText = "";
    try {
      const { stdout } = await pi.exec("gt", ["prime", "--hook"]);
      primeText = stdout;
    } catch (e) {
      console.error("[gastown] gt prime failed:", e);
    }
    return primeText;
  };

  const gastownMailCheck = async () => {
    let mailText = "";
    try {
      const { stdout } = await pi.exec("gt", ["mail", "check", "--inject"]);
      mailText = stdout;
    } catch (e) {
      console.error("[gastown] gt mail check --inject failed:", e);
    }
    return mailText;
  };

  pi.on("session_start", async (_event, _ctx) => {
    const primeText = await gastownPrime();
    if (!primeText) return;

    const mailText = await gastownMailCheck();
    pi.sendMessage(
      {
        customType: thisExtMessageType,
        content: primeText + "\n\n" + mailText,
        display: true,
      },
      {
        deliverAs: "steer",
        triggerTurn: false,
      },
    );
  });

  pi.on("before_agent_start", async (_event, _ctx) => {
    const mailText = await gastownMailCheck();
    if (!mailText || !autonomousRoles.has(role)) return;

    return {
      message: {
        customType: thisExtMessageType,
        content: mailText,
        display: true,
      },
    };
  });

  pi.on("session_compact", async (_event, _ctx) => {
    const primeText = await gastownPrime();
    if (!primeText) return;

    pi.sendMessage(
      {
        customType: thisExtMessageType,
        content: primeText,
        display: true,
      },
      {
        deliverAs: "followUp",
        triggerTurn: true,
      },
    );
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    const sessionId = ctx.sessionManager.getSessionId();
    try {
      await pi.exec("gt", ["costs", "record", "--session", sessionId]);
    } catch (e) {
      console.error("[gastown] gt costs record failed:", e);
    }
  });
}
