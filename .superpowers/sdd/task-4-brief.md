# Task 4 Brief: Add CardsView Component

## Context
Tasks 1–3 complete. File has purple theme, BottomNav, HomeView with donut chart.
Task 4 replaces the CardsView stub with the full implementation + adds its styles to `s`.

File to edit: `c:\Users\lfaustino\Downloads\controle-parcelas.jsx`

---

## Change 1: Replace the CardsView stub

Find (exact):
```jsx
function CardsView({ cards, cardTotals, onAdd, onDelete }) {
  return <div style={{ padding: "24px 20px", color: C.muted }}>Cartões — em breve</div>;
}
```

Replace with:
```jsx
function CardsView({ cards, cardTotals, onAdd, onDelete }) {
  return (
    <div>
      <div style={s.viewHeader}>
        <h1 style={s.viewTitle}>Meus Cartões</h1>
        <button type="button" style={s.headerGhostBtn} onClick={onAdd}>
          + Novo
        </button>
      </div>
      <div style={s.viewBody}>
        {cards.length === 0 ? (
          <Empty
            text="Nenhum cartão ainda. Cadastre o primeiro para começar."
            cta="Cadastrar cartão"
            onClick={onAdd}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cards.map((card) => {
              const monthly = cardTotals[card.id] || 0;
              return (
                <div key={card.id} style={s.cardVisual}>
                  <div style={{ ...s.cardVisualStripe, background: card.color }} />
                  <div style={s.cardVisualBody}>
                    <div style={s.cardVisualTop}>
                      <div>
                        <div style={s.cardVisualName}>{card.name}</div>
                        {card.digits && (
                          <div style={s.cardVisualDigits}>•••• {card.digits}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        style={s.cardDeleteBtn}
                        onClick={() => onDelete(card.id)}
                        title="Excluir cartão"
                      >
                        ×
                      </button>
                    </div>
                    <div style={s.cardVisualAmt}>
                      <span style={{ ...s.cardVisualMonthly, color: card.color }}>{brl(monthly)}</span>
                      <span style={s.cardVisualMonthlyLabel}>/mês</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Change 2: Add CardsView styles to `s`

Find the last line of the HomeView styles block in `s`:
```js
  recentAmt: { fontSize: 13, fontWeight: 700, color: C.primary, whiteSpace: "nowrap" },
};
```

Replace with:
```js
  recentAmt: { fontSize: 13, fontWeight: 700, color: C.primary, whiteSpace: "nowrap" },

  /* shared view layout */
  viewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "24px 20px 12px",
  },
  viewTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: C.ink,
    letterSpacing: "-0.01em",
  },
  viewBody: { padding: "8px 16px 0" },
  headerGhostBtn: {
    background: "transparent",
    color: C.primary,
    border: `1.5px solid ${C.primary}`,
    borderRadius: 20,
    padding: "7px 16px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: FONTS.body,
  },

  /* cards view */
  cardVisual: {
    background: C.surface,
    borderRadius: 16,
    overflow: "hidden",
    display: "flex",
    boxShadow: "0 2px 12px rgba(124,58,237,0.07)",
  },
  cardVisualStripe: { width: 6, flex: "0 0 auto" },
  cardVisualBody: { flex: 1, padding: "16px 16px" },
  cardVisualTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardVisualName: { fontFamily: FONTS.display, fontSize: 17, fontWeight: 700, color: C.ink },
  cardVisualDigits: { fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 2 },
  cardDeleteBtn: {
    width: 28, height: 28, borderRadius: "50%",
    border: `1px solid ${C.line}`, background: C.surface,
    color: C.muted, cursor: "pointer", fontSize: 16, lineHeight: 1,
  },
  cardVisualAmt: { display: "flex", alignItems: "baseline", gap: 3 },
  cardVisualMonthly: { fontFamily: FONTS.display, fontSize: 22, fontWeight: 700 },
  cardVisualMonthlyLabel: { fontSize: 12, color: C.muted, fontWeight: 500 },
};
```

---

## After changes: sync and commit

```powershell
Copy-Item "c:\Users\lfaustino\Downloads\controle-parcelas.jsx" "C:\Users\LFAUST~1\AppData\Local\Temp\claude\c--Users-lfaustino-Gestao-de-pagamentos-Gestao-de-Pagamentos\f5d417d4-4de6-4a18-861f-7750c82c7e41\scratchpad\preview-app\src\App.jsx" -Force
```

```bash
git -C "c:/Users/lfaustino/Gestao de pagamentos/Gestao_de_Pagamentos" add -A
git -C "c:/Users/lfaustino/Gestao de pagamentos/Gestao_de_Pagamentos" commit -m "feat: add CardsView with visual card list"
```

---

## Report
Write to: `c:\Users\lfaustino\Gestao de pagamentos\Gestao_de_Pagamentos\.superpowers\sdd\task-4-report.md`
Include: Status, commit hash, both changes confirmed, concerns.
