# Cost Governance & Transparency

## Query Limit Safeguard
Implemented a session-level query limit (MAX_QUERIES_PER_SESSION = 8) to 
prevent the AI agent from executing unbounded, expensive queries against 
the data warehouse — directly addressing the "Cost Governance" requirement.

## Resilient Fallback System
During testing, the free-tier AI model occasionally entered reasoning 
loops on certain questions (GraphRecursionError). Rather than failing, 
the system automatically falls back to direct governed-data lookup, 
ensuring the user always receives an accurate answer even when the AI's 
reasoning step is interrupted.

## Full Transparency
Every answer — whether from the AI agent or the fallback system — 
includes the exact SQL query used to retrieve the number, both in the 
backend agent output and in the frontend chat interface (below each chart).

## Example (real test output)
**Question:** What was our total revenue?
**Result:** AI reasoning loop detected → automatic fallback triggered → 
correct governed answer returned with full query transparency.
**Answer:** Total revenue is 141500
**Query used:** SELECT total_revenue FROM governance_check