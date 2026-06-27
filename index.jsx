import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Controle de Parcelas — gerenciador de gastos no cartão de crédito  */
/* ------------------------------------------------------------------ */

const C = {
  bg: "#F0EEF8",
  surface: "#FFFFFF",
  surfaceAlt: "#FAF8FF",
  ink: "#1A1233",
  inkSoft: "#3D2B6E",
  muted: "#8B83B0",
  line: "#E4DFFA",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  accent: "#10B981",
  accentSoft: "#D1FAE5",
  green: "#10B981",
  red: "#EF4444",
};

const CARD_COLORS = [
  "#0F6E5A", "#1D3557", "#7A3E9D", "#C2410C",
  "#0E7490", "#B91C1C", "#475569", "#A16207",
];

const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const FONTS = {
  display: "'Poppins', system-ui, sans-serif",
  body: "'Poppins', system-ui, sans-serif",
  mono: "'Poppins', system-ui, sans-serif",
};

const brl = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/* --------------------------- persistence -------------------------- */

const store = {
  async get(key, fallback) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        const r = await window.storage.get(key);
        return r ? JSON.parse(r.value) : fallback;
      }
    } catch (e) {
      /* key not found or no storage — use fallback */
    }
    return fallback;
  },
  async set(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value));
      }
    } catch (e) {
      /* storage unavailable — silently keep in-memory state */
    }
  },
};

/* ------------------------------ app ------------------------------- */

export default function App() {
  const [cards, setCards] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filterCard, setFilterCard] = useState("all");
  const [showCardForm, setShowCardForm] = useState(false);
  const [expenseModal, setExpenseModal] = useState(null); // null | {} | expense
  const [activeTab, setActiveTab] = useState("home");

  // inject fonts once
  useEffect(() => {
    const id = "cp-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  // load saved data
  useEffect(() => {
    (async () => {
      const [c, e] = await Promise.all([
        store.get("cp_cards", []),
        store.get("cp_expenses", []),
      ]);
      setCards(c);
      setExpenses(e);
      setLoaded(true);
    })();
  }, []);

  // persist
  useEffect(() => {
    if (loaded) store.set("cp_cards", cards);
  }, [cards, loaded]);
  useEffect(() => {
    if (loaded) store.set("cp_expenses", expenses);
  }, [expenses, loaded]);

  /* ----------------------------- actions ---------------------------- */
  const addCard = (card) => {
    setCards((prev) => [...prev, { id: uid(), ...card }]);
    setShowCardForm(false);
  };

  const deleteCard = (id) => {
    const linked = expenses.filter((e) => e.cardId === id).length;
    const msg = linked
      ? `Excluir este cartão também remove ${linked} compra(s) ligada(s) a ele. Continuar?`
      : "Excluir este cartão?";
    if (!window.confirm(msg)) return;
    setCards((prev) => prev.filter((c) => c.id !== id));
    setExpenses((prev) => prev.filter((e) => e.cardId !== id));
    if (filterCard === id) setFilterCard("all");
  };

  const saveExpense = (data) => {
    if (data.id) {
      setExpenses((prev) => prev.map((e) => (e.id === data.id ? { ...e, ...data } : e)));
    } else {
      setExpenses((prev) => [...prev, { id: uid(), ...data }]);
    }
    setExpenseModal(null);
  };

  const deleteExpense = (id) =>
    setExpenses((prev) => prev.filter((e) => e.id !== id));

  const setPaid = (id, paid) =>
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, paidInstallments: Math.max(0, Math.min(e.totalInstallments, paid)) }
          : e
      )
    );

  /* --------------------------- derived data ------------------------- */
  const cardById = useMemo(
    () => Object.fromEntries(cards.map((c) => [c.id, c])),
    [cards]
  );

  const enrich = useCallback((e) => {
    const monthly = e.total / e.totalInstallments;
    const remainingCount = e.totalInstallments - e.paidInstallments;
    const remaining = monthly * remainingCount;
    const done = remainingCount <= 0;
    return { ...e, monthly, remainingCount, remaining, done };
  }, []);

  const visible = useMemo(() => {
    let list = expenses.map(enrich);
    if (filterCard !== "all") list = list.filter((e) => e.cardId === filterCard);
    return list.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1; // active first
      return (b.date || "").localeCompare(a.date || "");
    });
  }, [expenses, filterCard, enrich]);

  const totals = useMemo(() => {
    let active = expenses.map(enrich).filter((e) => !e.done);
    if (filterCard !== "all") active = active.filter((e) => e.cardId === filterCard);
    const monthly = active.reduce((s, e) => s + e.monthly, 0);
    const remaining = active.reduce((s, e) => s + e.remaining, 0);
    return { monthly, remaining, activeCount: active.length };
  }, [expenses, enrich, filterCard]);

  const cardTotals = useMemo(() => {
    const m = {};
    expenses.map(enrich).forEach((e) => {
      if (e.done) return;
      m[e.cardId] = (m[e.cardId] || 0) + e.monthly;
    });
    return m;
  }, [expenses, enrich]);

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

/* ---------------------- view stubs (replaced by Tasks 3-6) -------- */
function DonutChart({ segments, centerLabel }) {
  const r = 54;
  const cx = 80;
  const cy = 80;
  const strokeW = 20;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((sum, x) => sum + x.value, 0);

  if (!total) {
    return (
      <svg viewBox="0 0 160 160" width={160} height={160}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth={strokeW} />
        <text x="80" y="76" textAnchor="middle" fontSize="10" fill={C.muted} fontFamily={FONTS.body}>SEM</text>
        <text x="80" y="92" textAnchor="middle" fontSize="10" fill={C.muted} fontFamily={FONTS.body}>COMPRAS</text>
      </svg>
    );
  }

  let cumulative = 0;
  const slices = segments.map((seg) => {
    const fraction = seg.value / total;
    const dash = fraction * circumference;
    const offset = -cumulative;
    cumulative += dash;
    return { ...seg, dash, offset };
  });

  return (
    <svg viewBox="0 0 160 160" width={160} height={160}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth={strokeW} />
      <g transform="rotate(-90 80 80)">
        {slices.map((slice, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={slice.color}
            strokeWidth={strokeW}
            strokeDasharray={`${slice.dash} ${circumference - slice.dash}`}
            strokeDashoffset={slice.offset}
          />
        ))}
      </g>
      <text x="80" y="76" textAnchor="middle" fontSize="10" fill={C.muted} fontFamily={FONTS.body} fontWeight="500">MENSAL</text>
      <text x="80" y="95" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.ink} fontFamily={FONTS.body}>
        {centerLabel}
      </text>
    </svg>
  );
}

function HomeView({ cards, expenses, enrich, totals, cardTotals, cardById }) {
  const now = new Date();
  const monthName = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][now.getMonth()];
  const year = now.getFullYear();

  const donutSegments = cards
    .filter((c) => cardTotals[c.id] > 0)
    .map((c) => ({ label: c.name, value: cardTotals[c.id], color: c.color }));

  const recentExpenses = expenses
    .map(enrich)
    .filter((e) => !e.done)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 5);

  return (
    <div>
      {/* purple gradient header */}
      <div style={s.homeHeader}>
        <div style={s.homeHeaderKicker}>controle de parcelas</div>
        <h1 style={s.homeHeaderTitle}>Controle de Parcelas</h1>
        <div style={s.homeHeaderSub}>{monthName} {year}</div>
      </div>

      <div style={s.homeBody}>
        {/* summary card */}
        <div style={s.homeCard}>
          <div style={s.homeBigValue}>{brl(totals.monthly)}</div>
          <div style={s.homeBigLabel}>compromisso mensal</div>
          <div style={s.homeStatRow}>
            <div style={s.homeStat}>
              <span style={s.homeStatVal}>{brl(totals.remaining)}</span>
              <span style={s.homeStatLbl}>a pagar no total</span>
            </div>
            <div style={s.homeStatDiv} />
            <div style={s.homeStat}>
              <span style={s.homeStatVal}>{totals.activeCount}</span>
              <span style={s.homeStatLbl}>compras ativas</span>
            </div>
          </div>
        </div>

        {/* chart card */}
        {cards.length > 0 && (
          <div style={s.homeCard}>
            <div style={s.homeCardTitle}>Por cartão</div>
            <div style={s.chartArea}>
              <DonutChart segments={donutSegments} centerLabel={brl(totals.monthly)} />
              <div style={s.chartLegend}>
                {cards.map((c) => {
                  const val = cardTotals[c.id] || 0;
                  const pct = totals.monthly > 0 ? Math.round((val / totals.monthly) * 100) : 0;
                  return (
                    <div key={c.id} style={s.legendRow}>
                      <span style={{ ...s.legendDot, background: c.color }} />
                      <span style={s.legendName}>{c.name}</span>
                      <span style={s.legendAmt}>{brl(val)}</span>
                      <span style={s.legendPct}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* recents card */}
        {recentExpenses.length > 0 && (
          <div style={s.homeCard}>
            <div style={s.homeCardTitle}>Compras recentes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentExpenses.map((e) => {
                const card = cardById[e.cardId];
                return (
                  <div key={e.id} style={s.recentRow}>
                    <span style={{ ...s.recentDot, background: card?.color || C.muted }} />
                    <div style={s.recentInfo}>
                      <span style={s.recentName}>{e.supplier}</span>
                      <span style={s.recentMeta}>
                        {card?.name || "sem cartão"} · {e.paidInstallments}/{e.totalInstallments} parcelas
                      </span>
                    </div>
                    <span style={s.recentAmt}>{brl(e.monthly)}/mês</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {cards.length === 0 && (
          <div style={s.homeCard}>
            <p style={{ color: C.muted, textAlign: "center", margin: 0, lineHeight: 1.6 }}>
              Cadastre um cartão e lance suas compras para ver o resumo aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
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

/* --------------------------- subcomponents ------------------------- */

function Stat({ label, value, accent, mono }) {
  return (
    <div style={s.statCell}>
      <span style={s.statLabel}>{label}</span>
      <span
        style={{
          ...s.statValue,
          color: accent,
          fontFamily: mono ? FONTS.mono : FONTS.display,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function FilterChip({ active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...s.chip,
        background: active ? C.ink : C.surface,
        color: active ? "#fff" : C.inkSoft,
        borderColor: active ? C.ink : C.line,
        minWidth: 96,
      }}
    >
      <span style={{ ...s.chipName, color: active ? "#fff" : C.ink }}>Todos</span>
      <span style={{ ...s.chipSub, color: active ? "rgba(255,255,255,.7)" : C.muted }}>
        visão geral
      </span>
    </button>
  );
}

function CardChip({ card, monthly, active, onClick, onDelete }) {
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onClick}
        style={{
          ...s.chip,
          borderColor: active ? card.color : C.line,
          boxShadow: active ? `inset 0 0 0 1px ${card.color}` : "none",
        }}
      >
        <span style={{ ...s.chipDot, background: card.color }} />
        <span style={s.chipName}>{card.name}</span>
        <span style={s.chipSub}>
          {card.digits ? `•••• ${card.digits}` : "cartão"}
        </span>
        <span style={{ ...s.chipMoney, color: card.color }}>{brl(monthly)}/mês</span>
      </button>
      <button title="Excluir cartão" style={s.chipX} onClick={onDelete}>
        ×
      </button>
    </div>
  );
}

function Pips({ total, paid, color }) {
  if (total > 18) {
    const pct = total ? (paid / total) * 100 : 0;
    return (
      <div style={s.barWrap}>
        <div style={s.barTrack}>
          <div style={{ ...s.barFill, width: `${pct}%`, background: color }} />
        </div>
      </div>
    );
  }
  return (
    <div style={s.pips}>
      {Array.from({ length: total }).map((_, i) => {
        const isPaid = i < paid;
        const isNext = i === paid;
        return (
          <span
            key={i}
            style={{
              ...s.pip,
              background: isPaid ? color : "transparent",
              borderColor: isPaid ? color : isNext ? color : C.line,
              opacity: isPaid ? 1 : isNext ? 0.9 : 0.55,
            }}
          />
        );
      })}
    </div>
  );
}

function ExpenseRow({ e, card, onPay, onUnpay, onEdit, onDelete }) {
  const color = card?.color || C.muted;
  return (
    <div style={{ ...s.row, opacity: e.done ? 0.72 : 1 }} className="cp-row">
      <div style={s.rowMain}>
        <div style={s.rowTop}>
          <span style={{ ...s.rowDot, background: color }} />
          <span style={s.supplier}>{e.supplier}</span>
          {e.done && <span style={s.doneTag}>quitado</span>}
        </div>
        <div style={s.rowMeta}>
          <span style={s.metaCard}>{card?.name || "sem cartão"}</span>
          <span style={s.metaSep}>·</span>
          <span>{brl(e.monthly)} × {e.totalInstallments}</span>
          {e.date && (
            <>
              <span style={s.metaSep}>·</span>
              <span>{formatDate(e.date)}</span>
            </>
          )}
        </div>
        <Pips total={e.totalInstallments} paid={e.paidInstallments} color={color} />
        <div style={s.progressText}>
          <span style={{ color, fontFamily: FONTS.mono, fontWeight: 700 }}>
            {e.paidInstallments}/{e.totalInstallments}
          </span>
          <span style={s.progressMuted}>parcelas pagas</span>
          {!e.done && (
            <span style={s.remainingChip}>
              faltam {brl(e.remaining)}
            </span>
          )}
        </div>
      </div>

      <div style={s.rowSide} className="cp-rowside">
        <div style={s.rowTotal}>
          <span style={s.totalLabel}>total</span>
          <span style={s.totalValue}>{brl(e.total)}</span>
        </div>
        <div style={s.rowBtns}>
          {!e.done && (
            <button style={s.payBtn} onClick={onPay}>
              registrar parcela
            </button>
          )}
          {e.paidInstallments > 0 && (
            <button style={s.iconBtn} title="Desfazer última parcela" onClick={onUnpay}>
              ↩
            </button>
          )}
          <button style={s.iconBtn} title="Editar" onClick={onEdit}>
            ✎
          </button>
          <button style={{ ...s.iconBtn, color: C.accent }} title="Excluir" onClick={onDelete}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function Empty({ text, cta, onClick }) {
  return (
    <div style={s.empty}>
      <p style={s.emptyText}>{text}</p>
      {cta && (
        <button style={s.primaryBtn} onClick={onClick}>
          {cta}
        </button>
      )}
    </div>
  );
}

/* ------------------------------ modals ---------------------------- */

function Modal({ title, children, onClose, wide }) {
  return (
    <div style={s.overlay} onClick={(ev) => { if (ev.target === ev.currentTarget) onClose(); }}>
      <div style={{ ...s.modal, ...(wide ? { maxWidth: 780 } : {}) }} onClick={(ev) => ev.stopPropagation()}>
        <div style={s.modalHead}>
          <h3 style={s.modalTitle}>{title}</h3>
          <button type="button" style={s.modalX} onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label style={s.field}>
      <span style={s.fieldLabel}>{label}</span>
      {children}
      {hint && <span style={s.fieldHint}>{hint}</span>}
    </label>
  );
}

function CardForm({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [digits, setDigits] = useState("");
  const [color, setColor] = useState(CARD_COLORS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), digits: digits.replace(/\D/g, "").slice(0, 4), color });
  };

  return (
    <Modal title="Novo cartão" onClose={onClose}>
      <div style={s.formBody}>
        <Field label="Nome do cartão">
          <input
            style={s.input}
            value={name}
            autoFocus
            placeholder="Ex.: Nubank, Inter, Itaú…"
            onChange={(ev) => setName(ev.target.value)}
            onKeyDown={(ev) => ev.key === "Enter" && submit()}
          />
        </Field>
        <Field label="Final do cartão (opcional)">
          <input
            style={s.input}
            value={digits}
            inputMode="numeric"
            placeholder="4 últimos dígitos"
            onChange={(ev) => setDigits(ev.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </Field>
        <Field label="Cor de identificação">
          <div style={s.swatches}>
            {CARD_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  ...s.swatch,
                  background: c,
                  outline: color === c ? `2px solid ${C.ink}` : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </Field>
      </div>
      <div style={s.formFoot}>
        <button type="button" style={s.ghostBtn} onClick={onClose}>cancelar</button>
        <button
          type="button"
          style={{ ...s.primaryBtn, opacity: name.trim() ? 1 : 0.5 }}
          disabled={!name.trim()}
          onClick={submit}
        >
          Salvar cartão
        </button>
      </div>
    </Modal>
  );
}

function ExpenseForm({ initial, cards, defaultCard, onSave, onClose }) {
  const editing = !!initial.id;
  const [supplier, setSupplier] = useState(initial.supplier || "");
  const [cardId, setCardId] = useState(initial.cardId || defaultCard || cards[0]?.id || "");
  const [total, setTotal] = useState(initial.total != null ? String(initial.total) : "");
  const [installments, setInstallments] = useState(
    initial.totalInstallments != null ? String(initial.totalInstallments) : "1"
  );
  const [paid, setPaid] = useState(
    initial.paidInstallments != null ? String(initial.paidInstallments) : "0"
  );
  const [mode, setMode] = useState("total"); // total | monthly
  const [date, setDate] = useState(initial.date || todayISO());

  const totalNum = parseMoney(total);
  const instNum = Math.max(1, parseInt(installments, 10) || 1);
  const paidNum = Math.min(instNum, Math.max(0, parseInt(paid, 10) || 0));
  const effectiveTotal = mode === "total" ? totalNum : totalNum * instNum;
  const monthly = effectiveTotal / instNum;
  const valid = supplier.trim() && cardId && effectiveTotal > 0;

  const submit = () => {
    if (!valid) return;
    onSave({
      id: initial.id,
      supplier: supplier.trim(),
      cardId,
      total: round2(effectiveTotal),
      totalInstallments: instNum,
      paidInstallments: paidNum,
      date,
    });
  };

  return (
    <Modal title={editing ? "Editar compra" : "Nova compra"} onClose={onClose}>
      <div style={s.formBody}>
        <Field label="Fornecedor">
          <input
            style={s.input}
            autoFocus
            value={supplier}
            placeholder="Onde foi a compra? Ex.: Magalu, Mercado Livre…"
            onChange={(ev) => setSupplier(ev.target.value)}
          />
        </Field>

        <Field label="Cartão usado">
          <select style={s.input} value={cardId} onChange={(ev) => setCardId(ev.target.value)}>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.digits ? ` •••• ${c.digits}` : ""}
              </option>
            ))}
          </select>
        </Field>

        <div style={s.modeRow}>
          <button
            type="button"
            style={{ ...s.modeBtn, ...(mode === "total" ? s.modeBtnOn : {}) }}
            onClick={() => setMode("total")}
          >
            valor total
          </button>
          <button
            type="button"
            style={{ ...s.modeBtn, ...(mode === "monthly" ? s.modeBtnOn : {}) }}
            onClick={() => setMode("monthly")}
          >
            valor da parcela
          </button>
        </div>

        <div style={s.grid2}>
          <Field label={mode === "total" ? "Valor total (R$)" : "Valor por parcela (R$)"}>
            <input
              style={s.input}
              inputMode="decimal"
              value={total}
              placeholder="0,00"
              onChange={(ev) => setTotal(ev.target.value)}
            />
          </Field>
          <Field label="Quantidade de parcelas">
            <input
              style={s.input}
              inputMode="numeric"
              value={installments}
              onChange={(ev) => setInstallments(ev.target.value.replace(/\D/g, ""))}
            />
          </Field>
        </div>

        <div style={s.grid2}>
          <Field label="Parcelas já pagas" hint={`de ${instNum}`}>
            <input
              style={s.input}
              inputMode="numeric"
              value={paid}
              onChange={(ev) => setPaid(ev.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <Field label="Data da compra">
            <input
              style={s.input}
              type="date"
              value={date}
              onChange={(ev) => setDate(ev.target.value)}
            />
          </Field>
        </div>

        {effectiveTotal > 0 && (
          <div style={s.preview}>
            <div>
              <span style={s.previewLabel}>parcela</span>
              <span style={s.previewBig}>{brl(monthly)}</span>
            </div>
            <div style={s.previewDiv} />
            <div>
              <span style={s.previewLabel}>total</span>
              <span style={s.previewVal}>{brl(effectiveTotal)}</span>
            </div>
            <div style={s.previewDiv} />
            <div>
              <span style={s.previewLabel}>restante</span>
              <span style={s.previewVal}>{brl(monthly * (instNum - paidNum))}</span>
            </div>
          </div>
        )}
      </div>

      <div style={s.formFoot}>
        <button type="button" style={s.ghostBtn} onClick={onClose}>cancelar</button>
        <button
          type="button"
          style={{ ...s.primaryBtn, opacity: valid ? 1 : 0.5 }}
          disabled={!valid}
          onClick={submit}
        >
          {editing ? "Salvar alterações" : "Lançar compra"}
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------ report modal ---------------------- */

function ReportModal({ expenses, cards, cardById, enrich, onClose }) {
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
    <Modal title="Relatório customizado" onClose={onClose} wide>
      <div style={{ ...s.formBody, gap: 20 }}>

        {/* Filtros */}
        <div style={s.repFilters}>
          {/* Cartão */}
          <div style={s.repFilterGroup}>
            <span style={s.fieldLabel}>Cartão</span>
            <div style={s.repChips}>
              {cards.map((c) => {
                const on = selCards.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    style={{ ...s.repChip, ...(on ? { background: c.color, color: "#fff", borderColor: c.color } : {}) }}
                    onClick={() => toggleCard(c.id)}
                  >
                    <span style={{ ...s.chipDot, background: on ? "rgba(255,255,255,.65)" : c.color }} />
                    {c.name}
                    {c.digits ? ` ···· ${c.digits}` : ""}
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

          {/* Mês */}
          {availableMonths.length > 0 && (
            <div style={s.repFilterGroup}>
              <span style={s.fieldLabel}>Mês de compra</span>
              <div style={s.repChips}>
                {availableMonths.map((m) => {
                  const on = selMonths.includes(m);
                  return (
                    <button
                      type="button"
                      key={m}
                      style={{ ...s.repChip, ...(on ? { background: C.primary, color: "#fff", borderColor: C.primary } : {}) }}
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

          {/* Status */}
          <div style={s.repFilterGroup}>
            <span style={s.fieldLabel}>Status</span>
            <div style={{ ...s.modeRow, width: "fit-content" }}>
              {[["all", "Todos"], ["active", "Ativos"], ["done", "Quitados"]].map(([v, l]) => (
                <button
                  type="button"
                  key={v}
                  style={{ ...s.modeBtn, ...(selStatus === v ? s.modeBtnOn : {}) }}
                  onClick={() => setSelStatus(v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div style={{ ...s.preview, flexWrap: "wrap" }}>
          {[
            ["compras", filtered.length, C.ink, false],
            ["ativas", summary.activeCount, C.primary, false],
            ["total gasto", summary.total, C.ink, true],
            ["parc./mês", summary.monthly, C.primary, true],
            ["a pagar", summary.remaining, C.accent, true],
          ].map(([lbl, val, color, isBrl], i, arr) => (
            <React.Fragment key={lbl}>
              <div style={s.repStat}>
                <span style={s.previewLabel}>{lbl}</span>
                <span style={{ ...s.previewBig, fontSize: 17, color }}>
                  {isBrl ? brl(val) : val}
                </span>
              </div>
              {i < arr.length - 1 && <div style={s.previewDiv} />}
            </React.Fragment>
          ))}
        </div>

        {/* Tabela */}
        {filtered.length === 0 ? (
          <p style={{ color: C.muted, textAlign: "center", padding: "16px 0", margin: 0, fontFamily: FONTS.mono, fontSize: 13 }}>
            Nenhuma compra para os filtros selecionados.
          </p>
        ) : (
          <div style={s.repTableWrap}>
            <table style={s.repTable}>
              <thead>
                <tr>
                  {["Fornecedor", "Cartão", "Data", "Total", "Parc./mês", "Pagas", "A pagar", "Status"].map((h) => (
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
                          <span style={{ ...s.chipDot, width: 8, height: 8, background: card?.color || C.muted }} />
                          {card?.name || "—"}
                        </span>
                      </td>
                      <td style={{ ...s.repTd, ...s.repMono }}>{formatDate(e.date)}</td>
                      <td style={{ ...s.repTd, ...s.repMono, textAlign: "right" }}>{brl(e.total)}</td>
                      <td style={{ ...s.repTd, ...s.repMono, textAlign: "right" }}>{brl(e.monthly)}</td>
                      <td style={{ ...s.repTd, ...s.repMono, textAlign: "center" }}>
                        {e.paidInstallments}/{e.totalInstallments}
                      </td>
                      <td style={{ ...s.repTd, ...s.repMono, textAlign: "right", color: e.done ? C.muted : C.accent }}>
                        {e.done ? "—" : brl(e.remaining)}
                      </td>
                      <td style={s.repTd}>
                        <span style={{
                          ...s.doneTag,
                          color: e.done ? C.primary : C.accent,
                          background: e.done ? "#f0faf5" : C.accentSoft,
                          border: `1px solid ${e.done ? "#c3e8d8" : C.accent + "44"}`,
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

      <div style={s.formFoot}>
        <button type="button" style={s.ghostBtn} onClick={onClose}>fechar</button>
        <button type="button" style={s.primaryBtn} onClick={() => window.print()}>
          ⬇ imprimir / salvar PDF
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------ helpers --------------------------- */

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}
function parseMoney(v) {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}

/* ------------------------------ styles ---------------------------- */

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

const s = {
  root: {
    fontFamily: FONTS.body,
    background: C.bg,
    color: C.ink,
    minHeight: "100vh",
    maxWidth: 680,
    margin: "0 auto",
    paddingBottom: 80,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 22,
    borderBottom: `2px solid ${C.ink}`,
  },
  kicker: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: C.primary,
    marginBottom: 6,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: "clamp(26px, 5vw, 40px)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: 0,
    lineHeight: 1.02,
  },
  headerNumbers: { textAlign: "right" },
  bigStat: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  bigStatLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: C.muted,
  },
  bigStatValue: {
    fontFamily: FONTS.display,
    fontSize: "clamp(22px, 4vw, 30px)",
    fontWeight: 700,
    color: C.primary,
  },

  strip: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
    margin: "22px 0 8px",
  },
  statCell: {
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 14,
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: C.muted,
  },
  statValue: { fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em" },

  section: { marginTop: 30 },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  h2: {
    fontFamily: FONTS.display,
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
    letterSpacing: "-0.01em",
  },

  cardRow: {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    paddingBottom: 6,
  },
  chip: {
    position: "relative",
    flex: "0 0 auto",
    minWidth: 150,
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 14,
    padding: "14px 16px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  chipDot: { width: 10, height: 10, borderRadius: "50%", marginBottom: 2 },
  chipName: { fontFamily: FONTS.display, fontWeight: 600, fontSize: 15, color: C.ink },
  chipSub: { fontFamily: FONTS.mono, fontSize: 11, color: C.muted },
  chipMoney: { fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, marginTop: 4 },
  chipX: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: `1px solid ${C.line}`,
    background: C.surface,
    color: C.muted,
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
  },

  list: { display: "flex", flexDirection: "column", gap: 12 },
  row: {
    display: "flex",
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 16,
    padding: 18,
    gap: 18,
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowTop: { display: "flex", alignItems: "center", gap: 9, marginBottom: 6 },
  rowDot: { width: 11, height: 11, borderRadius: "50%", flex: "0 0 auto" },
  supplier: {
    fontFamily: FONTS.display,
    fontSize: 17,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
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
  rowMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: C.muted,
    marginBottom: 12,
  },
  metaCard: { color: C.inkSoft, fontWeight: 700 },
  metaSep: { opacity: 0.5 },

  pips: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 },
  pip: {
    width: 16,
    height: 9,
    borderRadius: 3,
    border: "1.5px solid",
    display: "inline-block",
  },
  barWrap: { marginBottom: 10 },
  barTrack: { height: 9, borderRadius: 6, background: C.surfaceAlt, border: `1px solid ${C.line}`, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6 },

  progressText: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13 },
  progressMuted: { color: C.muted, fontSize: 12 },
  remainingChip: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: 700,
    color: C.accent,
    background: C.accentSoft,
    borderRadius: 20,
    padding: "2px 10px",
  },

  rowSide: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 14,
    paddingLeft: 18,
    borderLeft: `1px solid ${C.line}`,
  },
  rowTotal: { textAlign: "right" },
  totalLabel: {
    display: "block",
    fontFamily: FONTS.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: C.muted,
  },
  totalValue: { fontFamily: FONTS.display, fontSize: 20, fontWeight: 700 },
  rowBtns: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" },
  payBtn: {
    background: C.primary,
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "9px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONTS.body,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    background: C.surface,
    color: C.inkSoft,
    cursor: "pointer",
    fontSize: 14,
  },

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

  empty: {
    background: C.surface,
    border: `1px dashed ${C.line}`,
    borderRadius: 16,
    padding: "34px 24px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  emptyText: { color: C.muted, fontSize: 14, maxWidth: 420, margin: 0, lineHeight: 1.5 },

  footer: {
    marginTop: 40,
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: C.muted,
    textAlign: "center",
  },

  /* modal */
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(22,35,29,0.45)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "6vh 16px",
    zIndex: 50,
    overflowY: "auto",
  },
  modal: {
    background: C.surface,
    borderRadius: 18,
    width: "100%",
    maxWidth: 460,
    boxShadow: "0 24px 60px rgba(0,0,0,.22)",
    overflow: "hidden",
  },
  modalHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px",
    borderBottom: `1px solid ${C.line}`,
  },
  modalTitle: { fontFamily: FONTS.display, fontSize: 18, fontWeight: 600, margin: 0 },
  modalX: {
    border: "none",
    background: "transparent",
    fontSize: 24,
    lineHeight: 1,
    color: C.muted,
    cursor: "pointer",
  },
  formBody: { padding: 22, display: "flex", flexDirection: "column", gap: 16 },
  formFoot: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: "16px 22px",
    borderTop: `1px solid ${C.line}`,
    background: C.surfaceAlt,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: C.inkSoft,
  },
  fieldHint: { fontFamily: FONTS.mono, fontSize: 11, color: C.muted },
  input: {
    border: `1px solid ${C.line}`,
    borderRadius: 10,
    padding: "11px 13px",
    fontSize: 15,
    color: C.ink,
    background: "#fff",
    outline: "none",
    width: "100%",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  swatches: { display: "flex", gap: 10, flexWrap: "wrap" },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 9,
    border: "none",
    cursor: "pointer",
  },
  modeRow: { display: "flex", gap: 8, background: C.surfaceAlt, padding: 4, borderRadius: 11 },
  modeBtn: {
    flex: 1,
    border: "none",
    background: "transparent",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    fontWeight: 600,
    color: C.muted,
    cursor: "pointer",
    fontFamily: FONTS.body,
  },
  modeBtnOn: { background: "#fff", color: C.ink, boxShadow: "0 1px 3px rgba(0,0,0,.08)" },

  preview: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: C.surfaceAlt,
    border: `1px solid ${C.line}`,
    borderRadius: 12,
    padding: "14px 16px",
  },
  previewLabel: {
    display: "block",
    fontFamily: FONTS.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: C.muted,
    marginBottom: 2,
  },
  previewBig: { fontFamily: FONTS.display, fontSize: 20, fontWeight: 700, color: C.primary },
  previewVal: { fontFamily: FONTS.display, fontSize: 16, fontWeight: 600 },
  previewDiv: { width: 1, alignSelf: "stretch", background: C.line },

  /* report modal */
  repFilters: { display: "flex", flexDirection: "column", gap: 14 },
  repFilterGroup: { display: "flex", flexDirection: "column", gap: 8 },
  repChips: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" },
  repChip: {
    display: "flex", alignItems: "center", gap: 6,
    border: `1px solid ${C.line}`, borderRadius: 20,
    padding: "6px 12px", fontSize: 13, fontWeight: 600,
    background: C.surface, color: C.inkSoft, cursor: "pointer",
    fontFamily: FONTS.body,
  },
  repClear: {
    border: "none", background: "transparent",
    color: C.muted, fontSize: 12, cursor: "pointer",
    fontFamily: FONTS.mono, padding: "4px 6px",
  },
  repStat: { display: "flex", flexDirection: "column", gap: 4 },
  repTableWrap: { overflowX: "auto", borderRadius: 10, border: `1px solid ${C.line}` },
  repTable: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  repTh: {
    fontFamily: FONTS.mono, fontSize: 10, fontWeight: 700, letterSpacing: 1,
    textTransform: "uppercase", color: C.muted,
    padding: "10px 12px", background: C.surfaceAlt,
    borderBottom: `1px solid ${C.line}`, textAlign: "left", whiteSpace: "nowrap",
  },
  repTd: {
    padding: "10px 12px", borderBottom: `1px solid ${C.line}`,
    color: C.ink, verticalAlign: "middle",
  },
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

  /* home view */
  homeHeader: {
    background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
    padding: "36px 20px 28px",
    color: "#fff",
  },
  homeHeaderKicker: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    opacity: 0.75,
    marginBottom: 8,
  },
  homeHeaderTitle: {
    fontFamily: FONTS.display,
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
    marginBottom: 4,
    letterSpacing: "-0.02em",
  },
  homeHeaderSub: { fontSize: 14, opacity: 0.8, fontWeight: 500 },
  homeBody: { padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 },
  homeCard: {
    background: C.surface,
    borderRadius: 18,
    padding: "18px 18px",
    boxShadow: "0 2px 12px rgba(124,58,237,0.07)",
  },
  homeCardTitle: {
    fontFamily: FONTS.display,
    fontSize: 14,
    fontWeight: 700,
    color: C.inkSoft,
    marginBottom: 14,
  },
  homeBigValue: {
    fontFamily: FONTS.display,
    fontSize: 34,
    fontWeight: 700,
    color: C.primary,
    letterSpacing: "-0.02em",
    marginBottom: 4,
  },
  homeBigLabel: { fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 16 },
  homeStatRow: { display: "flex", alignItems: "center", gap: 16 },
  homeStat: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  homeStatDiv: { width: 1, height: 32, background: C.line },
  homeStatVal: { fontSize: 16, fontWeight: 700, color: C.ink },
  homeStatLbl: { fontSize: 11, color: C.muted, fontWeight: 500 },
  chartArea: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
  chartLegend: { flex: 1, minWidth: 140, display: "flex", flexDirection: "column", gap: 10 },
  legendRow: { display: "flex", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: "50%", flex: "0 0 auto" },
  legendName: { flex: 1, fontSize: 13, fontWeight: 600, color: C.ink },
  legendAmt: { fontSize: 12, fontWeight: 700, color: C.inkSoft },
  legendPct: { fontSize: 11, color: C.muted, minWidth: 32, textAlign: "right" },
  recentRow: { display: "flex", alignItems: "center", gap: 12 },
  recentDot: { width: 10, height: 10, borderRadius: "50%", flex: "0 0 auto" },
  recentInfo: { flex: 1, minWidth: 0 },
  recentName: { display: "block", fontSize: 14, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  recentMeta: { display: "block", fontSize: 11, color: C.muted, fontWeight: 500 },
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
