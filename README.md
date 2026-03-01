# 12 Week Year Tracker

A free, open-source goal tracking app based on [*The 12 Week Year*](https://12weekyear.com/) by Brian P. Moran & Michael Lennington. Set a vision, define goals with weekly tactics, track execution weekly, and review your progress — all in your browser with no account required.

**[Live Demo →](https://kheng2023.github.io/12-week-year/)**

## Features

- **12-Week Cycles** — Create goal cycles with a vision, start/end dates, and track progress across 12 weeks
- **Goals & Tactics** — Define measurable goals and break them into recurring weekly actions
- **Weekly Scorecard** — Check off completed tactics each week and see your execution score in real-time
- **Weekly Review** — Reflect on wins, improvements, and insights each week
- **Dashboard** — Visual charts showing execution score trends, goal completion rates, and weekly breakdowns
- **Data Export/Import** — Download your SQLite database as a `.db` file for backup; import it anytime
- **PWA** — Install as a standalone app on desktop or mobile; works offline after first visit
- **Privacy-first** — All data stays in your browser (IndexedDB). No server, no tracking, no account

## Tech Stack

- **React 19** + TypeScript + Vite
- **MUI (Material UI)** for the UI
- **sql.js** (SQLite compiled to WebAssembly) for in-browser database
- **IndexedDB** for persistent storage
- **Recharts** for data visualization
- **vite-plugin-pwa** for offline/PWA support
- **GitHub Pages** for hosting

## Use Locally

```bash
# 1. Clone the repo
git clone https://github.com/Kheng2023/12-week-year.git
cd 12-week-year

# 2. Install dependencies
npm install

# 3. Development mode (hot reload)
npm run dev

# 4. Or build and serve (production)
npm run build
npx serve dist
```

Then open `http://localhost:3000/12-week-year/` in your browser.

## Desktop App (Tauri)

Run as a fully local desktop app (Windows/macOS/Linux):

```bash
# Install Rust once (required by Tauri)
# https://www.rust-lang.org/tools/install

# Start desktop app in development mode
npm run tauri:dev

# Build an installable desktop app
npm run tauri:build
```

On Windows, the installer/exe is generated under:

`src-tauri/target/release/bundle/`

After installing, launch it directly from the desktop/start menu (no terminal).

## The 12 Week Year Method

Instead of vague annual goals, the 12 Week Year method compresses your planning into 12-week cycles:

1. **Vision** — Define what success looks like
2. **Goals** — Set 2-3 measurable goals for the 12 weeks
3. **Tactics** — Break each goal into specific weekly actions
4. **Scorecard** — Track which tactics you complete each week (aim for **85%+**)
5. **Review** — Reflect weekly on wins, failures, and adjustments

The shorter time frame creates urgency and eliminates the "I'll start next month" trap.

## License

MIT
