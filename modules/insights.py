import pandas as pd
import numpy as np
from typing import Optional
from .llm import ask_llm

def format_metric_value(val: any, col_name: str = "") -> str:
    """Format numerical values nicely with currency, percent, or commas."""
    if pd.isna(val):
        return "N/A"
    if isinstance(val, (int, float, np.number)):
        col_lower = col_name.lower()
        if 'percent' in col_lower or 'rate' in col_lower or 'discount' in col_lower:
            # Check if fractional (e.g. 0.08) or already percentage (e.g. 8.0)
            if 0.0 <= val <= 1.0 and 'percent_of_total' in col_lower:
                return f"{val * 100:.2f}%"
            elif 0.0 <= val <= 1.0:
                return f"{val * 100:.1f}%"
            return f"{val:.2f}%"
        elif any(w in col_lower for w in ['revenue', 'sales', 'profit', 'price', 'cost', 'amount', 'income']):
            if isinstance(val, (int, np.integer)) or float(val).is_integer():
                return f"${int(val):,}"
            return f"${val:,.2f}"
        else:
            if isinstance(val, (int, np.integer)) or float(val).is_integer():
                return f"{int(val):,}"
            return f"{val:,.2f}"
    return str(val)

def generate_statistical_insight(question: str, result_df: pd.DataFrame) -> str:
    """Generate clear, professional analytical narrative from the dataframe numbers without external API."""
    if result_df is None or result_df.empty:
        return "The query returned an empty result set. No records matched the specified criteria."
        
    num_rows = len(result_df)
    cols = list(result_df.columns)
    
    # Case 1: Single cell (e.g. Total count or sum or avg)
    if num_rows == 1 and len(cols) == 1:
        val = result_df.iloc[0, 0]
        formatted_val = format_metric_value(val, cols[0])
        clean_col = cols[0].replace('_', ' ').title()
        return f"The total calculated **{clean_col}** is **{formatted_val}**."
        
    # Case 2: 1 row, multiple columns (e.g. specific entity or summary row)
    if num_rows == 1:
        # Check if first col is text and second is numeric
        first_col = cols[0]
        first_val = result_df.iloc[0, 0]
        if not pd.api.types.is_numeric_dtype(result_df[first_col]):
            metric_descriptions = []
            for c in cols[1:]:
                formatted_v = format_metric_value(result_df.iloc[0][c], c)
                clean_c = c.replace('_', ' ').title()
                metric_descriptions.append(f"**{clean_c}** is **{formatted_v}**")
            return f"For **{first_val}**, the {', and the '.join(metric_descriptions)}."
        else:
            items = [f"{c.replace('_', ' ').title()}: **{format_metric_value(result_df.iloc[0][c], c)}**" for c in cols]
            return f"Calculated metrics: {', '.join(items)}."
        
    # Case 3: Grouped / Ranked data (e.g. Category vs Sum)
    first_col = cols[0]
    num_cols = [c for c in cols if pd.api.types.is_numeric_dtype(result_df[c])]
    
    if num_cols:
        metric = num_cols[-1]
        top_row = result_df.iloc[0]
        top_entity = top_row[first_col]
        top_val = top_row[metric]
        formatted_top = format_metric_value(top_val, metric)
        clean_metric = metric.replace('_', ' ').title()
        
        total_sum = result_df[metric].sum()
        if total_sum > 0 and isinstance(top_val, (int, float)):
            share = (top_val / total_sum) * 100
            lowest_row = result_df.iloc[-1]
            lowest_entity = lowest_row[first_col]
            formatted_lowest = format_metric_value(lowest_row[metric], metric)
            
            if num_rows > 2:
                return (
                    f"**{top_entity}** ranks #1 for **{clean_metric}** with **{formatted_top}**, "
                    f"accounting for **{share:.1f}%** of the results shown across {num_rows} records. "
                    f"The lowest in this group is **{lowest_entity}** at **{formatted_lowest}**."
                )
            else:
                return (
                    f"**{top_entity}** leads for **{clean_metric}** with **{formatted_top}** "
                    f"({share:.1f}% of total across {num_rows} entries)."
                )
        else:
            return f"**{top_entity}** is the leading record with **{formatted_top}** in **{clean_metric}** across {num_rows} entries."
            
    # Case 4: Non-numeric preview / listing
    return f"Returned {num_rows} records. The leading entry is **{result_df.iloc[0][first_col]}**."

def generate_insight(question: str, result_df: pd.DataFrame) -> str:
    """Generate a natural language explanation for the SQL result with statistical fallback."""
    if result_df is None or result_df.empty:
        return "The query returned no results, so no insight can be generated."
        
    system_prompt = (
        "You are an expert Data Analyst.\n"
        "You will be given a user's question and the exact result data from a database query.\n"
        "Your task is to explain the result clearly and concisely in natural language.\n"
        "IMPORTANT RULES:\n"
        "- Only use the data provided in the result.\n"
        "- DO NOT invent, guess, or hallucinate numbers.\n"
        "- Keep the explanation brief, accurate, and easy to understand (1-3 sentences).\n"
        "- Highlight key numbers, rankings, or percentages.\n"
        "- If the result is just a single number, answer the question directly with that number."
    )
    
    user_prompt = f"Question: {question}\n\nQuery Result:\n{result_df.head(20).to_dict(orient='records')}"
    
    try:
        insight = ask_llm(system_prompt, user_prompt)
        return insight
    except Exception:
        # Seamlessly fallback to automated statistical narrative
        return generate_statistical_insight(question, result_df)
