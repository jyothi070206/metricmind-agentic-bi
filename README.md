# MetricMind — Agentic Semantic BI Engine

## Problem Statement
Giving an LLM raw access to a data warehouse for Text-to-SQL leads to 
hallucinated joins and inconsistent metrics across teams (e.g., Finance 
vs Sales seeing different "revenue" numbers). This breaks trust in 
AI-generated analytics.

## Solution Approach
Instead of letting the LLM write raw SQL, MetricMind routes all queries 
through a governed Semantic Layer (Cube.dev/dbt) that mathematically 
defines every business metric once. The LLM acts purely as an 
orchestrator — translating natural language into semantic API calls, 
not SQL — guaranteeing every user gets the same governed number.

## Architecture
- **Semantic Layer (dbt / Cube.dev)** — single source of truth for metrics
- **Agentic Orchestrator (LangChain)** — NL → semantic API calls
- **Data Lakehouse (Snowflake)** — underlying storage/compute
- **Conversational UI (Next.js + Tremor/ECharts)** — chat interface with 
  rendered charts

## Why This Matters
Demonstrates governed AI-BI integration — a real 2026 enterprise pain 
point (trustworthy agentic analytics vs. hallucination-prone Text-to-SQL).

## Progress Log
### Week 1
- **Day 1**: Repo setup, architecture study, planned data model 
  (dimensions: Time, Geography; measures: Revenue, Cost, Margin)
- **Day 2**: Scaffolded Next.js chat interface (TypeScript + Tailwind, 
     App Router). Basic UI shell — message list + input box — no backend 
     logic yet.
- **Day 3**: Set up Snowflake warehouse (METRICMIND_DB), loaded mock 
  sales data (RAW_SALES table). Initialized dbt project, connected to 
  Snowflake, and built first staging model (stg_sales) with computed 
  margin column.
- **Day 4**: Defined the Semantic Layer using dbt (entities, 
  dimensions, measures for sales data). Created governed metrics 
  (total_revenue, total_margin, margin_percentage). Added required 
  time-spine model for date-based grouping.
- **Day 5**: Ran Governance Audit — built governance_check model on 
  governed staging layer, confirmed identical results across 3 
  repeated runs, proving deterministic metric calculation with no 
  hallucination risk.
  
### Week 2
- **Day 6**: Set up LangChain AI agent (using free Groq/Llama model). 
  Connected agent to Snowflake via 3 pre-approved governed tools 
  (get_total_revenue, get_total_margin, get_margin_percentage) — the 
  AI cannot write its own SQL, it can only call these fixed, 
  governance-approved functions.
- **Day 7**: Ran API Check — tested 3 different natural-language 
  phrasings of questions, confirmed the agent correctly selects the 
  right governed metric tool every time. Documented in api_check.md.

### Week 3
- **Day 8**: Added multi-step reasoning to the AI agent — a new 
  `get_full_breakdown` tool that pulls revenue, cost, and margin 
  together and explains them as a connected story, instead of 
  answering with a single isolated number.
- **Day 9**: Connected the chat interface to dynamic visualizations 
  — added a bar chart (Recharts) that automatically renders when a 
  user asks about revenue, cost, or margin, showing the governed 
  metrics visually inside the chat window.

### Week 4
- **Day 10**: Implemented Cost Governance — added a session query 
  limit to prevent unbounded, expensive database usage by the AI 
  agent. Built a resilient fallback for cases where the free-tier 
  AI model loops during reasoning, guaranteeing accurate answers 
  regardless.
- **Day 11**: Implemented full transparency — every answer (from AI 
  or fallback), on both backend and frontend, now shows the exact 
  governed SQL query used to calculate it. Documented in 
  cost_governance.md.  