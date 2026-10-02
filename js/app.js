/* Rajan Kumar V K | Industry portfolio | simulations and page behaviour */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var C = { teal: "#6fd0c7", amber: "#e09a4a", red: "#f09a85", green: "#7fd6a0", grid: "rgba(255,255,255,0.09)", text: "#a9bac3", white: "#ffffff" };

  function setupCanvas(cv) {
    var dpr = window.devicePixelRatio || 1;
    var w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }
  function fmt(n, d) { return n.toFixed(d === undefined ? 1 : d); }
  function signed(n, d, unit) { return (n > 0 ? "+" : n < 0 ? "-" : "") + Math.abs(n).toFixed(d) + (unit || ""); }
  function cls(el, good, bad) { el.classList.toggle("good", !!good); el.classList.toggle("bad", !!bad); }

  /* ---------- Navigation, tabs, reveal ---------- */
  var toggle = document.querySelector(".nav-toggle"), menu = $("menu");
  toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  menu.addEventListener("click", function (e) { if (e.target.tagName === "A") { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); } });

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var current = "lab-margin";
  function openLab(id) {
    current = id;
    tabs.forEach(function (t) {
      var on = t.getAttribute("aria-controls") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      $(t.getAttribute("aria-controls")).classList.toggle("on", on);
    });
    if (id === "lab-margin") drawMargin();
    if (id === "lab-spc") drawSpc();
    if (id === "lab-twin") { calcTwin(); drawTwin(); }
  }
  tabs.forEach(function (t) { t.addEventListener("click", function () { openLab(t.getAttribute("aria-controls")); }); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-open]"), function (a) {
    a.addEventListener("click", function () { openLab(a.getAttribute("data-open")); });
  });

  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(reveals, function (r) { io.observe(r); });
  } else {
    Array.prototype.forEach.call(reveals, function (r) { r.classList.add("in"); });
  }

  /* ---------- Lab 1: margin bridge ---------- */
  var MB = { V: 10000, P: 1200, M: 620, EU: 1.1, EP: 90, S: 0.04, F: 2600000 };
  function ebitda(V, P, M, EP, S) { return V * P - (V / (1 - S)) * (M + MB.EU * EP) - MB.F; }
  function marginState() {
    return {
      P: MB.P * (1 + (+$("mPrice").value) / 100),
      V: MB.V * (1 + (+$("mVol").value) / 100),
      M: MB.M * (1 + (+$("mMat").value) / 100),
      EP: +$("mEn").value,
      S: (+$("mScr").value) / 100
    };
  }
  function drawMargin() {
    var s = marginState();
    $("mPriceV").textContent = signed(+$("mPrice").value, 1, " %");
    $("mVolV").textContent = signed(+$("mVol").value, 0, " %");
    $("mMatV").textContent = signed(+$("mMat").value, 0, " %");
    $("mEnV").textContent = fmt(s.EP, 0) + " EUR/MWh";
    $("mScrV").textContent = fmt(s.S * 100, 1) + " %";

    var e0 = ebitda(MB.V, MB.P, MB.M, MB.EP, MB.S);
    var e1 = ebitda(MB.V, s.P, MB.M, MB.EP, MB.S);
    var e2 = ebitda(s.V, s.P, MB.M, MB.EP, MB.S);
    var e3 = ebitda(s.V, s.P, s.M, MB.EP, MB.S);
    var e4 = ebitda(s.V, s.P, s.M, s.EP, MB.S);
    var e5 = ebitda(s.V, s.P, s.M, s.EP, s.S);
    var steps = [
      { n: "Baseline", v: e0, total: true },
      { n: "Price", v: e1 - e0 }, { n: "Volume", v: e2 - e1 }, { n: "Material", v: e3 - e2 },
      { n: "Energy", v: e4 - e3 }, { n: "Scrap", v: e5 - e4 },
      { n: "New", v: e5, total: true }
    ];
    var run = 0, lo = 0, hi = 0;
    steps.forEach(function (st) {
      if (st.total) { st.a = 0; st.b = st.v; run = st.v; } else { st.a = run; st.b = run + st.v; run = st.b; }
      lo = Math.min(lo, st.a, st.b); hi = Math.max(hi, st.a, st.b);
    });
    var pad = (hi - lo) * 0.14 || 1; hi += pad; if (lo < 0) lo -= pad;
    var W = 720, H = 300, L = 54, R = 16, T = 40, B = 40;
    var y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    var bw = (W - L - R) / steps.length;
    var out = "";
    var ticks = 4, i;
    for (i = 0; i <= ticks; i++) {
      var tv = lo + (hi - lo) * i / ticks;
      out += "<line x1='" + L + "' x2='" + (W - R) + "' y1='" + y(tv) + "' y2='" + y(tv) + "' stroke='" + C.grid + "'/>";
      out += "<text x='" + (L - 8) + "' y='" + (y(tv) + 4) + "' fill='" + C.text + "' font-size='11' text-anchor='end'>" + fmt(tv / 1e6, 1) + "</text>";
    }
    out += "<line x1='" + L + "' x2='" + (W - R) + "' y1='" + y(0) + "' y2='" + y(0) + "' stroke='rgba(255,255,255,0.35)'/>";
    out += "<text x='12' y='14' fill='" + C.text + "' font-size='11'>EBITDA, million EUR</text>";
    steps.forEach(function (st, k) {
      var x = L + k * bw + bw * 0.18, w = bw * 0.64;
      var top = y(Math.max(st.a, st.b)), hgt = Math.max(2, Math.abs(y(st.a) - y(st.b)));
      var col = st.total ? C.teal : (st.v >= 0 ? C.green : C.red);
      out += "<rect x='" + x + "' y='" + top + "' width='" + w + "' height='" + hgt + "' rx='3' fill='" + col + "'/>";
      var lab = st.total ? fmt(st.v / 1e6, 2) : signed(st.v / 1e6, 2);
      out += "<text x='" + (x + w / 2) + "' y='" + (top - 6) + "' fill='" + C.white + "' font-size='12' font-weight='600' text-anchor='middle'>" + lab + "</text>";
      out += "<text x='" + (x + w / 2) + "' y='" + (H - 14) + "' fill='" + C.text + "' font-size='12' text-anchor='middle'>" + st.n + "</text>";
      if (k < steps.length - 1) {
        out += "<line x1='" + (x + w) + "' x2='" + (x + bw) + "' y1='" + y(st.b) + "' y2='" + y(st.b) + "' stroke='rgba(255,255,255,0.3)' stroke-dasharray='3 3'/>";
      }
    });
    $("mChart").innerHTML = out;

    var drivers = steps.slice(1, 6).slice().sort(function (a, b) { return Math.abs(b.v) - Math.abs(a.v); });
    var top1 = drivers[0];
    $("mBase").textContent = fmt(e0 / 1e6, 2) + " M";
    $("mNew").textContent = fmt(e5 / 1e6, 2) + " M";
    cls($("mNewBox"), e5 > e0 + 1, e5 < e0 - 1);
    $("mMargin").textContent = fmt(e5 / (s.V * s.P) * 100, 1) + " %";
    $("mTop").textContent = Math.abs(top1.v) < 1 ? "none" : top1.n;
    var diff = e5 - e0, msg;
    if (Math.abs(diff) < 1) {
      msg = "This is the baseline: revenue of 12.0 million EUR and EBITDA of " + fmt(e0 / 1e6, 2) + " million. Move a slider to see which driver matters most.";
    } else {
      msg = "EBITDA " + (diff > 0 ? "rises" : "falls") + " by " + fmt(Math.abs(diff) / 1e6, 2) + " million EUR (" + signed(diff / e0 * 100, 0, " %") + "). ";
      msg += top1.n + " explains " + fmt(Math.abs(top1.v) / 1e6, 2) + " million of the movement";
      if (drivers[1] && Math.abs(drivers[1].v) > 1) { msg += ", followed by " + drivers[1].n.toLowerCase() + " at " + fmt(Math.abs(drivers[1].v) / 1e6, 2) + " million"; }
      msg += ". ";
      if (e5 < 0) { msg += "The plant is now loss making at this combination."; }
      else if (top1.n === "Scrap") { msg += "Each point of scrap costs both material and energy, which is why it is rarely visible in a standard cost report."; }
      else if (top1.n === "Price") { msg += "One percent of price is worth far more than one percent of volume here, the usual pattern in a high variable cost business."; }
      else if (top1.n === "Energy") { msg += "This is the case for tracking energy per tonne next to the financial KPIs."; }
    }
    $("mVerdict").textContent = msg;
  }
  ["mPrice", "mVol", "mMat", "mEn", "mScr"].forEach(function (id) { $(id).addEventListener("input", drawMargin); });

  /* ---------- Lab 2: control chart and Welch test ---------- */
  function rng(seed) {
    var a = seed * 2654435761 >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function normals(seed, n) {
    var r = rng(seed), out = [], u, v;
    while (out.length < n) {
      u = r(); v = r(); if (u < 1e-12) u = 1e-12;
      out.push(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
    }
    return out;
  }
  function mean(a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; }
  function variance(a) { var m = mean(a); return a.reduce(function (x, y) { return x + (y - m) * (y - m); }, 0) / (a.length - 1); }
  function lgamma(x) {
    var g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.001208650973866179, -0.000005395239384953];
    var y = x, t = x + 5.5, s = 1.000000000190015, j;
    t -= (x + 0.5) * Math.log(t);
    for (j = 0; j < 6; j++) { y += 1; s += g[j] / y; }
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function tTwoSided(t, df) {
    var x = Math.abs(t), n = 400, h = x / n, k;
    var c = Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2)) / Math.sqrt(df * Math.PI);
    var f = function (u) { return c * Math.pow(1 + u * u / df, -(df + 1) / 2); };
    var sum = f(0) + f(x);
    for (k = 1; k < n; k++) { sum += f(k * h) * (k % 2 ? 4 : 2); }
    var area = sum * h / 3;
    return Math.max(0, 1 - 2 * area);
  }
  function drawSpc() {
    var shift = +$("sShift").value, spread = +$("sSpread").value, seed = +$("sSeed").value;
    $("sShiftV").textContent = fmt(shift, 1) + " sigma";
    $("sSpreadV").textContent = "x " + fmt(spread, 1);
    $("sSeedV").textContent = seed;
    var z = normals(seed, 40), d = [], i;
    for (i = 0; i < 40; i++) { d.push(i < 20 ? 50 + z[i] : 50 + shift + z[i] * spread); }
    var a = d.slice(0, 20), b = d.slice(20);
    var cl = mean(a), mr = 0;
    for (i = 1; i < 20; i++) { mr += Math.abs(a[i] - a[i - 1]); }
    var sig = (mr / 19) / 1.128, ucl = cl + 3 * sig, lcl = cl - 3 * sig;
    var flags = [], runUp = 0, runDn = 0;
    for (i = 0; i < 40; i++) {
      var out = d[i] > ucl || d[i] < lcl;
      if (d[i] > cl) { runUp++; runDn = 0; } else if (d[i] < cl) { runDn++; runUp = 0; }
      flags.push(out ? 2 : (runUp >= 8 || runDn >= 8) ? 1 : 0);
    }
    var nOut = flags.filter(function (f) { return f === 2; }).length;
    var nRun = flags.filter(function (f) { return f === 1; }).length;
    var first = flags.findIndex(function (f) { return f > 0; });

    var mb = mean(b), sb = Math.sqrt(variance(b));
    var cpk = Math.min(54 - mb, mb - 46) / (3 * sb);
    var va = variance(a) / 20, vb = variance(b) / 20;
    var t = (mb - mean(a)) / Math.sqrt(va + vb);
    var df = (va + vb) * (va + vb) / (va * va / 19 + vb * vb / 19);
    var p = tTwoSided(t, df);

    var g = setupCanvas($("sChart")), ctx = g.ctx, W = g.w, H = g.h;
    var L = 46, R = 14, T = 16, B = 30;
    var lo = Math.min(45.5, Math.min.apply(null, d) - 0.5), hi = Math.max(54.5, Math.max.apply(null, d) + 0.5);
    var X = function (k) { return L + k * (W - L - R) / 39; };
    var Y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(111,208,199,0.06)";
    ctx.fillRect(X(19.5), T, W - R - X(19.5), H - T - B);
    function hline(v, col, dash, label) {
      ctx.beginPath(); ctx.setLineDash(dash); ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.moveTo(L, Y(v)); ctx.lineTo(W - R, Y(v)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col; ctx.textAlign = "right"; ctx.fillText(label, L - 6, Y(v) + 4);
    }
    hline(54, "rgba(255,255,255,0.3)", [2, 4], "USL");
    hline(46, "rgba(255,255,255,0.3)", [2, 4], "LSL");
    hline(ucl, C.red, [6, 4], "UCL");
    hline(lcl, C.red, [6, 4], "LCL");
    hline(cl, C.teal, [], fmt(cl, 1));
    ctx.beginPath(); ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.5;
    for (i = 0; i < 40; i++) { if (i === 0) ctx.moveTo(X(i), Y(d[i])); else ctx.lineTo(X(i), Y(d[i])); }
    ctx.stroke();
    for (i = 0; i < 40; i++) {
      ctx.beginPath(); ctx.arc(X(i), Y(d[i]), flags[i] ? 5 : 3.2, 0, Math.PI * 2);
      ctx.fillStyle = flags[i] === 2 ? C.red : flags[i] === 1 ? C.amber : C.white; ctx.fill();
    }
    ctx.fillStyle = C.text; ctx.textAlign = "center";
    [1, 10, 20, 30, 40].forEach(function (k) { ctx.fillText(String(k), X(k - 1), H - 10); });
    ctx.textAlign = "left"; ctx.fillText("after change", X(19.5) + 6, T + 12);

    $("sSig").textContent = String(nOut + nRun);
    cls($("sSigBox"), nOut + nRun === 0, nOut + nRun > 0);
    $("sCpk").textContent = fmt(cpk, 2);
    cls($("sCpkBox"), cpk >= 1.33, cpk < 1);
    $("sT").textContent = fmt(t, 2);
    $("sP").textContent = p < 0.001 ? "< 0.001" : fmt(p, 3);
    cls($("sPBox"), false, p < 0.05);
    var msg;
    if (nOut + nRun === 0) {
      msg = "No signal on the chart. ";
      msg += p < 0.05 ? "The t test still finds a difference in means (p " + (p < 0.001 ? "< 0.001" : "= " + fmt(p, 3)) + "), a reminder that a small sustained shift can hide inside the control limits for a while."
        : "The test agrees: no evidence that the mean changed (p = " + fmt(p, 3) + "). Leave the process alone, adjusting now would add variation.";
    } else {
      msg = "The chart signals at sample " + (first + 1) + " (" + nOut + " beyond the limits, " + nRun + " in a run). ";
      msg += p < 0.05 ? "The shift is statistically significant. " : "The mean difference is not significant, so the signals point to spread, not level. ";
      msg += cpk < 1 ? "With Cpk at " + fmt(cpk, 2) + " the process is producing out of specification product and needs a root cause, not an adjustment."
        : cpk < 1.33 ? "Cpk of " + fmt(cpk, 2) + " still meets specification but with little room."
        : "Capability remains comfortable at " + fmt(cpk, 2) + ", so this is a warning, not yet a quality problem.";
    }
    $("sVerdict").textContent = msg;
  }
  ["sShift", "sSpread", "sSeed"].forEach(function (id) { $(id).addEventListener("input", drawSpc); });

  /* ---------- Lab 3: production line twin ---------- */
  var TW = { names: ["Cutting", "Pressing", "Finishing"], c: [36, 48, 40], bn: 1, rate: 75, phase: 0, last: 0 };
  function calcTwin() {
    var c = [+$("tC1").value, +$("tC2").value, +$("tC3").value];
    var A = (+$("tAv").value) / 100, Q = (+$("tQ").value) / 100;
    $("tC1V").textContent = c[0] + " s"; $("tC2V").textContent = c[1] + " s"; $("tC3V").textContent = c[2] + " s";
    $("tAvV").textContent = fmt(A * 100, 0) + " %"; $("tQV").textContent = fmt(Q * 100, 1) + " %";
    var mx = Math.max.apply(null, c), bn = c.indexOf(mx);
    var rate = 3600 / mx, good = rate * A * Q;
    var perf = Math.min(1, 36 / mx), oee = A * perf * Q;
    var kwh = (45 * A + 12 * (1 - A)) / good;
    TW.c = c; TW.bn = bn; TW.rate = rate; TW.A = A;
    $("tOut").textContent = fmt(good, 1);
    $("tOee").textContent = fmt(oee * 100, 1) + " %";
    cls($("tOeeBox"), oee >= 0.75, oee < 0.6);
    $("tKwh").textContent = fmt(kwh, 2);
    $("tCo2").textContent = fmt(kwh * 0.1, 3);
    var second = c.slice().sort(function (a, b) { return b - a; })[1];
    var gain = (3600 / second - rate) * A * Q;
    var lossA = rate * (1 - A) * Q, lossQ = rate * A * (1 - Q);
    var msg = TW.names[bn] + " is the bottleneck at " + mx + " s per unit. ";
    if (mx === second) { msg += "Two stations are tied, so speeding up one alone gains nothing. "; }
    else { msg += "Bringing it down to " + second + " s would add " + fmt(gain, 1) + " good units per hour, and time saved at any other station adds none. "; }
    if (lossA > lossQ && lossA > gain) { msg += "Downtime costs more than that: " + fmt(lossA, 1) + " units per hour. Start with availability."; }
    else if (lossQ > gain) { msg += "Quality losses take " + fmt(lossQ, 1) + " units per hour, more than the cycle time gap."; }
    else { msg += "Energy per good unit falls in step with output, because the base load is spread over more units."; }
    $("tVerdict").textContent = msg;
  }
  function drawTwin() {
    var g = setupCanvas($("tChart")), ctx = g.ctx, W = g.w, H = g.h;
    var mx = Math.max.apply(null, TW.c), n = 3, bw = Math.min(150, (W - 80) / 4.2), gap = (W - n * bw) / (n + 1);
    var cy = H * 0.46, bh = 84, i, k;
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    var span = 46, off = (TW.phase * span) % span;
    for (var x = -span + off; x < W + span; x += span) {
      var hidden = false;
      for (i = 0; i < n; i++) { var sx = gap + i * (bw + gap); if (x > sx - 6 && x < sx + bw + 6) hidden = true; }
      if (!hidden) { ctx.fillStyle = C.teal; ctx.fillRect(x - 7, cy - 7, 14, 14); }
    }
    for (i = 0; i < n; i++) {
      var x0 = gap + i * (bw + gap), isB = i === TW.bn;
      if (i > 0) {
        var q = Math.max(0, Math.min(7, Math.round((TW.c[i] - TW.c[i - 1]) / 4)));
        for (k = 0; k < q; k++) { ctx.fillStyle = C.amber; ctx.fillRect(x0 - 20 - (k % 4) * 15, cy - 26 - Math.floor(k / 4) * 15, 12, 12); }
      }
      ctx.fillStyle = isB ? "rgba(224,154,74,0.16)" : "rgba(255,255,255,0.07)";
      ctx.strokeStyle = isB ? C.amber : "rgba(255,255,255,0.3)"; ctx.lineWidth = isB ? 2 : 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x0, cy - bh / 2, bw, bh, 10); else ctx.rect(x0, cy - bh / 2, bw, bh);
      ctx.save(); ctx.fillStyle = "#16252f"; ctx.fill(); ctx.restore();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.white; ctx.textAlign = "center"; ctx.font = "600 13px Inter, system-ui, sans-serif";
      ctx.fillText(TW.names[i], x0 + bw / 2, cy - 14);
      ctx.font = "12px Inter, system-ui, sans-serif"; ctx.fillStyle = C.text;
      ctx.fillText(TW.c[i] + " s  |  " + fmt(TW.c[i] / mx * 100, 0) + " % busy", x0 + bw / 2, cy + 6);
      ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(x0 + 14, cy + 20, bw - 28, 6);
      ctx.fillStyle = isB ? C.amber : C.teal; ctx.fillRect(x0 + 14, cy + 20, (bw - 28) * TW.c[i] / mx, 6);
      if (isB) { ctx.fillStyle = C.amber; ctx.font = "700 11px Inter, system-ui, sans-serif"; ctx.fillText("BOTTLENECK", x0 + bw / 2, cy - bh / 2 - 10); }
    }
    ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("Line pace " + fmt(TW.rate, 0) + " units/h while running. Orange squares show work waiting.", 12, H - 12);
  }
  function tickTwin(ts) {
    if (current === "lab-twin") {
      var dt = TW.last ? Math.min(0.05, (ts - TW.last) / 1000) : 0;
      TW.phase += dt * TW.rate / 60;
      drawTwin();
    }
    TW.last = ts;
    requestAnimationFrame(tickTwin);
  }
  ["tC1", "tC2", "tC3", "tAv", "tQ"].forEach(function (id) { $(id).addEventListener("input", function () { calcTwin(); drawTwin(); }); });

  /* ---------- Lab 4: research framework ---------- */
  var FW = {
    A: [
      ["Real-time data", "IoT sensors, cloud platforms and digital twins feed live indicators, so decisions follow the current state of the process and not last month's report."],
      ["Collaboration tools", "Shared platforms put the same performance data in front of every function, which matters most where work crosses department or company borders."],
      ["Visualisation tools", "Dashboards, twins and extended reality make complex metrics readable. People act on what they can see."],
      ["Automation techniques", "AI, machine learning and robotic process automation remove manual tracking and allow the control loop to correct itself."],
      ["Predictive analytics", "Forecasting and anomaly detection move performance reviews from looking back to planning ahead."],
      ["Blockchain", "Tamper-proof records for performance data where trust between parties is needed, such as supply chains and compliance."]
    ],
    B: [
      ["Real-time sensing", "Performance is observed continuously. Deviations are caught in hours and not at the end of the reporting period."],
      ["Predictive insight", "Targets and forecasts are informed by models, so managers can act before a KPI turns red."],
      ["Continuous goal adjustment", "Goals are revised as conditions change, in place of one fixed annual target that soon loses meaning."],
      ["Collaborative visibility", "Operators, managers and partners see the same figures, which shortens the argument about whose number is right."]
    ],
    C: [
      ["Business", "Efficiency, productivity, agility and competitiveness. In my survey of 179 SMEs, this is where technology adoption showed a direct, significant effect."],
      ["Environmental", "Lower emissions, better energy and resource use. The effect of technology arrives through improved business performance, not directly. Installing technology alone did not improve environmental results."],
      ["Social", "Wellbeing, safety and inclusion. Industry 5.0 places people at the centre, and the case studies show twins supporting operators and not replacing them."]
    ]
  };
  function buildFw() {
    ["A", "B", "C"].forEach(function (col) {
      var host = $("fw" + col);
      FW[col].forEach(function (item, idx) {
        var b = document.createElement("button");
        b.className = "fw-btn"; b.type = "button"; b.textContent = item[0];
        b.addEventListener("click", function () { pickFw(b, item); });
        host.appendChild(b);
        if (col === "C" && idx === 1) pickFw(b, item);
      });
    });
  }
  function pickFw(btn, item) {
    Array.prototype.forEach.call(document.querySelectorAll(".fw-btn"), function (x) { x.classList.remove("on"); });
    btn.classList.add("on");
    var d = $("fwDetail"); d.textContent = "";
    var h = document.createElement("b"); h.textContent = item[0];
    var p = document.createElement("p"); p.textContent = item[1];
    d.appendChild(h); d.appendChild(p);
  }

  /* ---------- Resets ---------- */
  var DEF = {
    margin: { mPrice: 0, mVol: 0, mMat: 0, mEn: 90, mScr: 4 },
    spc: { sShift: 1.2, sSpread: 1, sSeed: 7 },
    twin: { tC1: 36, tC2: 48, tC3: 40, tAv: 88, tQ: 96 }
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-reset]"), function (b) {
    b.addEventListener("click", function () {
      var set = DEF[b.getAttribute("data-reset")];
      Object.keys(set).forEach(function (k) { $(k).value = set[k]; });
      drawMargin(); drawSpc(); calcTwin(); drawTwin();
    });
  });

  /* ---------- Hero monitor ---------- */
  var hero = { d: [], r: rng(11) };
  function heroStep() {
    var prev = hero.d.length ? hero.d[hero.d.length - 1] : 72;
    var next = prev + (72 - prev) * 0.25 + (hero.r() - 0.5) * 5;
    if (hero.r() < 0.06) next -= 9;
    hero.d.push(Math.max(48, Math.min(80, next)));
    if (hero.d.length > 60) hero.d.shift();
  }
  function heroDraw() {
    var g = setupCanvas($("heroChart")), ctx = g.ctx, W = g.w, H = g.h, i;
    var Y = function (v) { return 10 + (82 - v) / 36 * (H - 24); };
    var X = function (k) { return k * W / 59; };
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    [50, 60, 70, 80].forEach(function (v) { ctx.beginPath(); ctx.moveTo(0, Y(v)); ctx.lineTo(W, Y(v)); ctx.stroke(); });
    ctx.setLineDash([5, 5]); ctx.strokeStyle = C.amber; ctx.beginPath(); ctx.moveTo(0, Y(75)); ctx.lineTo(W, Y(75)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.amber; ctx.font = "10px Inter, system-ui, sans-serif"; ctx.fillText("target 75", 4, Y(75) - 5);
    var off = 60 - hero.d.length;
    ctx.beginPath();
    for (i = 0; i < hero.d.length; i++) { if (i === 0) ctx.moveTo(X(i + off), Y(hero.d[i])); else ctx.lineTo(X(i + off), Y(hero.d[i])); }
    ctx.strokeStyle = C.teal; ctx.lineWidth = 2; ctx.stroke();
    ctx.lineTo(W, H); ctx.lineTo(X(off), H); ctx.closePath(); ctx.fillStyle = "rgba(111,208,199,0.10)"; ctx.fill();
    var v = hero.d[hero.d.length - 1];
    ctx.beginPath(); ctx.arc(W - 2, Y(v), 4, 0, Math.PI * 2); ctx.fillStyle = C.white; ctx.fill();
    $("hkT").textContent = fmt(v, 0);
    $("hkO").textContent = fmt(v / 95 * 100, 0) + "%";
    $("hkE").textContent = fmt(45 / v, 2);
  }
  for (var w0 = 0; w0 < 60; w0++) heroStep();

  /* ---------- Start ---------- */
  buildFw();
  drawMargin(); drawSpc(); calcTwin(); drawTwin(); heroDraw();
  if (!reduced) {
    setInterval(function () { heroStep(); heroDraw(); }, 1100);
    requestAnimationFrame(tickTwin);
  }
  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { heroDraw(); if (current === "lab-spc") drawSpc(); if (current === "lab-twin") drawTwin(); }, 150);
  });
})();
