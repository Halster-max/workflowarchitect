# Projekt-Datenmodell (Schema)

Jedes Projekt ist **eine JSON-Datei** unter `projects/<slug>.json`. Diese Datei ist die
**einzige Quelle der Wahrheit** für das Projekt. Die Website rendert daraus automatisch
die Übersichtskarte, die Detailseite **und** alle aggregierten Dashboards (Portfolio-Dashboard,
Facts & Figures, Process-Maturity-Dashboard, Artefakt-Bibliothek). Website-Code wird **nie**
angefasst.

> **Grundregel: Keine erfundenen Zahlen.** Die Engine zeigt ausschliesslich Werte, die in der
> Projektdatei stehen. Fehlende oder auf `0` gesetzte Werte werden ausgeblendet — es entstehen
> keine Platzhalter und keine Fake-KPIs. Alle Aggregat-Widgets werden aus den Projektdaten
> berechnet und aktualisieren sich automatisch, sobald ein Projekt hinzukommt.

## Pflicht-/Kernfelder

| Feld | Pflicht | Typ | Bedeutung |
|------|:------:|------|-----------|
| `slug` | ✅ | String | Eindeutige ID, identisch mit dem Dateinamen ohne `.json`. Erscheint in der URL (`#/projekt/<slug>`). Nur Kleinbuchstaben, Ziffern, Bindestriche. |
| `name` | ✅ | String | Projektname (Titel der Karte und Detailseite). |
| `status` | ✅ | Enum | Einer von: `real`, `anonymized`, `concept`, `in-progress`. Steuert Status-Label und Filter. |
| `category` | ✅ | String | Fachkategorie (z. B. „Digitalisierung", „Prozess"). Frei wählbar. |
| `summary` | ✅ | String | Kurzbeschreibung (1–2 Sätze) für die Übersichtskarte. |
| `meta` | ✅ | Objekt | Metadaten, siehe unten. |
| `context` | ◻️ | String | Ausgangslage. |
| `problem` | ◻️ | String | Problemstellung. |
| `analysis` | ◻️ | String | Analyse. |
| `approach` | ◻️ | Objekt | `{ methodology: [String], implementation: String }`. |
| `figures` | ◻️ | Objekt | Facts & Figures, siehe unten. |
| `measurement` | ◻️ | Objekt | Messmodell (Verified / Estimated / Hypotheses), siehe unten. |
| `maturity` | ◻️ | Objekt | Prozessreife je Dimension (Current / Target), siehe unten. |
| `transformation` | ◻️ | Objekt | Transformations-Phasen, siehe unten. |
| `artifacts` | ◻️ | Array | Liste von Artefakten, siehe unten. |
| `deliverables` | ◻️ | [String] | Konkrete Ergebnisse / Lieferobjekte. |
| `impact` | ◻️ | String | Wirkung (als Messlogik, nicht als unbelegte Zahl). |
| `lessons` | ◻️ | [String] | Lessons Learned. |
| `evidence` | ◻️ | String | Belegstatus / nächster Dokumentationsschritt. |
| `related` | ◻️ | [String] | Slugs verwandter Projekte (werden zu Links). |

> Leere oder fehlende optionale Felder werden **automatisch ausgeblendet**.

### `meta`

```json
"meta": {
  "role": "Deine Rolle im Projekt",
  "industry": "Branche",
  "period": "Zeitraum oder Status-Hinweis",
  "type": "Projekttyp",
  "implementationStatus": "Konzept · Pilot geplant · In Umsetzung · Produktiv",
  "tracked": ["Durchlaufzeit", "Fehlerquote"]
}
```

`tracked` listet die Kennzahlen-Kategorien, die im Projekt betrachtet werden (Chips auf Karte
und Detailseite). `implementationStatus` erscheint im Projekt-Dashboard als „Umsetzungsstatus".

### `figures` — Facts & Figures

Reine Projektfakten, keine Wirkungs-KPIs. Jeder Wert > 0 wird angezeigt; `0` oder fehlend wird
ausgeblendet. Die Website summiert diese Werte über alle Projekte für die Facts-&-Figures-Sektion
und das Portfolio-Dashboard.

```json
"figures": {
  "stakeholders": 6,     // Stakeholder eingebunden
  "systems": 4,          // Systeme betroffen
  "processSteps": 24,    // Prozessschritte analysiert
  "workshops": 2,        // Workshops durchgeführt
  "documents": 5,        // Dokumente erstellt
  "screenshots": 0,      // Screenshots verfügbar
  "diagrams": 2,         // Prozessdiagramme erstellt
  "departments": 3,      // Abteilungen beteiligt
  "trainings": 0,        // Schulungen durchgeführt
  "businessUnits": 1     // Geschäftsbereiche betroffen
}
```

### `measurement` — Messmodell (Transparenz statt Behauptung)

Trennt **verifizierte Ergebnisse**, **geschätzte Wirkung** und **Hypothesen**. Jeder Wert ist
eine Selbsteinschätzung der Belegstärke von `0`–`5` (wird als ★-Bewertung dargestellt).
`note` ist ein optionaler erklärender Satz.

```json
"measurement": {
  "verified": 0,     // Verifizierte Ergebnisse (belegt durch Messung)
  "estimated": 3,    // Geschätzte Wirkung (plausibel, noch nicht gemessen)
  "hypotheses": 2,   // Hypothesen (zu testende Annahmen)
  "note": "Warum die Bewertung so ausfällt."
}
```

### `maturity` — Prozessreife (Process-Maturity-Dashboard)

Sechs Dimensionen, je `current` und `target` auf einer Skala von `0`–`5`. Die Detailseite
rendert daraus ein Radar-Chart; die Aggregat-Sektion bildet den Durchschnitt über alle Projekte.

```json
"maturity": {
  "standardization": { "current": 2, "target": 4 },
  "documentation":   { "current": 3, "target": 5 },
  "transparency":    { "current": 1, "target": 4 },
  "digitalization":  { "current": 1, "target": 4 },
  "automation":      { "current": 1, "target": 3 },
  "governance":      { "current": 2, "target": 3 }
}
```

### `transformation` — Transformations-Phasen

Fünf Phasen: `before`, `analysis`, `optimization`, `digitalization`, `future`. Je Phase optional
`summary`, `inputs[]`, `outputs[]`, `artifacts[]` (Artefakt-Titel als Text) und `evidence`.
Leere Phasen werden ausgeblendet.

```json
"transformation": {
  "before": {
    "summary": "Ausgangszustand in einem Satz.",
    "inputs": ["Input A", "Input B"],
    "outputs": ["Output A"],
    "artifacts": ["IST-Prozessdiagramm"],
    "evidence": "Belegstand dieser Phase."
  },
  "analysis": { "summary": "", "inputs": [], "outputs": [], "artifacts": [], "evidence": "" }
}
```

### `artifacts`

```json
"artifacts": [
  {
    "type": "bpmn",
    "title": "SOLL-Prozessdiagramm",
    "caption": "Kurze Bildunterschrift (optional)",
    "src": "projects/artifacts/<slug>/soll-prozess.png",
    "pending": false
  }
]
```

| Artefakt-Feld | Bedeutung |
|------|-----------|
| `type` | Einer von: `image`, `screenshot`, `diagram`, `bpmn`, `dashboard`, `orgchart`, `presentation`, `pdf`, `document`, `checklist`, `sop`, `workshop`. Bestimmt Icon und Darstellung. |
| `title` | Anzeigename des Artefakts. |
| `caption` | Optionale Bildunterschrift. |
| `src` | Pfad zur Datei (relativ zur Website-Wurzel). Bildtypen werden eingebettet, Dokumenttypen als Öffnen-Kachel verlinkt. |
| `pending` | `true` = angekündigt, aber noch nicht hochgeladen → „In Vorbereitung"-Kachel statt totem Link. |

**Darstellung nach Typ:**
- `image`, `screenshot`, `diagram`, `bpmn`, `dashboard`, `orgchart` → als **Bild** eingebettet (wenn `src` gesetzt).
- `presentation`, `pdf`, `document`, `checklist`, `sop`, `workshop` → als **Datei-Kachel** mit Öffnen-Link.

Die Artefakt-Bibliothek auf der Startseite zählt alle Artefakte je Typ über sämtliche Projekte —
ebenfalls direkt aus den Daten.

## Status-Werte

| `status` | Label | Filter |
|----------|-------|--------|
| `real` | Praxisprojekt | Praxisprojekt |
| `anonymized` | Anonymisiert | Anonymisiert |
| `concept` | Konzeptstudie | Konzeptstudie |
| `in-progress` | In Ausarbeitung | In Ausarbeitung |

## Abgeleitete Werte (von der Engine berechnet, nie eingeben)

- **Dokumentations-Vollständigkeit** — Anteil ausgefüllter Wissensbausteine (Kontext, Problem,
  Analyse, Methodik, Umsetzung, Lieferobjekte, Facts, Messmodell, Reife, Transformation, Lessons, Artefakte).
- **Evidenz-Vollständigkeit** — Anteil tatsächlich hochgeladener (nicht `pending`) Artefakte.
- **Prozessreife (Ø)** — Durchschnitt aller `maturity.current`-Werte.
- **Portfolio-Dashboard / Facts & Figures / Maturity-Aggregat** — Summen bzw. Durchschnitte über
  alle Projekte.
