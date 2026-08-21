// UI chrome strings. The advisory content itself (headline/tips/risk label)
// is translated server-side in app.py — this file only covers labels,
// buttons, and section titles rendered directly by React components.
export const UI_TEXT = {
  en: {
    tagline: "Route-level exposure, not just city-wide AQI.",
    tabAdvisor: "Advisor",
    tabCompare: "Compare Routes",
    tabAbout: "About",
    corridorTitle: "01 — Your commute corridor",
    commuteTitle: "02 — How you're commuting",
    advisoryTitle: "03 — Your advisory",
    transport: "Transport mode",
    mask: "Mask",
    timeOfDay: "Time of day",
    exposureScore: "exposure score",
    ringCaption:
      "Your personal exposure score — combines this corridor's air quality with your transport, mask, and timing choices. Higher means more inhaled pollution on this specific commute.",
    footer:
      "Built for the AI for Sustainability Virtual Internship · SDG 11 & SDG 3 · Exposure scoring is a transparent, rule-based estimate — not a medical measurement.",
    compareIntro: "Pick two corridors to see which one carries more personal exposure risk for the same commute setup.",
    compareRouteA: "Route A",
    compareRouteB: "Route B",
    compareWinner: "lower exposure",
    aboutWhatTitle: "What this is",
    aboutWhatBody:
      "Namma Breath is a route-level pollution exposure advisor for Bengaluru commuters. Instead of one citywide AQI number, it estimates YOUR personal exposure based on the corridor you travel, your transport mode, your mask, and the time of day — then gives you plain-language, actionable advice. A single mask and one city-wide AQI reading don't tell you what you're actually breathing on a congested route like Silk Board or Hosur Road at peak hour — this tool tries to close that gap.",
    aboutWhyTitle: "Why it matters",
    aboutWhyBody:
      "Bengaluru's traffic corridors see pollution spikes far above the city's average AQI, especially during morning and evening peak hours. Daily commuters — students, delivery riders, two-wheeler and bus commuters — bear most of this exposure, often without realizing how much their transport choice, timing, and mask type actually change what they inhale. This project aligns with SDG 11 (Sustainable Cities & Communities) and SDG 3 (Good Health & Well-being).",
    aboutHowTitle: "How it works",
    aboutHowBody:
      "The backend pulls live AQI data for known Bengaluru traffic hotspots (or realistic mock data if no live feed is configured), then runs it through a transparent, rule-based advisory engine: your transport mode, mask, and time of day each apply a documented weight to the base AQI, producing a personal Exposure Score. That score drives specific tips — switch to an N95, shift your timing, consider enclosed transport — instead of one generic city-wide warning.",
    aboutResponsibleTitle: "Responsible AI",
    aboutResponsibleBody:
      "Every recommendation traces back to a visible, documented rule — not a black-box model — so you can see exactly why you got that advice. The tool doesn't assume access to a car or an air purifier; options span walking, bus, and metro, and no mask to N95, so it stays usable across income levels. No location tracking happens — you manually pick a corridor from a fixed list, and nothing is stored beyond this session.",
    aboutCredit: "Built for the AI for Sustainability Virtual Internship (July–Sept 2026) · SDG 11 & SDG 3",
  },
  kn: {
    tagline: "ನಗರದ ಒಟ್ಟಾರೆ AQI ಅಲ್ಲ, ನಿಮ್ಮ ಮಾರ್ಗದ ಮಟ್ಟದ ಮಾಲಿನ್ಯ ಸಂಪರ್ಕ.",
    tabAdvisor: "ಸಲಹೆಗಾರ",
    tabCompare: "ಮಾರ್ಗಗಳನ್ನು ಹೋಲಿಸಿ",
    tabAbout: "ಬಗ್ಗೆ",
    corridorTitle: "೦೧ — ನಿಮ್ಮ ಪ್ರಯಾಣದ ಮಾರ್ಗ",
    commuteTitle: "೦೨ — ನೀವು ಹೇಗೆ ಪ್ರಯಾಣಿಸುತ್ತಿದ್ದೀರಿ",
    advisoryTitle: "೦೩ — ನಿಮ್ಮ ಸಲಹೆ",
    transport: "ಸಾರಿಗೆ ವಿಧಾನ",
    mask: "ಮಾಸ್ಕ್",
    timeOfDay: "ಸಮಯ",
    exposureScore: "ಮಾಲಿನ್ಯ ಸಂಪರ್ಕ ಅಂಕ",
    ringCaption:
      "ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮಾಲಿನ್ಯ ಸಂಪರ್ಕ ಅಂಕ — ಈ ಮಾರ್ಗದ ಗಾಳಿಯ ಗುಣಮಟ್ಟವನ್ನು ನಿಮ್ಮ ಸಾರಿಗೆ, ಮಾಸ್ಕ್ ಮತ್ತು ಸಮಯದ ಆಯ್ಕೆಗಳೊಂದಿಗೆ ಸಂಯೋಜಿಸುತ್ತದೆ. ಹೆಚ್ಚಿನ ಅಂಕ ಎಂದರೆ ಈ ಪ್ರಯಾಣದಲ್ಲಿ ಹೆಚ್ಚು ಮಾಲಿನ್ಯ ಸಂಪರ್ಕ.",
    footer:
      "AI for Sustainability Virtual Internship ಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ · SDG 11 ಮತ್ತು SDG 3 · ಮಾಲಿನ್ಯ ಅಂಕವು ಪಾರದರ್ಶಕ, ನಿಯಮ-ಆಧಾರಿತ ಅಂದಾಜು — ವೈದ್ಯಕೀಯ ಅಳತೆಯಲ್ಲ.",
    compareIntro: "ಒಂದೇ ಪ್ರಯಾಣ ಸೆಟಪ್‌ಗೆ ಯಾವ ಮಾರ್ಗವು ಹೆಚ್ಚು ವೈಯಕ್ತಿಕ ಮಾಲಿನ್ಯ ಅಪಾಯ ಹೊಂದಿದೆ ಎಂದು ನೋಡಲು ಎರಡು ಮಾರ್ಗಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    compareRouteA: "ಮಾರ್ಗ A",
    compareRouteB: "ಮಾರ್ಗ B",
    compareWinner: "ಕಡಿಮೆ ಮಾಲಿನ್ಯ ಸಂಪರ್ಕ",
    aboutWhatTitle: "ಇದು ಏನು",
    aboutWhatBody:
      "ನಮ್ಮ ಬ್ರೆತ್ ಬೆಂಗಳೂರಿನ ದೈನಂದಿನ ಪ್ರಯಾಣಿಕರಿಗಾಗಿ ಮಾರ್ಗ-ಮಟ್ಟದ ಮಾಲಿನ್ಯ ಸಂಪರ್ಕ ಸಲಹೆಗಾರ. ನಗರದ ಒಟ್ಟಾರೆ AQI ಸಂಖ್ಯೆಯ ಬದಲು, ಇದು ನೀವು ಪ್ರಯಾಣಿಸುವ ಮಾರ್ಗ, ನಿಮ್ಮ ಸಾರಿಗೆ ವಿಧಾನ, ಮಾಸ್ಕ್ ಮತ್ತು ಸಮಯದ ಆಧಾರದ ಮೇಲೆ ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮಾಲಿನ್ಯ ಸಂಪರ್ಕವನ್ನು ಅಂದಾಜಿಸುತ್ತದೆ — ನಂತರ ಸರಳ ಭಾಷೆಯಲ್ಲಿ ಕಾರ್ಯಸಾಧ್ಯ ಸಲಹೆ ನೀಡುತ್ತದೆ. ಸಿಲ್ಕ್ ಬೋರ್ಡ್ ಅಥವಾ ಹೊಸೂರು ರಸ್ತೆಯಂತಹ ಜನನಿಬಿಡ ಮಾರ್ಗದಲ್ಲಿ ಗರಿಷ್ಠ ಸಮಯದಲ್ಲಿ ಒಂದೇ ಮಾಸ್ಕ್ ಮತ್ತು ನಗರದ ಒಟ್ಟಾರೆ AQI ನಿಮ್ಮ ನಿಜವಾದ ಉಸಿರಾಟದ ಸಂಪರ್ಕವನ್ನು ತೋರಿಸುವುದಿಲ್ಲ — ಈ ಸಾಧನವು ಆ ಅಂತರವನ್ನು ಕಡಿಮೆ ಮಾಡಲು ಪ್ರಯತ್ನಿಸುತ್ತದೆ.",
    aboutWhyTitle: "ಇದು ಏಕೆ ಮುಖ್ಯ",
    aboutWhyBody:
      "ಬೆಂಗಳೂರಿನ ಟ್ರಾಫಿಕ್ ಮಾರ್ಗಗಳಲ್ಲಿ, ವಿಶೇಷವಾಗಿ ಬೆಳಗ್ಗೆ ಮತ್ತು ಸಂಜೆ ಗರಿಷ್ಠ ಸಮಯದಲ್ಲಿ, ಮಾಲಿನ್ಯವು ನಗರದ ಸರಾಸರಿ AQI ಗಿಂತ ಹೆಚ್ಚು ಏರುತ್ತದೆ. ವಿದ್ಯಾರ್ಥಿಗಳು, ಡೆಲಿವರಿ ಸವಾರರು, ದ್ವಿಚಕ್ರ ಮತ್ತು ಬಸ್ ಪ್ರಯಾಣಿಕರಂತಹ ದೈನಂದಿನ ಪ್ರಯಾಣಿಕರು ಈ ಸಂಪರ್ಕದ ಹೆಚ್ಚಿನ ಭಾಗವನ್ನು ಅನುಭವಿಸುತ್ತಾರೆ, ಆಗಾಗ್ಗೆ ತಮ್ಮ ಸಾರಿಗೆ ಆಯ್ಕೆ, ಸಮಯ ಮತ್ತು ಮಾಸ್ಕ್ ವಿಧವು ತಾವು ಉಸಿರಾಡುವುದನ್ನು ಎಷ್ಟು ಬದಲಾಯಿಸುತ್ತದೆ ಎಂದು ಅರಿವಿಲ್ಲದೆ. ಈ ಯೋಜನೆಯು SDG 11 (ಸುಸ್ಥಿರ ನಗರಗಳು ಮತ್ತು ಸಮುದಾಯಗಳು) ಮತ್ತು SDG 3 (ಉತ್ತಮ ಆರೋಗ್ಯ ಮತ್ತು ಯೋಗಕ್ಷೇಮ) ಗುರಿಗಳೊಂದಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ.",
    aboutHowTitle: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
    aboutHowBody:
      "ಬ್ಯಾಕೆಂಡ್ ಬೆಂಗಳೂರಿನ ಪ್ರಸಿದ್ಧ ಟ್ರಾಫಿಕ್ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳಿಗೆ ಲೈವ್ AQI ಡೇಟಾವನ್ನು ಪಡೆಯುತ್ತದೆ (ಅಥವಾ ಲೈವ್ ಫೀಡ್ ಇಲ್ಲದಿದ್ದರೆ ವಾಸ್ತವಿಕ ಮಾದರಿ ಡೇಟಾ), ನಂತರ ಅದನ್ನು ಪಾರದರ್ಶಕ, ನಿಯಮ-ಆಧಾರಿತ ಸಲಹಾ ಎಂಜಿನ್ ಮೂಲಕ ರವಾನಿಸುತ್ತದೆ: ನಿಮ್ಮ ಸಾರಿಗೆ ವಿಧಾನ, ಮಾಸ್ಕ್ ಮತ್ತು ಸಮಯ ಪ್ರತಿಯೊಂದೂ ಮೂಲ AQI ಗೆ ದಾಖಲಿತ ತೂಕವನ್ನು ಅನ್ವಯಿಸುತ್ತದೆ, ವೈಯಕ್ತಿಕ ಮಾಲಿನ್ಯ ಸಂಪರ್ಕ ಅಂಕವನ್ನು ಉತ್ಪಾದಿಸುತ್ತದೆ. ಆ ಅಂಕವು ನಿರ್ದಿಷ್ಟ ಸಲಹೆಗಳನ್ನು ಮುನ್ನಡೆಸುತ್ತದೆ — N95 ಗೆ ಬದಲಾಯಿಸಿ, ನಿಮ್ಮ ಸಮಯವನ್ನು ಬದಲಾಯಿಸಿ, ಮುಚ್ಚಿದ ಸಾರಿಗೆ ಪರಿಗಣಿಸಿ — ಒಂದು ಸಾಮಾನ್ಯ ನಗರ-ವ್ಯಾಪಿ ಎಚ್ಚರಿಕೆಯ ಬದಲು.",
    aboutResponsibleTitle: "ಜವಾಬ್ದಾರಿಯುತ AI",
    aboutResponsibleBody:
      "ಪ್ರತಿಯೊಂದು ಶಿಫಾರಸು ಒಂದು ಕಪ್ಪು-ಪೆಟ್ಟಿಗೆ ಮಾದರಿಯಲ್ಲ, ಬದಲಿಗೆ ಗೋಚರ, ದಾಖಲಿತ ನಿಯಮಕ್ಕೆ ಹಿಂತಿರುಗುತ್ತದೆ — ಆದ್ದರಿಂದ ನಿಮಗೆ ಆ ಸಲಹೆ ಏಕೆ ಸಿಕ್ಕಿತು ಎಂದು ನೀವು ನಿಖರವಾಗಿ ನೋಡಬಹುದು. ಈ ಸಾಧನವು ಕಾರು ಅಥವಾ ಏರ್ ಪ್ಯೂರಿಫೈಯರ್ ಪ್ರವೇಶವನ್ನು ಊಹಿಸುವುದಿಲ್ಲ; ಆಯ್ಕೆಗಳು ನಡಿಗೆ, ಬಸ್ ಮತ್ತು ಮೆಟ್ರೋವರೆಗೆ, ಮಾಸ್ಕ್ ಇಲ್ಲದಿರುವಿಕೆಯಿಂದ N95 ವರೆಗೆ ವ್ಯಾಪಿಸಿವೆ, ಆದ್ದರಿಂದ ಇದು ಎಲ್ಲಾ ಆದಾಯ ಮಟ್ಟಗಳಲ್ಲಿ ಬಳಸಬಹುದಾಗಿದೆ. ಯಾವುದೇ ಸ್ಥಳ ಟ್ರ್ಯಾಕಿಂಗ್ ನಡೆಯುವುದಿಲ್ಲ — ನೀವು ಸ್ಥಿರ ಪಟ್ಟಿಯಿಂದ ಮಾರ್ಗವನ್ನು ಹಸ್ತಚಾಲಿತವಾಗಿ ಆಯ್ಕೆಮಾಡುತ್ತೀರಿ, ಮತ್ತು ಈ ಸೆಶನ್‌ಗಿಂತ ಹೆಚ್ಚಿನದನ್ನು ಸಂಗ್ರಹಿಸಲಾಗುವುದಿಲ್ಲ.",
    aboutCredit: "AI for Sustainability Virtual Internship (ಜುಲೈ–ಸೆಪ್ಟೆಂಬರ್ 2026) ಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ · SDG 11 ಮತ್ತು SDG 3",
  },
};
