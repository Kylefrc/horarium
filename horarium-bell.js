// ───────────────────────────────────────────────────────────────
// Horarium Bell — Scriptable
// Gentle daily reminders for your anchor practices. They fire even
// with the phone locked and the app closed (true system notifications).
//
// Run once after you install it. Re-run only when you change a time
// below — or let the morning Shortcuts automation re-run it for you
// (see SCRIPTABLE-SETUP.md).
// ───────────────────────────────────────────────────────────────

const APP_URL = "https://kylefrc.github.io/horarium/index.html";

// Your bells. Edit hour (24-hour clock), minute, and the lines freely.
// Keep it to a few so it stays a quiet bell, not a nag.
const ANCHORS = [
  { id: "hor-office", hour: 5,  minute: 0, title: "Morning Office",        body: "Begin the day with the Lord." },
  { id: "hor-rosary", hour: 20, minute: 0, title: "Rosary w/ wife",        body: "A decade together before the day closes." },
  { id: "hor-examen", hour: 21, minute: 0, title: "Examen & Night Prayer", body: "Give thanks · review the day · rest in Him.", url: APP_URL + "?examen=1" }
];

// Remove any bells we set before, so re-running never stacks duplicates.
async function clearOurs() {
  const pending = await Notification.allPending();
  for (const n of pending) {
    if ((n.identifier || "").indexOf("hor-") === 0) n.remove();
  }
}

async function setBells() {
  for (const a of ANCHORS) {
    const n = new Notification();
    n.identifier = a.id;
    n.title = a.title;
    n.body = a.body;
    n.sound = "default";
    n.openURL = a.url || APP_URL;     // tap → opens Horarium (Examen bell deep-links to the review)
    n.threadIdentifier = "horarium";
    n.setDailyTrigger(a.hour, a.minute, true);  // repeats every day, indefinitely
    await n.schedule();
  }
}

(async () => {
await clearOurs();
await setBells();

// Confirmation when you run it by hand inside Scriptable.
if (config.runsInApp) {
  const two = (x) => (x < 10 ? "0" + x : "" + x);
  const list = ANCHORS.map(a => "•  " + two(a.hour) + ":" + two(a.minute) + "  —  " + a.title).join("\n");
  const alert = new Alert();
  alert.title = "Horarium bells set";
  alert.message = "Daily reminders scheduled:\n\n" + list + "\n\nThey’ll keep firing each day. Re-run only to change times.";
  alert.addAction("Good");
  await alert.present();
}
Script.complete();
})();
