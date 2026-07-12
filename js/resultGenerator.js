/* =============================================================================
 * resultGenerator.js — RESULT GENERATOR
 * -----------------------------------------------------------------------------
 * Turns the engine's rich computed object into:
 *   1. the flat JSON contract required by the spec (`toJSON`)
 *   2. a human recommendation string
 *   3. a 0–100 Vastu score for the UI progress circle (config-weighted)
 *
 * Exposed globally as `AyadiResult`.
 * ===========================================================================*/
(function (global, CONFIG, TABLES, ENGINE) {
  "use strict";

  function labelOf(entry) { return ENGINE.label(entry); }

  /** Translate an internally-English key (status / rating / verdict) for display. */
  function tr(kind, key) {
    var m = CONFIG.i18n && CONFIG.i18n[CONFIG.language];
    return (m && m[kind] && m[kind][key]) || key;
  }

  /** Pretty dimension string in Telugu: 21 అ. 1 అం. 0 ను. (21.083 అడుగులు). */
  function dimString(dimInput, conv) {
    return dimInput.feet + " అ. " + dimInput.inches + " అం. " + dimInput.nullu + " ను. (" +
           conv.feet.toFixed(3) + " అడుగులు)";
  }

  /** Format a number for display WITHOUT altering its integer part: truncates
   *  (does NOT round) the visible decimals, so the shown integer part always
   *  matches Math.floor(value) — the same basis the engine uses to pick a table
   *  row. e.g. 2.996 → "2.99", never "3.00". Values carry ≤3 real decimals, so
   *  toFixed(dp+4) first stabilises float noise (2.99599…981) before we slice. */
  function num(v, dp) {
    dp = (dp === undefined) ? 2 : dp;
    var s = Number(v).toFixed(dp + 4);
    var dot = s.indexOf(".");
    return dp === 0 ? s.slice(0, dot) : s.slice(0, dot + 1 + dp);
  }

  /** "value · name" for a lookup factor, e.g. "6.26 · గజ". */
  function lk(f) { return num(f.value) + " · " + f.label; }

  /** Owner nakshatra display label from its stored English key. */
  function ownerNakLabel(key) {
    var i = ENGINE.indexOfKey(TABLES.NAKSHATRAS, key);
    return i >= 0 ? labelOf(TABLES.NAKSHATRAS[i]) : key;
  }
  function directionLabel(key) {
    var i = ENGINE.indexOfKey(TABLES.DIRECTIONS, key);
    return i >= 0 ? labelOf(TABLES.DIRECTIONS[i]) : key;
  }

  /**
   * Build the exact flat JSON object the spec asks for.
   */
  function toJSON(c) {
    return {
      name: c.input.name,
      ownerNakshatra: ownerNakLabel(c.input.ownerNakshatra),
      direction: directionLabel(c.input.direction),
      width: dimString(c.input.width, c.width),
      depth: dimString(c.input.depth, c.depth),
      areaSqFt: num(c.area.sqft, 3),
      padam: Number(c.padam).toFixed(3),   // padam is a quantity → round for display (102.667)
      dhanam: num(c.dhanam),
      runam: num(c.runam),
      ayam: lk(c.ayam),
      ayamStatus: tr("status", c.ayam.status),
      ayushu: num(c.ayushu.value) + " · " + c.ayushu.phala,
      amsa: num(c.amsa.value) + " · " + c.amsa.label + " · " + c.amsa.phala,
      nakshatra: lk(c.nakshatra),
      nakshatraCompatibility: c.nakshatraCompatibility.tara,
      tithi: lk(c.tithi) + " · " + c.tithi.phala,
      vara: num(c.vara.value) + " · " + c.vara.label + " (" + c.vara.graha + ") · " + c.vara.phala,
      dikpati: num(c.dikpati.value) + " · " + c.dikpati.label + " (" + c.dikpati.dikku + ") · " + c.dikpati.phala,
      karana: lk(c.karana),
      recommendation: recommendation(c)
    };
  }

  /** Extra area representations for the UI (not part of the spec JSON). */
  function areaBreakdown(c) {
    return {
      sqft:   c.area.sqft.toFixed(3),
      sqin:   c.area.sqin.toFixed(1),
      angula: c.area.angula.toFixed(1),
      hasta:  c.area.hasta.toFixed(3)
    };
  }

  /**
   * Config-weighted score (0–100) for the progress circle.
   */
  function score(c) {
    var w = CONFIG.score.weights;
    var pts = CONFIG.score.ratingPoints;
    var total = w.ayam + w.compatibility + w.wealth;

    var ayamPart = (c.ayam.status === "Good" ? 1 : 0) * w.ayam;
    var compPart = (pts[c.nakshatraCompatibility.rating] || 0) * w.compatibility;
    // Wealth: dhanam (gain) should exceed runam (debt).
    var wealthRatio = c.dhanam + c.runam === 0 ? 0.5 : c.dhanam / (c.dhanam + c.runam);
    var wealthPart = wealthRatio * w.wealth;

    return Math.max(0, Math.min(100, Math.round((ayamPart + compPart + wealthPart) / total * 100)));
  }

  /** Overall auspiciousness rating derived from the score (Telugu display). */
  function rating(s) {
    if (s >= 80) return { label: tr("verdict", "Excellent"), tone: "good" };
    if (s >= 60) return { label: tr("verdict", "Auspicious"), tone: "good" };
    if (s >= 40) return { label: tr("verdict", "Moderate"), tone: "warn" };
    return { label: tr("verdict", "Not Recommended"), tone: "bad" };
  }

  /**
   * Human-readable recommendation in Telugu. Assembled from the significant
   * factors so phrasing stays consistent as rules change.
   */
  function recommendation(c) {
    var parts = [];

    parts.push(c.ayam.status === "Good"
      ? "ఆయము (" + c.ayam.label + ") శుభప్రదం."
      : "ఆయము (" + c.ayam.label + ") అశుభం — కొలతలను సవరించడం మేలు.");

    var compGood = c.nakshatraCompatibility.rating === "Excellent" || c.nakshatraCompatibility.rating === "Good";
    parts.push("నక్షత్ర పొంతన " + c.nakshatraCompatibility.tara +
      " (" + tr("rating", c.nakshatraCompatibility.rating) + ")" +
      (compGood ? "." : " — శుభ ముహూర్తం సలహా."));

    parts.push(c.dhanam >= c.runam
      ? "ధనము రుణము కంటే ఎక్కువ — ధన సూచనలు అనుకూలం."
      : "రుణము ధనము కంటే ఎక్కువ — స్థల నిష్పత్తిని పరిశీలించండి.");

    var dirLabel = directionLabel(c.input.direction);
    var dirOk = TABLES.AUSPICIOUS_DIRECTIONS.indexOf(c.input.direction) !== -1;
    parts.push(dirOk
      ? dirLabel + " ముఖం శుభప్రదం."
      : dirLabel + " ముఖం అంత అనుకూలం కాదు; తూర్పు/ఉత్తర ద్వారాలు మేలు.");

    return parts.join(" ");
  }

  global.AyadiResult = {
    toJSON: toJSON,
    areaBreakdown: areaBreakdown,
    score: score,
    rating: rating,
    recommendation: recommendation
  };
})(window, window.AyadiConfig, window.AyadiTables, window.AyadiEngine);
