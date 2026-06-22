/* ============================================================================
   DIGITAL TRANSFORMATION KNOWLEDGE BASE — projects.js
   ----------------------------------------------------------------------------
   The website is only the interface. The truth lives in /projects/*.json.
   This engine:
     · reads the project registry (projects/index.json)
     · loads every project file (the single source of truth per project)
     · COMPUTES every aggregate dashboard from the data (no hardcoded numbers):
         – Portfolio dashboard widgets
         – Facts & Figures totals
         – Process-Maturity aggregate (radar + dimension bars)
         – Artifact-Library counts per type
     · renders the project library grid (with documentation completeness)
     · renders a dedicated, hash-routed project page (#/projekt/<slug>) with its
       own project dashboard, facts & figures, measurement model (verified /
       estimated / hypotheses), transformation chain, maturity radar and artifacts.
   Nothing is fabricated: a value that isn't in the data is simply not shown.
   Add data → every dashboard updates itself. That's the whole system.
   ============================================================================ */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---- Status: data value → label, css class, filter key ------------------ */
  const STATUS = {
    real:          { label: "Praxisprojekt",   cls: "is-praxis",  filter: "praxis"  },
    anonymized:    { label: "Anonymisiert",     cls: "is-anonym",  filter: "anonym"  },
    concept:       { label: "Konzeptstudie",    cls: "is-konzept", filter: "konzept" },
    "in-progress": { label: "In Ausarbeitung",  cls: "is-aufbau",  filter: "aufbau"  },
  };
  const statusOf = (p) => STATUS[p.status] || STATUS["in-progress"];

  /* ---- Inline SVG icon paths (no external assets) ------------------------- */
  const ICONS = {
    image:    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="9" r="1.6"/><path d="m21 16-5-5L5 21"/>',
    diagram:  '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h6a3 3 0 0 1 3 3v6"/>',
    chart:    '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="13" y="7" width="3" height="10"/>',
    org:      '<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 7v5M5 16v-2h14v2"/>',
    present:  '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v4M8 20h8"/>',
    file:     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    check:    '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    sop:      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>',
    workshop: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    folder:   '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    layers:   '<path d="M12 2 2 7l10 5 10-5z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    chip:     '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>',
    globe:    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
    users:    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
    bulb:     '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/>',
    steps:    '<path d="M3 20h4v-4h4v-4h4V8h6"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    gauge:    '<path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M12 14l3-3M3.3 16a9 9 0 1 1 17.4 0"/>',
    clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };
  const svg = (key) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[key] || ICONS.file}</svg>`;

  /* ---- Artifact types → how they render ----------------------------------- */
  const ARTIFACTS = {
    image:        { label: "Bild",            kind: "image", icon: "image"    },
    screenshot:   { label: "Screenshot",      kind: "image", icon: "image"    },
    diagram:      { label: "Diagramm",        kind: "image", icon: "diagram"  },
    bpmn:         { label: "BPMN-Diagramm",   kind: "image", icon: "diagram"  },
    dashboard:    { label: "Dashboard",       kind: "image", icon: "chart"    },
    orgchart:     { label: "Organigramm",     kind: "image", icon: "org"      },
    presentation: { label: "Präsentation",    kind: "file",  icon: "present"  },
    pdf:          { label: "PDF-Dokument",    kind: "file",  icon: "file"     },
    document:     { label: "Dokument",        kind: "file",  icon: "file"     },
    checklist:    { label: "Checkliste",      kind: "file",  icon: "check"    },
    sop:          { label: "SOP",             kind: "file",  icon: "sop"      },
    workshop:     { label: "Workshop-Doku",   kind: "file",  icon: "workshop" },
  };
  const artifactCfg = (t) => ARTIFACTS[t] || ARTIFACTS.document;

  /* ---- Facts & Figures: key → label (order = display order) --------------- */
  const FIGURES = [
    ["stakeholders", "Stakeholder eingebunden"],
    ["systems",      "Systeme betroffen"],
    ["processSteps", "Prozessschritte analysiert"],
    ["workshops",    "Workshops durchgeführt"],
    ["documents",    "Dokumente erstellt"],
    ["screenshots",  "Screenshots verfügbar"],
    ["diagrams",     "Prozessdiagramme erstellt"],
    ["departments",  "Abteilungen beteiligt"],
    ["trainings",    "Schulungen durchgeführt"],
    ["businessUnits","Geschäftsbereiche betroffen"],
  ];

  /* ---- Measurement model categories --------------------------------------- */
  const MEASURES = [
    ["verified",   "Verifizierte Ergebnisse", "Belegt durch Messung"],
    ["estimated",  "Geschätzte Wirkung",      "Plausibel, noch nicht gemessen"],
    ["hypotheses", "Hypothesen",              "Zu testende Annahmen"],
  ];

  /* ---- Process-maturity dimensions ---------------------------------------- */
  const MATURITY_DIMS = [
    ["standardization", "Standardisierung"],
    ["documentation",   "Dokumentation"],
    ["transparency",    "Transparenz"],
    ["digitalization",  "Digitalisierung"],
    ["automation",      "Automatisierung"],
    ["governance",      "Governance"],
  ];

  /* ---- Transformation phases ---------------------------------------------- */
  const PHASES = [
    ["before",         "Before State"],
    ["analysis",       "Analyse"],
    ["optimization",   "Optimierung"],
    ["digitalization", "Digitalisierung"],
    ["future",         "Future State"],
  ];

  /* ---- Portfolio-dashboard widgets (each value computed from data) -------- */
  const isDigital = (p) =>
    /digital|ki|\bai\b|automat|daten|reporting|data/i.test(
      [p.category, p.meta && p.meta.type].filter(Boolean).join(" ")
    );
  const WIDGETS = [
    { icon: "folder",  label: "Projekte dokumentiert",      compute: (ps) => ps.length },
    { icon: "layers",  label: "Artefakte",                  compute: (ps) => ps.reduce((n, p) => n + ((p.artifacts || []).length), 0) },
    { icon: "diagram", label: "Prozessdiagramme",           compute: (ps) => countArtifactTypes(ps, ["diagram", "bpmn", "orgchart"]) },
    { icon: "chip",    label: "Digitalisierungsinitiativen",compute: (ps) => ps.filter(isDigital).length },
    { icon: "globe",   label: "Branchen abgedeckt",         compute: (ps) => distinct(ps.map((p) => p.meta && p.meta.industry)).length },
    { icon: "users",   label: "Stakeholder eingebunden",    compute: (ps) => sumFig(ps, "stakeholders") },
    { icon: "workshop",label: "Workshops durchgeführt",     compute: (ps) => sumFig(ps, "workshops") },
    { icon: "file",    label: "Dokumente erstellt",         compute: (ps) => sumFig(ps, "documents") },
    { icon: "steps",   label: "Prozessschritte analysiert", compute: (ps) => sumFig(ps, "processSteps") },
    { icon: "bulb",    label: "Lessons Learned",            compute: (ps) => ps.reduce((n, p) => n + (Array.isArray(p.lessons) ? p.lessons.length : 0), 0) },
  ];

  /* ---- Small helpers ------------------------------------------------------ */
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const has = (v) => (Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== "");
  const chips = (arr) => (arr || []).map((t) => `<span>${esc(t)}</span>`).join("");
  const block = (title, html) => (has(html) || html === 0 ? `<div class="cm-block"><h4>${esc(title)}</h4>${html}</div>` : "");
  const num = (n) => new Intl.NumberFormat("de-CH").format(n);
  const distinct = (arr) => Array.from(new Set(arr.filter((v) => has(v))));
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const sumFig = (ps, key) => ps.reduce((n, p) => n + (p.figures && typeof p.figures[key] === "number" ? p.figures[key] : 0), 0);
  const countArtifactTypes = (ps, types) =>
    ps.reduce((n, p) => n + ((p.artifacts || []).filter((a) => types.includes(a.type)).length), 0);
  const clamp5 = (v) => Math.max(0, Math.min(5, Number(v) || 0));

  /* ---- Library state ------------------------------------------------------ */
  let PROJECTS = [];
  const BY_SLUG = new Map();

  const grid = $("#caseGrid");
  const homeView = $("#homeView");
  const projectView = $("#projectView");

  /* ==========================================================================
     LOAD — registry → all project files (parallel)
  ========================================================================== */
  async function loadLibrary() {
    const idx = await fetch("projects/index.json", { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error("index.json " + r.status);
      return r.json();
    });
    const order = Array.isArray(idx.order) ? idx.order : [];
    const loaded = await Promise.all(
      order.map((slug) =>
        fetch(`projects/${slug}.json`, { cache: "no-cache" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );
    PROJECTS = loaded.filter(Boolean);
    BY_SLUG.clear();
    PROJECTS.forEach((p) => BY_SLUG.set(p.slug, p));
  }

  /* ==========================================================================
     COMPLETENESS / MATURITY — derived, never entered
  ========================================================================== */
  const hasFigures = (p) => !!p.figures && Object.values(p.figures).some((v) => typeof v === "number" && v > 0);
  const hasMeasurement = (p) => !!p.measurement && ["verified", "estimated", "hypotheses"].some((k) => Number(p.measurement[k]) > 0);
  const hasMaturity = (p) =>
    !!p.maturity && MATURITY_DIMS.some(([k]) => p.maturity[k] && (p.maturity[k].current > 0 || p.maturity[k].target > 0));
  const hasTransformation = (p) =>
    !!p.transformation && PHASES.some(([k]) => p.transformation[k] && has(p.transformation[k].summary));

  function docCompleteness(p) {
    const ap = p.approach || {};
    const checks = [
      has(p.context), has(p.problem), has(p.analysis),
      has(ap.methodology), has(ap.implementation),
      has(p.deliverables), has(p.impact), has(p.lessons),
      has(p.artifacts), hasFigures(p), hasMeasurement(p), hasMaturity(p), hasTransformation(p),
    ];
    const total = checks.length;
    const done = checks.filter(Boolean).length;
    return { done, total, pct: Math.round((done / total) * 100) };
  }

  function evidenceCompleteness(p) {
    const arts = p.artifacts || [];
    if (!arts.length) return { uploaded: 0, total: 0, pct: 0 };
    const uploaded = arts.filter((a) => !a.pending && has(a.src)).length;
    return { uploaded, total: arts.length, pct: Math.round((uploaded / arts.length) * 100) };
  }

  function maturityAvgCurrent(p) {
    if (!hasMaturity(p)) return null;
    const curs = MATURITY_DIMS.map(([k]) => p.maturity[k] && p.maturity[k].current)
      .filter((v) => typeof v === "number");
    return curs.length ? avg(curs) : null;
  }

  /* ==========================================================================
     RADAR CHART — pure SVG, 6 axes, current vs target (0–5)
  ========================================================================== */
  function radarSVG(dims) {
    const n = dims.length;
    const W = 360, H = 286, cx = 180, cy = 140, R = 94;
    const ang = (i) => (-90 + i * (360 / n)) * (Math.PI / 180);
    const pt = (v, i) => {
      const r = (clamp5(v) / 5) * R;
      return [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
    };
    const ptsStr = (vals) => vals.map((v, i) => pt(v, i).map((x) => x.toFixed(1)).join(",")).join(" ");

    let rings = "";
    for (let ring = 1; ring <= 5; ring++) {
      const p = dims.map((_, i) => pt(ring, i).map((x) => x.toFixed(1)).join(",")).join(" ");
      rings += `<polygon class="radar__ring" points="${p}"/>`;
    }

    let axes = "", labels = "", dots = "";
    dims.forEach((d, i) => {
      const [ax, ay] = pt(5, i);
      axes += `<line class="radar__axis" x1="${cx}" y1="${cy}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}"/>`;
      const lr = R * 1.16;
      const lx = cx + lr * Math.cos(ang(i));
      const ly = cy + lr * Math.sin(ang(i));
      const c = Math.cos(ang(i)), s = Math.sin(ang(i));
      const anchor = Math.abs(c) < 0.35 ? "middle" : c > 0 ? "start" : "end";
      const dy = s > 0.35 ? "0.9em" : s < -0.35 ? "-0.35em" : "0.32em";
      labels += `<text class="radar__label" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dy="${dy}">${esc(d.label)}</text>`;
      const [dx, dyp] = pt(d.current, i);
      dots += `<circle class="radar__dot" cx="${dx.toFixed(1)}" cy="${dyp.toFixed(1)}" r="2.6"/>`;
    });

    const tar = ptsStr(dims.map((d) => d.target));
    const cur = ptsStr(dims.map((d) => d.current));

    return `
      <svg class="radar" viewBox="0 0 ${W} ${H}" role="img" aria-label="Prozessreife-Radar: aktueller Stand und Zielzustand">
        ${rings}${axes}
        <polygon class="radar__tar" points="${tar}"/>
        <polygon class="radar__cur" points="${cur}"/>
        ${dots}${labels}
      </svg>`;
  }

  const radarLegend = () => `
    <div class="radar__legend">
      <span class="radar__key radar__key--cur">Aktueller Stand</span>
      <span class="radar__key radar__key--tar">Zielzustand</span>
    </div>`;

  /* ---- Stars (0–5) -------------------------------------------------------- */
  function stars(value) {
    const v = clamp5(value);
    let out = "";
    for (let i = 1; i <= 5; i++) out += `<span class="star${i <= v ? " is-on" : ""}" aria-hidden="true">★</span>`;
    return `<span class="stars" role="img" aria-label="${v} von 5">${out}</span>`;
  }

  /* ---- A compact "x %" progress bar -------------------------------------- */
  const bar = (pct, cls = "") => `<span class="kpi-bar ${cls}"><span class="kpi-bar__fill" style="width:${Math.max(0, Math.min(100, pct))}%"></span></span>`;

  /* ==========================================================================
     PORTFOLIO DASHBOARD (aggregate, top of page)
  ========================================================================== */
  function renderDashboard() {
    const host = $("#dashboardGrid");
    if (!host) return;
    const cards = WIDGETS
      .map((w) => ({ w, value: w.compute(PROJECTS) }))
      .filter((x) => x.value > 0)
      .map(({ w, value }) => `
        <article class="stat">
          <span class="stat__icon">${svg(w.icon)}</span>
          <span class="stat__value" data-count="${value}">${num(value)}</span>
          <span class="stat__label">${esc(w.label)}</span>
        </article>`)
      .join("");
    host.innerHTML = cards || `<p class="pv__empty">Noch keine Projektdaten vorhanden.</p>`;
    countUp($$(".stat__value", host));
  }

  /* Animated count-up for dashboard values (respects reduced motion) */
  function countUp(els) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries, o) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        o.unobserve(e.target);
        const el = e.target;
        const target = Number(el.getAttribute("data-count")) || 0;
        const start = performance.now(), dur = 900;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = num(Math.round(target * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  }

  /* ==========================================================================
     FACTS & FIGURES (aggregate)
  ========================================================================== */
  function renderFigures() {
    const host = $("#figuresGrid");
    if (!host) return;
    const rows = FIGURES
      .map(([key, label]) => ({ key, label, value: sumFig(PROJECTS, key) }))
      .filter((r) => r.value > 0);
    if (!rows.length) {
      host.innerHTML = `<p class="pv__empty">Sobald Projektdaten Zahlen enthalten, erscheinen sie hier — automatisch summiert.</p>`;
      return;
    }
    host.innerHTML = rows.map((r) => `
      <article class="fig">
        <span class="fig__value">${num(r.value)}</span>
        <span class="fig__label">${esc(r.label)}</span>
      </article>`).join("");
  }

  /* ==========================================================================
     PROCESS-MATURITY DASHBOARD (aggregate radar + dimension bars)
  ========================================================================== */
  function aggregateMaturity() {
    const dims = MATURITY_DIMS.map(([key, label]) => {
      const curs = [], tars = [];
      PROJECTS.forEach((p) => {
        const d = p.maturity && p.maturity[key];
        if (!d) return;
        if (typeof d.current === "number") curs.push(d.current);
        if (typeof d.target === "number") tars.push(d.target);
      });
      return { key, label, current: avg(curs), target: avg(tars) };
    });
    return dims.some((d) => d.current > 0 || d.target > 0) ? dims : null;
  }

  function renderMaturityAggregate() {
    const host = $("#maturityViz");
    if (!host) return;
    const dims = aggregateMaturity();
    if (!dims) {
      host.innerHTML = `<p class="pv__empty">Reife-Bewertungen erscheinen hier, sobald Projekte sie liefern.</p>`;
      return;
    }
    const bars = dims.map((d) => {
      const pct = d.target > 0 ? Math.round((d.current / d.target) * 100) : 0;
      return `
        <div class="mat-row">
          <div class="mat-row__head">
            <span class="mat-row__name">${esc(d.label)}</span>
            <span class="mat-row__num">${d.current.toFixed(1)} <span>/ ${d.target.toFixed(1)}</span></span>
          </div>
          <span class="mat-bar">
            <span class="mat-bar__cur" style="width:${(d.current / 5) * 100}%"></span>
            <span class="mat-bar__tar" style="left:${(d.target / 5) * 100}%"></span>
          </span>
        </div>`;
    }).join("");
    host.innerHTML = `
      <div class="mat-radar">${radarSVG(dims)}${radarLegend()}</div>
      <div class="mat-bars">
        <p class="mat-bars__hint">Durchschnitt über ${num(PROJECTS.filter(hasMaturity).length)} bewertete Projekte · Skala 0–5</p>
        ${bars}
      </div>`;
  }

  /* ==========================================================================
     ARTIFACT LIBRARY (counts per type)
  ========================================================================== */
  function renderArtifactLibrary() {
    const host = $("#artifactLibrary");
    if (!host) return;
    const counts = new Map();
    PROJECTS.forEach((p) => (p.artifacts || []).forEach((a) => {
      const key = ARTIFACTS[a.type] ? a.type : "document";
      counts.set(key, (counts.get(key) || 0) + 1);
    }));
    const order = Object.keys(ARTIFACTS);
    const items = order
      .filter((t) => counts.get(t))
      .map((t) => {
        const cfg = artifactCfg(t);
        return `
          <article class="alib">
            <span class="alib__icon">${svg(cfg.icon)}</span>
            <span class="alib__count">${num(counts.get(t))}</span>
            <span class="alib__label">${esc(cfg.label)}</span>
          </article>`;
      }).join("");
    host.innerHTML = items || `<p class="pv__empty">Noch keine Artefakte dokumentiert.</p>`;
  }

  /* ==========================================================================
     OVERVIEW GRID — one card per project
  ========================================================================== */
  function renderGrid() {
    if (!grid) return;
    if (!PROJECTS.length) {
      grid.innerHTML = `<p class="pv__empty">Noch keine Projekte dokumentiert.</p>`;
      return;
    }
    grid.innerHTML = PROJECTS.map((p, i) => {
      const s = statusOf(p);
      const doc = docCompleteness(p);
      const artCount = (p.artifacts || []).length;
      return `
      <a class="case" href="#/projekt/${esc(p.slug)}" data-status="${s.filter}" aria-label="${esc(p.name)} – Dossier öffnen">
        <div class="case__top">
          <span class="case__status ${s.cls}">${esc(s.label)}</span>
          <span class="case__index">${String(i + 1).padStart(2, "0")}</span>
        </div>
        <span class="case__domain">${esc(p.category || "")}</span>
        <h3 class="case__title">${esc(p.name)}</h3>
        <p class="case__summary">${esc(p.summary || "")}</p>
        <div class="case__doc">
          <div class="case__doc-head"><span>Dokumentation</span><span>${doc.pct}%</span></div>
          ${bar(doc.pct)}
        </div>
        <div class="case__foot">
          <span class="case__foot-item">${svg("layers")}${num(artCount)} Artefakte</span>
          ${has(p.meta && p.meta.industry) ? `<span class="case__foot-item">${svg("globe")}${esc(p.meta.industry)}</span>` : ""}
        </div>
        <span class="case__open">Dossier öffnen</span>
      </a>`;
    }).join("");

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver((entries, o) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.style.opacity = 1; e.target.style.transform = "none"; o.unobserve(e.target); }
        });
      }, { threshold: 0.1 });
      $$(".case", grid).forEach((card, i) => {
        card.style.opacity = 0;
        card.style.transform = "translateY(28px)";
        card.style.transition = `opacity .7s ${i * 0.05 + 0.05}s ease, transform .7s ${i * 0.05 + 0.05}s cubic-bezier(.22,.61,.36,1)`;
        obs.observe(card);
      });
    }
  }

  function initFilters() {
    const bar = $("#projectFilters");
    if (!bar || !grid) return;
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter");
      if (!btn) return;
      $$(".filter", bar).forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const f = btn.getAttribute("data-filter");
      $$(".case", grid).forEach((card) => {
        const match = f === "all" || card.getAttribute("data-status") === f;
        card.classList.toggle("is-hidden", !match);
      });
    });
  }

  /* ==========================================================================
     ARTIFACT RENDERING (detail view)
  ========================================================================== */
  function renderArtifact(a) {
    const cfg = artifactCfg(a.type);
    const cap = has(a.caption) ? `<figcaption class="art__cap">${esc(a.caption)}</figcaption>` : "";

    if (a.pending || !has(a.src)) {
      return `
        <figure class="art art--pending">
          <div class="art__ph">${svg(cfg.icon)}<span class="art__badge">In Vorbereitung</span></div>
          <figcaption class="art__cap"><span class="art__type">${esc(cfg.label)}</span>${esc(a.title || "")}</figcaption>
        </figure>`;
    }

    if (cfg.kind === "image") {
      return `
        <figure class="art art--img">
          <a class="art__frame" href="${esc(a.src)}" target="_blank" rel="noopener" aria-label="${esc(a.title || cfg.label)} öffnen">
            <img src="${esc(a.src)}" alt="${esc(a.title || cfg.label)}" loading="lazy" />
          </a>
          <figcaption class="art__cap"><span class="art__type">${esc(cfg.label)}</span>${esc(a.title || "")}${has(a.caption) ? " — " + esc(a.caption) : ""}</figcaption>
        </figure>`;
    }

    return `
      <a class="art art--file" href="${esc(a.src)}" target="_blank" rel="noopener">
        <span class="art__icon">${svg(cfg.icon)}</span>
        <span class="art__file-meta">
          <span class="art__type">${esc(cfg.label)}</span>
          <span class="art__file-title">${esc(a.title || cfg.label)}</span>
        </span>
        <span class="art__arrow" aria-hidden="true">→</span>
      </a>${cap}`;
  }

  function renderArtifacts(list) {
    if (!has(list)) return "";
    const ev = evidenceCompleteness({ artifacts: list });
    return `
      <div class="cm-block">
        <h4>Evidenz &amp; Artefakte</h4>
        <p class="art-grid__meta">${num(ev.uploaded)} von ${num(ev.total)} Artefakten hochgeladen · Rest in Vorbereitung</p>
        <div class="art-grid">${list.map(renderArtifact).join("")}</div>
      </div>`;
  }

  /* ---- Related projects --------------------------------------------------- */
  function renderRelated(slugs) {
    const rel = (slugs || []).map((s) => BY_SLUG.get(s)).filter(Boolean);
    if (!rel.length) return "";
    return `
      <div class="cm-block">
        <h4>Verwandte Projekte</h4>
        <div class="pv__related">
          ${rel.map((r) => {
            const s = statusOf(r);
            return `<a class="pv__rel" href="#/projekt/${esc(r.slug)}">
              <span class="case__status ${s.cls}">${esc(s.label)}</span>
              <span class="pv__rel-name">${esc(r.name)}</span>
              <span class="pv__rel-arrow" aria-hidden="true">→</span>
            </a>`;
          }).join("")}
        </div>
      </div>`;
  }

  /* ==========================================================================
     PROJECT DASHBOARD (detail header) — every metric from data or derived
  ========================================================================== */
  function renderProjectDashboard(p) {
    const s = statusOf(p);
    const m = p.meta || {};
    const doc = docCompleteness(p);
    const ev = evidenceCompleteness(p);
    const mat = maturityAvgCurrent(p);
    const artCount = (p.artifacts || []).length;

    const text = (label, value) => has(value)
      ? `<div class="pdash__cell"><span class="pdash__k">${esc(label)}</span><span class="pdash__v">${esc(value)}</span></div>` : "";
    const meter = (label, pct, sub) => `
      <div class="pdash__cell">
        <span class="pdash__k">${esc(label)}</span>
        <span class="pdash__v">${pct}%${sub ? ` <small>${esc(sub)}</small>` : ""}</span>
        ${bar(pct)}
      </div>`;

    const cells = [
      `<div class="pdash__cell"><span class="pdash__k">Projektstatus</span><span class="pdash__v"><span class="case__status ${s.cls}">${esc(s.label)}</span></span></div>`,
      text("Projekttyp", m.type),
      text("Rolle", m.role),
      text("Branche", m.industry),
      text("Zeitraum", m.period),
      text("Umsetzungsstatus", m.implementationStatus),
      `<div class="pdash__cell"><span class="pdash__k">Artefakte</span><span class="pdash__v">${num(artCount)}</span></div>`,
      mat != null ? `<div class="pdash__cell"><span class="pdash__k">Prozessreife (Ø)</span><span class="pdash__v">${mat.toFixed(1)} <small>/ 5</small></span>${bar((mat / 5) * 100)}</div>` : "",
      meter("Dokumentations-Vollständigkeit", doc.pct, `${doc.done}/${doc.total}`),
      meter("Evidenz-Vollständigkeit", ev.pct, `${ev.uploaded}/${ev.total}`),
    ].filter(Boolean).join("");

    return `<div class="pdash">${cells}</div>`;
  }

  /* ---- Facts & Figures (project) ----------------------------------------- */
  function renderProjectFigures(p) {
    if (!hasFigures(p)) return "";
    const rows = FIGURES
      .map(([key, label]) => ({ label, value: p.figures[key] }))
      .filter((r) => typeof r.value === "number" && r.value > 0);
    if (!rows.length) return "";
    return `
      <div class="cm-block">
        <h4>Facts &amp; Figures</h4>
        <div class="figrow">
          ${rows.map((r) => `<div class="figrow__item"><span class="figrow__v">${num(r.value)}</span><span class="figrow__l">${esc(r.label)}</span></div>`).join("")}
        </div>
      </div>`;
  }

  /* ---- Measurement model (project) --------------------------------------- */
  function renderMeasurement(p) {
    if (!hasMeasurement(p)) return "";
    const mm = p.measurement;
    const rows = MEASURES.map(([key, label, hint]) => `
      <div class="meas__row">
        <div class="meas__meta"><span class="meas__label">${esc(label)}</span><span class="meas__hint">${esc(hint)}</span></div>
        ${stars(mm[key])}
      </div>`).join("");
    return `
      <div class="cm-block cm-block--meas">
        <h4>Messmodell — Transparenz statt Behauptung</h4>
        <div class="meas">${rows}</div>
        ${has(mm.note) ? `<p class="meas__note">${esc(mm.note)}</p>` : ""}
      </div>`;
  }

  /* ---- Transformation chain (project) ------------------------------------ */
  function renderTransformation(p) {
    if (!hasTransformation(p)) return "";
    const t = p.transformation;
    const sub = (label, arr) => has(arr) ? `<div class="tphase__sub"><span class="tphase__sub-l">${label}</span><div class="cm-list">${chips(arr)}</div></div>` : "";
    const phases = PHASES
      .map(([key, label], i) => ({ key, label, i, d: t[key] }))
      .filter((x) => x.d && has(x.d.summary))
      .map((x) => `
        <li class="tphase">
          <span class="tphase__step">${String(x.i + 1).padStart(2, "0")}</span>
          <div class="tphase__body">
            <h5 class="tphase__title">${esc(x.label)}</h5>
            <p class="tphase__sum">${esc(x.d.summary)}</p>
            ${sub("Inputs", x.d.inputs)}
            ${sub("Outputs", x.d.outputs)}
            ${sub("Artefakte", x.d.artifacts)}
            ${has(x.d.evidence) ? `<p class="tphase__ev"><span>Evidenz</span> ${esc(x.d.evidence)}</p>` : ""}
          </div>
        </li>`).join("");
    return `
      <div class="cm-block">
        <h4>Transformations-Verlauf</h4>
        <ol class="tchain">${phases}</ol>
      </div>`;
  }

  /* ---- Maturity (project radar) ------------------------------------------ */
  function renderProjectMaturity(p) {
    if (!hasMaturity(p)) return "";
    const dims = MATURITY_DIMS.map(([key, label]) => ({
      key, label,
      current: (p.maturity[key] && p.maturity[key].current) || 0,
      target: (p.maturity[key] && p.maturity[key].target) || 0,
    }));
    const bars = dims.map((d) => `
      <div class="mat-row">
        <div class="mat-row__head"><span class="mat-row__name">${esc(d.label)}</span><span class="mat-row__num">${d.current} <span>/ ${d.target}</span></span></div>
        <span class="mat-bar"><span class="mat-bar__cur" style="width:${(d.current / 5) * 100}%"></span><span class="mat-bar__tar" style="left:${(d.target / 5) * 100}%"></span></span>
      </div>`).join("");
    return `
      <div class="cm-block">
        <h4>Prozessreife — aktueller Stand vs. Ziel</h4>
        <div class="mat mat--project">
          <div class="mat-radar">${radarSVG(dims)}${radarLegend()}</div>
          <div class="mat-bars">${bars}</div>
        </div>
      </div>`;
  }

  /* ==========================================================================
     DETAIL VIEW — the dedicated project dossier (hash-routed)
  ========================================================================== */
  function renderDetail(p) {
    const s = statusOf(p);
    const ap = p.approach || {};
    const tracked = p.meta && p.meta.tracked;

    projectView.innerHTML = `
      <div class="container pv__inner">
        <a class="pv__back" href="#/">← Zurück zur Wissensbasis</a>

        <header class="pv__head">
          <div class="pv__badges">
            <span class="case__status ${s.cls}">${esc(s.label)}</span>
            ${has(p.category) ? `<span class="pv__cat">${esc(p.category)}</span>` : ""}
          </div>
          <h1 class="pv__title">${esc(p.name)}</h1>
          ${has(p.summary) ? `<p class="pv__summary">${esc(p.summary)}</p>` : ""}
          ${renderProjectDashboard(p)}
          ${has(tracked) ? `
            <div class="pv__tracked">
              <span class="cm-tracked-lab">Kennzahlen-Kategorien:</span>
              ${chips(tracked)}
            </div>` : ""}
        </header>

        <div class="pv__body">
          ${block("Ausgangslage", has(p.context) ? `<p>${esc(p.context)}</p>` : "")}
          ${block("Problemstellung", has(p.problem) ? `<p>${esc(p.problem)}</p>` : "")}
          ${block("Analyse", has(p.analysis) ? `<p>${esc(p.analysis)}</p>` : "")}
          ${block("Methodik", has(ap.methodology) ? `<div class="cm-list">${chips(ap.methodology)}</div>` : "")}
          ${block("Umsetzung", has(ap.implementation) ? `<p>${esc(ap.implementation)}</p>` : "")}
          ${renderTransformation(p)}
          ${renderProjectFigures(p)}
          ${renderArtifacts(p.artifacts)}
          ${block("Lieferobjekte", has(p.deliverables) ? `<ul class="pv__bullets">${(p.deliverables || []).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : "")}
          ${renderMeasurement(p)}
          ${has(p.impact) ? `
            <div class="cm-block cm-block--impact">
              <h4>Erwartete oder dokumentierte Wirkung</h4>
              <p>${esc(p.impact)}</p>
              ${has(tracked) ? `<div class="cm-tracked"><span class="cm-tracked-lab">Gemessen über:</span>${chips(tracked)}</div>` : ""}
            </div>` : ""}
          ${renderProjectMaturity(p)}
          ${block("Lessons Learned", has(p.lessons)
            ? (Array.isArray(p.lessons) ? `<ul class="pv__bullets">${p.lessons.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : `<p>${esc(p.lessons)}</p>`)
            : "")}
          ${has(p.evidence) ? `<div class="cm-block cm-block--next"><h4>Belege &amp; nächster Dokumentationsschritt</h4><p>${esc(p.evidence)}</p></div>` : ""}
          ${renderRelated(p.related)}
        </div>
      </div>`;
  }

  /* ==========================================================================
     ROUTER — #/ = home · #/projekt/<slug> = detail
  ========================================================================== */
  function showHome() {
    if (projectView) { projectView.hidden = true; projectView.innerHTML = ""; }
    if (homeView) homeView.hidden = false;
    document.title = "Dominic Haldi — Digital Transformation Knowledge Base";
  }

  function showDetail(slug) {
    const p = BY_SLUG.get(slug);
    if (!p) { location.hash = "#/"; return; }
    renderDetail(p);
    if (homeView) homeView.hidden = true;
    projectView.hidden = false;
    document.title = `${p.name} — Dominic Haldi`;
    window.scrollTo({ top: 0, behavior: "auto" });
    const h = $(".pv__title", projectView);
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }

  function route() {
    const m = location.hash.match(/^#\/projekt\/(.+)$/);
    if (m) showDetail(decodeURIComponent(m[1]));
    else showHome();
  }

  /* ==========================================================================
     BOOT
  ========================================================================== */
  function fail(err) {
    console.error("[Knowledge Base] Laden fehlgeschlagen:", err);
    if (grid) {
      grid.innerHTML = `
        <div class="pv__error">
          <p><strong>Projekte konnten nicht geladen werden.</strong></p>
          <p>Die Seite liest die Projektdaten per <code>fetch</code> — das funktioniert auf
          GitHub Pages bzw. über einen Webserver, aber nicht beim direkten Öffnen der Datei
          (<code>file://</code>). Lokal z. B. mit <code>python -m http.server</code> starten.</p>
        </div>`;
    }
  }

  function boot() {
    initFilters();
    loadLibrary()
      .then(() => {
        renderDashboard();
        renderFigures();
        renderMaturityAggregate();
        renderArtifactLibrary();
        renderGrid();
        route();
      })
      .catch(fail);
    window.addEventListener("hashchange", route);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
