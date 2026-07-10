/* =============================================================================
 * units.js — UNIT CONVERSION UTILITY
 * -----------------------------------------------------------------------------
 * All conversions read their factors from AyadiConfig.units, so a different
 * tradition only needs a different unit system in config.js.
 *
 * Base capture unit: feet + inches + nullu.
 *
 * Exposed globally as `AyadiUnits`.
 * ===========================================================================*/
(function (global, CONFIG) {
  "use strict";

  function u() { return CONFIG.units; }   // always read the live (swappable) unit system

  /** Total decimal FEET from feet + inches + nullu. */
  function convertToFeet(feet, inches, nullu) {
    var ipf = u().inchesPerFoot, npi = u().nulluPerInch;
    return feet + inches / ipf + nullu / (ipf * npi);
  }

  /** Total INCHES from feet + inches + nullu. */
  function convertToInches(feet, inches, nullu) {
    var ipf = u().inchesPerFoot, npi = u().nulluPerInch;
    return feet * ipf + inches + nullu / npi;
  }

  /** Total ANGULA. Derived from total inches × angulaPerInch. */
  function convertToAngula(feet, inches, nullu) {
    return convertToInches(feet, inches, nullu) * u().angulaPerInch;
  }

  /** Total HASTA (cubits). Derived from total inches ÷ inchesPerHasta. */
  function convertToHasta(feet, inches, nullu) {
    return convertToInches(feet, inches, nullu) / u().inchesPerHasta;
  }

  /**
   * Convert one dimension object {feet, inches, nullu} into every unit at once.
   * @returns {{feet:number, inches:number, angula:number, hasta:number}}
   */
  function convertAll(dim) {
    return {
      feet:   convertToFeet(dim.feet, dim.inches, dim.nullu),
      inches: convertToInches(dim.feet, dim.inches, dim.nullu),
      angula: convertToAngula(dim.feet, dim.inches, dim.nullu),
      hasta:  convertToHasta(dim.feet, dim.inches, dim.nullu)
    };
  }

  global.AyadiUnits = {
    convertToFeet: convertToFeet,
    convertToInches: convertToInches,
    convertToAngula: convertToAngula,
    convertToHasta: convertToHasta,
    convertAll: convertAll
  };
})(window, window.AyadiConfig);
