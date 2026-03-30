# Mnemosyne Naming Convention

## Scope
This convention applies to the `Mnemosyne.WPF` solution.

## Core Rules

- Backend C# model and DTO property names use `PascalCase`.
- Frontend JavaScript identifiers and JSON fields use `camelCase`.
- Do not use `snake_case` in newly added API payloads, responses, or frontend state fields.

## Mapping Rule

- C# `PascalCase` properties are serialized to JSON `camelCase`.
- JS code must consume/produce `camelCase` JSON fields only.

## Examples

- C# model: `ServerTime`, `DisplayYear`, `HistoricalTotal`
- JSON: `serverTime`, `displayYear`, `historicalTotal`
- JS state: `kpi.serverTime.displayYear`

## Current API Shape Guidance

- Response envelope: `id`, `action`, `data`, `error`
- Expense list: `total`, `page`, `pageSize`, `totalPages`, `data`
- Expense item: `id`, `expenseDate`, `platform`, `amount`, `itemName`, `tags`, `tagsList`
- KPI root: `serverTime`, `historicalTotal`, `thisMonth`, `lastMonthTotal`, `thisYear`, `lastYearTotal`, `momRate`, `fireflyTotal`, `fireflyPercent`

## Migration Notes

- Keep API action names unchanged for now (handled in a later step).
- During transition, avoid introducing mixed naming in new code.
