# Lab-Datenmodell (Schema)

Ein **Lab** ist eine **eigeninitiierte Forschungs- und Entwicklungsarbeit** — kein Kundenprojekt
(siehe `projects/_SCHEMA.md`) und kein Beratungsmandat (siehe `mandates/_SCHEMA.md`), sondern eine
selbst getriebene Architektur-/Engineering-Initiative. Labs sind ein **dritter, paralleler
Content-Typ** mit eigenem Register, eigener Sektion und eigener Route. Projekte und Mandate bleiben
unverändert.

Jedes Lab ist **eine JSON-Datei** unter `labs/<slug>.json` und die einzige Quelle der Wahrheit für
dieses Lab. Die Website rendert daraus die Lab-Karte, das Lab-Dossier (`#/lab/<slug>`) **und** das
Lab-Dashboard. Website-Code wird nie angefasst.

> **Grundregel wie bei Projekten/Mandaten: keine erfundenen Zahlen.** Fehlende oder auf `0` gesetzte
> Werte werden ausgeblendet. Abgeleitete Werte (Roadmap-Fortschritt, Reife-Ø, Evidenz) berechnet die
> Engine selbst. Die Reife-Werte sind eine Selbsteinschätzung (0–5).

## Registrierung

Slug in `labs/index.json` → `"order"` eintragen. Reihenfolge dort = Reihenfolge in der Sektion.
Fehlt `labs/index.json`, rendert die Labs-Sektion einfach nicht (Nav-Eintrag bleibt versteckt).

## Felder

| Feld | Pflicht | Typ | Bedeutung |
|------|:------:|------|-----------|
| `slug` | ✅ | String | Eindeutige ID = Dateiname. URL: `#/lab/<slug>`. |
| `name` | ✅ | String | Lab-Name. |
| `type` | ◻️ | String | `"lab"` (Diskriminator). |
| `status` | ✅ | Enum | `real` / `anonymized` / `concept` / `in-progress`. Label im Lab: Lauffähig / Anonymisiert / Forschung / Aktive Entwicklung. |
| `category` | ✅ | String | z. B. „Architecture Lab · Enterprise Systems". |
| `summary` | ✅ | String | Kurzbeschreibung für die Lab-Karte. |
| `executiveSummary` | ◻️ | String | Längerer Aufmacher im Dossier-Kopf (Fallback: `summary`). |
| `meta` | ✅ | Objekt | `subtitle`, `initiative`, `role`, `period`, `developmentStatus`, `platform`, `license`, `tracked[]`. |
| `vision` | ◻️ | String | Langfristige Vision. |
| `purpose` | ◻️ | String | Zweck der Initiative. |
| `researchAreas` | ◻️ | Array | `[{ name, description }]` oder `[String]`. |
| `architecture` | ◻️ | Objekt | `{ summary, principles[], layers[{ name, description }] }`. |
| `stack` | ◻️ | Objekt | `{ languages[], frameworks[], data[], infrastructure[], tools[] }`. |
| `capabilities` | ◻️ | Array | `[{ name, state, description }]` oder `[String]`. |
| `experiments` | ◻️ | Array | `[{ title, hypothesis, state, result, evidence }]`. |
| `metrics` | ◻️ | Objekt | Lab-Dashboard-Zahlen, siehe unten. |
| `maturity` | ◻️ | Objekt | Engineering-Reife je Dimension (Current / Target, 0–5), siehe unten. |
| `roadmap` | ◻️ | Array | `[{ phase, title, state, items[] }]`. Fortschritt = Anteil `state: "completed"`. |
| `artifacts` | ◻️ | Array | Screenshots/Bilder; gleiche Struktur wie bei Projekten (`type`, `title`, `caption`, `src`, `pending`). |
| `documentation` | ◻️ | Array | Optionale Dokument-Kacheln; gleiche Artefakt-Struktur (meist `type: "pdf"`). |
| `lessons` | ◻️ | [String] | Lessons Learned. |
| `relatedProjects` | ◻️ | [String] | Slugs verwandter **Projekte** → Links auf `#/projekt/<slug>`. |
| `relatedMandates` | ◻️ | [String] | Slugs verwandter **Mandate** → Links auf `#/mandat/<slug>`. |

> Leere oder fehlende optionale Felder werden **automatisch ausgeblendet**.

### `state`-Werte (capabilities, experiments, roadmap)

`completed` → „Abgeschlossen", `in-progress` → „In Umsetzung", `planned` → „Geplant".

### `metrics` — Lab-Dashboard (Engineering-orientiert)

Jeder Wert > 0 erscheint als Dashboard-Kachel; `0` oder fehlend wird ausgeblendet. Die Labs-Sektion
summiert ausgewählte Werte über alle Labs (Business-Domänen, Module, Datenmodelle, Lines of Code,
Integrationen).

```json
"metrics": {
  "businessDomains": 0,   // fachliche Domänen
  "modules": 0,           // Backend-/Feature-Module
  "subFeatures": 0,       // Sub-Features
  "restAreas": 0,         // REST-Ressourcenbereiche
  "dataModels": 0,        // Datenbank-Tabellen / Modelle
  "migrations": 0,        // versionierte DB-Migrationen
  "integrations": 0,      // externe Integrationen
  "sourceFiles": 0,       // Quellcode-Dateien
  "linesOfCode": 0,       // Lines of Code
  "sharedPackages": 0,    // interne Shared Libraries
  "documents": 0,         // Engineering-Dokumente
  "complexity": 0         // Selbsteinschätzung 0–5
}
```

### `maturity` — Architektur-Reife (eigene Dimensionen)

Sechs engineering-orientierte Dimensionen, je `current` und `target` auf einer Skala von `0`–`5`.
Das Dossier rendert daraus ein Radar-Chart; der Dossier-Kopf zeigt den Ø als „Reife (Ø)".

```json
"maturity": {
  "architecture":  { "current": 0, "target": 0 },
  "dataModel":     { "current": 0, "target": 0 },
  "integration":   { "current": 0, "target": 0 },
  "automation":    { "current": 0, "target": 0 },
  "documentation": { "current": 0, "target": 0 },
  "quality":       { "current": 0, "target": 0 }
}
```

## Status-Werte

| `status` | Label im Lab |
|----------|--------------|
| `real` | Lauffähig |
| `anonymized` | Anonymisiert |
| `concept` | Forschung |
| `in-progress` | Aktive Entwicklung |

## Abgeleitete Werte (von der Engine berechnet, nie eingeben)

- **Roadmap-Fortschritt** — Anteil der Phasen mit `state: "completed"` (Karte: „X/Y").
- **Reife (Ø)** — Durchschnitt aller `maturity.current`-Werte.
- **Evidenz** — Anteil tatsächlich hochgeladener (nicht `pending`) Screenshots/Artefakte.
- **Labs-Aggregat** — Summen über alle Labs (Domänen, Module, Datenmodelle, LOC, Integrationen).

## Bildablage

Screenshots unter `labs/artifacts/<slug>/` ablegen und in `artifacts[].src` relativ zur
Website-Wurzel referenzieren (z. B. `labs/artifacts/aegis/cockpit-dashboard.jpg`).
