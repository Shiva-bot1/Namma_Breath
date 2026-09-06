"""
pytest unit tests for the Namma Breath advisory engine.

Covers:
  - Exposure Score formula (happy path, boundary clipping, unknown keys)
  - generate_advice rule branches (all tip IDs and headline bands)
  - aqi_risk_band thresholds (boundary values)
  - render_advice language handling
  - Edge cases: zero AQI, AQI above scale, None-like fallbacks
"""

import pytest

# ── isolate the module so we never need a real Flask context ────────────────
import importlib, sys, types, os

# Provide a stub for python-dotenv so the import doesn't fail without the package
if "dotenv" not in sys.modules:
    stub = types.ModuleType("dotenv")
    stub.load_dotenv = lambda: None
    sys.modules["dotenv"] = stub

# Set dummy env vars before importing so Flask doesn't complain
os.environ.setdefault("WAQI_TOKEN", "")
os.environ.setdefault("ANTHROPIC_API_KEY", "")

import app as advisory   # app.py is in the same directory


# ════════════════════════════════════════════════════════════════════════════
# Helpers — replicate the formula so tests are self-documenting
# ════════════════════════════════════════════════════════════════════════════

def calc_exposure(base_aqi, transport, mask, time_of_day):
    """Mirror of the formula inside /api/advice."""
    t_mult   = advisory.TRANSPORT_MULTIPLIER.get(transport, 1.0)
    time_mult = advisory.TIME_OF_DAY_MULTIPLIER.get(time_of_day, 1.0)
    protection = advisory.MASK_PROTECTION.get(mask, 0.0)
    raw = (base_aqi / 3.0) * t_mult * time_mult
    return round(max(0, min(100, raw * (1 - protection))), 1)


# ════════════════════════════════════════════════════════════════════════════
# 1. Exposure Score — formula correctness
# ════════════════════════════════════════════════════════════════════════════

class TestExposureScoreFormula:

    def test_typical_case_bus_no_mask_morning_peak(self):
        # AQI=150, bus (1.0), morning-peak (1.3), none (0.0)
        # raw = (150/3) * 1.0 * 1.3 = 65.0 ; score = 65.0
        score = calc_exposure(150, "bus", "none", "morning-peak")
        assert score == 65.0

    def test_walking_amplifies_exposure(self):
        # walking (1.35) > bus (1.0) — same everything else must give higher score
        score_walk = calc_exposure(120, "walking", "none", "midday")
        score_bus  = calc_exposure(120, "bus",     "none", "midday")
        assert score_walk > score_bus

    def test_metro_reduces_exposure(self):
        # metro multiplier is the lowest (0.55)
        score_metro = calc_exposure(200, "metro", "none", "morning-peak")
        score_walk  = calc_exposure(200, "walking", "none", "morning-peak")
        assert score_metro < score_walk

    def test_n95_mask_cuts_score_significantly(self):
        # protection = 0.65  →  score is 35 % of no-mask score
        base = 150
        score_none = calc_exposure(base, "bus", "none", "midday")
        score_n95  = calc_exposure(base, "bus", "n95",  "midday")
        assert score_n95 == pytest.approx(score_none * (1 - 0.65), abs=0.2)

    def test_n95_valve_is_better_than_n95(self):
        score_n95       = calc_exposure(200, "two-wheeler", "n95",       "evening-peak")
        score_n95_valve = calc_exposure(200, "two-wheeler", "n95-valve", "evening-peak")
        assert score_n95_valve < score_n95

    def test_evening_peak_higher_than_night(self):
        score_peak  = calc_exposure(100, "car", "none", "evening-peak")
        score_night = calc_exposure(100, "car", "none", "night")
        assert score_peak > score_night

    def test_score_never_exceeds_100(self):
        # Extreme AQI with highest multipliers should be clipped at 100
        score = calc_exposure(500, "walking", "none", "evening-peak")
        assert score == 100.0

    def test_score_never_below_zero(self):
        # AQI of 0 should yield 0 (not negative)
        score = calc_exposure(0, "walking", "none", "morning-peak")
        assert score == 0.0

    def test_zero_aqi_always_zero(self):
        for transport in advisory.TRANSPORT_MULTIPLIER:
            for mask in advisory.MASK_PROTECTION:
                for tod in advisory.TIME_OF_DAY_MULTIPLIER:
                    assert calc_exposure(0, transport, mask, tod) == 0.0

    def test_full_protection_mask_reduces_to_zero(self):
        # If protection were 1.0 the score would be 0 — n95-valve at 0.70 is
        # the closest; verify score is substantially lower, not negative.
        score = calc_exposure(300, "bus", "n95-valve", "midday")
        assert 0 <= score < 100

    def test_unknown_transport_defaults_to_1_0(self):
        # An unrecognized transport key falls back to multiplier 1.0 (bus baseline)
        score_unknown = calc_exposure(100, "UNKNOWN_MODE", "none", "midday")
        score_bus     = calc_exposure(100, "bus",          "none", "midday")
        assert score_unknown == score_bus

    def test_unknown_mask_defaults_to_0_protection(self):
        # An unrecognized mask key falls back to 0.0 protection (same as "none")
        score_unknown = calc_exposure(100, "bus", "UNKNOWN_MASK", "midday")
        score_none    = calc_exposure(100, "bus", "none",         "midday")
        assert score_unknown == score_none

    def test_unknown_time_of_day_defaults_to_1_0(self):
        # Fallback multiplier 1.0 is the same as "bus" baseline; compare to midday(0.9)
        score_unknown = calc_exposure(100, "bus", "none", "UNKNOWN_TIME")
        score_midday  = calc_exposure(100, "bus", "none", "midday")
        assert score_unknown != score_midday   # 1.0 ≠ 0.9

    def test_score_is_rounded_to_one_decimal(self):
        # The formula uses round(..., 1) — confirm no more than one decimal place
        score = calc_exposure(123, "two-wheeler", "surgical", "morning-peak")
        assert score == round(score, 1)

    def test_all_transport_modes_produce_valid_range(self):
        for mode in advisory.TRANSPORT_MULTIPLIER:
            s = calc_exposure(150, mode, "none", "midday")
            assert 0 <= s <= 100, f"Out-of-range score for transport={mode!r}: {s}"

    def test_all_mask_types_produce_valid_range(self):
        for mask in advisory.MASK_PROTECTION:
            s = calc_exposure(150, "bus", mask, "midday")
            assert 0 <= s <= 100, f"Out-of-range score for mask={mask!r}: {s}"


# ════════════════════════════════════════════════════════════════════════════
# 2. aqi_risk_band — boundary values
# ════════════════════════════════════════════════════════════════════════════

class TestAqiRiskBand:

    @pytest.mark.parametrize("aqi,expected_key", [
        (0,   "good"),
        (50,  "good"),
        (51,  "moderate"),
        (100, "moderate"),
        (101, "sensitive"),
        (150, "sensitive"),
        (151, "unhealthy"),
        (200, "unhealthy"),
        (201, "very-unhealthy"),
        (300, "very-unhealthy"),
        (301, "hazardous"),
        (500, "hazardous"),
    ])
    def test_band_boundaries(self, aqi, expected_key):
        key, _ = advisory.aqi_risk_band(aqi)
        assert key == expected_key, f"AQI={aqi}: expected {expected_key!r}, got {key!r}"

    def test_returns_tuple_of_two(self):
        result = advisory.aqi_risk_band(75)
        assert isinstance(result, tuple) and len(result) == 2

    def test_label_is_non_empty_string(self):
        _, label = advisory.aqi_risk_band(200)
        assert isinstance(label, str) and label


# ════════════════════════════════════════════════════════════════════════════
# 3. generate_advice — rule branches
# ════════════════════════════════════════════════════════════════════════════

class TestGenerateAdvice:

    # --- headline band thresholds ---

    def test_headline_high_at_75(self):
        headline, _ = advisory.generate_advice("bus", "none", "midday", 75.0)
        assert headline == "high"

    def test_headline_high_above_75(self):
        headline, _ = advisory.generate_advice("bus", "none", "midday", 90.0)
        assert headline == "high"

    def test_headline_moderate_at_45(self):
        headline, _ = advisory.generate_advice("bus", "none", "midday", 45.0)
        assert headline == "moderate"

    def test_headline_moderate_at_74(self):
        headline, _ = advisory.generate_advice("bus", "none", "midday", 74.9)
        assert headline == "moderate"

    def test_headline_low_below_45(self):
        headline, _ = advisory.generate_advice("bus", "n95", "midday", 10.0)
        assert headline == "low"

    # --- tip ID: need_n95 ---

    def test_need_n95_triggered_for_cloth_high_exposure(self):
        # cloth protection=0.10 < 0.5, score>60 → need_n95
        _, tips = advisory.generate_advice("bus", "cloth", "midday", 65.0)
        assert "need_n95" in tips

    def test_need_n95_triggered_for_surgical_high_exposure(self):
        _, tips = advisory.generate_advice("bus", "surgical", "midday", 70.0)
        assert "need_n95" in tips

    def test_need_n95_not_triggered_when_score_at_60(self):
        # boundary: score must be > 60, not >= 60
        _, tips = advisory.generate_advice("bus", "cloth", "midday", 60.0)
        assert "need_n95" not in tips

    def test_need_n95_not_triggered_for_n95_mask(self):
        # protection=0.65 ≥ 0.5 → rule skipped
        _, tips = advisory.generate_advice("bus", "n95", "midday", 90.0)
        assert "need_n95" not in tips

    # --- tip ID: wear_mask ---

    def test_wear_mask_triggered_when_no_mask_above_40(self):
        _, tips = advisory.generate_advice("bus", "none", "midday", 41.0)
        assert "wear_mask" in tips

    def test_wear_mask_not_triggered_at_score_40(self):
        # boundary: score must be > 40
        _, tips = advisory.generate_advice("bus", "none", "midday", 40.0)
        assert "wear_mask" not in tips

    def test_wear_mask_not_triggered_when_mask_worn(self):
        _, tips = advisory.generate_advice("bus", "cloth", "midday", 50.0)
        assert "wear_mask" not in tips

    # --- tip ID: use_enclosed_transport ---

    def test_enclosed_transport_tip_for_walking_high_exposure(self):
        _, tips = advisory.generate_advice("walking", "none", "midday", 60.0)
        assert "use_enclosed_transport" in tips

    def test_enclosed_transport_tip_for_two_wheeler(self):
        _, tips = advisory.generate_advice("two-wheeler", "none", "midday", 56.0)
        assert "use_enclosed_transport" in tips

    def test_enclosed_transport_not_triggered_at_score_55(self):
        # boundary: score must be > 55
        _, tips = advisory.generate_advice("walking", "none", "midday", 55.0)
        assert "use_enclosed_transport" not in tips

    def test_enclosed_transport_not_triggered_for_metro(self):
        _, tips = advisory.generate_advice("metro", "none", "midday", 80.0)
        assert "use_enclosed_transport" not in tips

    # --- tip ID: shift_timing ---

    def test_shift_timing_during_morning_peak(self):
        _, tips = advisory.generate_advice("bus", "none", "morning-peak", 55.0)
        assert "shift_timing" in tips

    def test_shift_timing_during_evening_peak(self):
        _, tips = advisory.generate_advice("bus", "none", "evening-peak", 55.0)
        assert "shift_timing" in tips

    def test_shift_timing_not_triggered_at_score_50(self):
        # boundary: score must be > 50
        _, tips = advisory.generate_advice("bus", "none", "morning-peak", 50.0)
        assert "shift_timing" not in tips

    def test_shift_timing_not_triggered_off_peak(self):
        _, tips = advisory.generate_advice("bus", "none", "midday", 80.0)
        assert "shift_timing" not in tips

    # --- tip ID: purifier_hydrate ---

    def test_purifier_hydrate_above_75(self):
        _, tips = advisory.generate_advice("bus", "none", "midday", 76.0)
        assert "purifier_hydrate" in tips

    def test_purifier_hydrate_at_75(self):
        # boundary: score must be > 75 (strictly)
        _, tips = advisory.generate_advice("bus", "none", "midday", 75.0)
        assert "purifier_hydrate" not in tips

    # --- favorable fallback ---

    def test_favorable_tip_when_no_rules_fire(self):
        # Very low score + n95 + metro + off-peak → no rules fire
        _, tips = advisory.generate_advice("metro", "n95", "night", 5.0)
        assert tips == ["favorable"]

    def test_favorable_not_present_when_other_tips_fire(self):
        _, tips = advisory.generate_advice("walking", "none", "morning-peak", 80.0)
        assert "favorable" not in tips

    # --- return type contract ---

    def test_returns_tuple_of_headline_and_list(self):
        result = advisory.generate_advice("bus", "none", "midday", 50.0)
        assert isinstance(result, tuple) and len(result) == 2
        headline, tips = result
        assert isinstance(headline, str)
        assert isinstance(tips, list)


# ════════════════════════════════════════════════════════════════════════════
# 4. render_advice — language & fallback
# ════════════════════════════════════════════════════════════════════════════

class TestRenderAdvice:

    def test_english_headline_contains_band_label(self):
        headline, _ = advisory.render_advice("high", ["favorable"], "sensitive", "en")
        assert "Sensitive" in headline or "Unhealthy" in headline  # band substituted

    def test_kannada_headline_returned_for_kn_lang(self):
        headline, _ = advisory.render_advice("high", ["favorable"], "unhealthy", "kn")
        # Kannada script codepoints present
        assert any(ord(c) >= 0x0C80 for c in headline)

    def test_unsupported_lang_falls_back_to_english(self):
        headline_en, _  = advisory.render_advice("moderate", ["wear_mask"], "moderate", "en")
        headline_xx, _  = advisory.render_advice("moderate", ["wear_mask"], "moderate", "xx")
        assert headline_en == headline_xx

    def test_tips_list_length_matches_input(self):
        tip_ids = ["need_n95", "shift_timing"]
        _, tips = advisory.render_advice("high", tip_ids, "unhealthy", "en")
        assert len(tips) == len(tip_ids)

    def test_unknown_tip_id_returns_empty_string(self):
        _, tips = advisory.render_advice("low", ["NONEXISTENT_TIP"], "good", "en")
        assert tips == [""]

    def test_unknown_headline_id_falls_back_to_low(self):
        # render_advice falls back to HEADLINE_TEXT["low"] for unknown keys
        headline, _ = advisory.render_advice("UNKNOWN_HEADLINE", ["favorable"], "good", "en")
        # Should not raise; must be a non-empty string
        assert isinstance(headline, str) and headline

    def test_all_tip_ids_have_translations(self):
        for tid in advisory.TIP_TEXT:
            for lang in advisory.SUPPORTED_LANGS:
                text = advisory.TIP_TEXT[tid].get(lang, "")
                assert text, f"Missing {lang!r} translation for tip {tid!r}"
