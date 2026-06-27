# Task 5 Brief: Add ExpensesView Component

## Context
Tasks 1–4 complete. File has bottom nav, HomeView, CardsView.
Task 5 replaces the ExpensesView stub with the full implementation + adds its styles.

File to edit: `c:\Users\lfaustino\Downloads\controle-parcelas.jsx`

IMPORTANT: `ExpensesView` uses `useState` and `useMemo` — these are available because React is imported at the top of the file as:
`import React, { useState, useEffect, useMemo, useCallback } from "react";`
All hooks are available in scope for any function in the file.

---

## Change 1: Replace the ExpensesView stub

Find (exact):
```jsx
function ExpensesView({ expenses, cards, enrich, cardById, filterCard, setFilterCard, onEdit, onDelete, setPaid }) {
  return <div style={{ padding: "24px 20px", color: C.muted }}>Compras — em breve</div>;
}
```

Replace with:
```jsx
function ExpensesView({ expenses, cards, enrich, cardById, filterCard, setFilterCard, onEdit, onDelete, setPaid }) {
  const [statusFilter, setStatusFilter] = useState("active");

  const visible = useMemo(() => {
    let list = expenses.map(enrich);
    if (filterCard !== "all") list = list.filter((e) => e.cardId === filterCard);
    if (statusFilter === "active") list = list.filter((e) => !e.done);
    if (statusFilter === "done") list = list.filter((e) => e.done);
    return list.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (b.date || "").localeCompare(a.date || "");
    });
  }, [expenses, filterCard, statusFilter, enrich]);

  return (
    <div>
      <div style={s.viewHeader}>
        <h1 style={s.viewTitle}>Compras</h1>
      </div>
      <div style={s.viewBody}>
        {/* card filter chips */}
        {cards.length > 0 && (
          <div style={s.filterChipsRow}>
            <button
              type="button"
              style={{ ...s.filterChip, ...(filterCard === "all" ? s.filterChipActive : {}) }}
              onClick={() => setFilterCard("all")}
            >
              Todos
            </button>
            {cards.map((c) => (
              <button
                type="button"
                key={c.id}
                style={{
                  ...s.filterChip,
                  ...(filterCard === c.id ? { background: c.color, color: "#fff", borderColor: c.color } : {}),
                }}
                onClick={() => setFilterCard(filterCard === c.id ? "all" : c.id)}
              >
                <span style={{ ...s.filterChipDot, background: filterCard === c.id ? "rgba(255,255,255,.7)" : c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* status toggle */}
        <div style={s.statusToggle}>
          {[["active","Ativos"],["all","Todos"],["done","Quitados"]].map(([v, l]) => (
            <button
              type="button"
              key={v}
              style={{ ...s.statusBtn, ...(statusFilter === v ? s.statusBtnOn : {}) }}
              onClick={() => setStatusFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>

        {/* list */}
        {visible.length === 0 ? (
          <Empty
            text={expenses.length === 0 ? "Lance uma compra parcelada para começar." : "Nenhuma compra para este filtro."}
            cta={null}
            onClick={null}
          />
        ) : (
          <div style={s.list}>
            {visible.map((e) => (
              <ExpenseRow
                key={e.id}
                e={e}
                card={cardById[e.cardId]}
                onPay={() => setPaid(e.id, e.paidInstallments + 1)}
                onUnpay={() => setPaid(e.id, e.paidInstallments - 1)}
                onEdit={() => onEdit(e)}
                onDelete={() => onDelete(e.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Change 2: Add ExpensesView styles to `s`

Find the last line of the CardsView styles block:
```js
  cardVisualMonthlyLabel: { fontSize: 12, color: C.muted, fontWeight: 500 },
};
```

Replace with:
```js
  cardVisualMonthlyLabel: { fontSize: 12, color: C.muted, fontWeight: 500 },

  /* expenses view */
  filterChipsRow: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
    marginBottom: 12,
  },
  filterChip: {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: `1.5px solid ${C.line}`,
    borderRadius: 20,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 600,
    background: C.surface,
    color: C.inkSoft,
    cursor: "pointer",
    fontFamily: FONTS.body,
    whiteSpace: "nowrap",
  },
  filterChipActive: { background: C.primary, color: "#fff", borderColor: C.primary },
  filterChipDot: { width: 8, height: 8, borderRadius: "50%", flex: "0 0 auto" },
  statusToggle: {
    display: "flex",
    background: C.surfaceAlt,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    gap: 2,
  },
  statusBtn: {
    flex: 1,
    border: "none",
    background: "transparent",
    borderRadius: 10,
    padding: "8px 6px",
    fontSize: 13,
    fontWeight: 600,
    color: C.muted,
    cursor: "pointer",
    fontFamily: FONTS.body,
  },
  statusBtnOn: { background: C.surface, color: C.ink, boxShadow: "0 1px 4px rgba(0,0,0,.08)" },
};
```

---

## After changes: sync and commit

```powershell
Copy-Item "c:\Users\lfaustino\Downloads\controle-parcelas.jsx" "C:\Users\LFAUST~1\AppData\Local\Temp\claude\c--Users-lfaustino-Gestao-de-pagamentos-Gestao-de-Pagamentos\f5d417d4-4de6-4a18-861f-7750c82c7e41\scratchpad\preview-app\src\App.jsx" -Force
```

```bash
git -C "c:/Users/lfaustino/Gestao de pagamentos/Gestao_de_Pagamentos" add -A
git -C "c:/Users/lfaustino/Gestao de pagamentos/Gestao_de_Pagamentos" commit -m "feat: add ExpensesView with card filter chips and status toggle"
```

---

## Report
Write to: `c:\Users\lfaustino\Gestao de pagamentos\Gestao_de_Pagamentos\.superpowers\sdd\task-5-report.md`
Include: Status, commit hash, both changes confirmed, concerns.
