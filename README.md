# Namma Breath — Bengaluru Commute Exposure Advisor

A route-level pollution exposure advisor for Bengaluru commuters. Instead of
one citywide AQI number, it estimates YOUR personal exposure based on the
corridor you travel, your transport mode, mask, and time of day — then gives
plain-language, actionable advice.

**SDG Alignment:** SDG 11 (Sustainable Cities & Communities), SDG 3 (Good
Health & Well-being), SDG 13 (Climate Action).

---

## Project structure

```
namma-breath/
├── backend/                    Flask API (Python)
│   ├── app.py                  routes, advisory engine, i18n text, SQLite history
│   ├── requirements.txt
│   ├── .env.example
│   └── history.db              created automatically on first run (git-ignore this)
└── frontend/                   React + Vite app
    ├── index.html
    ├── package.json
    └── src/
        ├── App.jsx             tabs: Advisor / Compare / History
        ├── i18n.js             UI chrome strings (English/Kannada)
        ├── api/client.js
        └── components/
            ├── AqiHeader, ExposureRing, StationSelector, CommuteControls
            ├── AdviceCard, TrendChart, LanguageToggle, TabNav
            ├── CompareView          (side-by-side route comparison)
            └── HistoryView          (7-day exposure chart + log)
```

---

## 1. Run the backend

```bash
cd backend
python -m venv venv               # first time only
venv\Scripts\activate              # Windows
# source venv/bin/activate         # Mac/Linux
python -m pip install -r requirements.txt
python app.py
```

The API starts at **http://localhost:5000**. Test it:

```bash
curl http://localhost:5000/api/health
```

### Optional: live AQI data
By default the app runs on realistic mock data (no setup needed). To use
**real live AQI**:

1. Get a free token at https://aqicn.org/data-platform/token/
2. Set it as an environment variable before running `app.py`:
   ```bash
   # Windows cmd
   set WAQI_TOKEN=your_token_here
   # Mac/Linux
   export WAQI_TOKEN=your_token_here
   ```
3. Restart `python app.py`. The `/api/health` response will show
   `"waqi_configured": true`, and advisory responses will show
   `"data_source": "live"`.

### Optional: LLM-phrased advice
If you also set `ANTHROPIC_API_KEY`, the advisory headline gets rephrased by
Claude into warmer natural language. This is entirely optional — the
built-in rule-based advisory engine already gives complete, useful output
without it.

---

## 2. Run the frontend

Open a **second terminal** (keep the backend running in the first):

```bash
cd frontend
npm install
npm run dev
```

Open the URL it prints (usually **http://localhost:5173**).

---

## How it works (for your documentation / presentation)

- **Data layer**: `/api/aqi/<station>` fetches live AQI from WAQI, falling
  back to labeled mock data if no token is configured or the request fails.
- **AI/decision layer** (`generate_advice` in `app.py`): a transparent,
  rule-based advisory engine. It combines the station's AQI with your
  transport mode, mask type, and time-of-day using documented weights
  (see `TRANSPORT_MULTIPLIER`, `MASK_PROTECTION`, `TIME_OF_DAY_MULTIPLIER`
  in `app.py`) to produce a personal **Exposure Score (0–100)** and
  matching tips. This transparency is intentional — it makes the
  "Responsible AI: Fairness & Transparency" section of your documentation
  straightforward to write, since every recommendation can be traced back
  to a specific, documented rule.
- **Optional LLM layer**: if `ANTHROPIC_API_KEY` is set, the structured
  advice is rephrased more conversationally — demonstrating how a
  prompt-engineered LLM layer could sit on top of a transparent
  rule-based core (a good talking point for "why AI is needed").

## New features

**Language toggle (English / Kannada)** — every piece of advisory text
(headline, tips, risk label) is stored as a stable ID in `app.py`
(`TIP_TEXT`, `HEADLINE_TEXT`, `RISK_LABELS`) and rendered into whichever
language the frontend requests via the `lang` field. The decision logic
(`generate_advice`) never touches text directly — it only picks IDs — so
adding a third language later means adding one more column to these
dictionaries, not touching any logic. UI chrome strings (tab names, section
titles) live separately in `frontend/src/i18n.js`.

**Weekly exposure history** — every advisory check is logged to a local
SQLite file (`backend/history.db`, created automatically on first run) via
the `exposure_log` table. `GET /api/history?days=7` returns a per-day
average/max exposure plus the most recent raw entries; `DELETE /api/history`
clears it. The History tab in the app renders this as a bar chart plus a
recent-checks list, with a "Clear history" button.

**Compare two routes** — the Compare tab calls `/api/advice` twice (once
per selected corridor) with the same transport/mask/time inputs and
`skip_log: true` so comparisons don't pollute your real history. It shows
both routes side-by-side with their Exposure Rings and states which one
carries lower risk under those conditions.

## Responsible AI notes (starting points for your write-up)

- **Transparency**: exposure scoring uses a documented, inspectable formula
  — not a black-box model — so users can see exactly why they got a
  recommendation.
- **Fairness**: advice doesn't assume access to a car or a purifier;
  options span walking/bus/metro and no-mask to N95, so it's usable across
  income levels.
- **Privacy**: no personal location tracking — the user manually picks a
  corridor from a fixed list; nothing is stored server-side.
- **Limitation to disclose**: the 24-hour trend and mock AQI are
  illustrative when live data isn't configured — this should be stated
  clearly in your presentation, not presented as measured data.
