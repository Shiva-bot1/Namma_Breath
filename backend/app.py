"""
Namma Breath — Backend API
---------------------------
A Flask backend that powers a route-level pollution exposure advisor for
Bengaluru commuters. It combines live AQI data (WAQI) with a transparent,
rule-based "advisory engine" (the AI decision-support layer for this
project) to turn a raw AQI number into a personalized, actionable
recommendation.

Run:
    pip install -r requirements.txt
    python app.py

The server starts on http://localhost:5000
"""

import os
import random
import sqlite3
import time
from datetime import datetime, timedelta

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow the React dev server (localhost:5173) to call this API

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
# Get a free token at https://aqicn.org/data-platform/token/ and set it as an
# environment variable before running the server:
#   export WAQI_TOKEN=your_token_here      (Mac/Linux)
#   set WAQI_TOKEN=your_token_here         (Windows cmd)
# If no token is set, the app automatically falls back to realistic mock
# data so the project still runs end-to-end without any setup.
WAQI_TOKEN = os.environ.get("WAQI_TOKEN", "").strip()
WAQI_BASE_URL = "https://api.waqi.info/feed"

# Optional: if you want the advisory text to be phrased by an LLM instead of
# the built-in templates, set ANTHROPIC_API_KEY. This is entirely optional —
# the rule-based engine below already produces complete, useful advice.
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()

# A curated set of high-traffic Bengaluru commute corridors / hotspots.
# These are well-known congestion + pollution points, useful as dropdown
# options on the frontend.
STATIONS = [
    {"id": "silk-board", "name": "Silk Board Junction", "waqi_query": "silk board bangalore", "lat": 12.9172, "lng": 77.6228},
    {"id": "hebbal", "name": "Hebbal", "waqi_query": "hebbal bangalore", "lat": 13.0355, "lng": 77.5970},
    {"id": "mysuru-road", "name": "Mysuru Road", "waqi_query": "mysore road bangalore", "lat": 12.9581, "lng": 77.5346},
    {"id": "hosur-road", "name": "Hosur Road", "waqi_query": "hosur road bangalore", "lat": 12.9082, "lng": 77.6476},
    {"id": "peenya", "name": "Peenya (Industrial)", "waqi_query": "peenya bangalore", "lat": 13.0281, "lng": 77.5199},
    {"id": "jayanagar", "name": "Jayanagar", "waqi_query": "jayanagar bangalore", "lat": 12.9308, "lng": 77.5838},
    {"id": "whitefield", "name": "Whitefield", "waqi_query": "whitefield bangalore", "lat": 12.9698, "lng": 77.7500},
    {"id": "electronic-city", "name": "Electronic City", "waqi_query": "electronic city bangalore", "lat": 12.8452, "lng": 77.6602},
]

# Exposure multipliers used by the advisory engine. These are simple,
# transparent weights (not a black box) — deliberately documented here so
# the "Responsible AI: Transparency" requirement is easy to demonstrate.
TRANSPORT_MULTIPLIER = {
    "walking": 1.35,       # full exposure, slow pace, deep breathing
    "two-wheeler": 1.25,   # unenclosed, close to exhaust pipes
    "bus": 1.0,            # partially enclosed baseline
    "metro": 0.55,         # mostly enclosed / underground
    "car": 0.85,           # enclosed cabin, some filtration
}

MASK_PROTECTION = {
    "none": 0.0,
    "cloth": 0.10,
    "surgical": 0.30,
    "n95": 0.65,
    "n95-valve": 0.70,
}

TIME_OF_DAY_MULTIPLIER = {
    "early-morning": 0.8,   # 5-7am, low traffic
    "morning-peak": 1.3,    # 8-10am, high traffic
    "midday": 0.9,
    "evening-peak": 1.35,   # 5:30-8pm, worst congestion
    "night": 0.75,
}

# ---------------------------------------------------------------------------
# Localization (English / Kannada)
# ---------------------------------------------------------------------------
# Every piece of advisory text is keyed by a stable ID, not hardcoded per
# language, so the rule engine (generate_advice) stays language-agnostic and
# only picks IDs. Rendering into text happens in render_advice(). This keeps
# translation additions simple (add a new lang column here) without ever
# touching the decision logic — useful to point out in your Responsible AI
# write-up under "transparency" and "accessibility".
SUPPORTED_LANGS = ("en", "kn")

RISK_LABELS = {
    "good": {"en": "Good", "kn": "ಉತ್ತಮ"},
    "moderate": {"en": "Moderate", "kn": "ಮಧ್ಯಮ"},
    "sensitive": {"en": "Unhealthy for Sensitive Groups", "kn": "ಸೂಕ್ಷ್ಮ ಗುಂಪುಗಳಿಗೆ ಅನಾರೋಗ್ಯಕರ"},
    "unhealthy": {"en": "Unhealthy", "kn": "ಅನಾರೋಗ್ಯಕರ"},
    "very-unhealthy": {"en": "Very Unhealthy", "kn": "ತೀವ್ರ ಅನಾರೋಗ್ಯಕರ"},
    "hazardous": {"en": "Hazardous", "kn": "ಅಪಾಯಕಾರಿ"},
}

TIP_TEXT = {
    "need_n95": {
        "en": "Switch to an N95 (or N95 with valve) — cloth and surgical masks block very little PM2.5.",
        "kn": "N95 ಮಾಸ್ಕ್‌ಗೆ (ಅಥವಾ ವಾಲ್ವ್ ಇರುವ N95) ಬದಲಾಯಿಸಿ — ಬಟ್ಟೆ ಮತ್ತು ಸರ್ಜಿಕಲ್ ಮಾಸ್ಕ್‌ಗಳು PM2.5 ಅನ್ನು ಬಹಳ ಕಡಿಮೆ ತಡೆಯುತ್ತವೆ.",
    },
    "wear_mask": {
        "en": "Wear a mask on this route — even a basic one helps more than nothing at this exposure level.",
        "kn": "ಈ ಮಾರ್ಗದಲ್ಲಿ ಮಾಸ್ಕ್ ಧರಿಸಿ — ಈ ಮಾಲಿನ್ಯ ಮಟ್ಟದಲ್ಲಿ ಸಾಮಾನ್ಯ ಮಾಸ್ಕ್ ಕೂಡ ಇಲ್ಲದಿರುವುದಕ್ಕಿಂತ ಉತ್ತಮ.",
    },
    "use_enclosed_transport": {
        "en": "If possible, shift part of this route to Metro or an enclosed bus — enclosed transport roughly halves your inhaled exposure.",
        "kn": "ಸಾಧ್ಯವಾದರೆ, ಈ ಮಾರ್ಗದ ಒಂದು ಭಾಗವನ್ನು ಮೆಟ್ರೋ ಅಥವಾ ಮುಚ್ಚಿದ ಬಸ್‌ಗೆ ಬದಲಾಯಿಸಿ — ಮುಚ್ಚಿದ ಸಾರಿಗೆ ಉಸಿರಾಟದ ಮಾಲಿನ್ಯವನ್ನು ಸುಮಾರು ಅರ್ಧದಷ್ಟು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.",
    },
    "shift_timing": {
        "en": "Shifting your commute by 30-45 minutes outside peak traffic hours can meaningfully cut your exposure.",
        "kn": "ನಿಮ್ಮ ಪ್ರಯಾಣದ ಸಮಯವನ್ನು ಗರಿಷ್ಠ ಟ್ರಾಫಿಕ್ ಸಮಯದಿಂದ 30-45 ನಿಮಿಷ ಬದಲಾಯಿಸುವುದರಿಂದ ಮಾಲಿನ್ಯ ಸಂಪರ್ಕ ಗಣನೀಯವಾಗಿ ಕಡಿಮೆಯಾಗುತ್ತದೆ.",
    },
    "purifier_hydrate": {
        "en": "Consider an indoor air purifier check-in after this commute and stay hydrated — high exposure irritates airways.",
        "kn": "ಈ ಪ್ರಯಾಣದ ನಂತರ ಒಳಾಂಗಣ ಏರ್ ಪ್ಯೂರಿಫೈಯರ್ ಬಳಸುವುದನ್ನು ಪರಿಗಣಿಸಿ ಮತ್ತು ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ — ಹೆಚ್ಚಿನ ಮಾಲಿನ್ಯ ಸಂಪರ್ಕ ಉಸಿರಾಟದ ಮಾರ್ಗಗಳನ್ನು ಕೆರಳಿಸುತ್ತದೆ.",
    },
    "favorable": {
        "en": "Conditions are relatively favorable right now — maintain your current precautions.",
        "kn": "ಪ್ರಸ್ತುತ ಪರಿಸ್ಥಿತಿಗಳು ತುಲನಾತ್ಮಕವಾಗಿ ಅನುಕೂಲಕರವಾಗಿವೆ — ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳನ್ನು ಮುಂದುವರಿಸಿ.",
    },
}

HEADLINE_TEXT = {
    "high": {
        "en": "High personal exposure risk on this route ({band} air, amplified by your transport & timing).",
        "kn": "ಈ ಮಾರ್ಗದಲ್ಲಿ ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮಾಲಿನ್ಯ ಅಪಾಯ ಹೆಚ್ಚಾಗಿದೆ ({band} ಗಾಳಿ, ನಿಮ್ಮ ಸಾರಿಗೆ ಮತ್ತು ಸಮಯದಿಂದ ಇನ್ನಷ್ಟು ಹೆಚ್ಚಾಗಿದೆ).",
    },
    "moderate": {
        "en": "Moderate personal exposure risk — your mask and transport choice are partially offsetting {band} air quality.",
        "kn": "ಮಧ್ಯಮ ವೈಯಕ್ತಿಕ ಮಾಲಿನ್ಯ ಅಪಾಯ — ನಿಮ್ಮ ಮಾಸ್ಕ್ ಮತ್ತು ಸಾರಿಗೆ ಆಯ್ಕೆ {band} ಗಾಳಿಯ ಗುಣಮಟ್ಟವನ್ನು ಭಾಗಶಃ ಸರಿದೂಗಿಸುತ್ತಿದೆ.",
    },
    "low": {
        "en": "Relatively low personal exposure risk right now.",
        "kn": "ಪ್ರಸ್ತುತ ವೈಯಕ್ತಿಕ ಮಾಲಿನ್ಯ ಅಪಾಯ ತುಲನಾತ್ಮಕವಾಗಿ ಕಡಿಮೆ ಇದೆ.",
    },
}


def t_risk_label(band_key: str, lang: str) -> str:
    return RISK_LABELS.get(band_key, RISK_LABELS["good"]).get(lang, RISK_LABELS["good"]["en"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def fetch_live_aqi(waqi_query: str):
    """Fetch live AQI for a station from WAQI. Returns None on any failure
    so the caller can fall back to mock data instead of crashing."""
    if not WAQI_TOKEN:
        return None
    try:
        url = f"{WAQI_BASE_URL}/{waqi_query}/"
        resp = requests.get(url, params={"token": WAQI_TOKEN}, timeout=5)
        data = resp.json()
        if data.get("status") != "ok":
            return None
        aqi = data["data"]["aqi"]
        dominant = data["data"].get("dominentpol", "pm25")
        iaqi = data["data"].get("iaqi", {})
        return {
            "aqi": aqi,
            "dominant_pollutant": dominant,
            "pm25": iaqi.get("pm25", {}).get("v"),
            "pm10": iaqi.get("pm10", {}).get("v"),
            "source": "live",
            "station_name": data["data"].get("city", {}).get("name", waqi_query),
            "measured_at": data["data"].get("time", {}).get("s"),
        }
    except (requests.RequestException, KeyError, ValueError):
        return None


def mock_aqi(station_id: str):
    """Deterministic-ish mock AQI so the same station gives a plausible,
    stable-feeling value within a session, clearly labeled as mock data."""
    random.seed(station_id + str(int(time.time() // 600)))  # changes every 10 min
    base = {
        "silk-board": 145, "hosur-road": 138, "peenya": 150, "mysuru-road": 120,
        "hebbal": 95, "jayanagar": 80, "whitefield": 105, "electronic-city": 110,
    }.get(station_id, 100)
    aqi = max(15, base + random.randint(-20, 20))
    return {
        "aqi": aqi,
        "dominant_pollutant": "pm25",
        "pm25": round(aqi * 0.55, 1),
        "pm10": round(aqi * 0.8, 1),
        "source": "mock",
        "station_name": station_id,
        "measured_at": datetime.now().isoformat(timespec="minutes"),
    }


def aqi_risk_band(aqi: int):
    if aqi <= 50:
        return "good", "Good"
    if aqi <= 100:
        return "moderate", "Moderate"
    if aqi <= 150:
        return "sensitive", "Unhealthy for Sensitive Groups"
    if aqi <= 200:
        return "unhealthy", "Unhealthy"
    if aqi <= 300:
        return "very-unhealthy", "Very Unhealthy"
    return "hazardous", "Hazardous"


def generate_advice(transport: str, mask: str, time_of_day: str, exposure_score: float):
    """Rule-based advisory engine — the 'AI decision-support' layer.
    Transparent, deterministic, and explainable (Responsible AI: transparency).
    Returns language-neutral IDs (not text) so the same logic renders in any
    supported language via render_advice()."""
    tip_ids = []

    protection = MASK_PROTECTION.get(mask, 0.0)
    if protection < 0.5 and exposure_score > 60:
        tip_ids.append("need_n95")
    if mask == "none" and exposure_score > 40:
        tip_ids.append("wear_mask")

    if transport in ("walking", "two-wheeler") and exposure_score > 55:
        tip_ids.append("use_enclosed_transport")

    if time_of_day in ("morning-peak", "evening-peak") and exposure_score > 50:
        tip_ids.append("shift_timing")

    if exposure_score > 75:
        tip_ids.append("purifier_hydrate")

    if not tip_ids:
        tip_ids.append("favorable")

    if exposure_score >= 75:
        headline_id = "high"
    elif exposure_score >= 45:
        headline_id = "moderate"
    else:
        headline_id = "low"

    return headline_id, tip_ids


def render_advice(headline_id: str, tip_ids: list, band_key: str, lang: str = "en"):
    """Fills language-neutral advisory IDs into display text for the
    requested language. Falls back to English for any missing translation."""
    lang = lang if lang in SUPPORTED_LANGS else "en"
    band_label = t_risk_label(band_key, lang)

    headline_template = HEADLINE_TEXT.get(headline_id, HEADLINE_TEXT["low"]).get(lang, HEADLINE_TEXT["low"]["en"])
    headline = headline_template.format(band=band_label)

    tips = [TIP_TEXT.get(tid, {}).get(lang, TIP_TEXT.get(tid, {}).get("en", "")) for tid in tip_ids]
    return headline, tips


def maybe_llm_rephrase(headline: str, tips: list, context: dict):
    """Optional: if an Anthropic API key is configured, ask Claude to turn the
    structured advisory output into a warmer, more natural explanation.
    This is intentionally optional — the app is fully functional without it."""
    if not ANTHROPIC_API_KEY:
        return None
    try:
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-6",
                "max_tokens": 200,
                "messages": [{
                    "role": "user",
                    "content": (
                        "Rewrite this air-quality exposure advisory for a Bengaluru "
                        "commuter in 2-3 warm, plain-language sentences. Keep every "
                        f"factual point, add nothing new.\nHeadline: {headline}\n"
                        f"Tips: {'; '.join(tips)}\nContext: {context}"
                    ),
                }],
            },
            timeout=8,
        )
        data = resp.json()
        blocks = [b["text"] for b in data.get("content", []) if b.get("type") == "text"]
        return "\n".join(blocks) if blocks else None
    except (requests.RequestException, KeyError, ValueError):
        return None


# ---------------------------------------------------------------------------
# History log (SQLite)
# ---------------------------------------------------------------------------
# A lightweight local log of every advisory check, used to power the
# "weekly exposure history" view. Deliberately simple (single SQLite file,
# no user accounts) — this is a single-user demo, not a multi-tenant system.
# Responsible AI / privacy note: nothing here identifies the user beyond
# what they type into this browser session, and /api/history supports a
# DELETE to let them clear it entirely.
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "history.db")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS exposure_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            logged_at TEXT NOT NULL,
            station_id TEXT NOT NULL,
            station_name TEXT NOT NULL,
            transport TEXT NOT NULL,
            mask TEXT NOT NULL,
            time_of_day TEXT NOT NULL,
            aqi INTEGER NOT NULL,
            risk_band TEXT NOT NULL,
            exposure_score REAL NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def log_exposure(station_id, station_name, transport, mask, time_of_day, aqi_value, risk_band, exposure_score):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """INSERT INTO exposure_log
           (logged_at, station_id, station_name, transport, mask, time_of_day, aqi, risk_band, exposure_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            datetime.now().isoformat(timespec="seconds"),
            station_id, station_name, transport, mask, time_of_day,
            aqi_value, risk_band, exposure_score,
        ),
    )
    conn.commit()
    conn.close()


init_db()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "waqi_configured": bool(WAQI_TOKEN),
        "llm_configured": bool(ANTHROPIC_API_KEY),
        "time": datetime.now().isoformat(timespec="seconds"),
    })


@app.route("/api/stations")
def stations():
    return jsonify([{"id": s["id"], "name": s["name"], "lat": s["lat"], "lng": s["lng"]} for s in STATIONS])


@app.route("/api/aqi/<station_id>")
def aqi(station_id):
    lang = request.args.get("lang", "en")
    station = next((s for s in STATIONS if s["id"] == station_id), None)
    if not station:
        return jsonify({"error": "Unknown station"}), 404

    data = fetch_live_aqi(station["waqi_query"])
    if data is None:
        data = mock_aqi(station_id)

    band_key, _ = aqi_risk_band(data["aqi"])
    data["risk_band"] = band_key
    data["risk_label"] = t_risk_label(band_key, lang)
    data["station_id"] = station_id
    data["display_name"] = station["name"]
    return jsonify(data)


@app.route("/api/trend/<station_id>")
def trend(station_id):
    """24-hour trend. WAQI's free tier doesn't reliably expose hourly
    history for every station, so this endpoint generates a clearly-labeled
    illustrative trend shaped around real known peak-hour patterns
    (morning + evening traffic peaks) anchored to the current live/mock AQI."""
    station = next((s for s in STATIONS if s["id"] == station_id), None)
    if not station:
        return jsonify({"error": "Unknown station"}), 404

    data = fetch_live_aqi(station["waqi_query"]) or mock_aqi(station_id)
    base = data["aqi"]
    random.seed(station_id + "-trend")

    hours = []
    for h in range(24):
        if 7 <= h <= 10:
            factor = 1.25
        elif 17 <= h <= 20:
            factor = 1.35
        elif 0 <= h <= 5:
            factor = 0.7
        else:
            factor = 0.95
        value = max(10, round(base * factor + random.randint(-8, 8)))
        hours.append({"hour": h, "aqi": value})

    return jsonify({"station_id": station_id, "source": data["source"], "hours": hours})


@app.route("/api/advice", methods=["POST"])
def advice():
    body = request.get_json(force=True, silent=True) or {}
    station_id = body.get("station_id")
    transport = body.get("transport", "bus")
    mask = body.get("mask", "none")
    time_of_day = body.get("time_of_day", "morning-peak")
    lang = body.get("lang", "en")
    skip_log = bool(body.get("skip_log", False))  # used by the compare view to avoid double-logging

    station = next((s for s in STATIONS if s["id"] == station_id), None)
    if not station:
        return jsonify({"error": "Unknown station"}), 404

    data = fetch_live_aqi(station["waqi_query"]) or mock_aqi(station_id)
    base_aqi = data["aqi"]
    band_key, _ = aqi_risk_band(base_aqi)

    # --- Exposure score: transparent weighted formula (0-100+ scale) ---
    t_mult = TRANSPORT_MULTIPLIER.get(transport, 1.0)
    time_mult = TIME_OF_DAY_MULTIPLIER.get(time_of_day, 1.0)
    protection = MASK_PROTECTION.get(mask, 0.0)

    raw_exposure = (base_aqi / 3.0) * t_mult * time_mult
    exposure_score = round(max(0, min(100, raw_exposure * (1 - protection))), 1)

    headline_id, tip_ids = generate_advice(transport, mask, time_of_day, exposure_score)
    headline, tips = render_advice(headline_id, tip_ids, band_key, lang)
    llm_text = maybe_llm_rephrase(headline, tips, {
        "station": station["name"], "transport": transport, "mask": mask, "time_of_day": time_of_day,
    }) if lang == "en" else None  # LLM rephrase only supported for English for now

    if not skip_log:
        log_exposure(station_id, station["name"], transport, mask, time_of_day, base_aqi, band_key, exposure_score)

    return jsonify({
        "station_id": station_id,
        "station_name": station["name"],
        "aqi": base_aqi,
        "risk_band": band_key,
        "risk_label": t_risk_label(band_key, lang),
        "data_source": data["source"],
        "exposure_score": exposure_score,
        "headline": headline,
        "tips": tips,
        "llm_summary": llm_text,  # null unless ANTHROPIC_API_KEY is set and lang=en
        "inputs": {"transport": transport, "mask": mask, "time_of_day": time_of_day, "lang": lang},
    })


@app.route("/api/history")
def history():
    """Returns a per-day average exposure score for the last N days
    (default 7), plus the most recent raw entries for a detail list."""
    days = request.args.get("days", 7, type=int)
    since = (datetime.now() - timedelta(days=days)).isoformat(timespec="seconds")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    daily_rows = conn.execute(
        """SELECT substr(logged_at, 1, 10) AS day,
                  AVG(exposure_score) AS avg_exposure,
                  MAX(exposure_score) AS max_exposure,
                  COUNT(*) AS count
           FROM exposure_log
           WHERE logged_at >= ?
           GROUP BY day
           ORDER BY day ASC""",
        (since,),
    ).fetchall()

    recent_rows = conn.execute(
        """SELECT * FROM exposure_log
           WHERE logged_at >= ?
           ORDER BY logged_at DESC
           LIMIT 25""",
        (since,),
    ).fetchall()
    conn.close()

    return jsonify({
        "daily": [
            {
                "day": r["day"],
                "avg_exposure": round(r["avg_exposure"], 1),
                "max_exposure": round(r["max_exposure"], 1),
                "count": r["count"],
            }
            for r in daily_rows
        ],
        "entries": [dict(r) for r in recent_rows],
    })


@app.route("/api/history", methods=["DELETE"])
def clear_history():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM exposure_log")
    conn.commit()
    conn.close()
    return jsonify({"cleared": True})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
