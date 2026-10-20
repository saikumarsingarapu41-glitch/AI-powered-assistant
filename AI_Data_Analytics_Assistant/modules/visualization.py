import plotly.express as px
import pandas as pd
from typing import Dict, Any, Optional

def recommend_chart_spec(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Determine the optimal chart type, dimensions, and titles for rendering in frontend or Plotly.
    """
    if df is None or df.empty or len(df.columns) < 2:
        return {"chart_type": "none", "x": None, "y": None, "title": ""}
        
    cols = list(df.columns)
    num_cols = df.select_dtypes(include=['number']).columns.tolist()
    cat_cols = [c for c in cols if c not in num_cols]
    
    # Identify date columns
    date_cols = []
    for c in cols:
        if pd.api.types.is_datetime64_any_dtype(df[c]) or any(w in c.lower() for w in ['date', 'time', 'year']):
            date_cols.append(c)

    if date_cols and num_cols:
        x_col = date_cols[0]
        y_col = num_cols[-1]
        return {
            "chart_type": "line",
            "x": x_col,
            "y": y_col,
            "title": f"{y_col.replace('_', ' ').title()} Over Time ({x_col})"
        }
    elif cat_cols and num_cols:
        x_col = cat_cols[0]
        y_col = num_cols[-1]
        unique_count = len(df[x_col].unique())
        chart_type = "pie" if unique_count <= 6 and unique_count > 1 else "bar"
        return {
            "chart_type": chart_type,
            "x": x_col,
            "y": y_col,
            "title": f"{y_col.replace('_', ' ').title()} by {x_col.replace('_', ' ').title()}"
        }
    elif len(num_cols) >= 2:
        return {
            "chart_type": "scatter",
            "x": num_cols[0],
            "y": num_cols[1],
            "title": f"{num_cols[1].replace('_', ' ').title()} vs {num_cols[0].replace('_', ' ').title()}"
        }
    else:
        return {"chart_type": "table", "x": cols[0], "y": None, "title": "Data Table"}

def generate_visualization(df: pd.DataFrame):
    """Automatically determine and render a suitable Plotly visualization in Streamlit."""
    try:
        import streamlit as st
    except ImportError:
        return

    if df.empty or len(df.columns) < 2:
        st.info("Result requires at least two columns for visualization.")
        return
        
    spec = recommend_chart_spec(df)
    chart_type = spec["chart_type"]
    x = spec["x"]
    y = spec["y"]
    title = spec["title"]
    
    st.subheader("📊 Visualization")
    try:
        if chart_type == "line":
            st.plotly_chart(px.line(df, x=x, y=y, title=title), use_container_width=True)
        elif chart_type in ["bar", "pie"]:
            if len(df[x].unique()) <= 10:
                user_choice = st.radio("Select Chart Type", ["Bar Chart", "Pie Chart"], horizontal=True, key=f"chart_{x}")
                if user_choice == "Bar Chart":
                    st.plotly_chart(px.bar(df, x=x, y=y, title=title), use_container_width=True)
                else:
                    st.plotly_chart(px.pie(df, names=x, values=y, title=title), use_container_width=True)
            else:
                st.plotly_chart(px.bar(df, x=x, y=y, title=title), use_container_width=True)
        elif chart_type == "scatter":
            st.plotly_chart(px.scatter(df, x=x, y=y, title=title), use_container_width=True)
        else:
            st.info("Tabular view recommended for this result structure.")
    except Exception as e:
        st.warning(f"Could not generate visualization: {str(e)}")
