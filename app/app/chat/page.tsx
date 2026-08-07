'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const REVENUE = 141500;
const MARGIN = 52500;
const COST = REVENUE - MARGIN;
const MARGIN_PCT = 37.1;
const MAX_QUERIES = 8;

const METRICS = [
  { key: 'revenue', label: 'Total Revenue', formula: 'SUM(revenue)', sql: 'SELECT total_revenue FROM governance_check' },
  { key: 'margin', label: 'Total Margin', formula: 'SUM(revenue) − SUM(cost)', sql: 'SELECT total_margin FROM governance_check' },
  { key: 'marginPct', label: 'Margin %', formula: 'margin ÷ revenue × 100', sql: 'SELECT margin_percentage FROM governance_check' },
];

const EXAMPLE_PROMPTS = ['What was our total revenue?', 'How much profit did we make?', 'Give me the full breakdown'];

type ChartSpec = { title: string; data: { name: string; value: number }[]; domain?: [number, number] };
type Message = { id: number; role: 'user' | 'assistant'; text: string; sql?: string; blocked?: boolean };
type LogEntry = { id: number; time: string; question: string };

function VerifiedStamp({ small = false }: { small?: boolean }) {
  const size = small ? 'h-6 w-6' : 'h-9 w-9';
  return (
    <svg viewBox="0 0 64 64" className={`stamp ${size} shrink-0`} aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="none" stroke="var(--verified)" strokeWidth="2" strokeDasharray="3 4" />
      <circle cx="32" cy="32" r="23" fill="var(--verified-soft)" stroke="var(--verified)" strokeWidth="1.5" />
      <path d="M21 33.5 L28 40 L44 24" fill="none" stroke="var(--verified)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
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

function resolveAnswer(question: string): { text: string; sql: string; chart: ChartSpec | null } {
  const q = question.toLowerCase();
  if (q.includes('why') || q.includes('breakdown')) {
    return {
      text: `Full breakdown — Revenue: $${REVENUE.toLocaleString()}, Cost: $${COST.toLocaleString()}, Margin: $${MARGIN.toLocaleString()} (${MARGIN_PCT}%).`,
      sql: 'SELECT total_revenue, total_margin, margin_percentage FROM governance_check',
      chart: {
        title: 'Revenue vs Cost vs Margin',
        data: [{ name: 'Revenue', value: REVENUE }, { name: 'Cost', value: COST }, { name: 'Margin', value: MARGIN }],
      },
    };
  }
  if (q.includes('percent') || q.includes('%')) {
    return {
      text: `Margin percentage is ${MARGIN_PCT}%.`,
      sql: METRICS[2].sql,
      chart: { title: 'Margin Percentage', data: [{ name: 'Margin %', value: MARGIN_PCT }], domain: [0, 100] },
    };
  }
  if (q.includes('margin') || q.includes('profit')) {
    return {
      text: `Total margin is $${MARGIN.toLocaleString()}.`,
      sql: METRICS[1].sql,
      chart: { title: 'Cost vs Margin', data: [{ name: 'Cost', value: COST }, { name: 'Margin', value: MARGIN }] },
    };
  }
  if (q.includes('revenue')) {
    return {
      text: `Total revenue is $${REVENUE.toLocaleString()}.`,
      sql: METRICS[0].sql,
      chart: { title: 'Revenue vs Cost', data: [{ name: 'Revenue', value: REVENUE }, { name: 'Cost', value: COST }] },
    };
  }
  return { text: 'I can answer questions about revenue, margin, margin percentage, or a full breakdown.', sql: '', chart: null };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [input, setInput] = useState('');
  const [queryCount, setQueryCount] = useState(0);
  const [lastSql, setLastSql] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<ChartSpec | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const userMsg: Message = { id: Date.now(), role: 'user', text };

    if (queryCount >= MAX_QUERIES) {
      setMessages((m) => [...m, userMsg, { id: Date.now() + 1, role: 'assistant', text: `Query limit reached (${MAX_QUERIES} per session).`, blocked: true }]);
      setInput('');
      return;
    }

    const { text: answer, sql, chart } = resolveAnswer(text);
    setQueryCount((c) => (sql ? c + 1 : c));
    if (sql) {
      setLastSql(sql);
      setLog((l) => [...l, { id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), question: text }]);
    }
    if (chart) setActiveChart(chart);

    setMessages((m) => [...m, userMsg, { id: Date.now() + 1, role: 'assistant', text: answer, sql: sql || undefined }]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper-raised)] px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">← Home</Link>
            <h1 className="font-display text-xl italic text-[var(--ink)]">MetricMind Console</h1>
          </div>
          <div className="w-40 shrink-0 sm:w-56">
            <div className="flex items-center justify-between font-mono text-[11px] text-[var(--ink-soft)]">
              <span>Query budget</span>
              <span>{queryCount}/{MAX_QUERIES}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
              <div className="h-full rounded-full bg-[var(--brass)] transition-all duration-500" style={{ width: `${Math.min((queryCount / MAX_QUERIES) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 sm:px-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section className="card-shadow rise-in rounded-3xl border border-[var(--line)] bg-[var(--paper-raised)] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-soft)]">Live Visualization</p>
                  <p className="font-display text-lg italic text-[var(--ink)]">{activeChart ? activeChart.title : 'Awaiting a question'}</p>
                </div>
                {activeChart && <VerifiedStamp small />}
              </div>
              {activeChart ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={activeChart.data} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} axisLine={{ stroke: 'var(--line)' }} tickLine={false} />
                    <YAxis domain={activeChart.domain} tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderColor: 'var(--line)', borderRadius: 8 }} />
                    <Bar dataKey="value" fill="var(--verified)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[180px] items-center justify-center text-sm text-[var(--ink-soft)]">
                  Ask a question below — the relevant chart will appear here.
                </div>
              )}
            </section>

            <section className="card-shadow rise-in flex h-[46vh] flex-col rounded-3xl border border-[var(--line)] bg-[var(--paper-raised)]">
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                {messages.length === 0 && (
                  <p className="text-sm text-[var(--ink-soft)]">Try one of the examples below to get started.</p>
                )}
                {messages.map((m) =>
                  m.role === 'user' ? (
                    <div key={m.id} className="rise-in flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[var(--ink)] px-4 py-2.5 text-sm text-[var(--paper)]">{m.text}</div>
                    </div>
                  ) : (
                    <div key={m.id} className="rise-in flex justify-start gap-3">
                      {m.blocked ? (
                        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-[var(--warn)]/30 bg-[var(--warn-soft)] px-4 py-3 text-sm text-[var(--warn)]">{m.text}</div>
                      ) : (
                        <>
                          <VerifiedStamp />
                          <div className="card-shadow max-w-[85%] space-y-2 rounded-2xl rounded-bl-sm border border-[var(--line)] bg-[var(--paper)] px-4 py-3">
                            <p className="text-sm text-[var(--ink)]">{m.text}</p>
                            {m.sql && <SqlToggle sql={m.sql} />}
                          </div>
                        </>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-[var(--line)] px-6 pt-4">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button key={p} onClick={() => send(p)} className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3.5 py-1.5 text-xs text-[var(--ink-soft)] transition hover:border-[var(--verified)] hover:text-[var(--verified)]">
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 p-4">
                <input
                  className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about revenue, margin, or cost…"
                  onKeyDown={(e) => e.key === 'Enter' && send(input)}
                />
                <button onClick={() => send(input)} className="rounded-xl bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] transition hover:opacity-90">
                  Ask
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="card-shadow rise-in rounded-3xl border border-[var(--line)] bg-[var(--paper-raised)] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-soft)]">Semantic Ledger</p>
              <p className="mt-1 font-display text-lg italic text-[var(--ink)]">Governed metrics</p>
              <div className="mt-4 space-y-3">
                {METRICS.map((m) => (
                  <div key={m.key} className="rounded-xl border border-[var(--line)] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--ink)]">{m.label}</span>
                      <span className="rounded-full bg-[var(--verified-soft)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--verified)]">Governed</span>
                    </div>
                    <p className="mt-1.5 font-mono text-[11px] text-[var(--ink-soft)]">{m.formula}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-shadow rise-in rounded-3xl border border-[var(--line)] bg-[var(--paper-raised)] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-soft)]">Last verified query</p>
              {lastSql ? (
                <p className="mt-2 rounded-lg bg-[var(--paper)] p-3 font-mono text-[11px] leading-relaxed text-[var(--ink)]">{lastSql}</p>
              ) : (
                <p className="mt-2 text-sm text-[var(--ink-soft)]">No query run yet.</p>
              )}
            </div>

            {log.length > 0 && (
              <div className="card-shadow rise-in rounded-3xl border border-[var(--line)] bg-[var(--paper-raised)] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-soft)]">Session activity</p>
                <div className="mt-3 space-y-2.5">
                  {log.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2 text-xs">
                      <span className="mt-0.5 font-mono text-[10px] text-[var(--ink-soft)]">{entry.time}</span>
                      <span className="text-[var(--ink)]">{entry.question}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}