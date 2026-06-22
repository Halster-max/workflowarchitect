/* ============================================================================
   DOMINIC HALDI — Digital Transformation Command Center
   script.js  (vanilla JS, zero dependencies)
   ----------------------------------------------------------------------------
   01  Theme toggle (dark-first, persisted)
   02  Mobile navigation
   03  Scroll: header state + progress bar + parallax
   04  Scrollspy (active nav link)
   05  Scroll reveal (IntersectionObserver)
   06  Animated counters ([data-target])
   07  Dashboard widgets (gauge / bars / sparkline)
   08  Systems-thinking interactive map
   09  Case studies: render + filter + modal
   10  Process engineering flow
   11  Business architecture accordion
   12  Footer year
   ============================================================================ */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ==========================================================================
     01  THEME TOGGLE
  ========================================================================== */
  const root = document.documentElement;
  const STORAGE_KEY = "dh-theme";

  (function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      root.setAttribute("data-theme", saved);
    } else {
      // Dark-mode first: stay dark unless the OS explicitly prefers light
      const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      root.setAttribute("data-theme", prefersLight ? "light" : "dark");
    }
  })();

  const themeToggle = $("#themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  }

  /* ==========================================================================
     02  MOBILE NAVIGATION
  ========================================================================== */
  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");

  function closeMenu() {
    if (!navMenu) return;
    navMenu.classList.remove("is-open");
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const open = navMenu.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
    $$("a", navMenu).forEach((a) => a.addEventListener("click", closeMenu));
  }

  /* ==========================================================================
     03  SCROLL: HEADER STATE + PROGRESS + PARALLAX
  ========================================================================== */
  const header = $("#siteHeader");
  const progress = $("#scrollProgress");
  const parallaxEls = $$("[data-parallax]");

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }
    if (!reduceMotion) {
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.getAttribute("data-parallax")) || 0;
        el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
      });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ==========================================================================
     04  SCROLLSPY — highlight the section currently in view
  ========================================================================== */
  const navLinks = $$("[data-nav]");
  const spyTargets = navLinks
    .map((l) => document.getElementById(l.getAttribute("href").slice(1)))
    .filter(Boolean);

  if ("IntersectionObserver" in window && spyTargets.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          navLinks.forEach((l) =>
            l.classList.toggle("is-current", l.getAttribute("href") === "#" + e.target.id)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    spyTargets.forEach((t) => spy.observe(t));
  }

  /* ==========================================================================
     05  SCROLL REVEAL
  ========================================================================== */
  const revealEls = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const obs = new IntersectionObserver(
      (entries, o) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            o.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
    );
    revealEls.forEach((el) => obs.observe(el));
  }

  /* ==========================================================================
     06  ANIMATED COUNTERS — any element with [data-target]
  ========================================================================== */
  function animateCount(el) {
    const target = parseFloat(el.getAttribute("data-target")) || 0;
    const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    const prefix = el.getAttribute("data-prefix") || "";
    const suffix = el.getAttribute("data-suffix") || "";
    const format = (v) => prefix + v.toFixed(decimals) + suffix;

    if (reduceMotion) { el.textContent = format(target); return; }

    const duration = 1500;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      el.textContent = format(target * eased);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = format(target);
    }
    requestAnimationFrame(tick);
  }

  function observeOnce(el, cb, threshold = 0.4) {
    if (!("IntersectionObserver" in window)) { cb(el); return; }
    const o = new IntersectionObserver(
      (entries, ob) => entries.forEach((e) => {
        if (e.isIntersecting) { cb(e.target); ob.unobserve(e.target); }
      }),
      { threshold }
    );
    o.observe(el);
  }

  // Standalone counters not inside a dashboard widget are animated individually.
  $$("[data-target]").forEach((el) => {
    if (el.closest(".widget")) return; // handled with their widget below
    observeOnce(el, animateCount);
  });

  /* ==========================================================================
     07  DASHBOARD WIDGETS — animate when each widget enters the viewport
  ========================================================================== */
  $$(".widget").forEach((widget) => {
    observeOnce(widget, () => {
      widget.classList.add("is-filled");           // triggers CSS bar / spark
      $$("[data-target]", widget).forEach(animateCount);

      // Radial gauge: convert value -> stroke-dashoffset
      const gauge = $(".gauge", widget);
      if (gauge) {
        const value = Math.max(0, Math.min(100, parseFloat(gauge.getAttribute("data-value")) || 0));
        const fill = $(".gauge__fill", gauge);
        const r = 52, circ = 2 * Math.PI * r;
        fill.style.strokeDasharray = circ.toFixed(1);
        // small delay so the transition is visible
        requestAnimationFrame(() => {
          fill.style.strokeDashoffset = (circ * (1 - value / 100)).toFixed(1);
        });
      }
    }, 0.3);
  });

  /* ==========================================================================
     08  SYSTEMS-THINKING INTERACTIVE MAP
  ========================================================================== */
  const SYSTEMS = {
    hub: {
      tag: "The core",
      title: "Holistic System Design",
      text: "Real transformation happens when every dimension reinforces the others. People, process, technology, organization and data form a single living system — designed together, not in silos.",
    },
    people: {
      tag: "People",
      title: "People & Capability",
      text: "Transformation is carried by people. I map roles, capabilities and ways of working, then enable teams to own change rather than endure it.",
    },
    processes: {
      tag: "Processes",
      title: "Processes & Value Streams",
      text: "Processes are how value actually flows. I make them visible, lean and measurable — removing friction between functions and standardizing what should be repeatable.",
    },
    technology: {
      tag: "Technology",
      title: "Technology & Automation",
      text: "Technology is leverage. I design application landscapes, integrations and automation that fit the process — not the other way around — so tools amplify the system.",
    },
    organization: {
      tag: "Organization",
      title: "Organization & Operating Model",
      text: "Structure follows strategy. I shape operating models, governance and accountability so the organization can scale without losing clarity or control.",
    },
    data: {
      tag: "Data",
      title: "Data & Decisions",
      text: "Data is the nervous system. I connect the right signals to the right decisions, turning scattered information into steering metrics leaders can trust.",
    },
  };

  const stage = $("#systemStage");
  if (stage) {
    const panelTag = $("#smTag");
    const panelTitle = $("#smTitle");
    const panelText = $("#smText");
    const links = $$("#smLinks line");
    const nodes = $$(".sm-node", stage);

    function lightLinks(key) {
      links.forEach((ln) => {
        const isSpoke = ln.getAttribute("data-link") === key;
        const isRing = ln.hasAttribute("data-ring");
        // Hub lights every spoke; a single node lights its own spoke.
        const lit = key === "hub" ? !isRing : isSpoke;
        ln.classList.toggle("is-lit", lit);
      });
    }

    function select(key) {
      const data = SYSTEMS[key];
      if (!data) return;
      panelTag.textContent = data.tag;
      panelTitle.textContent = data.title;
      panelText.textContent = data.text;
      nodes.forEach((n) => n.classList.toggle("is-active", n.getAttribute("data-node") === key));
      lightLinks(key);
    }

    nodes.forEach((n) => {
      const key = n.getAttribute("data-node");
      ["mouseenter", "focus", "click"].forEach((ev) =>
        n.addEventListener(ev, () => select(key))
      );
    });

    // Reset to hub when the pointer leaves the whole stage
    stage.addEventListener("mouseleave", () => select("hub"));
  }

  /* ==========================================================================
     09  CASE STUDIES — render cards, filter, modal
  ========================================================================== */
  const CASES = [
    {
      cat: "digital", tag: "Digitalization",
      title: "End-to-end digitalization of a sales process",
      summary: "A manual, media-break-heavy quote-to-order flow rebuilt into one transparent, automated pipeline.",
      kpis: [{ v: "-60%", l: "Cycle time" }, { v: "+25%", l: "Win rate" }, { v: "100%", l: "Transparency" }],
      challenge: "Quotes and orders were handled manually across email, spreadsheets and disconnected tools. Lead times were long, status was invisible, and nothing was measurable.",
      analysis: "An end-to-end process mapping revealed five hand-offs and three media breaks. Most delay sat in waiting time, not work time — a classic flow problem.",
      approach: "Designed a single CRM-backed workflow with clear stage gates, then automated quote generation and approvals to remove the manual bottlenecks.",
      implementation: "Configured the CRM, built automation flows, migrated data and ran the team through a structured enablement and change programme.",
      outcome: "A continuous, traceable sales process: response times dropped sharply, win rate rose, and leadership finally had real-time pipeline visibility.",
      lessons: "Automate the flow, not the chaos — standardizing the process first made the technology trivial and the adoption durable.",
      tools: ["BPMN", "CRM", "Workflow Automation", "Power Automate"],
    },
    {
      cat: "structure", tag: "Structure",
      title: "Building a scalable holding structure",
      summary: "Grown-up single entities re-architected into a governed, shared-services holding ready for growth.",
      kpis: [{ v: "4", l: "Entities" }, { v: "-30%", l: "Overhead" }, { v: "+1", l: "Scaling layer" }],
      challenge: "Several companies had grown organically with no shared governance, duplicated functions and unclear accountability between entities.",
      analysis: "Mapped overlapping roles, costs and decision rights. The duplication wasn't the root cause — the missing operating model was.",
      approach: "Designed a holding model with a central shared-services layer, clear role definitions and clean interfaces between entities.",
      implementation: "Stood up shared services, defined RACI and governance forums, and migrated overlapping functions into the centre step by step.",
      outcome: "A clear, scalable structure that absorbs new entities cleanly and cut duplicated overhead while improving control.",
      lessons: "Structure is a product — it needs an owner, versioning and a roadmap, not a one-off reorg.",
      tools: ["Business Architecture", "Governance", "Org Design", "Operating Model"],
    },
    {
      cat: "process", tag: "Process",
      title: "Operational process optimization",
      summary: "Recurring bottlenecks and error rates removed through value-stream analysis and KPI steering.",
      kpis: [{ v: "-45%", l: "Error rate" }, { v: "+35%", l: "Productivity" }, { v: "-50%", l: "Rework" }],
      challenge: "The daily operation suffered from recurring bottlenecks, high error rates and heavy manual coordination across teams.",
      analysis: "A value-stream analysis exposed unstable inputs and undefined standards as the source of variation and rework.",
      approach: "Standardized the core processes, designed pull-based hand-offs and introduced steering KPIs to make performance visible.",
      implementation: "Rolled out standards with the teams, built a lightweight KPI cockpit and embedded a continuous-improvement rhythm.",
      outcome: "Stable, predictable operations with fewer errors and meaningfully more capacity freed for value-adding work.",
      lessons: "You can't improve what you don't standardize — variation hides every other problem.",
      tools: ["Lean", "Value-Stream Mapping", "Continuous Improvement", "KPI Steering"],
    },
    {
      cat: "ai", tag: "AI & Automation",
      title: "AI-assisted automation of admin work",
      summary: "Repetitive administrative work offloaded to AI assistants and automated document workflows.",
      kpis: [{ v: "-70%", l: "Handling time" }, { v: "+90%", l: "Consistency" }, { v: "12h", l: "Freed / week" }],
      challenge: "Time-intensive, repetitive admin tasks tied up skilled people and slowed down decisions across the back office.",
      analysis: "Profiled task volumes and variability to separate what's truly judgement work from what's pattern work ripe for automation.",
      approach: "Deployed AI assistants for drafting and classification, and built automated document workflows around them with human checkpoints.",
      implementation: "Designed prompts and guardrails, wired up OCR and routing, and piloted with one team before scaling to others.",
      outcome: "Noticeable relief for the teams and faster, more consistent processing of administrative work — with people moved to higher-value tasks.",
      lessons: "AI delivers when it sits inside a well-defined process with clear checkpoints — not as a bolt-on novelty.",
      tools: ["AI Assistants", "RPA", "OCR", "Prompt Design"],
    },
    {
      cat: "business", tag: "Business Dev",
      title: "Business development for new revenue fields",
      summary: "Saturation in the core business answered with validated new business models and first paying customers.",
      kpis: [{ v: "3", l: "New fields" }, { v: "2", l: "Pilot clients" }, { v: "+15%", l: "Revenue upside" }],
      challenge: "The core business was saturating and needed additional, future-proof revenue streams to keep growing.",
      analysis: "Ran market and capability analysis to find adjacencies where existing strengths created an unfair advantage.",
      approach: "Developed business models on the Business Model Canvas and shaped first pilot offerings to test demand fast.",
      implementation: "Built MVPs, defined pricing and ran lightweight go-to-market experiments with selected pilot customers.",
      outcome: "Three validated business fields with a clear scaling path and the first paying pilot customers on board.",
      lessons: "Validate the business model, not just the product — willingness to pay is the only signal that matters early.",
      tools: ["Business Model Canvas", "Market Analysis", "MVP", "Pricing"],
    },
    {
      cat: "digital", tag: "Digitalization",
      title: "Data-driven steering & reporting layer",
      summary: "Fragmented spreadsheets replaced by a single steering cockpit leaders actually trust.",
      kpis: [{ v: "1", l: "Source of truth" }, { v: "-80%", l: "Reporting effort" }, { v: "24/7", l: "Live KPIs" }],
      challenge: "Decisions relied on scattered spreadsheets compiled by hand — slow, inconsistent and impossible to trust at speed.",
      analysis: "Traced every key metric back to its source and found conflicting definitions and duplicated manual effort everywhere.",
      approach: "Defined a single metric dictionary, then designed an automated data pipeline feeding one executive steering cockpit.",
      implementation: "Connected the source systems, automated the refresh, and co-designed the dashboards with the leaders who use them.",
      outcome: "One source of truth with live KPIs — reporting effort collapsed and decisions sped up across the leadership team.",
      lessons: "Governance before dashboards: agree what a number means before you automate how it's calculated.",
      tools: ["Data & Analytics", "KPI Cockpit", "Automation", "Governance"],
    },
  ];

  const caseGrid = $("#caseGrid");
  if (caseGrid) {
    // Render cards
    caseGrid.innerHTML = CASES.map((c, i) => `
      <button class="case" data-category="${c.cat}" data-index="${i}" aria-haspopup="dialog">
        <div class="case__top">
          <span class="case__tag">${c.tag}</span>
          <span class="case__index">${String(i + 1).padStart(2, "0")}</span>
        </div>
        <h3 class="case__title">${c.title}</h3>
        <p class="case__summary">${c.summary}</p>
        <div class="case__kpis">
          ${c.kpis.map((k) => `<div><strong>${k.v}</strong><span>${k.l}</span></div>`).join("")}
        </div>
        <span class="case__open">Read full case study</span>
      </button>
    `).join("");

    // Re-observe new cards for reveal (they were injected after initial scan)
    if (!reduceMotion && "IntersectionObserver" in window) {
      const cardObs = new IntersectionObserver((entries, o) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.style.opacity = 1; e.target.style.transform = "none"; o.unobserve(e.target); } });
      }, { threshold: 0.1 });
      $$(".case", caseGrid).forEach((card, i) => {
        card.style.opacity = 0;
        card.style.transform = "translateY(28px)";
        card.style.transition = `opacity .7s ${i * 0.05 + 0.05}s ease, transform .7s ${i * 0.05 + 0.05}s cubic-bezier(.22,.61,.36,1)`;
        cardObs.observe(card);
      });
    }

    /* ---- Filtering ---- */
    const filterBar = $("#projectFilters");
    if (filterBar) {
      filterBar.addEventListener("click", (e) => {
        const btn = e.target.closest(".filter");
        if (!btn) return;
        $$(".filter", filterBar).forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const f = btn.getAttribute("data-filter");
        $$(".case", caseGrid).forEach((card) => {
          const match = f === "all" || card.getAttribute("data-category") === f;
          card.classList.toggle("is-hidden", !match);
        });
      });
    }

    /* ---- Modal ---- */
    const modal = $("#caseModal");
    const modalBody = $("#caseModalBody");
    let lastFocused = null;

    function openCase(index) {
      const c = CASES[index];
      if (!c) return;
      modalBody.innerHTML = `
        <span class="cm-tag">${c.tag}</span>
        <h3 class="cm-title" id="cmTitle">${c.title}</h3>
        <div class="cm-metrics">
          ${c.kpis.map((k) => `<div><strong>${k.v}</strong><span>${k.l}</span></div>`).join("")}
        </div>
        <div class="cm-visuals">
          <div class="cm-visual"><span>🖼️</span><small>Process diagram</small></div>
          <div class="cm-visual"><span>📊</span><small>Results chart</small></div>
          <div class="cm-visual cm-visual--wide"><span>⇆</span><small>Before / after visualization</small></div>
        </div>
        <div class="cm-block"><h4>Challenge</h4><p>${c.challenge}</p></div>
        <div class="cm-block"><h4>Analysis</h4><p>${c.analysis}</p></div>
        <div class="cm-block"><h4>Approach</h4><p>${c.approach}</p></div>
        <div class="cm-block"><h4>Implementation</h4><p>${c.implementation}</p></div>
        <div class="cm-block"><h4>Outcome</h4><p>${c.outcome}</p></div>
        <div class="cm-block"><h4>Lessons Learned</h4><p>${c.lessons}</p></div>
        <div class="cm-tools">${c.tools.map((t) => `<span>${t}</span>`).join("")}</div>
      `;
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      $(".case-modal__close", modal).focus();
    }

    function closeCase() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    caseGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".case");
      if (card) openCase(parseInt(card.getAttribute("data-index"), 10));
    });

    modal.addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-close")) closeCase();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeCase();
    });
  }

  /* ==========================================================================
     10  PROCESS ENGINEERING FLOW
  ========================================================================== */
  const PROCESS = [
    {
      tag: "Stage 01 · Baseline",
      title: "Current State",
      text: "We start with reality — not the org chart. The actual flow of work, hand-offs, waiting time and workarounds, captured honestly.",
      list: ["End-to-end process capture", "Pain points & media breaks", "Baseline metrics & cost of delay"],
      cap: "As-is",
    },
    {
      tag: "Stage 02 · Diagnose",
      title: "Analysis",
      text: "With the baseline visible, we find the root causes — separating symptoms from the structural issues that actually drive waste.",
      list: ["Value-stream & bottleneck analysis", "Root-cause investigation", "Quantified improvement potential"],
      cap: "Insight",
    },
    {
      tag: "Stage 03 · Redesign",
      title: "Optimization",
      text: "Lean the process before touching technology. Remove, simplify and standardize so the redesigned flow is robust by design.",
      list: ["Eliminate waste & rework", "Standardize core steps", "Design pull-based hand-offs"],
      cap: "Lean",
    },
    {
      tag: "Stage 04 · Enable",
      title: "Digitalization",
      text: "Now technology adds leverage: automation, integration and AI applied to a process that already works on paper.",
      list: ["Workflow automation & integration", "AI & data where it pays", "Guardrails & exception handling"],
      cap: "Automate",
    },
    {
      tag: "Stage 05 · Sustain",
      title: "Future State",
      text: "A scalable, measured target operating model — with the KPIs and ownership needed to keep improving long after go-live.",
      list: ["Live KPI steering", "Clear ownership & governance", "Continuous-improvement rhythm"],
      cap: "Scale",
    },
  ];

  const flowTrack = $("#flowTrack");
  const flowDetail = $("#flowDetail");
  const flowProgress = $("#flowProgress");

  if (flowTrack && flowDetail) {
    const steps = $$(".flow__step", flowTrack);

    function renderStep(idx) {
      const p = PROCESS[idx];
      flowDetail.innerHTML = `
        <div>
          <span class="flow__detail-tag">${p.tag}</span>
          <h3>${p.title}</h3>
          <p>${p.text}</p>
          <ul class="flow__detail-list">${p.list.map((i) => `<li>${i}</li>`).join("")}</ul>
        </div>
        <div class="flow__viz">
          <div class="flow__viz-card">
            <span class="flow__viz-num">0${idx + 1}</span>
            <span class="flow__viz-cap">${p.cap}</span>
          </div>
        </div>
      `;
      steps.forEach((s, i) => {
        s.classList.toggle("is-active", i === idx);
        s.classList.toggle("is-done", i < idx);
      });
      if (flowProgress) flowProgress.style.width = (idx / (PROCESS.length - 1)) * 88 + "%";
    }

    steps.forEach((s, i) => {
      ["click", "mouseenter", "focus"].forEach((ev) => s.addEventListener(ev, () => renderStep(i)));
      s.setAttribute("tabindex", "0");
    });
    renderStep(0);
  }

  /* ==========================================================================
     11  BUSINESS ARCHITECTURE ACCORDION
  ========================================================================== */
  const archi = $("#archi");
  if (archi) {
    $$(".archi__layer", archi).forEach((layer) => {
      const bar = $(".archi__bar", layer);
      bar.setAttribute("role", "button");
      bar.setAttribute("tabindex", "0");
      const toggle = () => {
        const open = layer.classList.contains("is-open");
        $$(".archi__layer", archi).forEach((l) => l.classList.remove("is-open"));
        if (!open) layer.classList.add("is-open");
      };
      bar.addEventListener("click", toggle);
      bar.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });
    // Open the top layer by default for visual interest
    $(".archi__layer", archi).classList.add("is-open");
  }

  /* ==========================================================================
     12  FOOTER YEAR
  ========================================================================== */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
