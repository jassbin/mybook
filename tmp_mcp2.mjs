import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
execSync("node tmp_mksession.cjs > /dev/null 2>&1");
const SESSION = readFileSync("tmp_session.json","utf8").trim();
const t = new StreamableHTTPClientTransport(new URL("http://localhost:3000/api/mcp"), { requestInit:{ headers:{ "x-eazo-session": SESSION } } });
const c = new Client({ name:"verify", version:"1.0.0" }, { capabilities:{} });
await c.connect(t);
const choices = [
 {act:1,choiceId:"A",choiceText:"先保住自己的位置",socialTag:"自保",revealText:"你把自身放第一"},
 {act:2,choiceId:"A",choiceText:"不揽这个险差",socialTag:"自保",revealText:"你回避风险"},
 {act:3,choiceId:"C",choiceText:"替她顶下罪名",socialTag:"情义",revealText:"你愿牺牲"},
 {act:4,choiceId:"A",choiceText:"翻脸不认那段情",socialTag:"情义",revealText:"你转头切割"},
 {act:5,choiceId:"C",choiceText:"公开维护弱者",socialTag:"公义",revealText:"你压下私利站出来"},
];
const r = await c.callTool({ name:"profile_values", arguments:{ choices, forAct:2 } });
const p = JSON.parse(r.content[0].text);
console.log("✓ 主流:", p.mainstream?.tag, "| 隐性:", p.hidden?.tag, "("+p.hidden?.reason+") | 矛盾:", p.conflicted?.tag);
console.log("✓ forAct=2 施压方向片段:", (p.intensifyDirectiveForAct||"").split("\n").find(l=>l.includes("逃·隐性"))?.slice(0,60));
await c.close();
