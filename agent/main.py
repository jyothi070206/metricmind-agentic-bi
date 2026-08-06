import os
from dotenv import load_dotenv
import snowflake.connector
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool

load_dotenv()

# --- Cost Governance: limit how many database queries can run per session ---
MAX_QUERIES_PER_SESSION = 8
query_count = {"count": 0}

class QueryLimitExceeded(Exception):
    pass

def run_snowflake_query(sql: str):
    if query_count["count"] >= MAX_QUERIES_PER_SESSION:
        raise QueryLimitExceeded(
            f"Query limit reached ({MAX_QUERIES_PER_SESSION} queries per session). "
            f"This protects against unbounded, expensive database usage."
        )
    query_count["count"] += 1

    conn = snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
    )
    cursor = conn.cursor()
    cursor.execute(sql)
    result = cursor.fetchall()
    conn.close()
    return result

# --- Internal functions: run the governed query and show the SQL used (transparency) ---

def _get_total_revenue():
    sql = "SELECT total_revenue FROM governance_check"
    result = run_snowflake_query(sql)
    return f"Total revenue is {result[0][0]}\n[Query used: {sql}]"

def _get_total_margin():
    sql = "SELECT total_margin FROM governance_check"
    result = run_snowflake_query(sql)
    return f"Total margin is {result[0][0]}\n[Query used: {sql}]"

def _get_margin_percentage():
    sql = "SELECT margin_percentage FROM governance_check"
    result = run_snowflake_query(sql)
    return f"Margin percentage is {result[0][0]}%\n[Query used: {sql}]"

def _get_full_breakdown():
    sql = "SELECT total_revenue, total_margin, margin_percentage FROM governance_check"
    result = run_snowflake_query(sql)
    revenue, margin, margin_pct = result[0]
    cost = revenue - margin
    return (
        f"Here is the full breakdown: "
        f"Total Revenue = {revenue}, "
        f"Total Cost = {cost}, "
        f"Total Margin (Profit) = {margin}, "
        f"Margin Percentage = {margin_pct}%. "
        f"This means for every unit of revenue, the company keeps "
        f"{margin_pct}% as profit after costs.\n[Query used: {sql}]"
    )

# --- These are the ONLY approved "actions" the AI is allowed to take ---
# This is the governance rule in action: the AI cannot write its own SQL.

@tool
def get_total_revenue() -> str:
    """Use this to answer questions about total revenue."""
    return _get_total_revenue()

@tool
def get_total_margin() -> str:
    """Use this to answer questions about total margin or profit."""
    return _get_total_margin()

@tool
def get_margin_percentage() -> str:
    """Use this to answer questions about margin percentage."""
    return _get_margin_percentage()

@tool
def get_full_breakdown() -> str:
    """Use this when the user asks a broader question like 'why' something
    happened, or wants a full breakdown of revenue, cost, and margin together,
    not just one single number."""
    return _get_full_breakdown()

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.1, timeout=10, max_retries=0)
tools = [get_total_revenue, get_total_margin, get_margin_percentage, get_full_breakdown]
agent = create_react_agent(llm, tools)

def fallback_answer(question: str) -> str:
    """If the AI model is unavailable or loops, fall back to simple
    keyword matching so the governed data can still be queried directly."""
    q = question.lower()
    if "why" in q or "breakdown" in q:
        return _get_full_breakdown()
    elif "percentage" in q or "percent" in q or "%" in q:
        return _get_margin_percentage()
    elif "margin" in q or "profit" in q:
        return _get_total_margin()
    elif "revenue" in q:
        return _get_total_revenue()
    else:
        return "I can answer questions about revenue, margin, margin percentage, or a full breakdown."

if __name__ == "__main__":
    question = input("Ask MetricMind a question: ")
    try:
        result = agent.invoke(
            {"messages": [{"role": "user", "content": question}]},
            config={"recursion_limit": 15},
        )
        final_answer = result["messages"][-1].content
        print("\nAnswer:", final_answer)
    except QueryLimitExceeded as e:
        print(f"\n[Cost governance triggered]: {e}")
        print("[Falling back to direct governed lookup for this question]")
        query_count["count"] = 0
        try:
            print("Answer:", fallback_answer(question))
        except QueryLimitExceeded as e2:
            print(f"[Cost governance triggered again]: {e2}")
    except Exception as e:
        print(f"\n[AI model unavailable: {type(e).__name__} — using fallback logic]")
        try:
            print("Answer:", fallback_answer(question))
        except QueryLimitExceeded as e2:
            print(f"[Cost governance triggered]: {e2}")