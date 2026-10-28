const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
async function chk(label, url, init={}) {
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, ...(init.headers||{}) }, method: init.method||"GET", body: init.body, signal: AbortSignal.timeout(20000) });
    const ct = r.headers.get("content-type")||"";
    let extra = "";
    if (ct.includes("json") || ct.includes("text")) { try { extra = (await r.text()).slice(0,200); } catch {} }
    console.log(label, r.status, ct, extra.replace(/\n/g," "));
  } catch(e) { console.log(label, "ERR", String(e.message||e).slice(0,100)); }
}
await chk("text-legacy-get", "https://text.pollinations.ai/Say%20hello%20in%20one%20word");
await chk("image-legacy-get", "https://image.pollinations.ai/prompt/a%20red%20apple?width=256&height=256&seed=1");
await chk("gen-image-get", "https://gen.pollinations.ai/image/a%20red%20apple?width=256&height=256&seed=1");
await chk("gen-chat-post", "https://gen.pollinations.ai/v1/chat/completions", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({model:"openai",messages:[{role:"user",content:"say hi"}]}) });
await chk("legacy-chat-post-openai", "https://text.pollinations.ai/openai", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({model:"openai",messages:[{role:"user",content:"say hi"}]}) });
await chk("tts-legacy", "https://text.pollinations.ai/Say%20hello?model=openai-audio&voice=nova");
await chk("models-list-text", "https://text.pollinations.ai/models");
await chk("models-list-image", "https://image.pollinations.ai/models");
