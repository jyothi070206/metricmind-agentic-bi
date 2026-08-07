import Link from 'next/link';

const STEPS = [
  { n: '01', title: 'Ask', text: 'Type a plain-English question about revenue, margin, or cost.' },
  { n: '02', title: 'Verify', text: 'The agent checks the answer against the governed Semantic Layer — never raw SQL.' },
  { n: '03', title: 'Deliver', text: 'You get the number, the exact query used, and a chart — all traceable.' },
];

const METRICS = [
  { label: 'Total Revenue', formula: 'SUM(revenue)' },
  { label: 'Total Margin', formula: 'SUM(revenue) − SUM(cost)' },
  { label: 'Margin %', formula: 'margin ÷ revenue × 100' },
];

function VerifiedStamp() {
  return (
    <svg viewBox="0 0 64 64" className="stamp h-16 w-16 shrink-0" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="none" stroke="var(--verified)" strokeWidth="2" strokeDasharray="3 4" />
      <circle cx="32" cy="32" r="23" fill="var(--verified-soft)" stroke="var(--verified)" strokeWidth="1.5" />
      <path d="M21 33.5 L28 40 L44 24" fill="none" stroke="var(--verified)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper-raised)] px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
              Governed Semantic BI
            </p>
            <h1 className="font-display text-2xl italic text-[var(--ink)]">MetricMind</h1>
          </div>
          <Link
            href="/chat"
            className="rounded-xl bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] transition hover:opacity-90"
          >
            Open Console →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
        <section className="rise-in flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <VerifiedStamp />
          <div>
            <h2 className="font-display text-3xl italic leading-tight text-[var(--ink)] sm:text-4xl">
              Ask, and every answer is verified.
            </h2>
            <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
              Letting an AI write its own database queries leads to hallucinated numbers.
              MetricMind forces every answer through a governed Semantic Layer, so Finance
              and Sales always see the exact same number — traceable to the exact query used.
            </p>
            <Link
              href="/chat"
              className="mt-6 inline-block rounded-xl bg-[var(--ink)] px-6 py-3 text-sm font-medium text-[var(--paper)] transition hover:opacity-90"
            >
              Ask a question →
            </Link>
          </div>
        </section>

        <section className="mt-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            How it works
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rise-in card-shadow rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-5">
                <p className="font-mono text-xs text-[var(--brass)]">{s.n}</p>
                <p className="mt-1 font-display text-lg italic text-[var(--ink)]">{s.title}</p>
                <p className="mt-1.5 text-sm text-[var(--ink-soft)]">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            Semantic Ledger
          </p>
          <p className="mt-1 font-display text-xl italic text-[var(--ink)]">Governed metrics</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {METRICS.map((m) => (
              <div key={m.label} className="rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-4">
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
        </section>
      </main>

      <footer className="border-t border-[var(--line)] px-6 py-6 text-center sm:px-10">
        <p className="text-xs text-[var(--ink-soft)]">MetricMind — a governed analytics prototype.</p>
      </footer>
    </div>
  );
}