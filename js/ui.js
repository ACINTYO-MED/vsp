/* =============================================================================
 * ui.js — UI LAYER (DOM controller)
 * -----------------------------------------------------------------------------
 * The ONLY layer that touches the DOM. It wires inputs → Validation → Engine →
 * Result Generator, and renders the bottom-sheet result. It contains NO Ayadi
 * formulas or divisors — all of that lives in config/engine.
 *
 * Depends (load order): AyadiConfig, AyadiTables, AyadiUnits, AyadiEngine,
 *                       AyadiValidation, AyadiResult.
 * ===========================================================================*/
(function (global, CONFIG, TABLES, UNITS, ENGINE, VALIDATION, RESULT, SUGGEST) {
  "use strict";
  var AyadiUnits = UNITS, AyadiSuggest = SUGGEST;   // local aliases
  var lastRendered = null;                          // {json, area, computed} for PDF export
  var SENDER = { name: "P.ప్రసాద్ శర్మ", place: "కేసానుపల్లి", phone: "9440938238" };  // PDF letterhead

  /* ---- tiny DOM helpers ---- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var el = function (id) { return document.getElementById(id); };
  var lbl = function (entry) { return ENGINE.label(entry); };

  /* ---- populate dropdowns from lookup tables ---- */
  function populateSelects() {
    var nak = el("ownerNakshatra");
    TABLES.NAKSHATRAS.forEach(function (n) { nak.add(new Option(lbl(n), n.en)); });
    var dir = el("direction");
    TABLES.DIRECTIONS.forEach(function (d) { dir.add(new Option(lbl(d), d.en)); });
    // Suggestions tab: birth star (for the నక్షత్రము factor)
    var sNak = el("sNakshatra");
    TABLES.NAKSHATRAS.forEach(function (n) { sNak.add(new Option(lbl(n), n.en)); });
    // Padam tab: birth star (for పొంతన)
    var pNak = el("pNakshatra");
    TABLES.NAKSHATRAS.forEach(function (n) { pNak.add(new Option(lbl(n), n.en)); });
  }

  /* ---- floating labels for selects (they always hold a value) ---- */
  function wireSelectLabels() {
    $$("select").forEach(function (s) {
      var sync = function () { s.classList.toggle("filled", !!s.value); };
      s.addEventListener("change", sync); sync();
    });
  }

  /* ---- Material ripple ---- */
  function attachRipple(btn) {
    btn.addEventListener("pointerdown", function (e) {
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var r = document.createElement("span");
      r.className = "ripple";
      r.style.width = r.style.height = size + "px";
      r.style.left = (e.clientX - rect.left - size / 2) + "px";
      r.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(r);
      r.addEventListener("animationend", function () { r.remove(); });
    });
  }

  /* ---- validation UI ---- */
  function fieldOf(input) { return input.closest(".field"); }
  function clearFieldErrors() { $$(".field").forEach(function (f) { f.classList.remove("invalid"); }); }
  function showErrors(errors) {
    clearFieldErrors();
    Object.keys(errors).forEach(function (id) {
      var input = el(id);
      if (!input) return;
      var f = fieldOf(input);
      f.classList.add("invalid");
      var em = $(".error-msg", f);
      if (em) em.lastChild.textContent = errors[id];
    });
    var firstBad = $(".field.invalid");
    if (firstBad) firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* ---- read raw form values ---- */
  function readForm() {
    return {
      name: el("name").value,
      ownerNakshatra: el("ownerNakshatra").value,
      direction: el("direction").value,
      widthFeet: el("widthFeet").value, widthInch: el("widthInch").value, widthNullu: el("widthNullu").value,
      depthFeet: el("depthFeet").value, depthInch: el("depthInch").value, depthNullu: el("depthNullu").value
    };
  }

  /* ---- render helpers ---- */
  /** One label/value pair → a <th><td> couple (half of a 4-column table row). */
  function pair(item) {
    var td = '<td' + (item.tone ? ' class="' + item.tone + '"' : "") + ">" + item.value + "</td>";
    return "<th>" + item.label + "</th>" + td;
  }

  /**
   * Render a list of {label, value, tone} items as a 4-column table:
   * each <tr> holds two pairs → columns = label | value | label | value.
   */
  function table(items) {
    var rows = "";
    for (var i = 0; i < items.length; i += 2) {
      rows += "<tr>" + pair(items[i]) +
        (items[i + 1] ? pair(items[i + 1]) : "<th></th><td></td>") + "</tr>";
    }
    return '<div class="table-wrap"><table class="rtable">' + rows + "</table></div>";
  }

  function collapsible(title, icon, innerHTML, open) {
    return '<div class="collapse' + (open ? " open" : "") + '">' +
      '<button type="button" class="collapse-head"><span class="material-symbols-rounded lead">' + icon +
      '</span>' + title + '<span class="material-symbols-rounded chev">expand_more</span></button>' +
      '<div class="collapse-body"><div class="collapse-inner">' + innerHTML + "</div></div></div>";
  }

  /* ---- render the full result into the bottom sheet ---- */
  function renderResult(computed) {
    var json = RESULT.toJSON(computed);
    var area = RESULT.areaBreakdown(computed);
    lastRendered = { json: json, area: area, computed: computed };   // for PDF export

    // tone is derived from the language-neutral computed keys (not the Telugu JSON)
    var ayamGood = computed.ayam.status === "Good";
    var compKey = computed.nakshatraCompatibility.rating;
    var compTone = (compKey === "Bad" || compKey === "Very Bad") ? "bad" :
                   (compKey === "Excellent" || compKey === "Good") ? "good" : "";

    // Owner / plot summary
    var summary = [
      { label: "పేరు", value: json.name },
      { label: "జన్మ నక్షత్రము", value: json.ownerNakshatra },
      { label: "దిక్కు", value: json.direction },
      { label: "వెడల్పు", value: json.width },
      { label: "పొడవు", value: json.depth }
    ];

    // Area in every unit
    var areaItems = [
      { label: "చదరపు అడుగులు", value: area.sqft },
      { label: "చదరపు అంగుళాలు", value: area.sqin },
      { label: "అంగుళం", value: area.angula },
      { label: "హస్తం", value: area.hasta },
      { label: "పదము", value: json.padam }
    ];

    // Ayadi factors
    var factors = [
      { label: "ధనము", value: json.dhanam },
      { label: "రుణము", value: json.runam },
      { label: "ఆయము", value: json.ayam + " · " + json.ayamStatus, tone: ayamGood ? "good" : "bad" },
      { label: "ఆయుష్షు", value: json.ayushu, tone: computed.ayushu.tone },
      { label: "అంశ", value: json.amsa, tone: computed.amsa.tone },
      { label: "నక్షత్రము", value: json.nakshatra },
      { label: "నక్షత్ర పొంతన", value: json.nakshatraCompatibility, tone: compTone },
      { label: "తిథి", value: json.tithi, tone: computed.tithi.tone },
      { label: "వారము", value: json.vara, tone: computed.vara.tone },
      { label: "దిక్పతి", value: json.dikpati, tone: computed.dikpati.tone },
      { label: "కరణము", value: json.karana }
    ];

    var body = el("sheetBody");
    body.innerHTML =
      // Collapsible sections (score gauge, rating badge and recommendation intentionally omitted)
      collapsible("యజమాని &amp; స్థలం", "person", table(summary), true) +
      collapsible("వైశాల్యం &amp; పదము", "square_foot", table(areaItems), true) +
      collapsible("ఆయాది వివరాలు", "calculate", table(factors), true);

    wireCollapsibles();
    openSheet();
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
  }

  /* ---- Printable/shareable result content (score/gauge/recommendation omitted) ---- */
  // Returns { css, bodyHTML, name } for the current result, or null if none.
  // CSS is scoped under `.ayadi-pdf` so it's safe to inject into any document.
  function buildResultContent() {
    if (!lastRendered) return null;
    var j = lastRendered.json, a = lastRendered.area, c = lastRendered.computed;

    var ayamGood = c.ayam.status === "Good";
    var compKey = c.nakshatraCompatibility.rating;
    var compTone = (compKey === "Bad" || compKey === "Very Bad") ? "bad" :
                   (compKey === "Excellent" || compKey === "Good") ? "good" : "";

    // Each row: [label, value, tone?]. Values are escaped (name is user input).
    var summary = [
      ["పేరు", j.name], ["జన్మ నక్షత్రము", j.ownerNakshatra], ["దిక్కు", j.direction],
      ["వెడల్పు", j.width], ["పొడవు", j.depth]
    ];
    var areaItems = [
      ["చదరపు అడుగులు", a.sqft], ["చదరపు అంగుళాలు", a.sqin], ["అంగుళం", a.angula],
      ["హస్తం", a.hasta], ["పదము", j.padam]
    ];
    var factors = [
      ["ధనము", j.dhanam], ["రుణము", j.runam],
      ["ఆయము", j.ayam + " · " + j.ayamStatus, ayamGood ? "good" : "bad"],
      ["ఆయుష్షు", j.ayushu, c.ayushu.tone], ["అంశ", j.amsa, c.amsa.tone],
      ["నక్షత్రము", j.nakshatra], ["నక్షత్ర పొంతన", j.nakshatraCompatibility, compTone],
      ["తిథి", j.tithi, c.tithi.tone], ["వారము", j.vara, c.vara.tone],
      ["దిక్పతి", j.dikpati, c.dikpati.tone], ["కరణము", j.karana]
    ];

    // Two items per row (label|value|label|value) to stay compact on one A4 page.
    function cell(item) {
      if (!item) return '<th></th><td></td>';
      return '<th>' + escapeHTML(item[0]) + '</th><td class="' + (item[2] || "") + '">' +
             escapeHTML(item[1]) + '</td>';
    }
    function rows(list) {
      var out = "";
      for (var i = 0; i < list.length; i += 2) out += '<tr>' + cell(list[i]) + cell(list[i + 1]) + '</tr>';
      return out;
    }
    function section(title, list) {
      return '<h2>' + escapeHTML(title) + '</h2><table>' + rows(list) + '</table>';
    }

    var when = new Date().toLocaleDateString("te-IN", { year: "numeric", month: "long", day: "numeric" });
    var css =
      '.ayadi-pdf,.ayadi-pdf *{box-sizing:border-box}' +
      '.ayadi-pdf{font-family:"Noto Sans Telugu","Inter",system-ui,sans-serif;color:#1a1a1a;background:#fff;line-height:1.3;font-size:11px;padding:32px}' +
      '.ayadi-pdf header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:2.5px solid #6d28d9;padding-bottom:7px;margin-bottom:10px}' +
      '.ayadi-pdf h1{font-size:17px;margin:0 0 2px;color:#6d28d9}' +
      '.ayadi-pdf .meta{font-size:10.5px;color:#555}' +
      '.ayadi-pdf .sender{text-align:right;font-size:10px;color:#444;line-height:1.4;white-space:nowrap}' +
      '.ayadi-pdf .sender .sname{font-weight:700;color:#6d28d9;font-size:11.5px}' +
      '.ayadi-pdf h2{font-size:12px;margin:11px 0 4px;color:#6d28d9}' +
      '.ayadi-pdf table{width:100%;border-collapse:collapse;font-size:10px;table-layout:fixed}' +
      '.ayadi-pdf th,.ayadi-pdf td{text-align:left;padding:3.5px 6px;border:1px solid #e3e3ea;vertical-align:top;word-break:break-word}' +
      '.ayadi-pdf th{width:16%;background:#f6f4fb;font-weight:600;color:#333;white-space:nowrap}' +
      '.ayadi-pdf td{width:34%}' +
      '.ayadi-pdf td.good{color:#0a7d32;font-weight:600}.ayadi-pdf td.bad{color:#c02626;font-weight:600}' +
      '.ayadi-pdf footer{margin-top:12px;font-size:9px;color:#999;text-align:center}';
    var bodyHTML =
      '<div class="ayadi-pdf">' +
      '<header>' +
      '<div><h1>ఆయాది ఫలితం</h1>' +
      '<div class="meta">' + escapeHTML(j.name) + ' · ' + escapeHTML(when) + '</div></div>' +
      '<div class="sender"><div class="sname">' + escapeHTML(SENDER.name) + '</div>' +
      '<div>' + escapeHTML(SENDER.place) + '</div><div>' + escapeHTML(SENDER.phone) + '</div></div>' +
      '</header>' +
      section("యజమాని & స్థలం", summary) +
      section("వైశాల్యం & పదము", areaItems) +
      section("ఆయాది వివరాలు", factors) +
      '<footer>ఆయాది గణితం · వాస్తు కాలిక్యులేటర్</footer>' +
      '</div>';
    return { css: css, bodyHTML: bodyHTML, name: j.name };
  }

  /* ---- PDF via print dialog (Save as PDF) ---- */
  function downloadResultPdf() {
    var p = buildResultContent();
    if (!p) return;
    var doc =
      '<!DOCTYPE html><html lang="te"><head><meta charset="utf-8">' +
      '<title>ఆయాది ఫలితం — ' + escapeHTML(p.name) + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">' +
      '<style>@page{size:A4;margin:0}html,body{margin:0}' + p.css + '</style></head><body>' +
      p.bodyHTML +
      '<script>window.onload=function(){window.focus();window.print();};' +
      'window.onafterprint=function(){window.close();};<\/script>' +
      '</body></html>';
    var win = window.open("", "_blank");
    if (!win) { alert("PDF కోసం పాప్-అప్‌ను అనుమతించండి."); return; }
    win.document.open(); win.document.write(doc); win.document.close();
  }

  /* ---- Render the current result to a real single-page A4 PDF Blob ---- */
  // Uses html2canvas (captures Telugu correctly) + jsPDF (wraps the raster in A4).
  function generateResultPdfBlob() {
    var p = buildResultContent();
    if (!p) return Promise.reject(new Error("ఫలితం లేదు"));
    if (!global.html2canvas || !global.jspdf) return Promise.reject(new Error("PDF లైబ్రరీ లోడ్ కాలేదు"));

    var host = document.createElement("div");
    host.setAttribute("style", "position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1;");
    host.innerHTML = "<style>" + p.css + "</style>" + p.bodyHTML;   // 794px ≈ A4 width @96dpi
    document.body.appendChild(host);
    var target = host.querySelector(".ayadi-pdf");

    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    return fontsReady
      .then(function () { return global.html2canvas(target, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false }); })
      .then(function (canvas) {
        var JsPDF = global.jspdf.jsPDF;
        var pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
        var pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
        var imgW = pw, imgH = canvas.height * pw / canvas.width;          // fit to page width
        if (imgH > ph) { imgH = ph; imgW = canvas.width * ph / canvas.height; }  // clamp to one page
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", (pw - imgW) / 2, 0, imgW, imgH);
        host.remove();
        return pdf.output("blob");
      })
      .catch(function (err) { host.remove(); throw err; });
  }

  /* ---- Blob → bare base64 (no data: prefix), for passing to the Android bridge ---- */
  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { var s = String(r.result); resolve(s.slice(s.indexOf(",") + 1)); };
      r.onerror = function () { reject(new Error("PDF ఎన్‌కోడ్ విఫలమైంది")); };
      r.readAsDataURL(blob);
    });
  }

  /* ---- Share the PDF to WhatsApp, choosing the best channel for the platform ---- */
  function sharePdfWhatsApp() {
    if (!lastRendered) return;
    var btn = el("sheetShare");
    if (btn) btn.disabled = true;
    var name = (lastRendered.json.name || "result");
    var fileName = "ayadi-" + name.replace(/[\s\\/:*?"<>|]+/g, "-") + ".pdf";
    var text = "ఆయాది ఫలితం — " + name;

    generateResultPdfBlob().then(function (blob) {
      // 1) Android WebView bridge — REQUIRED inside a native WebView (no Web Share
      //    API there). Native code decodes the base64, saves the file and fires an
      //    ACTION_SEND intent so WhatsApp receives the actual PDF. See ANDROID_SHARE.md.
      if (global.AndroidShare && typeof global.AndroidShare.sharePdf === "function") {
        return blobToBase64(blob).then(function (b64) { global.AndroidShare.sharePdf(b64, fileName, text); });
      }
      // 2) Web Share API (real mobile browsers) — file goes straight to WhatsApp.
      var file = new File([blob], fileName, { type: "application/pdf" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: "ఆయాది ఫలితం", text: text });
      }
      // 3) Desktop fallback — download the PDF, then open WhatsApp to attach it.
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      window.open("https://wa.me/?text=" + encodeURIComponent(text + " (దిగుమతైన PDF ను జతచేయండి)"), "_blank");
    }).catch(function (err) {
      if (err && err.name === "AbortError") return;  // user dismissed the share sheet
      alert("PDF షేర్ విఫలమైంది: " + (err && err.message ? err.message : err));
    }).then(function () { if (btn) btn.disabled = false; });
  }

  /* ---- collapsible behaviour ---- */
  function wireCollapsibles() {
    $$("#sheetBody .collapse-head").forEach(function (head) {
      head.addEventListener("click", function () { head.parentElement.classList.toggle("open"); });
    });
  }

  /* ---- animate progress ring + count-up ---- */
  function animateGauge(score) {
    var CIRC = 2 * Math.PI * 52;
    var arc = el("scoreArc"), num = el("scoreNum");
    if (!arc) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        arc.style.strokeDashoffset = (CIRC * (1 - score / 100)).toFixed(1);
      });
    });
    var start = performance.now(), dur = 1100;
    (function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      num.textContent = Math.round((1 - Math.pow(1 - p, 3)) * score);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  /* ---- bottom sheet open/close ---- */
  function openSheet() { el("scrim").classList.add("open"); el("sheet").classList.add("open"); }
  function closeSheet() { el("scrim").classList.remove("open"); el("sheet").classList.remove("open"); }

  /* ---- clear ---- */
  function clearForm() {
    var form = el("ayadiForm");
    form.classList.add("clearing");
    setTimeout(function () { form.classList.remove("clearing"); }, 450);
    form.reset();
    clearFieldErrors();
    $$("select").forEach(function (s) { s.classList.remove("filled"); });
    clearTargetPadam();
    el("name").focus();
  }

  /* ---- submit ---- */
  function handleSubmit(e) {
    e.preventDefault();
    var res = VALIDATION.validate(readForm());
    if (!res.valid) { showErrors(res.errors); return; }
    clearFieldErrors();

    var btn = el("calcBtn");
    btn.classList.add("loading"); btn.disabled = true;
    setTimeout(function () {                       // brief loading animation
      var computed = ENGINE.computeAll(res.data);
      renderResult(computed);
      btn.classList.remove("loading"); btn.disabled = false;
    }, 900);
  }

  /* ---- theme ---- */
  function initTheme() {
    var btn = el("themeToggle"), icon = el("themeIcon");
    var apply = function (t) { document.documentElement.setAttribute("data-theme", t); icon.textContent = t === "dark" ? "light_mode" : "dark_mode"; };
    var current = (global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    apply(current);
    btn.addEventListener("click", function () { current = current === "dark" ? "light" : "dark"; apply(current); });
  }

  /* =======================================================================
   * TABS
   * ===================================================================== */
  function switchTab(name) {
    $$(".tab").forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-tab") === name); });
    el("tab-calc").hidden = name !== "calc";
    el("tab-suggest").hidden = name !== "suggest";
    el("tab-padam").hidden = name !== "padam";
    if (name === "suggest") prefillPadamRange();
  }

  /* =======================================================================
   * PADAM → full calculation (dimension-free)
   * ===================================================================== */
  function compToneOf(rating) {
    if (rating === "Excellent" || rating === "Good") return "good";
    if (rating === "Bad" || rating === "Very Bad") return "bad";
    return "";
  }

  /** In the padam tab, fill the missing dimension from padam + the given one. */
  function padamAutoOther(source) {
    var padam = Number(el("pPadam").value);
    if (!(padam > 0)) return;
    if (source === "width") {
      var w = calcDim("pWidth"), wFt = AyadiUnits.convertToFeet(w.feet, w.inches, w.nullu);
      if (wFt > 0) setDim("pDepth", ftToDim(9 * padam / wFt));
    } else {
      var d = calcDim("pDepth"), dFt = AyadiUnits.convertToFeet(d.feet, d.inches, d.nullu);
      if (dFt > 0) setDim("pWidth", ftToDim(9 * padam / dFt));
    }
  }
  /** When padam changes, refresh whichever dimension is already filled. */
  function padamRecompute() {
    var w = calcDim("pWidth"), d = calcDim("pDepth");
    if (w.feet + w.inches + w.nullu > 0) padamAutoOther("width");
    else if (d.feet + d.inches + d.nullu > 0) padamAutoOther("depth");
  }

  function handlePadamCalc() {
    var box = el("padamResults");
    var padam = Number(el("pPadam").value);
    if (!(padam > 0)) {
      box.innerHTML = '<div class="empty">సరైన పదము విలువ నమోదు చేయండి.</div>';
      return;
    }
    var owner = el("pNakshatra").value;
    // optional dimensions
    var w = calcDim("pWidth"), d = calcDim("pDepth");
    var wFt = AyadiUnits.convertToFeet(w.feet, w.inches, w.nullu);
    var dFt = AyadiUnits.convertToFeet(d.feet, d.inches, d.nullu);
    var dims = (wFt > 0 && dFt > 0) ? { w: w, d: d, wFt: wFt, dFt: dFt, area: wFt * dFt } : null;

    var btn = el("padamCalcBtn");
    btn.classList.add("loading"); btn.disabled = true;
    setTimeout(function () {
      renderPadamReport(ENGINE.computeFromPadam(padam, owner), dims);
      btn.classList.remove("loading"); btn.disabled = false;
    }, 500);
  }

  function renderPadamReport(c, dims) {
    // Truncate (don't round) to 2 dp so the shown integer part matches the
    // Math.floor(value) the engine uses to pick the row — e.g. 2.996 → "2.99".
    var n2 = function (v) { var s = Number(v).toFixed(6); return s.slice(0, s.indexOf(".") + 3); };
    var lk = function (f) { return n2(f.value) + " · " + f.label; };
    var statusTe = c.ayam.status === "Good" ? "శుభం" : "అశుభం";

    var items = [{ label: "పదము", value: c.padam.toFixed(3) }];
    if (dims) {
      items.push(
        { label: "వెడల్పు", value: fmtDim(dims.w) + " (" + dims.wFt.toFixed(3) + " అ.)" },
        { label: "పొడవు",  value: fmtDim(dims.d) + " (" + dims.dFt.toFixed(3) + " అ.)" },
        { label: "వైశాల్యం", value: dims.area.toFixed(3) + " చ.అ." }
      );
    }
    items.push(
      { label: "ధనము",        value: n2(c.dhanam) },
      { label: "రుణము",       value: n2(c.runam) },
      { label: "ఆయము",        value: lk(c.ayam) + " · " + statusTe, tone: c.ayam.status === "Good" ? "good" : "bad" },
      { label: "ఆయుష్షు",     value: n2(c.ayushu.value) + " · " + c.ayushu.phala, tone: c.ayushu.tone },
      { label: "అంశ",         value: lk(c.amsa) + " · " + c.amsa.phala, tone: c.amsa.tone },
      { label: "నక్షత్రము",    value: lk(c.nakshatra) },
      { label: "నక్షత్ర పొంతన", value: c.nakshatraCompatibility.tara || "—", tone: compToneOf(c.nakshatraCompatibility.rating) },
      { label: "తిథి",        value: lk(c.tithi) + " · " + c.tithi.phala, tone: c.tithi.tone },
      { label: "వారము",       value: lk(c.vara) + " (" + c.vara.graha + ") · " + c.vara.phala, tone: c.vara.tone },
      { label: "దిక్పతి",      value: lk(c.dikpati) + " (" + c.dikpati.dikku + ") · " + c.dikpati.phala, tone: c.dikpati.tone },
      { label: "కరణము",       value: lk(c.karana) }
    );
    el("padamResults").innerHTML =
      '<div class="card"><h2 class="section-title"><span class="material-symbols-rounded">summarize</span>ఫలిత నివేదిక</h2>' +
      table(items) + "</div>";
  }

  /* =======================================================================
   * SUITABLE-DIMENSION SUGGESTIONS
   * Standalone: needs only a padam range (+ optional own nakshatra).
   * ===================================================================== */
  function fmtDim(d) { return d.feet + " అ. " + d.inches + " అం. " + d.nullu + " ను."; }

  /** Default the padam range on first open. */
  function prefillPadamRange() {
    if (!el("sPadamMin").value && !el("sPadamMax").value) {
      el("sPadamMin").value = "40";
      el("sPadamMax").value = "60";
    }
  }

  function handleSuggest() {
    var box = el("suggestResults");
    var pmin = Number(el("sPadamMin").value);
    var pmax = Number(el("sPadamMax").value);

    if (!(pmin > 0) || !(pmax > 0) || pmax < pmin) {
      box.innerHTML = '<div class="empty">సరైన పదము పరిధి నమోదు చేయండి (కనిష్ఠ ≤ గరిష్ఠ).</div>';
      return;
    }

    var owner = el("sNakshatra").value;                 // optional birth star
    var btn = el("suggestBtn");
    btn.classList.add("loading"); btn.disabled = true;
    setTimeout(function () {
      var results = AyadiSuggest.search({ ownerNakshatra: owner, padamMin: pmin, padamMax: pmax });
      renderSuggestions(results);
      btn.classList.remove("loading"); btn.disabled = false;
    }, 500);
  }

  function chip(c) {
    var cls = c.tone === "good" ? " good" : c.tone === "bad" ? " bad" : "";
    return '<span class="chip' + cls + '">' + c.label + "</span>";
  }

  function renderSuggestions(result) {
    var box = el("suggestResults");
    var items = result.items;
    if (!items.length) {
      box.innerHTML = '<div class="empty">అనుకూల పదము కనబడలేదు — పరిధిని పెంచి మళ్ళీ ప్రయత్నించండి.</div>';
      return;
    }
    var head = '<div class="sugg-count">' + items.length + " అనుకూల పదములు" +
      (result.truncated ? " (మొదటివి)" : "") + " దొరికాయి</div>";
    var cards = items.map(function (r) {
      var facts = r.chips.map(function (c) {
        var cls = c.tone === "good" ? " good" : c.tone === "bad" ? " bad" : "";
        return '<div class="fcell' + cls + '"><span class="fk">' + c.label +
          '</span><span class="fv">' + c.value + "</span></div>";
      }).join("");
      var sq = ftToDim(3 * Math.sqrt(r.padam));   // square plot that gives this padam
      return '<div class="sugg">' +
        '<div class="sugg-head"><div>' +
          '<div class="sugg-dim">పదము ' + r.padam.toFixed(3) + "</div>" +
          '<div class="sugg-sub">సూచన: వె ' + fmtDim(sq) + " × పొ " + fmtDim(sq) + "</div>" +
          '<div class="sugg-sub">' + r.goodCount + "/" + r.chips.length + " శుభం</div>" +
        '</div><button type="button" class="sugg-use" data-padam="' + r.padam + '">వాడు</button></div>' +
        '<div class="fgrid">' + facts + "</div></div>";
    }).join("");
    box.innerHTML = head + cards;

    // Wire "వాడు": load a square plot for this padam into the calculator.
    $$(".sugg-use", box).forEach(function (b) {
      b.addEventListener("click", function () { useSuggestionPadam(Number(b.dataset.padam)); });
    });
  }

  /* ---- target-padam mode: enter one dimension, the other auto-fills ---- */
  var targetPadam = null;      // active target padam (null = normal mode)
  var autoFilling = false;     // guard so programmatic fills don't recurse

  function calcDim(prefix) {
    var toInt = function (id) { var v = el(id).value.trim(); return v === "" ? 0 : Number(v); };
    return { feet: toInt(prefix + "Feet"), inches: toInt(prefix + "Inch"), nullu: toInt(prefix + "Nullu") };
  }
  /** decimal feet → {feet,inches,nullu} (nearest nullu; 96 nullu = 1 foot). */
  function ftToDim(ft) {
    var t = Math.max(0, Math.round(ft * 96));
    var feet = Math.floor(t / 96), rem = t - feet * 96, inches = Math.floor(rem / 8);
    return { feet: feet, inches: inches, nullu: rem - inches * 8 };
  }
  function setDim(prefix, d) {
    autoFilling = true;
    el(prefix + "Feet").value = d.feet; el(prefix + "Inch").value = d.inches; el(prefix + "Nullu").value = d.nullu;
    autoFilling = false;
  }

  /** Snap a dimension's fields to whole feet/inch/nullu (e.g. 20.5 ft → 20′6″0n). */
  function normalizeField(prefix) {
    var d = calcDim(prefix);
    var ft = AyadiUnits.convertToFeet(d.feet, d.inches, d.nullu);
    if (ft <= 0) return;
    var nd = ftToDim(ft);
    if (nd.feet !== d.feet || nd.inches !== d.inches || nd.nullu !== d.nullu) setDim(prefix, nd);
  }

  /** When one side is typed in target-padam mode, compute the other: padam = w·d/9. */
  function autoComputeOther(source) {
    if (!targetPadam || autoFilling) return;
    if (source === "width") {
      var w = calcDim("width"), wFt = AyadiUnits.convertToFeet(w.feet, w.inches, w.nullu);
      if (wFt > 0) setDim("depth", ftToDim(9 * targetPadam / wFt));
    } else {
      var d = calcDim("depth"), dFt = AyadiUnits.convertToFeet(d.feet, d.inches, d.nullu);
      if (dFt > 0) setDim("width", ftToDim(9 * targetPadam / dFt));
    }
  }

  function setTargetPadam(padam) {
    targetPadam = padam;
    var banner = el("padamTarget");
    $(".pt-text", banner).textContent =
      "లక్ష్య పదము " + padam.toFixed(3) + " — వెడల్పు లేదా పొడవు నమోదు చేయండి; రెండోది స్వయంచాలకంగా.";
    banner.hidden = false;
  }
  function clearTargetPadam() {
    targetPadam = null;
    el("padamTarget").hidden = true;
  }

  /** Move a suggested padam into the calculator as the target; user provides one side. */
  function useSuggestionPadam(padam) {
    // clear both sides so the user enters exactly one
    ["widthFeet", "widthInch", "widthNullu", "depthFeet", "depthInch", "depthNullu"].forEach(function (id) { el(id).value = ""; });
    var star = el("sNakshatra").value;
    if (star && !el("ownerNakshatra").value) {
      el("ownerNakshatra").value = star;
      el("ownerNakshatra").classList.add("filled");
    }
    setTargetPadam(padam);
    switchTab("calc");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---- boot ---- */
  function init() {
    populateSelects();
    wireSelectLabels();
    initTheme();
    $$(".btn").forEach(attachRipple);
    el("ayadiForm").addEventListener("submit", handleSubmit);
    el("clearBtn").addEventListener("click", clearForm);
    el("scrim").addEventListener("click", closeSheet);
    el("sheetClose").addEventListener("click", closeSheet);
    el("sheetPdf").addEventListener("click", downloadResultPdf);
    el("sheetShare").addEventListener("click", sharePdfWhatsApp);
    $$("input, select").forEach(function (inp) {
      inp.addEventListener("input", function () { var f = fieldOf(inp); if (f) f.classList.remove("invalid"); });
    });

    // Tabs + suggestions
    $$(".tab").forEach(function (t) {
      t.addEventListener("click", function () { switchTab(t.getAttribute("data-tab")); });
    });
    el("suggestBtn").addEventListener("click", handleSuggest);
    el("padamCalcBtn").addEventListener("click", handlePadamCalc);

    // Padam tab: type one dimension → the other fills from padam
    ["pWidthFeet", "pWidthInch", "pWidthNullu"].forEach(function (id) {
      el(id).addEventListener("input", function () { padamAutoOther("width"); });
    });
    ["pDepthFeet", "pDepthInch", "pDepthNullu"].forEach(function (id) {
      el(id).addEventListener("input", function () { padamAutoOther("depth"); });
    });
    el("pPadam").addEventListener("input", padamRecompute);

    // Target-padam auto-fill: typing one side computes the other
    ["widthFeet", "widthInch", "widthNullu"].forEach(function (id) {
      el(id).addEventListener("input", function () { autoComputeOther("width"); });
    });
    ["depthFeet", "depthInch", "depthNullu"].forEach(function (id) {
      el(id).addEventListener("input", function () { autoComputeOther("depth"); });
    });
    el("padamClear").addEventListener("click", clearTargetPadam);
  }

  document.addEventListener("DOMContentLoaded", init);
})(window, window.AyadiConfig, window.AyadiTables, window.AyadiUnits, window.AyadiEngine,
   window.AyadiValidation, window.AyadiResult, window.AyadiSuggest);
