import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ChoiceRecord } from "@/lib/agent/world-state";
import { buildValueProfile, buildIntensifyDirectiveForAct } from "@/lib/agent/value-profile";

/**
 * profile_values —— 「难得读书」最核心的分析能力，暴露为 MCP 工具。
 * 传入一局的选择轨迹，返回三类价值画像（主流 / 隐性 / 矛盾），
 * 以及针对某一幕的「分型施压」方向（第1幕砸主流 / 第2幕逃隐性 / 第3幕撞矛盾）。
 * 纯计算、无用户私有数据、可复现。
 */
export function registerProfileValues(server: McpServer, _userId: string) {
  server.registerTool(
    "profile_values",
    {
      description:
        "Analyze a play-through's choice trajectory and return a three-layer VALUE PROFILE: " +
        "mainstream (the value repeatedly upheld), hidden (a low-frequency but revealing value the player may not notice), " +
        "and conflicted (a back-and-forth contradiction). " +
        "Optionally also returns the typed-pressure directive for a given act (act 1 hits mainstream, act 2 chases hidden, act 3 collides the conflict). " +
        "This is the analytic core of 难得读书 — turning a list of choices into a portrait of someone's plural values.",
      inputSchema: {
        choices: z
          .array(
            z.object({
              act: z.number().int().describe("Which act this choice was made in (1-based)"),
              choiceId: z.enum(["A", "B", "C"]).describe("A=self-preserving, B=middle, C=self-sacrificing"),
              choiceText: z.string().describe("The option text the player chose"),
              socialTag: z.string().describe("The value/situation tag of this dilemma, e.g. 自保 / 情义 / 公义"),
              revealText: z.string().optional().describe("The one-line 'tell' about what this choice reveals"),
              consequenceText: z.string().optional().describe("Short summary of the consequence"),
            })
          )
          .min(1)
          .describe("The ordered choice trajectory of one play-through"),
        forAct: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Optional: also return the typed-pressure directive targeting this act number"),
      },
    },
    async ({ choices, forAct }) => {
      const history: ChoiceRecord[] = choices.map((c) => ({
        act: c.act,
        choiceId: c.choiceId,
        choiceText: c.choiceText,
        socialTag: c.socialTag,
        revealText: c.revealText ?? "",
        consequenceText: c.consequenceText ?? "",
      }));

      const profile = buildValueProfile(history);
      const result: Record<string, unknown> = {
        mainstream: profile.mainstream
          ? { tag: profile.mainstream.tag, count: profile.mainstream.count }
          : null,
        hidden: profile.hidden ? { tag: profile.hidden.tag, reason: profile.hidden.reason } : null,
        conflicted: profile.conflicted
          ? {
              tag: profile.conflicted.tag,
              self: profile.conflicted.forA.choiceText,
              sacrifice: profile.conflicted.forC.choiceText,
            }
          : null,
      };
      if (typeof forAct === "number") {
        result.intensifyDirectiveForAct = buildIntensifyDirectiveForAct(profile, forAct).trim();
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
