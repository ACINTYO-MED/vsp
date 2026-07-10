/* =============================================================================
 * suggest.js — SUITABLE-DIMENSION SEARCH (by Padam range, dimension-free)
 * -----------------------------------------------------------------------------
 * Given ONLY a PADAM range [min, max] (+ owner nakshatra for పొంతన), enumerate
 * padams in that range that are fully auspicious (no అశుభం / "bad"), and for
 * each suggest a concrete WIDTH × DEPTH that exactly realizes it.
 *
 * Since a factor set depends only on padam, and padam = width × depth / 9, we
 * enumerate square plots: side = 3·√padam. Stepping the side by 1 nullu yields a
 * distinct, exactly-realizable padam and a clean width = depth = side.
 *
 * Factors are evaluated straight from a padam value via the engine's individual
 * calculators — no dimension round-trip needed. Pure logic, no DOM.
 *
 * Exposed globally as `AyadiSuggest`.
 * ===========================================================================*/
(function (global, CONFIG, TABLES, ENGINE) {
  "use strict";

  var IPF = CONFIG.units.inchesPerFoot;        // 12
  var NPI = CONFIG.units.nulluPerInch;         // 8
  var NULLU_PER_FOOT = IPF * NPI;              // 96
  var MAX_STEPS = 20000;                       // safety cap on the scan loop

  /** total nullu → {feet,inches,nullu}. */
  function fromNullu(total) {
    var feet = Math.floor(total / NULLU_PER_FOOT);
    var rem = total - feet * NULLU_PER_FOOT;
    var inches = Math.floor(rem / NPI);
    return { feet: feet, inches: inches, nullu: rem - inches * NPI };
  }

  // "value > 0" positivity for numeric factors.
  function posByValue(v) { return v > 0 ? "good" : "bad"; }
  // A lookup factor's tone: use its table row's `tone` if defined (once తిథి
  // phala table gets one), else fall back to value > 0.
  function lookupTone(f) { return (f.entry && f.entry.tone) ? f.entry.tone : posByValue(f.value); }
  // Compatibility rating → tone.
  function compTone(rating) {
    if (rating === "Excellent" || rating === "Good") return "good";
    if (rating === "Bad" || rating === "Very Bad") return "bad";
    return "";
  }

  /**
   * Evaluate the nine factors required for a padam value:
   *   ధనము, రుణము, ఆయము, ఆయుష్షు, అంశ, నక్షత్రము, తిథి, వారము, దిక్పతి.
   * The నక్షత్రము factor is judged against the birth star (ownerIdx) via the Tara
   * cycle; if no star is given it falls back to value > 0.
   * (కరణము is intentionally NOT part of this check.)
   * @returns {{ positive, goodCount, chips:[{label,tone}] }}
   */
  function evalPadam(padam, ownerIdx) {
    var dhanam = ENGINE.calculateDhanam(padam);
    var runam = ENGINE.calculateRunam(padam);
    var ayam = ENGINE.calculateAyam(padam);
    var ayushu = ENGINE.calculateAyushu(padam);
    var amsa = ENGINE.calculateAmsa(padam);
    var nak = ENGINE.calculateNakshatra(padam);
    var tithi = ENGINE.calculateTithi(padam);
    var vara = ENGINE.calculateVara(padam);
    var dikpati = ENGINE.calculateDikpati(padam);

    var nakTone = (ownerIdx >= 0)
      ? compTone(ENGINE.calculateNakshatraCompatibility(ownerIdx, nak.index).rating)
      : lookupTone(nak);

    var n2 = function (v) { return v.toFixed(2); };            // numeric factor value
    var lk = function (f) { return f.value.toFixed(2) + " · " + f.label; };  // lookup: value · name

    // ధనము must exceed రుణము (wealth > debt) — both factors reflect this.
    var wealthOk = dhanam > runam;

    var chips = [
      { label: "ధనము",    value: n2(dhanam),      tone: wealthOk ? "good" : "bad" },
      { label: "రుణము",   value: n2(runam),       tone: wealthOk ? "good" : "bad" },
      { label: "ఆయము",    value: lk(ayam),        tone: ayam.status === "Good" ? "good" : "bad" },
      { label: "ఆయుష్షు", value: n2(ayushu.value), tone: ayushu.value >= 60 ? "good" : "bad" },
      { label: "అంశ",     value: lk(amsa),        tone: amsa.tone },
      { label: "నక్షత్రము", value: lk(nak),         tone: nakTone },
      { label: "తిథి",    value: lk(tithi),       tone: lookupTone(tithi) },
      { label: "వారము",   value: lk(vara),        tone: vara.tone },
      { label: "దిక్పతి",  value: lk(dikpati),     tone: dikpati.tone }
    ];
    // Positive = no factor is "bad" (neutral/మధ్యమం allowed).
    var bad = false, good = 0;
    for (var i = 0; i < chips.length; i++) {
      if (chips[i].tone === "bad") bad = true;
      else if (chips[i].tone === "good") good++;
    }
    return { positive: !bad, goodCount: good, chips: chips, dikpatiKey: dikpati.key };
  }

  // Sort priority for దిక్పతి: Indra → Kubera → Ishana → Varuna → (everything else).
  var DIKPATI_PRIORITY = { "Indra": 0, "Kubera": 1, "Ishana": 2, "Varuna": 3 };
  function dikRank(key) {
    return DIKPATI_PRIORITY[key] === undefined ? 99 : DIKPATI_PRIORITY[key];
  }

  /**
   * List the exact PADAM values within [padamMin, padamMax] (at `step`, 2-decimal)
   * where every evaluated factor is auspicious.
   *
   * @param {Object} opts { ownerNakshatra (en key|""), padamMin, padamMax, step, limit }
   * @returns {{ items:Array<{padam,goodCount,chips}>, truncated:boolean }}
   */
  function search(opts) {
    var pmin = opts.padamMin, pmax = opts.padamMax;
    var step = opts.step || 0.001;
    var limit = opts.limit || 200;
    var ownerIdx = ENGINE.indexOfKey(TABLES.NAKSHATRAS, opts.ownerNakshatra || "");

    var items = [], seen = {}, guard = 0, truncated = false;
    for (var p = pmin; p <= pmax + 1e-9 && guard < MAX_STEPS; p += step, guard++) {
      var padam = Math.round(p * 1000) / 1000;   // exact, 3-decimal
      if (seen[padam]) continue;
      seen[padam] = 1;
      var ev = evalPadam(padam, ownerIdx);
      if (!ev.positive) continue;
      items.push({ padam: padam, goodCount: ev.goodCount, chips: ev.chips, dikpatiKey: ev.dikpatiKey });
      if (items.length >= limit) { truncated = true; break; }
    }
    // Sort by దిక్పతి priority (Indra → Kubera → Ishana → Varuna → rest), then padam.
    items.sort(function (a, b) {
      return dikRank(a.dikpatiKey) - dikRank(b.dikpatiKey) || a.padam - b.padam;
    });
    return { items: items, truncated: truncated };
  }

  global.AyadiSuggest = { search: search, evalPadam: evalPadam };
})(window, window.AyadiConfig, window.AyadiTables, window.AyadiEngine);
