/* =============================================================================
 * lookupTables.js — LOOKUP TABLES LAYER
 * -----------------------------------------------------------------------------
 * Pure data. Each table is an array of { en, te } entries so the app can render
 * in English or Telugu without touching logic. Plain strings are also accepted
 * by the engine's label resolver, so tables can be simplified per tradition.
 *
 * These tables are intentionally data-only and easy to replace/extend for
 * different Ayadi traditions.
 *
 * Exposed globally as `AyadiTables`.
 * ===========================================================================*/
(function (global) {
  "use strict";

  // The eight Ayams (order is significant — index maps 1..8).
  var AYAM = [
    { en: "Dhwaja",    te: "ధ్వజ" },
    { en: "Dhooma",    te: "ధూమ" },
    { en: "Simha",     te: "సింహ" },
    { en: "Shwana",    te: "శ్వాన" },
    { en: "Vrishabha", te: "వృషభ" },
    { en: "Khara",     te: "ఖర" },
    { en: "Gaja",      te: "గజ" },
    { en: "Kaka",      te: "కాక" }
  ];

  // Good / Bad classification for Ayam (by English key).
  var AYAM_GOOD = ["Dhwaja", "Simha", "Vrishabha", "Gaja"];
  var AYAM_BAD  = ["Dhooma", "Shwana", "Khara", "Kaka"];

  // 27 Nakshatras.
  var NAKSHATRAS = [
    { en: "Ashwini", te: "అశ్విని" }, { en: "Bharani", te: "భరణి" }, { en: "Krittika", te: "కృత్తిక" },
    { en: "Rohini", te: "రోహిణి" }, { en: "Mrigashira", te: "మృగశిర" }, { en: "Ardra", te: "ఆరుద్ర" },
    { en: "Punarvasu", te: "పునర్వసు" }, { en: "Pushya", te: "పుష్యమి" }, { en: "Ashlesha", te: "ఆశ్లేష" },
    { en: "Magha", te: "మఖ" }, { en: "Purva Phalguni", te: "పుబ్బ" }, { en: "Uttara Phalguni", te: "ఉత్తర" },
    { en: "Hasta", te: "హస్త" }, { en: "Chitra", te: "చిత్త" }, { en: "Swati", te: "స్వాతి" },
    { en: "Vishakha", te: "విశాఖ" }, { en: "Anuradha", te: "అనూరాధ" }, { en: "Jyeshtha", te: "జ్యేష్ఠ" },
    { en: "Mula", te: "మూల" }, { en: "Purva Ashadha", te: "పూర్వాషాఢ" }, { en: "Uttara Ashadha", te: "ఉత్తరాషాఢ" },
    { en: "Shravana", te: "శ్రవణం" }, { en: "Dhanishta", te: "ధనిష్ఠ" }, { en: "Shatabhisha", te: "శతభిషం" },
    { en: "Purva Bhadrapada", te: "పూర్వాభాద్ర" }, { en: "Uttara Bhadrapada", te: "ఉత్తరాభాద్ర" }, { en: "Revati", te: "రేవతి" }
  ];

  // 7 Varas (weekdays) with ruling planet (graha), phalitam and tone.
  var VARA = [
    { en: "Sunday",    te: "ఆదివారం",   graha: "సూర్యుడు", phala: "మధ్యమం",         tone: ""     }, // 1
    { en: "Monday",    te: "సోమవారం",   graha: "చంద్రుడు", phala: "శుభం",           tone: "good" }, // 2
    { en: "Tuesday",   te: "మంగళవారం",  graha: "కుజుడు",   phala: "అశుభం / మధ్యమం", tone: "bad"  }, // 3
    { en: "Wednesday", te: "బుధవారం",   graha: "బుధుడు",   phala: "శుభం",           tone: "good" }, // 4
    { en: "Thursday",  te: "గురువారం",  graha: "గురుడు",   phala: "అత్యంత శుభం",    tone: "good" }, // 5
    { en: "Friday",    te: "శుక్రవారం", graha: "శుక్రుడు", phala: "అత్యంత శుభం",    tone: "good" }, // 6
    { en: "Saturday",  te: "శనివారం",   graha: "శని",      phala: "మధ్యమం / అశుభం", tone: "bad"  }  // 7
  ];

  // 30 Tithis (15 Shukla + 15 Krishna paksha).
  var TITHI = [
    { en: "Shukla Prathama", te: "శు. పాడ్యమి" }, { en: "Shukla Dwitiya", te: "శు. విదియ" }, { en: "Shukla Tritiya", te: "శు. తదియ" },
    { en: "Shukla Chaturthi", te: "శు. చవితి" }, { en: "Shukla Panchami", te: "శు. పంచమి" }, { en: "Shukla Shashthi", te: "శు. షష్ఠి" },
    { en: "Shukla Saptami", te: "శు. సప్తమి" }, { en: "Shukla Ashtami", te: "శు. అష్టమి" }, { en: "Shukla Navami", te: "శు. నవమి" },
    { en: "Shukla Dashami", te: "శు. దశమి" }, { en: "Shukla Ekadashi", te: "శు. ఏకాదశి" }, { en: "Shukla Dwadashi", te: "శు. ద్వాదశి" },
    { en: "Shukla Trayodashi", te: "శు. త్రయోదశి" }, { en: "Shukla Chaturdashi", te: "శు. చతుర్దశి" }, { en: "Purnima", te: "పౌర్ణమి" },
    { en: "Krishna Prathama", te: "బ. పాడ్యమి" }, { en: "Krishna Dwitiya", te: "బ. విదియ" }, { en: "Krishna Tritiya", te: "బ. తదియ" },
    { en: "Krishna Chaturthi", te: "బ. చవితి" }, { en: "Krishna Panchami", te: "బ. పంచమి" }, { en: "Krishna Shashthi", te: "బ. షష్ఠి" },
    { en: "Krishna Saptami", te: "బ. సప్తమి" }, { en: "Krishna Ashtami", te: "బ. అష్టమి" }, { en: "Krishna Navami", te: "బ. నవమి" },
    { en: "Krishna Dashami", te: "బ. దశమి" }, { en: "Krishna Ekadashi", te: "బ. ఏకాదశి" }, { en: "Krishna Dwadashi", te: "బ. ద్వాదశి" },
    { en: "Krishna Trayodashi", te: "బ. త్రయోదశి" }, { en: "Krishna Chaturdashi", te: "బ. చతుర్దశి" }, { en: "Amavasya", te: "అమావాస్య" }
  ];

  // 11 Karanas, each with its phalitam (result) and a tone for colouring.
  var KARANA = [
    { en: "Bava",       te: "బవ",            phala: "శుభం",   tone: "good" }, // 1
    { en: "Balava",     te: "బాలవ",          phala: "శుభం",   tone: "good" }, // 2
    { en: "Kaulava",    te: "కౌలవ",          phala: "శుభం",   tone: "good" }, // 3
    { en: "Taitila",    te: "తైతిల",         phala: "శుభం",   tone: "good" }, // 4
    { en: "Garaja",     te: "గరజ",           phala: "శుభం",   tone: "good" }, // 5
    { en: "Vanija",     te: "వణిజ",          phala: "మధ్యమం", tone: ""     }, // 6
    { en: "Vishti",     te: "విష్టి (భద్ర)", phala: "అశుభం",  tone: "bad"  }, // 7
    { en: "Shakuni",    te: "శకుని",         phala: "అశుభం",  tone: "bad"  }, // 8
    { en: "Chatushpada",te: "చతుష్పాద",      phala: "అశుభం",  tone: "bad"  }, // 9
    { en: "Naga",       te: "నాగ",           phala: "అశుభం",  tone: "bad"  }, // 10
    { en: "Kimstughna", te: "కింస్తుఘ్న",   phala: "శుభం",   tone: "good" }  // 11
  ];

  // 8 Dikpatis (direction lords) with their dikku, phalitam and tone.
  var DIKPATI = [
    { en: "Indra",   te: "ఇంద్రుడు",         dikku: "తూర్పు",   phala: "శుభం",        tone: "good" }, // 1
    { en: "Agni",    te: "అగ్ని",            dikku: "ఆగ్నేయం",  phala: "మధ్యమం",      tone: ""     }, // 2
    { en: "Yama",    te: "యముడు",            dikku: "దక్షిణం",  phala: "అశుభం",       tone: "bad"  }, // 3
    { en: "Nirruti", te: "నిరృతి",           dikku: "నైరుతి",   phala: "అశుభం",       tone: "bad"  }, // 4
    { en: "Varuna",  te: "వరుణుడు",          dikku: "పడమర",     phala: "శుభం",        tone: "good" }, // 5
    { en: "Vayu",    te: "వాయువు",           dikku: "వాయువ్యం", phala: "మధ్యమం",      tone: ""     }, // 6
    { en: "Kubera",  te: "కుబేరుడు",         dikku: "ఉత్తరం",   phala: "అత్యంత శుభం", tone: "good" }, // 7
    { en: "Ishana",  te: "ఈశానుడు (శివుడు)", dikku: "ఈశాన్యం",  phala: "అత్యంత శుభం", tone: "good" }  // 8
  ];

  // 9 Amsas, each with its phalitam (result) and a tone for good/bad colouring.
  // Row order is significant — index maps 0..8 (floor of the Amsa remainder).
  var AMSA = [
    { en: "Nashtamsa",  te: "నష్టాంశం",    phala: "అశుభం",        tone: "bad"  }, // 1
    { en: "Vriddhamsa", te: "వృద్ధాంశం",   phala: "శుభం",         tone: "good" }, // 2
    { en: "Dhruvamsa",  te: "ధ్రువాంశం",   phala: "శుభం",         tone: "good" }, // 3
    { en: "Dahanamsa",  te: "దహనాంశం",     phala: "అశుభం",        tone: "bad"  }, // 4
    { en: "Mrityvamsa", te: "మృత్యాంశం",   phala: "అత్యంత అశుభం", tone: "bad"  }, // 5
    { en: "Choramsa",   te: "చోరాంశం",     phala: "అశుభం",        tone: "bad"  }, // 6
    { en: "Putramsa",   te: "పుత్రాంశం",   phala: "శుభం",         tone: "good" }, // 7
    { en: "Godhanamsa", te: "గోధనాంశం",    phala: "అత్యంత శుభం",  tone: "good" }, // 8
    { en: "Kirtyamsa",  te: "కీర్త్యాంశం", phala: "అత్యంత శుభం",  tone: "good" }  // 9
  ];

  // 8 compass directions with the DIKPATI index each faces (for reference/UI).
  var DIRECTIONS = [
    { en: "East", te: "తూర్పు" }, { en: "South-East", te: "ఆగ్నేయం" }, { en: "South", te: "దక్షిణం" },
    { en: "South-West", te: "నైరుతి" }, { en: "West", te: "పడమర" }, { en: "North-West", te: "వాయువ్యం" },
    { en: "North", te: "ఉత్తరం" }, { en: "North-East", te: "ఈశాన్యం" }
  ];
  // Directions traditionally considered favourable for a main entrance.
  var AUSPICIOUS_DIRECTIONS = ["East", "North", "North-East"];

  global.AyadiTables = {
    AYAM: AYAM, AYAM_GOOD: AYAM_GOOD, AYAM_BAD: AYAM_BAD,
    NAKSHATRAS: NAKSHATRAS, VARA: VARA, TITHI: TITHI, KARANA: KARANA,
    DIKPATI: DIKPATI, AMSA: AMSA,
    DIRECTIONS: DIRECTIONS, AUSPICIOUS_DIRECTIONS: AUSPICIOUS_DIRECTIONS
  };
})(window);
