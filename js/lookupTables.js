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
  // Good tithis (positions): 2,3,5,6,7,8,10,11,13,17,18,20,21 → శుభం; all others → అశుభం.
  var TITHI = [
    { en: "Shukla Prathama",   te: "శు. పాడ్యమి",  phala: "అశుభం", tone: "bad"  }, //  1
    { en: "Shukla Dwitiya",    te: "శు. విదియ",    phala: "శుభం",  tone: "good" }, //  2
    { en: "Shukla Tritiya",    te: "శు. తదియ",     phala: "శుభం",  tone: "good" }, //  3
    { en: "Shukla Chaturthi",  te: "శు. చవితి",    phala: "అశుభం", tone: "bad"  }, //  4
    { en: "Shukla Panchami",   te: "శు. పంచమి",    phala: "శుభం",  tone: "good" }, //  5
    { en: "Shukla Shashthi",   te: "శు. షష్ఠి",    phala: "శుభం",  tone: "good" }, //  6
    { en: "Shukla Saptami",    te: "శు. సప్తమి",   phala: "శుభం",  tone: "good" }, //  7
    { en: "Shukla Ashtami",    te: "శు. అష్టమి",   phala: "శుభం",  tone: "good" }, //  8
    { en: "Shukla Navami",     te: "శు. నవమి",     phala: "అశుభం", tone: "bad"  }, //  9
    { en: "Shukla Dashami",    te: "శు. దశమి",     phala: "శుభం",  tone: "good" }, // 10
    { en: "Shukla Ekadashi",   te: "శు. ఏకాదశి",   phala: "శుభం",  tone: "good" }, // 11
    { en: "Shukla Dwadashi",   te: "శు. ద్వాదశి",  phala: "అశుభం", tone: "bad"  }, // 12
    { en: "Shukla Trayodashi", te: "శు. త్రయోదశి", phala: "శుభం",  tone: "good" }, // 13
    { en: "Shukla Chaturdashi",te: "శు. చతుర్దశి", phala: "అశుభం", tone: "bad"  }, // 14
    { en: "Purnima",           te: "పౌర్ణమి",      phala: "అశుభం", tone: "bad"  }, // 15
    { en: "Krishna Prathama",  te: "బ. పాడ్యమి",   phala: "అశుభం", tone: "bad"  }, // 16
    { en: "Krishna Dwitiya",   te: "బ. విదియ",     phala: "శుభం",  tone: "good" }, // 17
    { en: "Krishna Tritiya",   te: "బ. తదియ",      phala: "శుభం",  tone: "good" }, // 18
    { en: "Krishna Chaturthi", te: "బ. చవితి",     phala: "అశుభం", tone: "bad"  }, // 19
    { en: "Krishna Panchami",  te: "బ. పంచమి",     phala: "శుభం",  tone: "good" }, // 20
    { en: "Krishna Shashthi",  te: "బ. షష్ఠి",     phala: "శుభం",  tone: "good" }, // 21
    { en: "Krishna Saptami",   te: "బ. సప్తమి",    phala: "అశుభం", tone: "bad"  }, // 22
    { en: "Krishna Ashtami",   te: "బ. అష్టమి",    phala: "అశుభం", tone: "bad"  }, // 23
    { en: "Krishna Navami",    te: "బ. నవమి",      phala: "అశుభం", tone: "bad"  }, // 24
    { en: "Krishna Dashami",   te: "బ. దశమి",      phala: "అశుభం", tone: "bad"  }, // 25
    { en: "Krishna Ekadashi",  te: "బ. ఏకాదశి",    phala: "అశుభం", tone: "bad"  }, // 26
    { en: "Krishna Dwadashi",  te: "బ. ద్వాదశి",   phala: "అశుభం", tone: "bad"  }, // 27
    { en: "Krishna Trayodashi",te: "బ. త్రయోదశి",  phala: "అశుభం", tone: "bad"  }, // 28
    { en: "Krishna Chaturdashi",te: "బ. చతుర్దశి", phala: "అశుభం", tone: "bad"  }, // 29
    { en: "Amavasya",          te: "అమావాస్య",     phala: "అశుభం", tone: "bad"  }  // 30
  ];

  // 11 Karanas.
  var KARANA = [
    { en: "Bava",       te: "బవ" },            // 1
    { en: "Balava",     te: "బాలవ" },          // 2
    { en: "Kaulava",    te: "కౌలవ" },          // 3
    { en: "Taitila",    te: "తైతిల" },         // 4
    { en: "Garaja",     te: "గరజ" },           // 5
    { en: "Vanija",     te: "వణిజ" },          // 6
    { en: "Vishti",     te: "విష్టి (భద్ర)" }, // 7
    { en: "Shakuni",    te: "శకుని" },         // 8
    { en: "Chatushpada",te: "చతుష్పాద" },      // 9
    { en: "Naga",       te: "నాగ" },           // 10
    { en: "Kimstughna", te: "కింస్తుఘ్న" }    // 11
  ];

  // 8 Dikpatis (direction lords) with their dikku, phalitam and tone.
  // Classification: odd positions (1,3,5,7) are good; even (2,4,6,8) are bad.
  var DIKPATI = [
    { en: "Indra",   te: "ఇంద్రుడు",         dikku: "తూర్పు",   phala: "శుభం",  tone: "good" }, // 1
    { en: "Agni",    te: "అగ్ని",            dikku: "ఆగ్నేయం",  phala: "అశుభం", tone: "bad"  }, // 2
    { en: "Yama",    te: "యముడు",            dikku: "దక్షిణం",  phala: "శుభం",  tone: "good" }, // 3
    { en: "Nirruti", te: "నిరృతి",           dikku: "నైరుతి",   phala: "అశుభం", tone: "bad"  }, // 4
    { en: "Varuna",  te: "వరుణుడు",          dikku: "పడమర",     phala: "శుభం",  tone: "good" }, // 5
    { en: "Vayu",    te: "వాయువు",           dikku: "వాయువ్యం", phala: "అశుభం", tone: "bad"  }, // 6
    { en: "Kubera",  te: "కుబేరుడు",         dikku: "ఉత్తరం",   phala: "శుభం",  tone: "good" }, // 7
    { en: "Ishana",  te: "ఈశానుడు (శివుడు)", dikku: "ఈశాన్యం",  phala: "అశుభం", tone: "bad"  }  // 8
  ];

  // 9 Amsas, each with its phalitam (result) and a tone for good/bad colouring.
  // Row order is significant — 1-based per the engine's spec (remainder r → r-th row).
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
