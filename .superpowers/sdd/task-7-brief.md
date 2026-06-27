# Task 7 Brief: Update Remaining Styles + Cleanup

## Context
Tasks 1–6 complete. The app has all 4 views working with bottom navigation.
Task 7 makes the final style polish: purple buttons, updated CSS, remove dead styles from the old layout.

File to edit: `c:\Users\lfaustino\Downloads\controle-parcelas.jsx`

---

## Change 1: Replace the `css` string (lines 1230–1250)

Find (exact):
```js
const css = `
  * { box-sizing: border-box; }
  .cp-root input, .cp-root select, .cp-root button { font-family: inherit; }
  input:focus, select:focus { border-color: ${C.primary} !important; }
  button { transition: transform .08s ease, opacity .15s ease, background .15s ease; }
  button:active:not(:disabled) { transform: translateY(1px); }
  @media (max-width: 640px) {
    .cp-header { flex-direction: column; align-items: flex-start; gap: 14px; }
    .cp-strip { grid-template-columns: 1fr !important; }
    .cp-row { flex-direction: column; }
    .cp-rowside { width: 100%; align-items: stretch !important; border-left: none !important; border-top: 1px solid ${C.line}; padding: 14px 0 0 0 !important; margin-top: 14px; }
  }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
  @media print {
    body > *:not(.cp-root) { display: none !important; }
    .cp-root > *:not([data-print]) { display: none !important; }
    [data-print] { display: block !important; }
    [data-print] button { display: none !important; }
    [data-print-hide] { display: none !important; }
  }
`;
```

Replace with:
```js
const css = `
  * { box-sizing: border-box; }
  body { background: ${C.bg}; }
  .cp-root input, .cp-root select, .cp-root button { font-family: inherit; }
  input:focus, select:focus { border-color: ${C.primary} !important; outline: none; }
  button { transition: transform .08s ease, opacity .15s ease, background .15s ease; }
  button:active:not(:disabled) { transform: translateY(1px); }
  ::-webkit-scrollbar { height: 4px; width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 4px; }
  @media (max-width: 480px) {
    .cp-row { flex-direction: column; }
    .cp-rowside { width: 100%; align-items: stretch !important; border-left: none !important; border-top: 1px solid ${C.line}; padding: 14px 0 0 0 !important; margin-top: 14px; }
  }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
  @media print {
    .cp-root nav { display: none !important; }
  }
`;
```

---

## Change 2: Update `primaryBtn` (background: C.ink → C.primary)

Find:
```js
  primaryBtn: {
    background: C.ink,
    color: "#fff",
    border: "none",
    borderRadius: 11,
    padding: "11px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONTS.body,
  },
```

Replace with:
```js
  primaryBtn: {
    background: C.primary,
    color: "#fff",
    border: "none",
    borderRadius: 11,
    padding: "11px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONTS.body,
  },
```

---

## Change 3: Update `ghostBtn` (muted → purple)

Find:
```js
  ghostBtn: {
    background: "transparent",
    color: C.inkSoft,
    border: `1px solid ${C.line}`,
    borderRadius: 11,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONTS.body,
  },
```

Replace with:
```js
  ghostBtn: {
    background: "transparent",
    color: C.primary,
    border: `1.5px solid ${C.primary}`,
    borderRadius: 11,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONTS.body,
  },
```

---

## Change 4: Update `doneTag` (mono → body font, purple badge)

Find:
```js
  doneTag: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    background: C.surfaceAlt,
    color: C.primary,
    border: `1px solid ${C.line}`,
    borderRadius: 20,
    padding: "2px 8px",
  },
```

Replace with:
```js
  doneTag: {
    fontFamily: FONTS.body,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    background: "#EDE9FE",
    color: C.primary,
    border: `1px solid #C4B5FD`,
    borderRadius: 20,
    padding: "2px 8px",
  },
```

---

## Change 5: Update `overlay` background tint

Find:
```js
    background: "rgba(22,35,29,0.45)",
```

Replace with:
```js
    background: "rgba(26,18,51,0.5)",
```

---

## Change 6: Remove dead styles from `s` (old layout no longer used)

Remove each of the following style entries from the `s` object. Each entry starts with the key name. Remove the entire key+value block including its trailing comma.

Keys to remove (they belong to the old header/strip/cards layout — none of these are referenced in any current component):
- `header` (old flex header)
- `kicker` (old "controle de parcelas" label)
- `title` (old h1)
- `headerNumbers`
- `bigStat`
- `bigStatLabel`
- `bigStatValue`
- `strip` (old 3-column stat strip)
- `statCell`
- `statLabel`
- `statValue`
- `section`
- `sectionHead`
- `h2`
- `cardRow`
- `chip`
- `chipDot`
- `chipName`
- `chipSub`
- `chipMoney`
- `chipX`
- `footer`
- `repChip` (old ReportModal chip, replaced by filterChip in ReportView)
- `repStat` (old ReportModal stat cell, replaced by repSumCell)

KEEP ALL OTHER STYLES. In particular, keep: `list`, `row`, `rowMain`, `rowTop`, `rowDot`, `supplier`, `doneTag`, `rowMeta`, `metaCard`, `metaSep`, `pips`, `pip`, `barWrap`, `barTrack`, `barFill`, `progressText`, `progressMuted`, `remainingChip`, `rowSide`, `rowTotal`, `totalLabel`, `totalValue`, `rowBtns`, `payBtn`, `iconBtn`, `primaryBtn`, `ghostBtn`, `empty`, `emptyText`, `overlay`, `modal`, `modalHead`, `modalTitle`, `modalX`, `formBody`, `formFoot`, `field`, `fieldLabel`, `fieldHint`, `input`, `grid2`, `swatches`, `swatch`, `modeRow`, `modeBtn`, `modeBtnOn`, `preview`, `previewLabel`, `previewBig`, `previewVal`, `previewDiv`, `repTableWrap`, `repTable`, `repTh`, `repTd`, `repMono`.

---

## Change 7: Fix duplicate `repClear` — remove the OLD one

There are two `repClear` entries in `s`. The OLD one uses `FONTS.mono` and is around line 1653. The NEW one (added by Task 6) uses `FONTS.body` and is near the bottom of `s`.

Remove ONLY the old one. Find it by its content:
```js
  repClear: {
    border: "none", background: "transparent",
    color: C.muted, fontSize: 12, cursor: "pointer",
    fontFamily: FONTS.mono, padding: "4px 6px",
  },
```

Delete this entry (the one with `fontFamily: FONTS.mono`). Keep the newer one with `fontFamily: FONTS.body`.

---

## After all changes: sync and commit

```powershell
Copy-Item "c:\Users\lfaustino\Downloads\controle-parcelas.jsx" "C:\Users\LFAUST~1\AppData\Local\Temp\claude\c--Users-lfaustino-Gestao-de-pagamentos-Gestao-de-Pagamentos\f5d417d4-4de6-4a18-861f-7750c82c7e41\scratchpad\preview-app\src\App.jsx" -Force
```

```bash
git -C "c:/Users/lfaustino/Gestao de pagamentos/Gestao_de_Pagamentos" add -A
git -C "c:/Users/lfaustino/Gestao de pagamentos/Gestao_de_Pagamentos" commit -m "refactor: purple buttons, updated CSS, remove dead old-layout styles"
```

---

## Report
Write to: `c:\Users\lfaustino\Gestao de pagamentos\Gestao_de_Pagamentos\.superpowers\sdd\task-7-report.md`
Include: Status, commit hash, all 7 changes confirmed, concerns.
