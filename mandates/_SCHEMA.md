# Mandats-Datenmodell (Schema)

Ein **Mandat** ist ein grossflächiger, bereichsübergreifender Transformationsauftrag, der **mehrere
Workstreams, Systeme und Initiativen** enthält — breiter angelegt als ein einzelnes Projekt
(siehe `projects/_SCHEMA.md`). Projekte bleiben unverändert; Mandate sind ein **zweiter, paralleler
Content-Typ** mit eigenem Register und eigener Sektion.

Jedes Mandat ist **eine JSON-Datei** unter `mandates/<slug>.json` und die einzige Quelle der
Wahrheit für dieses Mandat. Die Website rendert daraus die Mandatskarte, das Mandats-Dossier
(`#/mandat/<slug>`) **und** das Mandats-Dashboard. Website-Code wird nie angefasst.

> **Grundregel wie bei Projekten: keine erfundenen Zahlen.** Fehlende oder auf `0` gesetzte Werte
> werden ausgeblendet. Abgeleitete Werte (Workstream-Fortschritt, Reife-Ø, Evidenz) berechnet die
> Engine selbst.

## Registrierung

Slug in `mandates/index.json` → `"order"` eintragen. Reihenfolge dort = Reihenfolge in der Sektion.

## Felder

| Feld | Pflicht | Typ | Bedeutung |
|------|:------:|------|-----------|
| `slug` | ✅ | String | Eindeutige ID = Dateiname. URL: `#/mandat/<slug>`. |
| `name` | ✅ | String | Mandatsname. |
| `type` | ◻️ | String | `"mandate"` (Diskriminator). |
| `status` | ✅ | Enum | `real` / `anonymized` / `concept` / `in-progress` (wie Projekte; Label im Mandat: Praxismandat / Anonymisiert / Konzeptstudie / In Umsetzung). |
| `category` | ✅ | String | z. B. „Transformationsmandat · CIO". |
| `summary` | ✅ | String | Kurzbeschreibung für die Mandatskarte. |
| `executiveSummary` | ◻️ | String | Executive Summary (Kopf des Dossiers). |
| `meta` | ✅ | Objekt | `subtitle`, `role`, `form`, `industry`, `period`, `type`, `companySize`, `reportingLine`, `mandateStatus`, `tracked[]`. |
| `context` | ◻️ | String | Ausgangslage. |
| `scope` | ◻️ | Objekt | `{ summary, objectives[], outOfScope[], domains[] }`. |
| `analysis` | ◻️ | String | Analyse-Text. |
| `coreProblems` | ◻️ | [String] | Identifizierte Kernprobleme. |
| `workstreams` | ◻️ | Array | Siehe unten — das Kernkonstrukt. |
| `systems` | ◻️ | Objekt | `{ introduced[], integrated[], decommissioned[], apis[] }`. |
| `organisationalImpact` | ◻️ | Objekt | `{ summary, changes[], rolesChanged[] }`. |
| `processImpact` | ◻️ | Objekt | `{ summary, processes[] }`. |
| `dataAnalytics` | ◻️ | Objekt | `{ summary, items[] }`. |
| `automation` | ◻️ | Objekt | `{ summary, implemented[] }`. |
| `governance` | ◻️ | Objekt | `{ summary, model, decisionRights[], stakeholders[] }`. |
| `figures` | ◻️ | Objekt | Mandats-Kennzahlen (siehe unten). |
| `measurement` | ◻️ | Objekt | `{ verified, estimated, hypotheses, note }` (0–5, wie Projekte → ★). |
| `maturity` | ◻️ | Objekt | 6 Dimensionen `current`/`target` (0–5) → Radar (wie Projekte). |
| `impact` | ◻️ | String | Dokumentierte Wirkung (Fliesstext). |
| `outcomes` | ◻️ | [String] | Wirkung als Punkte. |
| `lessons` | ◻️ | [String] | Besondere Erkenntnisse. |
| `closing` | ◻️ | String | Mandatsabschluss / ehrliche Einordnung. |
| `evidence` | ◻️ | String | Belegstatus. |
| `relatedProjects` | ◻️ | [String] | Slugs aus `projects/` (werden zu Projekt-Links). |
| `artifacts` | ◻️ | Array | **Gleiches Schema wie Projekte** (`type`, `title`, `caption`, `src`, `pending`). |

### `workstreams[]` — das Kernkonstrukt

Ein Mandat enthält mehrere Workstreams. Jeder Workstream ist eine eigenständige Lieferung
(wie ein Mini-Projekt) und wird als Akkordeon dargestellt.

```json
{
  "id": "A",
  "name": "Digital Operating Platform",
  "state": "completed",            // completed | in-progress | planned  → Fortschritts-Badge
  "objective": "…",
  "activities": ["…"],
  "outcomes":   ["…"],
  "evidence":   "…",
  "artifacts":  [ /* gleiches Artefakt-Schema wie Projekte, optional */ ]
}
```

Aus `state` berechnet die Engine den Wert „Workstreams abgeschlossen" (Karte + Dashboard).

### `figures` — Mandats-Kennzahlen

Jeder Wert > 0 wird angezeigt; `0`/fehlend wird ausgeblendet.

```json
"figures": {
  "systemsIntroduced": 5, "apisIntegrated": 6, "automations": 8,
  "processesBuilt": 15, "employeesAffected": 30, "newLeadershipRoles": 4,
  "trainings": 20, "dataSources": 5, "workstreams": 5
}
```

## Abgeleitete Werte (Engine, nie eingeben)

- **Workstreams abgeschlossen** — Anteil `state === "completed"`.
- **Reife (Ø)** — Durchschnitt aller `maturity.current`.
- **Evidenz** — Anteil hochgeladener (nicht `pending`) Artefakte über Mandat + Workstreams.

## Verhältnis zu Projekten

Mandate und Projekte sind **getrennte Sektionen** (Tier-getrennt: eigene Register, eigene Arrays).
Verknüpfung läuft über `relatedProjects` (Mandat → Projekt). Aggregat-Dashboards der Projekte
bleiben unberührt.
