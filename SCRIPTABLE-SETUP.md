# Horarium on your iPhone — widget + reminders

This gets you two things the website alone can't do on iOS:

- **Reminders** that actually fire at your anchor hours, even with the phone locked and the app closed.
- A **home-screen and lock-screen widget** showing what's now and what's next.

Both run off one free app (**Scriptable**) reading your published `schedule.json`. No App Store submission, no $99 developer account, no server.

Why Scriptable instead of the website doing it? On iOS a web app still can't schedule a notification for "5 AM tomorrow" while it's closed, and a website can't place a real home-screen widget at all. Scriptable can do both. The website stays your editor; Scriptable is the bell and the glance.

---

## 0. First: install the web app properly

1. Open **https://kylefrc.github.io/horarium/** in Safari.
2. Share → **Add to Home Screen**. (If you already had an old icon, delete it first and re-add — this makes it a real installed app, which keeps your data from being wiped and lets the icon show a count badge.)

---

## 1. Reminders (the bell)

1. Install **Scriptable** from the App Store (free).
2. Open Scriptable → **＋** (new script) → name it **Horarium Bell**.
3. Paste the contents of `horarium-bell.js` from this repo.
4. Tap ▶︎ to run it once. You'll see "Horarium bells set." Done — those repeat daily forever.

**Default bells** (edit the times at the top of the script to whatever you want):

| Time  | Bell |
|-------|------|
| 5:00 AM  | Morning Office |
| 8:00 PM  | Rosary w/ wife |
| 9:00 PM  | Examen & Night Prayer |

To change a time, edit the `hour`/`minute` in the script and run it once more (it clears the old ones first, so no duplicates).

### Optional: let it re-set itself each morning
So you never have to think about it:

1. **Shortcuts** app → Automation → **＋** → **Time of Day** → 4:45 AM, **Run Immediately**, turn **Notify When Run off**.
2. Action: **Run Script** → choose **Horarium Bell**.

That quietly re-seeds the bells every morning.

---

## 2. The widget

1. In Scriptable → **＋** → name it **Horarium** → paste `widget/horarium-widget.js`. Run it once to preview.
2. **Home screen:** long-press the home screen → **＋** → search **Scriptable** → pick a small or medium widget → add it → long-press the new widget → **Edit Widget** → Script: **Horarium**.
3. **Lock screen:** lock-screen edit → add a **Scriptable** widget → set Script to **Horarium**. The wide rectangular slot reads best ("Now… / Next…").

Tap the widget any time to jump straight into the app.

---

## Honest limits (so nothing surprises you)

- **Widget refresh** is on iOS's schedule (roughly every 5–15 min), not to the second. Since your blocks are hour-long, it flips right around each hour — fine in practice. Don't expect a live ticking countdown.
- **The widget shows your published rule.** If you hand-edit your schedule inside the app, the widget keeps showing the committed `schedule.json` until you re-publish it. (The app's "Publish" step handles that — ask if you want it wired up to push edits automatically.)
- **Fonts:** the widget uses Georgia, since the app's Cormorant/EB Garamond aren't on the system. It reads as the same warm book-serif.

---

## If you'd rather the app itself send the notifications

That's possible too (Web Push from the installed PWA) but it needs a tiny always-on server to fire at the right minute, plus push keys and a daylight-saving-safe schedule. The notification plumbing is already in `service-worker.js`, so it can be added later if you ever want the app to own its reminders instead of Scriptable. For one person on a fixed rhythm, Scriptable is simpler and more reliable — start here.
