import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CHARACTER_DNA, normalizeTitle } from "@/lib/agent/character-dna";

/**
 * list_characters —— 列出「难得读书」里所有可代入的名著角色。
 * 纯静态目录数据（无用户私有数据），供 AI 客户端先了解有哪些书/角色可玩，
 * 再决定用哪个角色调用 start_session。
 */
export function registerListCharacters(server: McpServer, _userId: string) {
  server.registerTool(
    "list_characters",
    {
      description:
        "List all classic-literature characters a player can step into in 难得读书 (mybook). " +
        "Returns each character's book, one-line modern mapping, the value domains they surface, " +
        "and their core wound. Call this first to discover valid { book, character } pairs for start_session.",
      inputSchema: {
        book: z
          .string()
          .optional()
          .describe("Optional: filter to a single book title, e.g. 《红楼梦》. Omit to list all."),
      },
    },
    async ({ book }) => {
      // 归一化过滤：空串/纯空白按「无过滤（列全部）」处理；书名号/emoji/空白均容错匹配
      const nBook = normalizeTitle(book ?? "");
      const list = CHARACTER_DNA
        .filter((c) => (nBook ? normalizeTitle(c.book) === nBook : true))
        .map((c) => ({
          book: c.book,
          character: c.name,
          modernMapping: c.modernMapping,
          coreWound: c.coreWound,
          protects: c.protects,
          fears: c.fears,
          domains: c.dominantDomains,
        }));

      if (list.length === 0) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: book
                ? `No characters found for book "${book}". Call list_characters without a filter to see all books.`
                : "No characters available.",
            },
          ],
        };
      }

      const books = [...new Set(list.map((c) => c.book))];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { total: list.length, books, characters: list },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
