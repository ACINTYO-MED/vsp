/* =============================================================================
 * validation.js — VALIDATION LAYER
 * -----------------------------------------------------------------------------
 * Validates raw form values BEFORE the engine runs. Range rules for inches /
 * nullu are derived from the active unit system so they stay correct across
 * traditions.
 *
 * Exposed globally as `AyadiValidation`.
 * ===========================================================================*/
(function (global, CONFIG) {
  "use strict";

  function isBlank(v) { return v == null || String(v).trim() === ""; }

  /** Parse an integer, treating blank as 0. */
  function toInt(v) {
    if (isBlank(v)) return 0;
    var n = Number(v);
    return n;
  }

  /**
   * Validate the raw input map from the UI.
   * @param {Object} raw  { name, ownerNakshatra, direction,
   *                        widthFeet, widthInch, widthNullu,
   *                        depthFeet, depthInch, depthNullu }
   * @returns {{ valid:boolean, errors:Object, data:Object }}
   *          `errors` is keyed by field id; `data` is the normalised input for
   *          the engine (only meaningful when valid).
   */
  function validate(raw) {
    var errors = {};
    var maxNullu = CONFIG.units.nulluPerInch - 1;

    if (isBlank(raw.name)) errors.name = "Name is required";
    if (isBlank(raw.ownerNakshatra)) errors.ownerNakshatra = "Select a nakshatra";
    if (isBlank(raw.direction)) errors.direction = "Select a direction";

    // Numeric range specs: [field, min, max, message]
    var specs = [
      ["widthFeet", 0, Infinity, "Feet cannot be negative"],
      ["widthInch", 0, 11,       "Inches must be 0–11"],
      ["widthNullu", 0, maxNullu, "Nullu must be 0–" + maxNullu],
      ["depthFeet", 0, Infinity, "Feet cannot be negative"],
      ["depthInch", 0, 11,       "Inches must be 0–11"],
      ["depthNullu", 0, maxNullu, "Nullu must be 0–" + maxNullu]
    ];

    var nums = {};
    specs.forEach(function (s) {
      var field = s[0], min = s[1], max = s[2], msg = s[3];
      var n = toInt(raw[field]);
      nums[field] = n;
      if (!isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
        errors[field] = msg;
      }
    });

    // Each dimension must be greater than zero overall.
    if (!errors.widthFeet && !errors.widthInch && !errors.widthNullu &&
        nums.widthFeet + nums.widthInch + nums.widthNullu === 0) {
      errors.widthFeet = "Enter a width";
    }
    if (!errors.depthFeet && !errors.depthInch && !errors.depthNullu &&
        nums.depthFeet + nums.depthInch + nums.depthNullu === 0) {
      errors.depthFeet = "Enter a depth";
    }

    var valid = Object.keys(errors).length === 0;

    return {
      valid: valid,
      errors: errors,
      data: {
        name: isBlank(raw.name) ? "" : raw.name.trim(),
        ownerNakshatra: raw.ownerNakshatra,
        direction: raw.direction,
        width: { feet: nums.widthFeet, inches: nums.widthInch, nullu: nums.widthNullu },
        depth: { feet: nums.depthFeet, inches: nums.depthInch, nullu: nums.depthNullu }
      }
    };
  }

  global.AyadiValidation = { validate: validate };
})(window, window.AyadiConfig);
