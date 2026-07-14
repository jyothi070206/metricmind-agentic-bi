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
