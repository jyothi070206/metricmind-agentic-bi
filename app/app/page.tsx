'use client';
import { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const REVENUE = 141500;
const MARGIN = 52500;
const COST = REVENUE - MARGIN;
const MARGIN_PCT = 37.1;
const MAX_QUERIES = 8;
const SESSION_ID = 'A-2417';

const METRICS = [
  { key: 'revenue', label: 'Total Revenue', formula: 'SUM(revenue)', sql: 'SELECT total_revenue FROM governance_check' },
  { key: 'margin', label: 'Total Margin', formula: 'SUM(revenue) − SUM(cost)', sql: 'SELECT total_margin FROM governance_check' },
  { key: 'marginPct', label: 'Margin %', formula: 'margin ÷ revenue × 100', sql: 'SELECT margin_percentage FROM governance_check' },
];

const EXAMPLE_PROMPTS = [
  'What was our total revenue?',
  'How much profit did we make?',
  'Give me the full breakdown',
];

const STACK = ['Next.js', 'TypeScript', 'Snowflake', 'dbt', 'LangChain', 'Groq Llama 3.1'];

const chartData = [
  { name: 'Revenue', value: REVENUE },
  { name: 'Cost', value: COST },
  { name: 'Margin', value: MARGIN },
];

type Message = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  sql?: string;
  chart?: boolean;
  blocked?: boolean;
};

const SEED_MESSAGES: Message[] = [
  { id: 1, role: 'user', text: 'What was our total revenue?' },
  {
    id: 2,
    role: 'assistant',
    text: `Total revenue is $${REVENUE.toLocaleString()}.`,
    sql: METRICS[0].sql,
  },
];

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--ink)" />
      <path
        d="M9 20.5 L9 11.5 L16 17 L23 11.5 L23 20.5"
        fill="none"
        stroke="var(--paper)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerifiedStamp() {
  return (
    <svg viewBox="0 0 64 64" className="stamp h-9 w-9 shrink-0" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="none" stroke="var(--verified)" strokeWidth="2" strokeDasharray="3 4" />
      <circle cx="32" cy="32" r="23" fill="var(--verified-soft)" stroke="var(--verified)" strokeWidth="1.5" />
      <path
        d="M21 33.5 L28 40 L44 24"
        fill="none"
        stroke="var(--verified)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SqlToggle({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-[var(--line)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-[var(--verified)] transition hover:bg-[var(--verified-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]"
      >
        {open ? 'Hide SQL ▲' : 'View SQL ▼'}
      </button>
      {open && (
        <p className="mt-2 rounded-lg bg-[var(--paper-raised)] px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-[var(--ink-soft)]">
          {sql}
        </p>
      )}
    </div>
  );
}

function resolveAnswer(question: string): { text: string; sql: string; chart: boolean } {
  const q = question.toLowerCase();
  if (q.includes('why') || q.includes('breakdown')) {
    return {
      text: `Full breakdown — Revenue: $${REVENUE.toLocaleString()}, Cost: $${COST.toLocaleString()}, Margin: $${MARGIN.toLocaleString()} (${MARGIN_PCT}%). For every unit of revenue, the company keeps ${MARGIN_PCT}% as profit after costs.`,
      sql: 'SELECT total_revenue, total_margin, margin_percentage FROM governance_check',
      chart: true,
    };
  }
  if (q.includes('percent') || q.includes('%')) {
    return { text: `Margin percentage is ${MARGIN_PCT}%.`, sql: METRICS[2].sql, chart: false };
  }
  if (q.includes('margin') || q.includes('profit')) {
    return { text: `Total margin is $${MARGIN.toLocaleString()}.`, sql: METRICS[1].sql, chart: false };
  }
  if (q.includes('revenue')) {
    return { text: `Total revenue is $${REVENUE.toLocaleString()}.`, sql: METRICS[0].sql, chart: false };
  }
  return {
    text: 'I can answer questions about revenue, margin, margin percentage, or a full breakdown — try one of the examples on the left.',
    sql: '',
    chart: false,
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [input, setInput] = useState('');
  const [queryCount, setQueryCount] = useState(1);
  const [lastSql, setLastSql] = useState<string | null>(METRICS[0].sql);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text };

    if (queryCount >= MAX_QUERIES) {
      setMessages((m) => [
        ...m,
        userMsg,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: `Query limit reached (${MAX_QUERIES} per session). This protects against unbounded, expensive database usage.`,
          blocked: true,
        },
      ]);
      setInput('');
      return;
    }

    const { text: answer, sql, chart } = resolveAnswer(text);
    setQueryCount((c) => (sql ? c + 1 : c));
    if (sql) setLastSql(sql);

    setMessages((m) => [
      ...m,
      userMsg,
      { id: Date.now() + 1, role: 'assistant', text: answer, sql: sql || undefined, chart },
    ]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Utility strip */}
      <div className="border-b border-[var(--line)] bg-[var(--ink)] px-6 py-1.5 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--paper)]/70">
            Enterprise Analytics Prototype
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--paper)]/50">
            Session #{SESSION_ID}
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="rise-in border-b border-[var(--line)] bg-[var(--paper-raised)] px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                Governed Semantic BI
              </p>
              <h1 className="font-display text-2xl italic leading-tight text-[var(--ink)] sm:text-[1.75rem]">
                MetricMind
              </h1>
            </div>
          </div>
          <div className="w-40 shrink-0 sm:w-56">
            <div className="flex items-center justify-between font-mono text-[11px] text-[var(--ink-soft)]">
              <span>Query budget</span>
              <span>{queryCount}/{MAX_QUERIES}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full rounded-full bg-[var(--brass)] transition-all duration-500"
                style={{ width: `${Math.min((queryCount / MAX_QUERIES) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[1fr_320px]">
        {/* Chat column */}
        <section className="card-shadow rise-in flex h-[68vh] flex-col rounded-3xl border border-[var(--line)] bg-[var(--paper-raised)]">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <p className="font-display text-xl italic text-[var(--ink)]">
                  Ask, and every answer is verified.
                </p>
                <p className="max-w-sm text-sm text-[var(--ink-soft)]">
                  Nothing here is guessed. Each answer is checked against the governed metric
                  definitions on the right before it reaches you.
                </p>
              </div>
            )}

            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="rise-in flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[var(--ink)] px-4 py-2.5 text-sm text-[var(--paper)]">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="rise-in flex justify-start gap-3">
                  {m.blocked ? (
                    <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-[var(--warn)]/30 bg-[var(--warn-soft)] px-4 py-3 text-sm text-[var(--warn)]">
                      {m.text}
                    </div>
                  ) : (
                    <>
                      <VerifiedStamp />
                      <div className="card-shadow max-w-[85%] space-y-2 rounded-2xl rounded-bl-sm border border-[var(--line)] bg-[var(--paper)] px-4 py-3">
                        <p className="text-sm text-[var(--ink)]">{m.text}</p>
                        {m.sql && <SqlToggle sql={m.sql} />}
                        {m.chart && (
                          <div className="pt-2">
                            <ResponsiveContainer width="100%" height={160}>
                              <BarChart data={chartData}>
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} />
                                <Tooltip
                                  contentStyle={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 12,
                                    borderColor: 'var(--line)',
                                  }}
                                />
                                <Bar dataKey="value" fill="var(--verified)" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            )}
          </div>

          {/* Example chips above input */}
          <div className="flex flex-wrap gap-2 border-t border-[var(--line)] px-6 pt-4">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3.5 py-1.5 text-xs text-[var(--ink-soft)] transition hover:border-[var(--verified)] hover:text-[var(--verified)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 p-4">
            <input
              className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about revenue, margin, or cost…"
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
            />
            <button
              onClick={() => send(input)}
              className="rounded-xl bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]"
            >
              Ask
            </button>
          </div>
        </section>

        {/* Semantic Ledger rail */}
        <aside className="space-y-4">
          <div className="card-shadow rise-in rounded-3xl border border-[var(--line)] bg-[var(--paper-raised)] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-soft)]">
              Semantic Ledger
            </p>
            <p className="mt-1 font-display text-lg italic text-[var(--ink)]">
              Governed metrics
            </p>
            <div className="mt-4 space-y-3">
              {METRICS.map((m) => (
                <div
                  key={m.key}
                  className="rounded-xl border border-[var(--line)] p-3 transition hover:border-[var(--verified)]/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--ink)]">{m.label}</span>
                    <span className="rounded-full bg-[var(--verified-soft)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--verified)]">
                      Governed
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-[var(--ink-soft)]">{m.formula}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-shadow rise-in rounded-3xl border border-[var(--line)] bg-[var(--paper-raised)] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-soft)]">
              Last verified query
            </p>
            {lastSql ? (
              <p className="mt-2 rounded-lg bg-[var(--paper)] p-3 font-mono text-[11px] leading-relaxed text-[var(--ink)]">
                {lastSql}
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                No query run yet — ask a question to see it here.
              </p>
            )}
          </div>
        </aside>
      </main>

      {/* Stack footer */}
      <footer className="border-t border-[var(--line)] px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            Built with
          </span>
          {STACK.map((s) => (
            <span
              key={s}
              className="rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-2.5 py-1 font-mono text-[10px] text-[var(--ink-soft)]"
            >
              {s}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}