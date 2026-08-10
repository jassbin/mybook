import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { execSync } from "node:child_process";

execSync("node tmp_mksession.cjs > /dev/null 2>&1"); const SESSION = (await import("node:fs")).readFileSync("tmp_session.json","utf8").trim();
const transport = new StreamableHTTPClientTransport(new URL("http://localhost:3000/api/mcp"), {
  requestInit: { headers: { "x-eazo-session": SESSION } },
});
const client = new Client({ name: "verify", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);
console.log("✓ connected & initialized");
const tools = await client.listTools();
console.log("✓ tools:", tools.tools.map(t => t.name).join(", "));
const r = await client.callTool({ name: "list_characters", arguments: {} });
const txt = r.content[0].text;
const parsed = JSON.parse(txt);
console.log("✓ list_characters(《红楼梦》) => total:", parsed.total, "| 角色:", parsed.characters.map(c=>c.character).join("、"));
await client.close();
