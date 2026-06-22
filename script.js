/* ============================================================================
   DOMINIC HALDI — Process Engineering · Digitalisierung · Business Architecture
   script.js  (vanilla JS, zero dependencies)
   ----------------------------------------------------------------------------
   Credibility-first build: no animated KPI counters, no fabricated dashboards.
   01  Theme toggle (dark-first, persisted)
   02  Mobile navigation
   03  Scroll: header state + progress bar + parallax
   04  Scrollspy (active nav link)
   05  Scroll reveal (IntersectionObserver)
   06  Process engineering flow (IST → Controlling)
   07  Business architecture accordion
   08  Footer year
   ----------------------------------------------------------------------------
   NOTE: The project portfolio (grid, filter, detail view) is rendered from the
   project library by projects.js — it is no longer hardcoded here.
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
     07  PROCESS TRANSFORMATION VIEW — Before State → Future State
         Generic transformation framework. Each phase shows Inputs, Outputs,
         Artifacts and Evidence. (Per-project transformation is data-driven and
         rendered in the project dossier by projects.js.)
  ========================================================================== */
  const PROCESS = [
    {
      tag: "Phase 01 · Ausgangslage",
      title: "Before State",
      text: "Die Realität ehrlich aufnehmen — der tatsächliche Arbeitsfluss mit Hand-offs, Wartezeiten und Workarounds, nicht das Organigramm.",
      inputs: ["Realer Arbeitsfluss", "Bestehende Tools & Tabellen", "Beobachtungen vor Ort"],
      outputs: ["Dokumentierte Ausgangslage", "Erste Symptome benannt"],
      artifacts: ["IST-Prozessaufnahme", "Foto-/Screenshot-Inventar"],
      evidence: "Belegt durch Aufnahme des realen Ablaufs, nicht durch Annahmen.",
      cap: "IST",
    },
    {
      tag: "Phase 02 · Diagnose",
      title: "Analyse",
      text: "Symptome von Ursachen trennen: Engpässe und Medienbrüche bis zur strukturellen Wurzel zurückverfolgen.",
      inputs: ["IST-Prozessaufnahme", "Interviews & Workshops", "Mengen-/Zeitdaten"],
      outputs: ["Ursachen statt Symptome", "Quantifiziertes Potenzial"],
      artifacts: ["Wertstromdiagramm", "Engpass-/Ursachenkarte"],
      evidence: "Belegt durch nachvollziehbare Ursache-Wirkungs-Kette.",
      cap: "Warum",
    },
    {
      tag: "Phase 03 · Zielbild",
      title: "Optimierung",
      text: "Den Prozess zuerst auf dem Papier richtig machen — entfernen, vereinfachen, standardisieren, bevor Technik ins Spiel kommt.",
      inputs: ["Analyse-Ergebnisse", "Fachexpertise", "Standards & Vorgaben"],
      outputs: ["Robuster SOLL-Prozess", "Klare Übergaben & Rollen"],
      artifacts: ["SOLL-Prozessdiagramm", "Prozessstandard / SOP"],
      evidence: "Belegt durch abgestimmtes, validiertes Zielbild.",
      cap: "SOLL",
    },
    {
      tag: "Phase 04 · Realisierung",
      title: "Digitalisierung",
      text: "Technik schafft Hebel: Automatisierung, Integration und KI auf einem Prozess, der bereits auf dem Papier funktioniert — mit Guardrails.",
      inputs: ["SOLL-Prozess", "Systemlandschaft", "Guardrails & Prüfpunkte"],
      outputs: ["Automatisierte Schritte", "Integrierte Datenflüsse"],
      artifacts: ["Workflow-Konzept", "Dashboard-/Datenfluss-Skizze"],
      evidence: "Belegt durch lauffähige Umsetzung bzw. Pilot.",
      cap: "Digital",
    },
    {
      tag: "Phase 05 · Steuerung",
      title: "Future State",
      text: "Ein gesteuertes, gemessenes Zielbild — mit Kennzahlen und Verantwortung, um nach Go-live weiter zu verbessern.",
      inputs: ["Live-Kennzahlen", "Verantwortlichkeiten", "Verbesserungsrhythmus"],
      outputs: ["Gesteuerter Betrieb", "Vorher-/Nachher-Messung"],
      artifacts: ["Kennzahlen-Cockpit", "Wirkungsmessung"],
      evidence: "Belegt durch laufende Messung gegen Basiswerte.",
      cap: "Steuern",
    },
  ];

  const flowTrack = $("#flowTrack");
  const flowDetail = $("#flowDetail");
  const flowProgress = $("#flowProgress");

  if (flowTrack && flowDetail) {
    const steps = $$(".flow__step", flowTrack);
    const subList = (label, arr) =>
      `<div class="flow__io"><span class="flow__io-label">${label}</span><ul class="flow__io-list">${arr.map((i) => `<li>${i}</li>`).join("")}</ul></div>`;

    function renderStep(idx) {
      const p = PROCESS[idx];
      flowDetail.innerHTML = `
        <div class="flow__detail-main">
          <span class="flow__detail-tag">${p.tag}</span>
          <h3>${p.title}</h3>
          <p>${p.text}</p>
          <div class="flow__io-grid">
            ${subList("Inputs", p.inputs)}
            ${subList("Outputs", p.outputs)}
            ${subList("Artefakte", p.artifacts)}
          </div>
          <p class="flow__evidence"><span>Evidenz</span> ${p.evidence}</p>
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
     08  BUSINESS ARCHITECTURE ACCORDION
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
     09  FOOTER YEAR
  ========================================================================== */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
