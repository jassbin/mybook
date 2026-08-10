import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const t = new StreamableHTTPClientTransport(new URL("https://mybook-3eb25c73.eazo.dev/api/mcp"));
const c = new Client({ name:"evaluator", version:"1.0.0" }, { capabilities:{} });
await c.connect(t);
console.log("✓ 线上无token握手成功");
console.log("✓ tools/list:", (await c.listTools()).tools.map(x=>x.name).join(", "));
const p = JSON.parse((await c.callTool({ name:"list_characters", arguments:{ book:"红楼梦" } })).content[0].text);
console.log("✓ list_characters(红楼梦):", p.total, "角色 —", p.characters.map(x=>x.character).join("、"));
const p2 = JSON.parse((await c.callTool({ name:"profile_values", arguments:{ choices:[
 {act:1,choiceId:"A",choiceText:"先保住自己",socialTag:"自保"},{act:2,choiceId:"A",choiceText:"回避风险",socialTag:"自保"},
 {act:3,choiceId:"C",choiceText:"替她顶罪",socialTag:"情义"},{act:4,choiceId:"A",choiceText:"翻脸不认",socialTag:"情义"},
 {act:5,choiceId:"C",choiceText:"维护弱者",socialTag:"公义"}], forAct:3 } })).content[0].text);
console.log("✓ profile_values: 主流="+p2.mainstream?.tag, "隐性="+p2.hidden?.tag, "矛盾="+p2.conflicted?.tag);
await c.close(); console.log("✓ 线上 MCP 全部通过");
