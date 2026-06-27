# Task 2 Brief: Add activeTab State + BottomNav Component + Wire App Render

## Context
Task 1 replaced the C/FONTS constants with purple theme + Poppins.
Task 2 restructures the App component to use tab-based navigation.
This file is a single JSX file: `c:\Users\lfaustino\Downloads\controle-parcelas.jsx`

After this task: bottom navigation bar is visible, FAB button works, tab switching works (content areas show placeholder "em breve" until Tasks 3–6 replace them).

---

## Change 1: Replace `showReport` state with `activeTab` state (line 78)

**Find** (exact):
```js
  const [expenseModal, setExpenseModal] = useState(null); // null | {} | expense
  const [showReport, setShowReport] = useState(false);
```

**Replace with**:
```js
  const [expenseModal, setExpenseModal] = useState(null); // null | {} | expense
  const [activeTab, setActiveTab] = useState("home");
```

---

## Change 2: Replace the entire App `return` block (lines 192–337)

The current return starts with:
```jsx
  /* ------------------------------ render ---------------------------- */
  return (
    <div style={s.root} className="cp-root">
      <style>{css}</style>

      {/* header */}
      <header style={s.header} className="cp-header">
```

And ends with:
```jsx
      {showReport && (
        <ReportModal
          expenses={expenses}
          cards={cards}
          cardById={cardById}
          enrich={enrich}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
```

**Replace the entire `return (...)` block** (from `/* ------------------------------ render */` up to and including the closing `}` of the `App` function) with:

```jsx
  /* ------------------------------ render ---------------------------- */
  return (
    <div style={s.root} className="cp-root">
      <style>{css}</style>

      {activeTab === "home" && (
        <HomeView
          cards={cards}
          expenses={expenses}
          enrich={enrich}
          totals={totals}
          cardTotals={cardTotals}
          cardById={cardById}
        />
      )}
      {activeTab === "cards" && (
        <CardsView
          cards={cards}
          cardTotals={cardTotals}
          onAdd={() => setShowCardForm(true)}
          onDelete={deleteCard}
        />
      )}
      {activeTab === "expenses" && (
        <ExpensesView
          expenses={expenses}
          cards={cards}
          enrich={enrich}
          cardById={cardById}
          filterCard={filterCard}
          setFilterCard={setFilterCard}
          onEdit={(e) => setExpenseModal(e)}
          onDelete={deleteExpense}
          setPaid={setPaid}
        />
      )}
      {activeTab === "report" && (
        <ReportView
          expenses={expenses}
          cards={cards}
          cardById={cardById}
          enrich={enrich}
        />
      )}

      <BottomNav
        active={activeTab}
        onChange={setActiveTab}
        onFAB={() => cards.length ? setExpenseModal({}) : setShowCardForm(true)}
      />

      {showCardForm && (
        <CardForm onSave={addCard} onClose={() => setShowCardForm(false)} />
      )}
      {expenseModal && (
        <ExpenseForm
          initial={expenseModal}
          cards={cards}
          defaultCard={filterCard !== "all" ? filterCard : cards[0]?.id}
          onSave={saveExpense}
          onClose={() => setExpenseModal(null)}
        />
      )}
    </div>
  );
}
```

---

## Change 3: Add view stubs + BottomNav component after the closing `}` of App

Find the line:
```
}

/* --------------------------- subcomponents ------------------------- */
```

Insert the following block between the closing `}` of App and the `/* subcomponents */` comment:

```jsx
/* ---------------------- view stubs (replaced by Tasks 3-6) -------- */
function HomeView({ cards, expenses, enrich, totals, cardTotals, cardById }) {
  return <div style={{ padding: "24px 20px", color: C.muted }}>Início — em breve</div>;
}
function CardsView({ cards, cardTotals, onAdd, onDelete }) {
  return <div style={{ padding: "24px 20px", color: C.muted }}>Cartões — em breve</div>;
}
function ExpensesView({ expenses, cards, enrich, cardById, filterCard, setFilterCard, onEdit, onDelete, setPaid }) {
  return <div style={{ padding: "24px 20px", color: C.muted }}>Compras — em breve</div>;
}
function ReportView({ expenses, cards, cardById, enrich }) {
  return <div style={{ padding: "24px 20px", color: C.muted }}>Relatório — em breve</div>;
}

/* ---------------------- bottom navigation ------------------------- */
function BottomNav({ active, onChange, onFAB }) {
  const items = [
    { id: "home", label: "Início", icon: "🏠" },
    { id: "cards", label: "Cartões", icon: "💳" },
    { id: "expenses", label: "Compras", icon: "🛒" },
    { id: "report", label: "Relatório", icon: "📊" },
  ];
  const left = items.slice(0, 2);
  const right = items.slice(2);

  return (
    <nav style={s.bottomNav}>
      <div style={s.bottomNavInner}>
        {left.map((item) => (
          <button
            type="button"
            key={item.id}
            style={{ ...s.navBtn, ...(active === item.id ? s.navBtnActive : {}) }}
            onClick={() => onChange(item.id)}
          >
            <span style={s.navIcon}>{item.icon}</span>
            <span style={s.navLabel}>{item.label}</span>
          </button>
        ))}

        <div style={s.fabWrap}>
          <button type="button" style={s.fab} onClick={onFAB} title="Nova compra">
            <span style={{ fontSize: 28, lineHeight: 1, color: "#fff", marginTop: -2 }}>+</span>
          </button>
        </div>

        {right.map((item) => (
          <button
            type="button"
            key={item.id}
            style={{ ...s.navBtn, ...(active === item.id ? s.navBtnActive : {}) }}
            onClick={() => onChange(item.id)}
          >
            <span style={s.navIcon}>{item.icon}</span>
            <span style={s.navLabel}>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
```

---

## Change 4: Update `s.root` in the styles object

**Find** (exact):
```js
  root: {
    fontFamily: FONTS.body,
    background: C.bg,
    color: C.ink,
    minHeight: "100vh",
    padding: "28px clamp(16px, 4vw, 48px) 60px",
    maxWidth: 1040,
    margin: "0 auto",
  },
```

**Replace with**:
```js
  root: {
    fontFamily: FONTS.body,
    background: C.bg,
    color: C.ink,
    minHeight: "100vh",
    maxWidth: 680,
    margin: "0 auto",
    paddingBottom: 80,
  },
```

---

## Change 5: Add bottom nav styles at end of `s` object

Find the last entry of the `s` object:
```js
  repMono: { fontFamily: FONTS.mono, fontSize: 12 },
};
```

Replace with:
```js
  repMono: { fontFamily: FONTS.mono, fontSize: 12 },

  /* bottom nav */
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: C.surface,
    borderTop: `1px solid ${C.line}`,
    boxShadow: "0 -4px 20px rgba(124,58,237,0.08)",
    zIndex: 100,
    height: 64,
  },
  bottomNavInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    maxWidth: 680,
    margin: "0 auto",
    height: "100%",
    padding: "0 8px",
  },
  navBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: "6px 4px",
    borderRadius: 12,
    color: C.muted,
    minWidth: 0,
  },
  navBtnActive: { color: C.primary },
  navIcon: { fontSize: 18, lineHeight: 1 },
  navLabel: { fontSize: 10, fontWeight: 600, fontFamily: FONTS.body, letterSpacing: 0.2 },
  fabWrap: {
    flex: "0 0 auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: 64,
    marginTop: -28,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
    border: "none",
    boxShadow: "0 4px 16px rgba(124,58,237,0.45)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
```

---

## After all 5 changes: sync and commit

```powershell
Copy-Item "c:\Users\lfaustino\Downloads\controle-parcelas.jsx" "C:\Users\LFAUST~1\AppData\Local\Temp\claude\c--Users-lfaustino-Gestao-de-pagamentos-Gestao-de-Pagamentos\f5d417d4-4de6-4a18-861f-7750c82c7e41\scratchpad\preview-app\src\App.jsx" -Force
```

```bash
git -C "c:/Users/lfaustino/Gestao de pagamentos/Gestao_de_Pagamentos" add -A
git -C "c:/Users/lfaustino/Gestao de pagamentos/Gestao_de_Pagamentos" commit -m "feat: add bottom navigation, tab routing, view stubs"
```

---

## Expected result in browser (http://localhost:5199)
- Bottom navigation bar fixed at bottom with 🏠 Início | 💳 Cartões | ⊕ FAB | 🛒 Compras | 📊 Relatório
- FAB is a purple circle elevated above the nav bar
- Clicking nav items switches the visible tab content (shows "em breve" text for now)
- FAB opens the "Nova compra" modal
- App background is now #F0EEF8 (light purple)

---

## Report
Write your report to: `c:\Users\lfaustino\Gestao de pagamentos\Gestao_de_Pagamentos\.superpowers\sdd\task-2-report.md`

Report must include:
- Status: DONE | BLOCKED | NEEDS_CONTEXT
- Commit hash (first 7 chars)
- Confirmation that all 5 changes were applied
- Any concerns
