/* =============================================================================
 * engine.js — CALCULATION ENGINE
 * -----------------------------------------------------------------------------
 * Pure, side-effect-free calculations. Knows nothing about the DOM.
 * Every factor is its own named function (per spec) but they share two generic
 * config-driven helpers so no formula or divisor is hardcoded here.
 *
 * The universal rule (from the spec):
 *     value  = padam * multiplier
 *     index  = value % divisor
 *     if (index === 0) index = divisor
 *     label  = TABLE[index - 1]
 *
 * Exposed globally as `AyadiEngine`.
 * ===========================================================================*/
(function (global, CONFIG, TABLES, UNITS) {
  "use strict";

  /* --- helpers ------------------------------------------------------------ */

  /** Resolve a table entry to a string in the active language. */
  function label(entry) {
    if (entry == null) return "";
    if (typeof entry === "string") return entry;
    return (CONFIG.language === "te" && entry.te) ? entry.te : entry.en;
  }

  /** NUMERIC factor: exact (padam × multiplier) % divisor — values are NOT rounded. */
  function numericFactor(padam, cfg) {
    return (padam * cfg.multiplier) % cfg.divisor;
  }

  /**
   * LOOKUP factor. The remainder is kept as an exact decimal (`value`); only the
   * table ROW is derived from it via Math.floor (an array index must be an
   * integer — the value itself is never rounded).
   *   value = (padam × multiplier) % divisor        → decimal, e.g. 6.265
   *   row   = floor(value)                           → 0-based index into table
   */
  function lookupFactor(padam, cfg) {
    var table = TABLES[cfg.table];
    var value = (padam * cfg.multiplier) % cfg.divisor;   // exact decimal remainder
    var idx = Math.floor(value);                          // table row (0-based)
    if (idx < 0) idx = 0;
    if (idx >= table.length) idx = table.length - 1;      // safety clamp
    var entry = table[idx];
    return {
      value: value,                                       // exact, un-rounded
      index: idx,
      entry: entry,                                       // full row (for extra fields)
      key: (entry && entry.en) ? entry.en : String(entry),
      label: label(entry)
    };
  }

  /* --- individual calculation functions (spec requires each separately) --- */

  function calculatePadam(areaSqFt) { return CONFIG.padam(areaSqFt); }

  function calculateDhanam(padam)   { return numericFactor(padam, CONFIG.numeric.dhanam); }
  function calculateRunam(padam)    { return numericFactor(padam, CONFIG.numeric.runam); }

  /** Resolve a numeric value into a phalitam band (first band with max ≥ floor(value)). */
  function resolveBand(value, bands) {
    var n = Math.floor(value);
    for (var i = 0; i < bands.length; i++) { if (n <= bands[i].max) return bands[i]; }
    return bands[bands.length - 1];
  }

  /** ఆయుష్షు — numeric remainder plus its phalitam band. */
  function calculateAyushu(padam) {
    var value = numericFactor(padam, CONFIG.numeric.ayushu);
    var band = resolveBand(value, CONFIG.bands.ayushu);
    return { value: value, phala: band.phala, tone: band.tone };
  }

  function calculateAyam(padam) {
    var r = lookupFactor(padam, CONFIG.lookup.ayam);
    r.status = TABLES.AYAM_GOOD.indexOf(r.key) !== -1 ? "Good" : "Bad";
    return r;
  }

  /** Copy phalitam (result) + tone + graha from the resolved table row, if present. */
  function withPhala(r) {
    r.phala = (r.entry && r.entry.phala) || "";   // e.g. "అశుభం"
    r.tone = (r.entry && r.entry.tone) || "";      // "good" | "bad" for colouring
    r.graha = (r.entry && r.entry.graha) || "";    // ruling planet (vara)
    r.dikku = (r.entry && r.entry.dikku) || "";    // direction (dikpati)
    return r;
  }

  function calculateAmsa(padam)      { return withPhala(lookupFactor(padam, CONFIG.lookup.amsa)); }
  function calculateNakshatra(padam) { return lookupFactor(padam, CONFIG.lookup.nakshatra); }
  function calculateTithi(padam)     { return lookupFactor(padam, CONFIG.lookup.tithi); }
  function calculateVara(padam)      { return withPhala(lookupFactor(padam, CONFIG.lookup.vara)); }
  function calculateDikpati(padam)   { return withPhala(lookupFactor(padam, CONFIG.lookup.dikpati)); }
  function calculateKarana(padam)    { return withPhala(lookupFactor(padam, CONFIG.lookup.karana)); }

  /**
   * NAKSHATRA COMPATIBILITY — owner nakshatra vs calculated nakshatra.
   * Matching logic is NOT hardcoded: it reads CONFIG.compatibility.
   *   - if a full 27×27 `matrix` is supplied, use matrix[owner][calc]
   *   - otherwise use the 9-fold Tara cycle → taraRatings
   * @param {number} ownerIdx  0-based index into NAKSHATRAS
   * @param {number} calcIdx   0-based index into NAKSHATRAS
   */
  function calculateNakshatraCompatibility(ownerIdx, calcIdx) {
    var comp = CONFIG.compatibility;
    if (ownerIdx < 0 || calcIdx < 0) {
      return { taraIndex: -1, tara: "", rating: "Average" };
    }
    // Full-matrix override yields a rating only (no Tara name).
    if (comp.matrix && comp.matrix[ownerIdx]) {
      var r = comp.matrix[ownerIdx][calcIdx] || "Average";
      return { taraIndex: -1, tara: r, rating: r };
    }
    var diff = (((calcIdx - ownerIdx) % 9) + 9) % 9;   // 0..8 Tara count
    return {
      taraIndex: diff,
      tara: label(comp.taras[diff]),   // e.g. "Janma" / "జన్మ"
      rating: comp.taraRatings[diff]   // internal quality for scoring/tone
    };
  }

  /* --- orchestration ------------------------------------------------------ */

  /**
   * Run the full Ayadi computation.
   * @param {Object} input  {name, ownerNakshatra (en key), direction (en key),
   *                         width:{feet,inches,nullu}, depth:{feet,inches,nullu}}
   * @returns {Object} rich computed result (raw pieces; formatting done later)
   */
  function computeAll(input) {
    var w = UNITS.convertAll(input.width);
    var d = UNITS.convertAll(input.depth);

    var area = {
      sqft:   w.feet * d.feet,
      sqin:   w.inches * d.inches,
      angula: w.angula * d.angula,
      hasta:  w.hasta * d.hasta
    };

    var padam = calculatePadam(area.sqft);

    var nak = calculateNakshatra(padam);
    var ownerIdx = indexOfKey(TABLES.NAKSHATRAS, input.ownerNakshatra);
    var calcIdx  = nak.index;   // lookupFactor.index is already 0-based

    return {
      input: input,
      width: w,
      depth: d,
      area: area,
      padam: padam,
      dhanam: calculateDhanam(padam),
      runam: calculateRunam(padam),
      ayam: calculateAyam(padam),
      ayushu: calculateAyushu(padam),
      amsa: calculateAmsa(padam),
      nakshatra: nak,
      nakshatraCompatibility: calculateNakshatraCompatibility(ownerIdx, calcIdx),
      tithi: calculateTithi(padam),
      vara: calculateVara(padam),
      dikpati: calculateDikpati(padam),
      karana: calculateKarana(padam)
    };
  }

  /**
   * Compute every factor directly from a given padam (no dimensions/area).
   * @param {number} padam
   * @param {string} ownerKey  owner nakshatra English key (optional, for పొంతన)
   */
  function computeFromPadam(padam, ownerKey) {
    var nak = calculateNakshatra(padam);
    var ownerIdx = indexOfKey(TABLES.NAKSHATRAS, ownerKey || "");
    return {
      padam: padam,
      dhanam: calculateDhanam(padam),
      runam: calculateRunam(padam),
      ayam: calculateAyam(padam),
      ayushu: calculateAyushu(padam),
      amsa: calculateAmsa(padam),
      nakshatra: nak,
      nakshatraCompatibility: calculateNakshatraCompatibility(ownerIdx, nak.index),
      tithi: calculateTithi(padam),
      vara: calculateVara(padam),
      dikpati: calculateDikpati(padam),
      karana: calculateKarana(padam)
    };
  }

  /** Find 0-based index of an entry by its English key. */
  function indexOfKey(table, key) {
    for (var i = 0; i < table.length; i++) {
      if ((table[i].en || table[i]) === key) return i;
    }
    return -1;
  }

  global.AyadiEngine = {
    // helpers exposed for testing / reuse
    label: label,
    // individual calculators
    calculatePadam: calculatePadam,
    calculateDhanam: calculateDhanam,
    calculateRunam: calculateRunam,
    calculateAyam: calculateAyam,
    calculateAyushu: calculateAyushu,
    calculateAmsa: calculateAmsa,
    calculateNakshatra: calculateNakshatra,
    calculateNakshatraCompatibility: calculateNakshatraCompatibility,
    calculateTithi: calculateTithi,
    calculateVara: calculateVara,
    calculateDikpati: calculateDikpati,
    calculateKarana: calculateKarana,
    // orchestration
    computeAll: computeAll,
    computeFromPadam: computeFromPadam,
    indexOfKey: indexOfKey
  };
})(window, window.AyadiConfig, window.AyadiTables, window.AyadiUnits);
