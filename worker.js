// Cloudflare Worker (module format)
// MuseStarlinkpay71 - Aggregator Worker
// - Token validation (MAIN_TOKEN / GUEST_TOKEN)
// - sources aggregation (DEFAULT_SOURCES or ?sources=...)
// - parsing: minimal Clash YAML, vmess:// (base64 JSON), socks://, raw base64 lists
// - dedupe
// - output: clash (yaml) or json, optional base64 encoding
// - KV: NODES_KV (store nodes & metadata), RATE_KV (rate limiting)
// - Scheduled handler: hourly diff & Telegram notify (SEND_TG periodically)
// NOTE: Fill secrets via wrangler secret put / Cloudflare dashboard
import YAML from 'yaml';

const RATE_LIMIT_PER_MIN = 100; // fallback if RATE_PER_MIN not set in env

function base64Encode(s){ return btoa(unescape(encodeURIComponent(s))); }
function base64Decode(s){
  try { return decodeURIComponent(escape(atob(s))); } catch(e){ return null; }
}

// parse vmess://<base64>
function parseVmessUrl(u){
  try{
    const b = u.replace(/^vmess:\/\//i,'');
    const jsonStr = base64Decode(b);
    if(!jsonStr) return null;
    const j = JSON.parse(jsonStr);
    return {
      name: j.ps || (`vmess-${j.add}:${j.port}`),
      type: 'vmess',
      server: j.add,
      port: parseInt(j.port||0),
      uuid: j.id,
      alterId: j.aid || 0,
      network: j.net || 'tcp',
      raw: j
    };
  }catch(e){ return null; }
}

// parse socks://user:pass@host:port
function parseSocksUrl(u){
  try{
    const m = u.match(/^socks:\/\/([^@]+)@([^:\/]+):(\d+)/i);
    if(!m) return null;
    const auth = m[1];
    const server = m[2];
    const port = parseInt(m[3]);
    return {
      name: `socks-${server}:${port}`,
      type: 'socks5',
      server, port, auth
    };
  }catch(e){ return null; }
}

// minimal clash YAML parsing to extract proxies list (best-effort)
function parseClashYaml(text){
  try{
    const doc = YAML.parse(text);
    if(!doc || !doc.proxies) return [];
    return doc.proxies.map(p => {
      return {
        name: p.name || p['remark'] || `${p.type}-${p.server||'unknown'}`,
        type: p.type,
        server: p.server,
        port: p.port,
        cipher: p.cipher || p.method || p.proto,
        raw: p
      };
    });
  }catch(e){
    return [];
  }
}

async function fetchSourceText(src){
  try{
    const res = await fetch(src, { redirect: 'follow', cf: { cacheTtl: 30 } });
    if(!res.ok) return null;
    return await res.text();
  }catch(e){
    return null;
  }
}

// dedupe key generator
function nodeKey(n){
  if(n.type && n.server && n.port) return `${n.type}|${n.server}|${n.port}|${n.uuid||''}`;
  return JSON.stringify([n.type,n.server,n.port,n.name]);
}

// YAML serializer for Clash output (simple)
function buildClashYaml(obj){
  const out = {};
  out['proxies'] = obj.proxies.map(p => {
    const o = {};
    o.name = p.name;
    o.type = p.type;
    if(p.server) o.server = p.server;
    if(p.port) o.port = p.port;
    if(p.cipher) o.cipher = p.cipher;
    if(p.note) o.note = p.note;
    return o;
  });
  out['proxy-groups'] = obj['proxy-groups'] || [];
  out['rules'] = obj.rules || [];
  return YAML.stringify(out);
}

export default {
  async fetch(request, env, ctx){
    const url = new URL(request.url);
    const token = url.searchParams.get('token') || '';
    const mainToken = env.MAIN_TOKEN || '';
    const guestToken = env.GUEST_TOKEN || '';
    if(!token || (token !== mainToken && token !== guestToken)) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Rate limiting using KV if available
    try{
      if(env.RATE_KV){
        const nowMin = Math.floor(Date.now()/60000);
        const rateKey = `rate:${token}:${nowMin}`;
        const raw = await env.RATE_KV.get(rateKey);
        const count = raw ? parseInt(raw) : 0;
        const lim = parseInt(env.RATE_PER_MIN || RATE_LIMIT_PER_MIN);
        if(count >= lim) return new Response('Too Many Requests', { status: 429 });
        await env.RATE_KV.put(rateKey, String(count+1), { expirationTtl: 70 });
      }
    }catch(e){
      // ignore kv errors
    }

    // get sources from query or DEFAULT_SOURCES env
    let sources = [];
    const sourcesParam = url.searchParams.get('sources');
    if(sourcesParam){
      sources = sourcesParam.split(',').map(s=>s.trim()).filter(Boolean);
    } else if(env.DEFAULT_SOURCES){
      try{ sources = JSON.parse(env.DEFAULT_SOURCES); }catch(e){ sources = []; }
    }

    // If no source, return an example minimal subscription
    if(sources.length === 0){
      const sample = {
        proxies: [{ name: "sample-node-1", type: "ss", server:"1.2.3.4", port:443, cipher:"aes-128-gcm" }],
        'proxy-groups': [],
        rules: ["GEOIP,CN,DIRECT","MATCH,Fallback"]
      };
      const target = url.searchParams.get('target') || 'clash';
      const encode = url.searchParams.get('encode') || 'plain';
      if(target === 'clash'){
        const yaml = buildClashYaml(sample);
        if(encode === 'base64') return new Response(base64Encode(yaml), { headers: { 'Content-Type':'text/plain' }});
        return new Response(yaml, { headers: { 'Content-Type':'text/plain' }});
      } else {
        return new Response(JSON.stringify(sample,null,2), { headers:{ 'Content-Type':'application/json' }});
      }
    }

    // Aggregate
    const aggregated = { proxies: [], 'proxy-groups': [], rules: [] };
    const seen = new Set();

    for(const src of sources){
      const text = await fetchSourceText(src);
      if(!text) continue;
      if(text.includes('proxies:')) {
        const parsed = parseClashYaml(text);
        for(const p of parsed){
          const k = nodeKey(p);
          if(!seen.has(k)){ aggregated.proxies.push(p); seen.add(k); }
        }
      } else if(src.startsWith('vmess://') || text.trim().startsWith('vmess://')){
        const lines = (text.indexOf('\n')!==-1)? text.split(/\r?\n/): [text];
        for(const l of lines){
          if(!l.trim()) continue;
          if(l.trim().startsWith('vmess://')){
            const p = parseVmessUrl(l.trim());
            if(p){
              const k = nodeKey(p);
              if(!seen.has(k)){ aggregated.proxies.push(p); seen.add(k); }
            }
          }
        }
      } else if(src.startsWith('socks://') || (text.trim() && text.trim().startsWith('socks://'))){
        const p = parseSocksUrl(text.trim() || src);
        if(p){
          const k = nodeKey(p);
          if(!seen.has(k)){ aggregated.proxies.push(p); seen.add(k); }
        }
      } else {
        const maybe = base64Decode(text.trim());
        if(maybe){
          try{
            const j = JSON.parse(maybe);
            if(Array.isArray(j)){
              for(const item of j){
                if(item.add || item.server){
                  const p = {
                    name: item.ps || item.name || `${item.add||item.server}:${item.port||item.p}`,
                    type: item.type || 'vmess',
                    server: item.add || item.server,
                    port: parseInt(item.port || item.p || 0),
                    raw: item
                  };
                  const k = nodeKey(p);
                  if(!seen.has(k)){ aggregated.proxies.push(p); seen.add(k); }
                }
              }
            }
          }catch(e){ /* ignore */ }
        } else {
          const p = { name:`raw-src:${src}`, type:'raw', note:'未解析的订阅或受限源', rawText: text.slice(0,200) };
          const k = nodeKey(p);
          if(!seen.has(k)){ aggregated.proxies.push(p); seen.add(k); }
        }
      }
    }

    // build default groups & rules
    aggregated['proxy-groups'] = [
      { name: "回国", type: "select", proxies: aggregated.proxies.map(p => p.name).slice(0,5) },
      { name: "Fallback", type: "fallback", proxies: aggregated.proxies.map(p => p.name) }
    ];
    aggregated.rules = [
      "RULE-SET,china-cn,回国",
      "DOMAIN-SUFFIX,google.com,海外",
      "MATCH,Fallback"
    ];

    // persist nodes to KV NODES_KV for detection & history (best-effort, non-blocking)
    try{
      if(env.NODES_KV){
        const nodesCompact = aggregated.proxies.map(p => ({
          key: nodeKey(p), name:p.name, type:p.type, server:p.server, port:p.port, note:p.note||''
        }));
        const now = Date.now();
        await env.NODES_KV.put(`nodes:latest`, JSON.stringify({ ts: now, nodes: nodesCompact }));
      }
    }catch(e){ /* ignore */ }
    
    // output
    const target = url.searchParams.get('target') || 'clash';
    const encode = url.searchParams.get('encode') || 'plain';
    let out = '';
    if(target === 'clash'){
      out = buildClashYaml(aggregated);
    } else {
      out = JSON.stringify(aggregated, null, 2);
    }
    if(encode === 'base64'){ 
      return new Response(base64Encode(out), { headers: { 'Content-Type':'text/plain' }});
    }
    return new Response(out, { headers: { 'Content-Type':'text/plain' }});
  },

  // scheduled handler: hourly diff + Telegram notify using KV snapshots
  async scheduled(controller, env, ctx){
    try{
      if(!env.NODES_KV || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
      const latestRaw = await env.NODES_KV.get('nodes:latest');
      if(!latestRaw) return;
      const latest = JSON.parse(latestRaw);
      const prevRaw = await env.NODES_KV.get('nodes:prev');
      const prev = prevRaw ? JSON.parse(prevRaw) : null;
      const changed = !prevRaw || JSON.stringify(prev.nodes) !== JSON.stringify(latest.nodes);
      await env.NODES_KV.put('nodes:prev', JSON.stringify(latest));
      if(changed){
        const add = latest.nodes.length - (prev ? prev.nodes.length : 0);
        const msg = `【museStarlinkpay71】订阅节点更新\n总节点: ${latest.nodes.length}\n变动: ${add >=0 ? '+'+add : add}\n时间: ${new Date(latest.ts).toISOString()}`;
        const bot = env.TELEGRAM_BOT_TOKEN;
        const chat = env.TELEGRAM_CHAT_ID;
        const url = `https://api.telegram.org/bot${bot}/sendMessage`;
        try{
          await fetch(url, {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({ chat_id: chat, text: msg })
          });
        }catch(e){ /* don't fail scheduled */ }
      }
    }catch(e){
      // swallow
    }
  }
};
