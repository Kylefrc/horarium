// ───────────────────────────────────────────────────────────────
// Horarium Widget — Scriptable
// A glanceable "Now / Next" from your rule, on the home or lock screen.
// Reads the same schedule.json the app publishes, caches the last-good
// copy so it still shows when offline.
//
// Home screen: add a Scriptable widget (small or medium) → this script.
// Lock screen: add a Scriptable accessory widget → this script.
// ───────────────────────────────────────────────────────────────

const SCHEDULE_URL = "https://kylefrc.github.io/horarium/schedule.json";
const APP_URL      = "https://kylefrc.github.io/horarium/index.html";

// Horarium palette
const INK   = new Color("#2A2620");
const PARCH = new Color("#F1E9D8");
const GILT  = new Color("#9C7A24");
const MUTED = new Color("#8A7E64");

async function loadSchedule() {
  const KEY = "horarium_schedule_cache";
  try {
    const req = new Request(SCHEDULE_URL);
    req.timeoutInterval = 8;
    const data = await req.loadJSON();
    Keychain.set(KEY, JSON.stringify(data));   // remember last-good for offline
    return data;
  } catch (e) {
    if (Keychain.contains(KEY)) return JSON.parse(Keychain.get(KEY));
    return null;
  }
}

function nowNext(schedule, when) {
  const day  = when.getDay();
  const hour = when.getHours();
  const rows = ((schedule.days || {})[day] || []).slice().sort((a, b) => a.h - b.h);
  let current = null, next = null;
  for (const r of rows) {
    if (r.h <= hour) current = r;
    if (r.h > hour && !next) next = r;
  }
  if (!next) {                                   // nothing later today → first of tomorrow
    const t = ((schedule.days || {})[(day + 1) % 7] || []).slice().sort((a, b) => a.h - b.h);
    if (t.length) next = t[0];
  }
  return { current, next };
}

function domColor(schedule, dom) {
  const d = (schedule.domains || {})[dom];
  return d ? new Color(d.color) : GILT;
}
function fmtHour(h) {
  const ap = h < 12 ? "AM" : "PM";
  let hr = h % 12; if (hr === 0) hr = 12;
  return hr + " " + ap;
}
function nameOf(row) { return row && row.names ? row.names.join(" · ") : "Open hour"; }

// Home-screen widget (small / medium)
function buildHome(schedule, nn, family) {
  const w = new ListWidget();
  w.backgroundColor = PARCH;
  w.url = APP_URL;
  w.setPadding(14, 15, 13, 15);

  const kick = w.addText("NOW · " + fmtHour(nn.current ? nn.current.h : new Date().getHours()));
  kick.font = Font.mediumSystemFont(9);
  kick.textColor = GILT;

  w.addSpacer(4);

  const row = w.addStack();
  row.centerAlignContent();
  const bar = row.addStack();
  bar.size = new Size(3, family === "medium" ? 26 : 22);
  bar.backgroundColor = nn.current ? domColor(schedule, nn.current.domain) : MUTED;
  bar.cornerRadius = 2;
  row.addSpacer(9);
  const name = row.addText(nameOf(nn.current));
  name.font = new Font("Georgia-Bold", family === "medium" ? 22 : 17);
  name.textColor = INK;
  name.lineLimit = 2;

  w.addSpacer();

  if (nn.next) {
    const nxt = w.addText("Next · " + fmtHour(nn.next.h) + " · " + nameOf(nn.next));
    nxt.font = new Font("Georgia", 11);
    nxt.textColor = MUTED;
    nxt.lineLimit = 1;
  }
  return w;
}

// Lock-screen rectangular
function buildRect(schedule, nn) {
  const w = new ListWidget();
  w.url = APP_URL;
  const a = w.addText("Now · " + nameOf(nn.current));
  a.font = new Font("Georgia-Bold", 13);
  if (nn.next) {
    const b = w.addText("Next · " + fmtHour(nn.next.h) + " " + nameOf(nn.next));
    b.font = new Font("Georgia", 11);
  }
  return w;
}
// Lock-screen inline (the thin line by the clock)
function buildInline(schedule, nn) {
  const w = new ListWidget();
  w.url = APP_URL;
  w.addText("Now · " + nameOf(nn.current));
  return w;
}
// Lock-screen circular
function buildCircular(schedule, nn) {
  const w = new ListWidget();
  w.url = APP_URL;
  const t = w.addText(nn.current && nn.current.names ? nn.current.names[0] : "—");
  t.font = Font.boldSystemFont(10);
  t.lineLimit = 2;
  return w;
}

(async () => {
const schedule = await loadSchedule();
let widget;

if (!schedule) {
  widget = new ListWidget();
  widget.backgroundColor = PARCH;
  const t = widget.addText("Horarium — offline");
  t.textColor = INK; t.font = new Font("Georgia", 13);
} else {
  const nn  = nowNext(schedule, new Date());
  const fam = config.widgetFamily;
  if (fam === "accessoryRectangular") widget = buildRect(schedule, nn);
  else if (fam === "accessoryInline")  widget = buildInline(schedule, nn);
  else if (fam === "accessoryCircular") widget = buildCircular(schedule, nn);
  else                                  widget = buildHome(schedule, nn, fam || "small");

  // Nudge a refresh near the next hour boundary (iOS treats this as a hint, ~15 min).
  const now  = new Date();
  const mins = Math.max(1, Math.min(15, 60 - now.getMinutes()));
  widget.refreshAfterDate = new Date(now.getTime() + mins * 60 * 1000);
}

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();   // preview when you run it inside Scriptable
}
Script.complete();
})();
