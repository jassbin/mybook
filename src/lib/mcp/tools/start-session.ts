import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createWorldState,
  getCharacterDNA,
  selectDilemmas,
  buildPrinciplesPrompt,
} from "@/lib/agent";
import { callActGenerator } from "@/app/api/narrative/init/route";

/**
 * start_session —— 用指定的名著角色发起一局「难得读书」，返回第一幕。
 * 复用与 /api/narrative/init 完全相同的叙事 Agent 逻辑（角色 DNA → 世界状态 →
 * 困境选材 → 原则检查 → AI 生成第一幕）。仅支持内置预设角色（先用 list_characters 查有效 { book, character }）。
 * 会真实调用 AI 模型生成内容，依赖 EAZO_* 环境变量。
 */
export function registerStartSession(server: McpServer, _userId: string) {
  server.registerTool(
    "start_session",
    {
      description:
        "Start a new 难得读书 play-through as a specific classic character and return the first act " +
        "(scene narration + first-person decision options). Reuses the same narrative Agent as the app. " +
        "Only built-in preset characters are supported — call list_characters first to get a valid { book, character } pair. " +
        "Set intensify=true for Extreme-Pressure Mode. This calls the AI model and needs EAZO_* env vars configured.",
      inputSchema: {
        book: z.string().describe("Book title, e.g. 红楼梦 / 三国演义 / 水浒传 / 西游记 (no 《》)"),
        character: z.string().describe("Character name, e.g. 林黛玉 / 诸葛亮. Must be a preset character."),
        intensify: z
          .boolean()
          .optional()
          .describe("Optional: true = Extreme-Pressure Mode (shorter, irreversible dilemmas). Default false."),
      },
    },
    async ({ book, character, intensify }) => {
      const dna = getCharacterDNA(character, book);
      if (!dna) {
        // 截断超长输入，避免把几千字符的垃圾原样回显
        const short = (s: string) => (s.length > 30 ? s.slice(0, 30) + "…" : s);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No preset character "${short(character ?? "")}" in book "${short(book ?? "")}". Call list_characters to see valid pairs (book titles work with or without 《》).`,
            },
          ],
        };
      }

      const state = createWorldState(book, dna.name, dna.modernMapping, dna.axes);
      if (intensify) {
        state.maxActs = 6;
        (state as unknown as { intensifyMode: boolean }).intensifyMode = true;
      }

      const dilemmas = selectDilemmas(dna.dominantDomains ?? [], intensify ? 3 : 1, [], 3);
      const { instructions } = buildPrinciplesPrompt(
        Object.fromEntries(state.axes.map((a) => [a.key, a.score])),
        1, 0, 0, []
      );

      try {
        const firstAct = await callActGenerator({
          state,
          dilemmas,
          instructions,
          openingHook: dna.openingHook,
          isFirstAct: true,
          intensifyMode: !!intensify,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  book,
                  character: dna.name,
                  tagline: dna.modernMapping,
                  intensify: !!intensify,
                  act: firstAct,
                  worldState: state,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to generate the first act: ${
                err instanceof Error ? err.message : String(err)
              }. Ensure EAZO_* env vars are configured for the AI proxy.`,
            },
          ],
        };
      }
    }
  );
}
