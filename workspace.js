/* Sandcode Workspace — mock data + interactions (no backend) */
const MODELS = ["Claude Sonnet", "GPT-5.2", "Gemini 3 Pro", "Sand Zen Auto"];

const DB = {
  projects: [
    {
      id: "web", name: "sandcode-web", sessions: [
        {
          id: "s-auth", title: "Refactor auth middleware", model: "Claude Sonnet",
          status: "active", updated: "2m ago", shared: true, shareSlug: "k7Qx2m9Z",
          tokens: "48.2K", cost: "$1.84", started: "Today 09:41",
          blocks: [
            { role: "user", text: "The auth middleware is doing too much — split token verification from rate limiting and add tests." },
            { role: "assistant", text: "On it. Reading the current middleware first to map the responsibilities.", tools: [
              { type: "read", title: "Read src/middleware/auth.ts", detail: "142 lines · 3 exports" }
            ]},
            { role: "assistant", text: "Confirmed: <code>auth()</code> verifies tokens <i>and</i> enforces limits. I'll extract <code>verifyToken()</code> and <code>limitByIP()</code>, then wire them in <code>server.ts</code>.", tools: [
              { type: "edit", title: "Edit src/middleware/auth.ts", diff: "  import { verify } from \"./tokens\";\n- export function auth(req, res, next) {\n+ export async function verifyToken(req, res, next) {\n      const token = req.headers.authorization?.split(\" \")[1];\n      req.user = await verify(token);\n      next();\n+ }\n+\n+ export function auth(req, res, next) {\n+   return verifyToken(req, res, () => limitByIP(req, res, next));\n    }" }
            ]},
            { role: "assistant", text: "Middleware split. Running the auth test suite to verify nothing broke.", tools: [
              { type: "bash", title: "$ bun test src/middleware", output: "22 pass · 0 fail · 310ms" }
            ]},
            { role: "assistant", text: "Done — 22/22 green. <code>verifyToken</code> and <code>limitByIP</code> are exported separately so routes can compose them. Want me to open a PR description?" }
          ]
        },
        {
          id: "s-flaky", title: "Fix flaky login test", model: "GPT-5.2",
          status: "idle", updated: "1h ago", shared: false, shareSlug: null,
          tokens: "12.6K", cost: "$0.42", started: "Today 08:15",
          blocks: [
            { role: "user", text: "login.spec.ts fails ~1 in 5 runs on CI. Probably a timing issue with the session cookie." },
            { role: "assistant", text: "Checking the spec and the session helper for un-awaited setup.", tools: [
              { type: "read", title: "Read tests/login.spec.ts", detail: "68 lines · 4 cases" }
            ]},
            { role: "assistant", text: "Found it — the test asserts the cookie before <code>await login()</code> resolves. I'll add an explicit wait for the redirect.", tools: [
              { type: "edit", title: "Edit tests/login.spec.ts", diff: "- await login(page);\n- expect(cookie).toBeDefined();\n+ await login(page);\n+ await page.waitForURL(\"**/dashboard\");\n+ expect(await cookieJar.get(\"sid\")).toBeDefined();" }
            ]}
          ]
        }
      ]
    },
    {
      id: "api", name: "api-gateway", sessions: [
        {
          id: "s-limit", title: "Add rate limiting to /v1/chat", model: "Sand Zen Auto",
          status: "running", updated: "now", shared: false, shareSlug: null,
          tokens: "31.9K", cost: "$0.97", started: "Today 10:02",
          blocks: [
            { role: "user", text: "Add per-key rate limiting to POST /v1/chat — 60 req/min, 429 with Retry-After." },
            { role: "assistant", text: "Scaffolding the limiter with a sliding window in Redis, then guarding the route.", tools: [
              { type: "write", title: "Create src/limits/sliding.ts", detail: "+84 lines" },
              { type: "bash", title: "$ bun test src/limits", output: "9 pass · 0 fail · 122ms" }
            ]},
            { role: "assistant", text: "Limiter is in and tested. Wiring it into the chat route now…" }
          ]
        }
      ]
    },
    {
      id: "docs", name: "docs", sessions: [
        {
          id: "s-faq", title: "Rewrite pricing FAQ", model: "Gemini 3 Pro",
          status: "idle", updated: "Yesterday", shared: true, shareSlug: "m3Pv8xRt",
          tokens: "8.1K", cost: "$0.21", started: "Yesterday 16:20",
          blocks: [
            { role: "user", text: "Rewrite the pricing FAQ in plain English, max 2 sentences per answer." },
            { role: "assistant", text: "Done — trimmed 6 answers, all under 2 sentences. Preview is in <code>go.html</code>, diff below.", tools: [
              { type: "edit", title: "Edit go.html", diff: "- <p>A flat monthly subscription plus a bucket of model credits…</p>\n+ <p>A flat subscription plus a bucket of credits. Top-ups cost API price — zero markup.</p>" }
            ]}
          ]
        }
      ]
    }
  ]
};

let current = DB.projects[0].sessions[0];
let seq = 0;
let view = "convo";
let dtab = "info";

/* mock repo trees per project */
const TREES = {
  web: [
    { n: "src", t: "d", c: [
      { n: "middleware", t: "d", c: [{ n: "auth.ts", t: "f", lines: 156 }, { n: "limit.ts", t: "f", lines: 48 }] },
      { n: "routes", t: "d", c: [{ n: "index.ts", t: "f", lines: 92 }, { n: "dashboard.ts", t: "f", lines: 131 }] },
      { n: "server.ts", t: "f", lines: 74 }
    ]},
    { n: "tests", t: "d", c: [{ n: "login.spec.ts", t: "f", lines: 71 }, { n: "auth.test.ts", t: "f", lines: 88 }] },
    { n: "package.json", t: "f", lines: 34 }
  ],
  api: [
    { n: "src", t: "d", c: [
      { n: "limits", t: "d", c: [{ n: "sliding.ts", t: "f", lines: 84 }] },
      { n: "routes", t: "d", c: [{ n: "chat.ts", t: "f", lines: 117 }] }
    ]},
    { n: "wrangler.toml", t: "f", lines: 19 }
  ],
  docs: [
    { n: "go.html", t: "f", lines: 210 },
    { n: "index.html", t: "f", lines: 168 },
    { n: "style.css", t: "f", lines: 342 }
  ]
};

const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function allSessions() {
  return DB.projects.flatMap((p) => p.sessions.map((s) => ({ ...s, project: p.name, pid: p.id })));
}
function findSession(id) {
  for (const p of DB.projects) for (const s of p.sessions) if (s.id === id) return { s, pname: p.name };
  return null;
}
function shareUrl(s) { return "https://sandcode.ai/s/" + s.shareSlug; }

/* ---------- sidebar ---------- */
function renderSidebar() {
  const q = ($("sess-search").value || "").toLowerCase();
  const host = $("project-list");
  host.innerHTML = "";
  let empty = true;
  DB.projects.forEach((p) => {
    const list = p.sessions.filter((s) => (s.title + p.name).toLowerCase().includes(q));
    if (!list.length) return;
    empty = false;
    const g = document.createElement("div");
    g.className = "proj";
    g.innerHTML = "<div class='proj-name'>" + esc(p.name) + "</div>";
    list.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sess" + (s.id === current.id ? " active" : "");
      b.innerHTML = "<span class='st st-" + s.status + "'></span>" +
        "<span class='sess-main'><span class='sess-title'>" + esc(s.title) + "</span>" +
        "<span class='sess-meta'>" + esc(s.model) + " · " + esc(s.updated) + "</span></span>" +
        (s.shared ? "<span class='shared-tag'>shared</span>" : "");
      b.addEventListener("click", () => openSession(s.id));
      g.appendChild(b);
    });
    host.appendChild(g);
  });
  if (empty) host.innerHTML = "<div class='empty'>No sessions match.</div>";
}

/* ---------- stream ---------- */
function toolCard(t) {
  let inner = "<div class='tool-head'><span class='tool-type'>" + t.type + "</span><span>" + esc(t.title) + "</span></div>";
  if (t.detail) inner += "<div class='tool-detail'>" + esc(t.detail) + "</div>";
  if (t.diff) {
    const lines = esc(t.diff).split("\n").map((l) =>
      l.startsWith("+") ? "<div class='dl add'>" + l + "</div>" :
      l.startsWith("-") ? "<div class='dl del'>" + l + "</div>" :
      "<div class='dl'>" + l + "</div>").join("");
    inner += "<pre class='diff'>" + lines + "</pre>";
  }
  if (t.output) inner += "<div class='tool-output'>" + esc(t.output) + "</div>";
  return "<div class='tool'>" + inner + "</div>";
}
function renderStream() {
  const st = $("stream");
  st.innerHTML = "";
  current.blocks.forEach((b) => {
    const d = document.createElement("div");
    d.className = "msg " + b.role;
    if (b.role === "user") {
      d.innerHTML = "<div class='bubble'>" + b.text + "</div>";
    } else {
      d.innerHTML = "<div class='a-avatar'>S</div><div class='a-body'><div class='bubble'>" + b.text + "</div>" +
        (b.tools || []).map(toolCard).join("") + "</div>";
    }
    st.appendChild(d);
  });
  const pane = $("pane-convo");
  if (pane) pane.scrollTop = pane.scrollHeight;
  $("crumb-proj").textContent = findSession(current.id).pname;
  $("crumb-sess").textContent = current.title;
  $("model-badge").textContent = current.model;
  $("model-pick").value = MODELS.includes(current.model) ? current.model : MODELS[0];
  renderShareBar();
  renderDetail();
  renderChanges();
  renderTimeline();
  renderFiles();
  renderSidebar();
}
function pushBlock(b) {
  current.blocks.push(b);
  renderStream();
}

/* ---------- share ---------- */
function renderShareBar() {
  const bar = $("share-bar");
  const show = !!current.shared;
  bar.hidden = !show;
  $("share-btn").textContent = show ? "Shared ✓" : "Share";
  $("copy-link-btn").hidden = !show;
  if (show) $("share-url").textContent = shareUrl(current);
}
function doShare() {
  if (!current.shared) {
    seq += 1;
    current.shareSlug = "mock" + Date.now().toString(36).slice(-4) + seq;
    current.shared = true;
  }
  renderShareBar(); renderDetail(); renderSidebar();
  copyText(shareUrl(current));
}
function doUnshare() {
  current.shared = false; current.shareSlug = null;
  renderShareBar(); renderDetail(); renderSidebar();
}
function copyText(t) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).catch(() => {}); return; }
  } catch (e) {}
  const ta = document.createElement("textarea");
  ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
}

/* ---------- detail panel ---------- */
function changedFiles() {
  const files = [];
  current.blocks.forEach((b) => (b.tools || []).forEach((t) => {
    if (t.type === "edit" || t.type === "write") {
      const m = t.title.match(/(?:Edit|Create) (.+)/);
      files.push({ name: m ? m[1] : t.title, kind: t.type, tool: t });
    }
  }));
  return files;
}
function blockTokens(b) {
  return Math.round(b.text.replace(/<[^>]+>/g, "").length * 1.7 + (b.tools || []).length * 640);
}
function burnChart() {
  const vals = current.blocks.map(blockTokens);
  if (!vals.length) return "";
  const W = 260, H = 92, pad = 8;
  const max = Math.max(...vals);
  const n = vals.length;
  const slot = (W - pad * 2) / n;
  const bw = Math.max(6, slot * 0.55);
  let bars = "", pts = [], cum = 0;
  const total = vals.reduce((a, b) => a + b, 0);
  vals.forEach((v, i) => {
    const h = Math.max(3, (v / max) * (H - 30));
    const x = pad + i * slot + (slot - bw) / 2;
    const y = H - 14 - h;
    bars += "<rect x='" + x.toFixed(1) + "' y='" + y.toFixed(1) + "' width='" + bw.toFixed(1) + "' height='" + h.toFixed(1) + "' rx='2'/>";
    cum += v;
    pts.push(((x + bw / 2).toFixed(1)) + "," + (H - 14 - (cum / total) * (H - 30)).toFixed(1));
  });
  return "<div class='d-sec'>Token burn (" + total.toLocaleString() + " total)</div>" +
    "<svg class='burn' viewBox='0 0 " + W + " " + H + "'>" +
    "<g class='burn-bars'>" + bars + "</g>" +
    "<polyline class='burn-line' points='" + pts.join(" ") + "'/></svg>" +
    "<div class='d-muted'>Bars per message · line is cumulative</div>";
}
function renderDetail() {
  const files = changedFiles();
  $("detail-body").innerHTML =
    row("Status", "<span class='st st-" + current.status + "'></span> " + current.status) +
    row("Model", esc(current.model)) +
    row("Tokens", esc(current.tokens)) +
    row("Cost", esc(current.cost)) +
    row("Started", esc(current.started)) +
    "<div class='d-sec'>Share link</div>" +
    (current.shared
      ? "<div class='d-share'><code>" + shareUrl(current) + "</code><button type='button' id='d-copy'>Copy</button></div>"
      : "<div class='d-muted'>Not shared. Press Share to publish.</div>") +
    "<div class='d-sec'>Changed files (" + files.length + ")</div>" +
    (files.length
      ? files.map((f) => "<div class='d-file'><span class='tool-type'>" + f.kind + "</span><span>" + esc(f.name) + "</span></div>").join("")
      : "<div class='d-muted'>No edits yet.</div>") +
    burnChart();
  const c = $("d-copy");
  if (c) c.addEventListener("click", () => copyText(shareUrl(current)));
}
function row(k, v) { return "<div class='d-row'><span>" + k + "</span><b>" + v + "</b></div>"; }

/* ---------- Changes tab ---------- */
function renderChanges() {
  const files = changedFiles();
  const cc = $("changes-count");
  if (cc) cc.textContent = files.length ? "(" + files.length + ")" : "";
  const host = $("changes");
  if (!files.length) {
    host.innerHTML = "<div class='pane-empty'>No file changes in this session yet.<br>Edits and created files will appear here as diffs.</div>";
    return;
  }
  host.innerHTML = files.map((f, i) => {
    const t = f.tool;
    let body = "";
    if (t.diff) {
      body = "<pre class='diff'>" + esc(t.diff).split("\n").map((l) =>
        l.startsWith("+") ? "<div class='dl add'>" + l + "</div>" :
        l.startsWith("-") ? "<div class='dl del'>" + l + "</div>" :
        "<div class='dl'>" + l + "</div>").join("") + "</pre>";
    } else {
      body = "<div class='tool-detail'>" + esc(t.detail || "created") + "</div>";
    }
    return "<div class='chg' id='chg-" + i + "' data-file='" + esc(f.name) + "'>" +
      "<div class='chg-head'><span class='tool-type'>" + f.kind + "</span><b>" + esc(f.name) + "</b></div>" + body + "</div>";
  }).join("");
}

/* ---------- Timeline tab ---------- */
function renderTimeline() {
  const evs = [];
  let clock = 0;
  current.blocks.forEach((b) => {
    clock += 1;
    if (b.role === "user") {
      evs.push({ t: "T+" + clock + "m", k: "you", d: "Asked: " + b.text.replace(/<[^>]+>/g, "").slice(0, 90) });
    } else {
      clock += 1;
      evs.push({ t: "T+" + clock + "m", k: "reply", d: "Replied (" + blockTokens(b).toLocaleString() + " tokens)" });
      (b.tools || []).forEach((t) => {
        clock += 1;
        evs.push({ t: "T+" + clock + "m", k: t.type, d: t.title });
      });
    }
  });
  $("timeline").innerHTML = evs.length
    ? evs.map((e) => "<div class='tl-row'><span class='tl-t'>" + e.t + "</span><span class='tl-dot tl-" + e.k + "'></span><span class='tl-d'>" + esc(e.d) + "</span></div>").join("")
    : "<div class='pane-empty'>Nothing yet.</div>";
}

/* ---------- Files tab (repo tree) ---------- */
function treeHtml(nodes) {
  return nodes.map((n) => {
    if (n.t === "d") {
      return "<details class='tree-dir' open><summary><span class='tree-ico'>▾</span>" + esc(n.n) + "</summary><div class='tree-kids'>" + treeHtml(n.c) + "</div></details>";
    }
    return "<button type='button' class='tree-file' data-file='" + esc(n.n) + "'><span class='tree-ico'>◦</span>" + esc(n.n) + "<span class='tree-lines'>" + n.lines + "</span></button>";
  }).join("");
}
function renderFiles() {
  const proj = DB.projects.find((p) => p.sessions.some((s) => s.id === current.id));
  const tree = proj ? (TREES[proj.id] || []) : [];
  $("files-body").innerHTML = "<div class='d-sec'>Repo · " + esc(proj ? proj.name : "") + "</div>" +
    "<div class='tree'>" + treeHtml(tree) + "</div>" +
    "<div class='d-muted' style='margin-top:8px'>Click a file to jump to its diff.</div>";
  $("files-body").querySelectorAll(".tree-file").forEach((b) =>
    b.addEventListener("click", () => gotoChanges(b.dataset.file)));
}
function gotoChanges(name) {
  switchView("changes");
  setTimeout(() => {
    const cards = $("changes").querySelectorAll(".chg");
    for (const c of cards) {
      if ((c.dataset.file || "").endsWith(name)) {
        c.scrollIntoView({ behavior: "smooth", block: "center" });
        c.classList.add("flash");
        setTimeout(() => c.classList.remove("flash"), 1600);
        return;
      }
    }
    toast("No changes to " + name + " in this session (mock).");
  }, 60);
}

/* ---------- view tabs ---------- */
function switchView(v) {
  view = v;
  document.querySelectorAll("#view-tabs button").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === v));
  $("pane-convo").hidden = v !== "convo";
  $("pane-changes").hidden = v !== "changes";
  $("pane-timeline").hidden = v !== "timeline";
}
function switchDtab(t) {
  dtab = t;
  document.querySelectorAll(".d-tabs button").forEach((b) =>
    b.classList.toggle("active", b.dataset.dtab === t));
  $("detail-body").hidden = t !== "info";
  $("files-body").hidden = t !== "files";
}

/* ---------- toast + theme ---------- */
let toastTimer = null;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 1800);
}
function setTheme(t) {
  document.body.dataset.theme = t;
  $("theme-btn").textContent = t === "light" ? "☾" : "☀";
  try { localStorage.setItem("sandcode-theme", t); } catch (e) {}
}
function initTheme() {
  let t = "dark";
  try { t = localStorage.getItem("sandcode-theme") || "dark"; } catch (e) {}
  setTheme(t);
}

/* ---------- session ops ---------- */
function openSession(id) {
  const f = findSession(id);
  if (!f) return;
  current = f.s;
  renderStream();
  closeMobilePanels();
}
function newSession() {
  const s = {
    id: "s-new-" + Date.now(), title: "Untitled session", model: $("model-pick").value || MODELS[0],
    status: "active", updated: "now", shared: false, shareSlug: null,
    tokens: "0", cost: "$0.00", started: "Just now",
    blocks: [{ role: "assistant", text: "New session ready. Tell me what to build, and I'll read the repo first." }]
  };
  DB.projects[0].sessions.unshift(s);
  openSession(s.id);
}
const CANNED = [
  "Got it — scanning the relevant files now, then I'll propose a plan before touching anything.",
  "Makes sense. I'll implement that with tests and run the suite before summarizing.",
  "On it. I'll keep the diff small and flag anything risky inline."
];
function send() {
  const inp = $("composer-input");
  const text = inp.value.trim();
  if (!text) return;
  inp.value = "";
  pushBlock({ role: "user", text: esc(text) });
  const think = document.createElement("div");
  think.className = "msg assistant";
  think.id = "thinking";
  think.innerHTML = "<div class='a-avatar'>S</div><div class='a-body'><div class='bubble thinking'><span></span><span></span><span></span></div></div>";
  $("stream").appendChild(think);
  const pane = $("pane-convo");
  if (pane) pane.scrollTop = pane.scrollHeight;
  setTimeout(() => {
    const el = $("thinking");
    if (el) el.remove();
    current.tokens = "mock";
    pushBlock({
      role: "assistant",
      text: CANNED[Math.floor(Math.random() * CANNED.length)],
      tools: [{ type: "read", title: "Read " + guessFile(text), detail: "mock preview" }]
    });
  }, 900);
}
function guessFile(t) {
  const m = t.match(/[\w\-./]+\.(ts|tsx|js|py|go|md|html|css)/);
  return m ? m[0] : "src/index.ts";
}

/* ---------- mobile panels ---------- */
function closeMobilePanels() {
  $("side").classList.remove("open"); $("side-scrim").hidden = true;
  $("detail").classList.remove("open"); $("detail-scrim").hidden = true;
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderSidebar(); renderStream();
  document.querySelectorAll("#view-tabs button").forEach((b) =>
    b.addEventListener("click", () => switchView(b.dataset.view)));
  document.querySelectorAll(".d-tabs button").forEach((b) =>
    b.addEventListener("click", () => switchDtab(b.dataset.dtab)));
  $("theme-btn").addEventListener("click", () =>
    setTheme(document.body.dataset.theme === "light" ? "dark" : "light"));
  $("sess-search").addEventListener("input", renderSidebar);
  $("new-session").addEventListener("click", newSession);
  $("send-btn").addEventListener("click", send);
  $("composer-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });
  $("model-pick").addEventListener("change", (e) => { current.model = e.target.value; renderStream(); });
  $("share-btn").addEventListener("click", doShare);
  $("copy-link-btn").addEventListener("click", () => copyText(shareUrl(current)));
  $("unshare-btn").addEventListener("click", doUnshare);
  $("servers-btn").addEventListener("click", () => { $("servers-pop").hidden = !$("servers-pop").hidden; });
  $("menu-side").addEventListener("click", () => {
    $("side").classList.add("open"); $("side-scrim").hidden = false;
  });
  $("side-scrim").addEventListener("click", closeMobilePanels);
  const openDetail = () => { $("detail").classList.add("open"); $("detail-scrim").hidden = false; };
  $("detail-toggle").addEventListener("click", openDetail);
  $("detail-close").addEventListener("click", closeMobilePanels);
  $("detail-scrim").addEventListener("click", closeMobilePanels);
});
