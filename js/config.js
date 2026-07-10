/* =============================================================================
 * config.js — CONFIGURATION LAYER
 * -----------------------------------------------------------------------------
 * Everything a tradition can differ on lives here: unit systems, the Padam
 * formula, per-factor multipliers & divisors, the compatibility matrix rules,
 * good/bad classification, and scoring weights.
 *
 * The calculation ENGINE never hardcodes any of these values — it only reads
 * from this object. To support Andhra / Tamil / Kerala / etc. you swap or
 * extend this config; you never touch engine.js.
 *
 * Exposed globally as `AyadiConfig` (loaded before all other scripts).
 * ===========================================================================*/
(function (global) {
  "use strict";

  /* ---------------------------------------------------------------------------
   * UNIT SYSTEMS — configurable because Ayadi traditions use different bases.
   *   inchesPerFoot   : sub-division of a foot
   *   nulluPerInch    : regional "nullu" sub-division (Andhra uses 8)
   *   angulaPerInch   : 1 angula ≈ 1 inch here; some texts use 0.75in per angula
   *   inchesPerHasta  : 1 hasta (cubit) length; commonly 18in (1.5ft) or 24 angula
   * ------------------------------------------------------------------------- */
  var UNIT_SYSTEMS = {
    Andhra: { inchesPerFoot: 12, nulluPerInch: 8, angulaPerInch: 1, inchesPerHasta: 18 },
    Tamil:  { inchesPerFoot: 12, nulluPerInch: 8, angulaPerInch: 1, inchesPerHasta: 24 },
    Kerala: { inchesPerFoot: 12, nulluPerInch: 8, angulaPerInch: 1, inchesPerHasta: 24 }
  };

  var ACTIVE_TRADITION = "Andhra";

  /* ---------------------------------------------------------------------------
   * MAIN CONFIG
   * ------------------------------------------------------------------------- */
  var AyadiConfig = {
    tradition: ACTIVE_TRADITION,
    language: "te",                       // "en" | "te" — Result Generator honours this
    units: UNIT_SYSTEMS[ACTIVE_TRADITION],

    /* i18n — display translations for values that are internally English keys
     * (Ayam status, compatibility ratings). Internal keys stay English so
     * scoring/classification never break; only the DISPLAYED text is localised. */
    i18n: {
      te: {
        status: { "Good": "శుభం", "Bad": "అశుభం" },
        rating: { "Excellent": "అత్యుత్తమం", "Good": "శుభం", "Average": "సాధారణం", "Bad": "అశుభం", "Very Bad": "అతి అశుభం" },
        verdict: { "Excellent": "అత్యుత్తమం", "Auspicious": "శుభప్రదం", "Moderate": "సాధారణం", "Not Recommended": "తగదు" }
      }
    },
    unitSystems: UNIT_SYSTEMS,            // exposed so UI can offer a tradition picker

    /* PADAM — configurable formula. Default per spec: round(area in sq.ft).
     * Replace with e.g. `function (area) { return area / 9; }` for a sq-yard
     * (గజం) based tradition. Kept as a function so it is trivially swappable. */
    padam: function (areaSqFt) {
      return (areaSqFt/9);
    },

    /* NUMERIC factors — result is a number: (padam * multiplier) % divisor.
     * multiplier defaults to 1 so the rule reduces to the spec's `value % divisor`. */
    numeric: {
      dhanam: { multiplier: 8, divisor: 12 },   // DHANAM_DIVISOR
      runam:  { multiplier: 3, divisor: 8  },   // RUNAM_DIVISOR
      ayushu: { multiplier: 9, divisor: 120 }   // longevity units
    },

    /* LOOKUP factors — resolve an index then read the named table.
     *   index = (padam * multiplier) % divisor ;  if index === 0 → divisor
     *   label = TABLE[index - 1]
     * All multipliers default to 1 (pure spec behaviour). */
    lookup: {
      ayam:      { multiplier: 9, divisor: 8,  table: "AYAM" },        // AYAM_DIVISOR
      amsa:      { multiplier: 6, divisor: 9,  table: "AMSA" },        // AMSA_DIVISOR
      nakshatra: { multiplier: 8, divisor: 27, table: "NAKSHATRAS" },  // NAKSHATRA_DIVISOR
      tithi:     { multiplier: 6, divisor: 30, table: "TITHI" },       // TITHI_DIVISOR
      vara:      { multiplier: 9, divisor: 7,  table: "VARA" },        // VARA_DIVISOR
      dikpati:   { multiplier: 9, divisor: 8,  table: "DIKPATI" },     // DIKPATI_DIVISOR
      karana:    { multiplier: 5, divisor: 11, table: "KARANA" }       // KARANA_DIVISOR
    },

    /* NAKSHATRA COMPATIBILITY — not hardcoded.
     * Default rule is the 9-fold Tara cycle counted from the owner's nakshatra
     * to the calculated nakshatra. `taraRatings[diff]` maps the count (0..8) to
     * a rating. To use an exhaustive rule instead, provide `matrix` as a 27×27
     * array of ratings and it takes precedence. */
    compatibility: {
      ratings: ["Excellent", "Good", "Average", "Bad", "Very Bad"],
      // The nine Taras (0-based, counted from owner's nakshatra). `taras[i]` is the
      // DISPLAYED name; `taraRatings[i]` is the internal quality used for scoring.
      taras: [
        { en: "Janma",        te: "జన్మ" },      // 0
        { en: "Sampath",      te: "సంపత్" },     // 1
        { en: "Vipath",       te: "విపత్" },     // 2
        { en: "Kshema",       te: "క్షేమ" },     // 3
        { en: "Pratyak",      te: "ప్రత్యక్" },  // 4
        { en: "Sadhana",      te: "సాధన" },      // 5
        { en: "Naidhana",     te: "నైధన" },      // 6
        { en: "Mitra",        te: "మిత్ర" },     // 7
        { en: "Parama Mitra", te: "పరమ మిత్ర" }  // 8
      ],
      taraRatings: [
        "Average",   // 0 Janma
        "Excellent", // 1 Sampath
        "Bad",       // 2 Vipath
        "Good",      // 3 Kshema
        "Bad",       // 4 Pratyak
        "Good",      // 5 Sadhana
        "Very Bad",  // 6 Naidhana
        "Good",      // 7 Mitra
        "Excellent"  // 8 Parama Mitra
      ],
      matrix: null   // optional 27×27 override: matrix[ownerIdx][calcIdx] = rating
    },

    /* BANDS — range → phalitam mapping for NUMERIC factors. The band is matched
     * on floor(value): the first band whose `max` ≥ floor(value) wins. */
    bands: {
      ayushu: [
        { max: 32,  phala: "అశుభం",        tone: "bad"  }, //  1–32
        { max: 64,  phala: "మధ్యమం",       tone: ""     }, // 33–64
        { max: 84,  phala: "శుభం",         tone: "good" }, // 65–84
        { max: 120, phala: "అత్యంత శుభం",  tone: "good" }  // 85–120
      ]
    },

    /* SCORING — weights for the UI progress circle (0..100). Configurable. */
    score: {
      weights: { ayam: 30, compatibility: 40, wealth: 30 },
      ratingPoints: { "Excellent": 1, "Good": 0.8, "Average": 0.5, "Bad": 0.2, "Very Bad": 0 }
    }
  };

  global.AyadiConfig = AyadiConfig;
})(window);
