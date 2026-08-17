const base = "http://127.0.0.1:3000/api/trpc";

async function call(procedure, json) {
  const response = await fetch(`${base}/${procedure}?batch=1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 0: { json } }),
  });
  const payload = await response.json();
  const item = payload[0];
  if (!response.ok || item?.error) throw new Error(JSON.stringify(item?.error ?? payload));
  return item.result.data.json;
}

const startedAt = Date.now();
const session = await call("narrative.begin", {
  bookTitle: "红楼梦", character: "林黛玉", locale: "zh-CN", mode: "normal",
});
const actWithChoices = await call("narrative.choices", { state: session.state, act: session.act });
const next = await call("narrative.continue", { state: session.state, choice: actWithChoices.choices[0] });

console.log(JSON.stringify({
  elapsedMs: Date.now() - startedAt,
  firstActMessages: session.act.messages.length,
  choiceCount: actWithChoices.choices.length,
  consequenceCount: actWithChoices.consequences.length,
  nextActNumber: next.state.actNumber,
  nextActMessages: next.act.messages.length,
}, null, 2));
