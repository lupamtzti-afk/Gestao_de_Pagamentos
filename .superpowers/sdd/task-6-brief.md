# Task 6 Brief: Add ReportView Component (replaces ReportModal)

## Context
Tasks 1–5 complete. File has bottom nav, HomeView, CardsView, ExpensesView.
Task 6 replaces the ReportView stub with the full page implementation AND removes the old ReportModal function.

File to edit: `c:\Users\lfaustino\Downloads\controle-parcelas.jsx`

IMPORTANT: `ReportView` uses `useState` and `useMemo` from the React import at the top of the file. All hooks are available in scope.

---

## Change 1: Replace the ReportView stub

Find (exact):
```jsx
function ReportView({ expenses, cards, cardById, enrich }) {
  return <div style={{ padding: "24px 20px", color: C.muted }}>Relatório — em breve</div>;
}
```

Replace with:
```jsx
function ReportView({ expenses, cards, cardById, enrich }) {
  const [selCards, setSelCards] = useState([]);
  const [selMonths, setSelMonths] = useState([]);
  const [selStatus, setSelStatus] = useState("all");

  const availableMonths = useMemo(() => {
    const set = new Set(expenses.map((e) => e.date?.slice(0, 7)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const filtered = useMemo(() => {
    let list = expenses.map(enrich);
    if (selCards.length) list = list.filter((e) => selCards.includes(e.cardId));
    if (selMonths.length) list = list.filter((e) => selMonths.some((m) => e.date?.startsWith(m)));
    if (selStatus === "active") list = list.filter((e) => !e.done);
    if (selStatus === "done") list = list.filter((e) => e.done);
    return list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [expenses, selCards, selMonths, selStatus, enrich]);

  const summary = useMemo(() => ({
    total: filtered.reduce((s, e) => s + e.total, 0),
    monthly: filtered.filter((e) => !e.done).reduce((s, e) => s + e.monthly, 0),
    remaining: filtered.filter((e) => !e.done).reduce((s, e) => s + e.remaining, 0),
    activeCount: filtered.filter((e) => !e.done).length,
  }), [filtered]);

  const fmtMonth = (ym) => {
    const [y, m] = ym.split("-");
    return `${MONTHS_PT[+m - 1]}/${y.slice(2)}`;
  };

  const toggleCard = (id) =>
    setSelCards((p) => (p.includes(id) ? p.filter((c) => c !== id) : [...p, id]));
  const toggleMonth = (m) =>
    setSelMonths((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  return (
    <div>
      <div style={s.viewHeader}>
        <h1 style={s.viewTitle}>Relatório</h1>
        <button type="button" style={s.headerGhostBtn} onClick={() => window.print()}>
          ⬇ PDF
        </button>
      </div>
      <div style={s.viewBody}>

        {/* Filtro Cartão */}
        <div style={s.repSection}>
          <div style={s.repSectionLabel}>Cartão</div>
          <div style={s.filterChipsRow}>
            {cards.map((c) => {
              const on = selCards.includes(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  style={{
                    ...s.filterChip,
                    ...(on ? { background: c.color, color: "#fff", borderColor: c.color } : {}),
                  }}
                  onClick={() => toggleCard(c.id)}
                >
                  <span style={{ ...s.filterChipDot, background: on ? "rgba(255,255,255,.7)" : c.color }} />
                  {c.name}
                </button>
              );
            })}
            {selCards.length > 0 && (
              <button type="button" style={s.repClear} onClick={() => setSelCards([])}>
                × limpar
              </button>
            )}
          </div>
        </div>

        {/* Filtro Mês */}
        {availableMonths.length > 0 && (
          <div style={s.repSection}>
            <div style={s.repSectionLabel}>Mês de compra</div>
            <div style={s.filterChipsRow}>
              {availableMonths.map((m) => {
                const on = selMonths.includes(m);
                return (
                  <button
                    type="button"
                    key={m}
                    style={{ ...s.filterChip, ...(on ? { background: C.primary, color: "#fff", borderColor: C.primary } : {}) }}
                    onClick={() => toggleMonth(m)}
                  >
                    {fmtMonth(m)}
                  </button>
                );
              })}
              {selMonths.length > 0 && (
                <button type="button" style={s.repClear} onClick={() => setSelMonths([])}>
                  × limpar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filtro Status */}
        <div style={{ ...s.statusToggle, marginBottom: 16 }}>
          {[["all","Todos"],["active","Ativos"],["done","Quitados"]].map(([v, l]) => (
            <button
              type="button"
              key={v}
              style={{ ...s.statusBtn, ...(selStatus === v ? s.statusBtnOn : {}) }}
              onClick={() => setSelStatus(v)}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Resumo */}
        <div style={s.repSummary}>
          {[
            ["compras", filtered.length, C.ink, false],
            ["ativas", summary.activeCount, C.primary, false],
            ["total gasto", summary.total, C.ink, true],
            ["parc./mês", summary.monthly, C.primary, true],
            ["a pagar", summary.remaining, C.green, true],
          ].map(([lbl, val, color, isBrl], i, arr) => (
            <React.Fragment key={lbl}>
              <div style={s.repSumCell}>
                <span style={s.repSumLabel}>{lbl}</span>
                <span style={{ ...s.repSumVal, color }}>
                  {isBrl ? brl(val) : val}
                </span>
              </div>
              {i < arr.length - 1 && <div style={s.homeStatDiv} />}
            </React.Fragment>
          ))}
        </div>

        {/* Tabela */}
        {filtered.length === 0 ? (
          <p style={{ color: C.muted, textAlign: "center", padding: "16px 0", margin: 0, fontSize: 14 }}>
            Nenhuma compra para os filtros selecionados.
          </p>
        ) : (
          <div style={s.repTableWrap}>
            <table style={s.repTable}>
              <thead>
                <tr>
                  {["Fornecedor","Cartão","Data","Total","Parc./mês","Pagas","A pagar","Status"].map((h) => (
                    <th key={h} style={s.repTh}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const card = cardById[e.cardId];
                  return (
                    <tr key={e.id} style={{ opacity: e.done ? 0.65 : 1 }}>
                      <td style={s.repTd}>{e.supplier}</td>
                      <td style={s.repTd}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ ...s.filterChipDot, background: card?.color || C.muted }} />
                          {card?.name || "—"}
                        </span>
                      </td>
                      <td style={{ ...s.repTd, ...s.repMono }}>{formatDate(e.date)}</td>
                      <td style={{ ...s.repTd, ...s.repMono, textAlign: "right" }}>{brl(e.total)}</td>
                      <td style={{ ...s.repTd, ...s.repMono, textAlign: "right" }}>{brl(e.monthly)}</td>
                      <td style={{ ...s.repTd, ...s.repMono, textAlign: "center" }}>
                        {e.paidInstallments}/{e.totalInstallments}
                      </td>
                      <td style={{ ...s.repTd, ...s.repMono, textAlign: "right", color: e.done ? C.muted : C.primary }}>
                        {e.done ? "—" : brl(e.remaining)}
                      </td>
                      <td style={s.repTd}>
                        <span style={{
                          ...s.doneTag,
                          color: e.done ? C.green : C.primary,
                          background: e.done ? "#D1FAE5" : "#EDE9FE",
                          border: `1px solid ${e.done ? "#A7F3D0" : "#C4B5FD"}`,
                        }}>
                          {e.done ? "quitado" : "ativo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Change 2: Remove the old ReportModal function

Find and delete the entire `ReportModal` function. It starts with:
```jsx
function ReportModal({ expenses, cards, cardById, enrich, onClose }) {
```
And ends with its closing `}` followed by the helpers section comment:
```jsx
/* ------------------------------ helpers --------------------------- */
```

Delete everything from `function ReportModal(` up to (but not including) `/* ------------------------------ helpers */`.

---

## Change 3: Add ReportView styles to `s`

Find the last entry in the `s` object:
```js
  statusBtnOn: { background: C.surface, color: C.ink, boxShadow: "0 1px 4px rgba(0,0,0,.08)" },
};
```

Replace with:
```js
  statusBtnOn: { background: C.surface, color: C.ink, boxShadow: "0 1px 4px rgba(0,0,0,.08)" },

  /* report view */
  repSection: { marginBottom: 14 },
  repSectionLabel: { fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  repSummary: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    background: C.surface,
    borderRadius: 14,
    padding: "14px 16px",
    marginBottom: 14,
    boxShadow: "0 2px 8px rgba(124,58,237,0.06)",
  },
  repSumCell: { flex: 1, minWidth: 80, display: "flex", flexDirection: "column", gap: 3 },
  repSumLabel: { fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  repSumVal: { fontSize: 15, fontWeight: 700, fontFamily: FONTS.display },
  repClear: {
    border: "none", background: "transparent",
    color: C.muted, fontSize: 12, cursor: "pointer",
    fontFamily: FONTS.body, padding: "4px 6px", flex: "0 0 auto",
  },
};
```

NOTE: `repTableWrap`, `repTable`, `repTh`, `repTd`, `repMono` are already in the `s` object from the original file — do NOT add them again.

---

## After changes: sync and commit

```powershell
Copy-Item "c:\Users\lfaustino\Downloads\controle-parcelas.jsx" "C:\Users\LFAUST~1\AppData\Local\Temp\claude\c--Users-lfaustino-Gestao-de-pagamentos-Gestao-de-Pagamentos\f5d417d4-4de6-4a18-861f-7750c82c7e41\scratchpad\preview-app\src\App.jsx" -Force
```

```bash
git -C "c:/Users/lfaustino/Gestao de pagamentos/Gestao_de_Pagamentos" add -A
git -C "c:/Users/lfaustino/Gestao de pagamentos/Gestao_de_Pagamentos" commit -m "feat: add ReportView full-page, remove ReportModal"
```

---

## Report
Write to: `c:\Users\lfaustino\Gestao de pagamentos\Gestao_de_Pagamentos\.superpowers\sdd\task-6-report.md`
Include: Status, commit hash, all 3 changes confirmed, concerns.
