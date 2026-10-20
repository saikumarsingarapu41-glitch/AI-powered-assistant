import streamlit as st
import pandas as pd
import os
from dotenv import load_dotenv

from modules.data_cleaning import load_data, clean_data, get_data_summary
from modules.database import create_database, get_schema, execute_query
from modules.sql_generator import generate_sql, validate_sql
from modules.insights import generate_insight
from modules.visualization import generate_visualization
from modules.prediction import run_prediction

# Load environment variables
load_dotenv()

# Configure Streamlit page
st.set_page_config(
    page_title="AI-Powered Data Analytics Assistant",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize Session State
if "df" not in st.session_state:
    st.session_state.df = None
if "table_name" not in st.session_state:
    st.session_state.table_name = "sales"
if "history" not in st.session_state:
    st.session_state.history = []
if "metrics" not in st.session_state:
    st.session_state.metrics = None
if "api_key_configured" not in st.session_state:
    api_key = os.getenv("LLM_API_KEY")
    st.session_state.api_key_configured = bool(api_key and api_key != "YOUR_API_KEY_HERE")

def apply_custom_css():
    st.markdown("""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap');
        
        /* Global Light App Styling */
        .stApp {
            background-color: #f8fafc;
            color: #0f172a;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        
        /* Headers */
        .main-header {
            font-size: 3rem;
            background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            margin-bottom: 0.35rem;
            letter-spacing: -0.02em;
            animation: fadeIn 1s ease-in-out;
        }
        .sub-header {
            font-size: 1.15rem;
            color: #475569;
            margin-bottom: 2rem;
            font-weight: 400;
        }

        /* Sidebar Styling */
        [data-testid="stSidebar"] {
            background-color: #ffffff !important;
            border-right: 1px solid #e2e8f0;
        }
        [data-testid="stSidebar"] * {
            color: #1e293b;
        }

        /* Metric Cards */
        [data-testid="metric-container"] {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 1.25rem;
            box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
            transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        [data-testid="metric-container"]:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 24px rgba(2, 132, 199, 0.12);
            border-color: #38bdf8;
        }
        [data-testid="stMetricValue"] {
            color: #0284c7 !important;
            font-weight: 800 !important;
        }
        [data-testid="stMetricLabel"] {
            color: #64748b !important;
            font-weight: 600 !important;
        }

        /* Buttons */
        .stButton>button {
            background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%);
            color: white !important;
            border: none;
            border-radius: 10px;
            padding: 0.55rem 1.25rem;
            font-weight: 600;
            transition: all 0.25s ease;
            box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
        }
        .stButton>button:hover {
            background: linear-gradient(135deg, #0369a1 0%, #4338ca 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35);
        }

        /* Input Fields */
        .stTextInput>div>div>input {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            color: #0f172a;
            border-radius: 10px;
        }
        .stTextInput>div>div>input:focus {
            border-color: #0284c7;
            box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
        }

        /* Expander (History SQL) */
        .streamlit-expanderHeader {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            color: #0f172a !important;
        }

        /* Text colors */
        .success-text { color: #059669; font-weight: 600; }
        .error-text { color: #e11d48; font-weight: 600; }

        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-12px); }
            to { opacity: 1; transform: translateY(0); }
        }
        </style>
    """, unsafe_allow_html=True)

def main():
    apply_custom_css()
    
    # Sidebar
    st.sidebar.title("🤖 AI Data Analytics")
    st.sidebar.markdown("---")
    
    menu = ["🏠 Dashboard", "📂 Upload Dataset", "📊 Data Preview", "🤖 AI Analytics", "📈 Visualizations", "🔮 Prediction", "📄 Reports", "ℹ️ About"]
    choice = st.sidebar.radio("Navigation", menu)
    
    st.sidebar.markdown("---")
    if not st.session_state.api_key_configured:
        st.sidebar.warning("⚠️ LLM API Key not configured. Please add it to your .env file.")
    else:
        st.sidebar.success("✅ LLM API Configured")
        
    st.sidebar.markdown("---")
    st.sidebar.subheader("Database Management")
    if st.sidebar.button("🧹 Clear Database"):
        from modules.database import clear_database
        success, msg = clear_database()
        if success:
            st.session_state.df = None
            st.session_state.table_name = "dataset"
            st.sidebar.success(msg)
        else:
            st.sidebar.error(msg)

    # Header
    st.markdown('<p class="main-header">🤖 AI-Powered Data Analytics Assistant</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Ask questions about your data using natural language.</p>', unsafe_allow_html=True)

    if choice == "🏠 Dashboard":
        show_dashboard()
    elif choice == "📂 Upload Dataset":
        show_upload()
    elif choice == "📊 Data Preview":
        show_preview()
    elif choice == "🤖 AI Analytics":
        show_analytics()
    elif choice == "📈 Visualizations":
        show_visualizations()
    elif choice == "🔮 Prediction":
        show_prediction()
    elif choice == "📄 Reports":
        show_reports()
    elif choice == "ℹ️ About":
        show_about()

def show_dashboard():
    st.header("🏠 Dashboard Overview")
    if st.session_state.df is None:
        st.info("Welcome! Please go to **📂 Upload Dataset** to begin.")
        
        # Check if local sample exists
        sample_path = os.path.join("data", "sales_data.csv")
        if os.path.exists(sample_path):
            if st.button("Load Sample Dataset (sales_data.csv)"):
                with st.spinner("Loading sample data..."):
                    df = pd.read_csv(sample_path)
                    process_dataset(df, "sales")
                    st.rerun()
        return

    metrics = st.session_state.metrics
    st.subheader("Dataset Metrics")
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Rows", metrics.get("Total Rows", 0))
    col2.metric("Total Columns", metrics.get("Total Columns", 0))
    col3.metric("Missing Values", metrics.get("Missing Values", 0))
    col4.metric("Duplicate Rows", metrics.get("Duplicate Rows", 0))
    
    # Display some basic revenue/profit if columns exist
    df = st.session_state.df
    
    numeric_cols = df.select_dtypes(include='number').columns
    rev_col = next((c for c in numeric_cols if 'rev' in c.lower() or 'sales' in c.lower()), None)
    prof_col = next((c for c in numeric_cols if 'prof' in c.lower() or 'margin' in c.lower()), None)
    order_col = next((c for c in df.columns if 'order' in c.lower() or 'id' in c.lower()), None)
    
    st.markdown("---")
    st.subheader("Key Performance Indicators")
    c1, c2, c3, c4 = st.columns(4)
    
    if rev_col:
        total_rev = df[rev_col].sum()
        c1.metric(f"Total {rev_col.title()}", f"₹ {total_rev:,.2f}")
        
    if prof_col:
        total_prof = df[prof_col].sum()
        c2.metric(f"Total {prof_col.title()}", f"₹ {total_prof:,.2f}")
        
    if order_col:
        total_orders = df[order_col].nunique()
        c3.metric(f"Total Orders", f"{total_orders:,}")
        
    if rev_col and order_col:
        avg_order = df[rev_col].sum() / df[order_col].nunique()
        c4.metric(f"Average Order Value", f"₹ {avg_order:,.2f}")
    
    st.markdown("---")
    st.subheader("Data Quick Preview")
    st.dataframe(df.head(10), use_container_width=True)

def show_upload():
    st.header("📂 Upload Dataset")
    uploaded_file = st.file_uploader("Upload CSV or Excel file", type=["csv", "xlsx", "xls"])
    
    if uploaded_file is not None:
        try:
            with st.spinner("Processing dataset..."):
                raw_df = load_data(uploaded_file)
                if raw_df.empty:
                    st.error("The uploaded file is empty.")
                    return
                    
                table_name = os.path.splitext(uploaded_file.name)[0]
                table_name = "".join(c for c in table_name if c.isalnum() or c == "_").lower()
                if not table_name.isidentifier() or not table_name:
                    table_name = "dataset"
                    
                process_dataset(raw_df, table_name)
                st.success(f"Dataset successfully loaded and stored as table `{table_name}`!")
                st.info("Head to Dashboard or AI Analytics to start exploring.")
        except Exception as e:
            st.error(f"Error processing file: {str(e)}")

def process_dataset(df, table_name):
    clean_df = clean_data(df)
    st.session_state.df = clean_df
    st.session_state.table_name = table_name
    st.session_state.metrics = get_data_summary(clean_df)
    create_database(clean_df, table_name)

def show_preview():
    st.header("📊 Data Preview")
    if st.session_state.df is None:
        st.warning("Please upload a dataset first.")
        return
    st.write(f"Showing preview for table: **{st.session_state.table_name}**")
    st.dataframe(st.session_state.df, use_container_width=True)

def show_visualizations():
    st.header("📈 Visualizations")
    if st.session_state.df is None:
        st.warning("Please upload a dataset first.")
        return
    st.write("Automatically render charts from your entire dataset.")
    generate_visualization(st.session_state.df)

def show_analytics():
    st.header("🤖 AI Analytics")
    
    if st.session_state.df is None:
        st.warning("Please upload a dataset first.")
        return
        
    if not st.session_state.api_key_configured:
        st.info("💡 **Heuristic Analytics Engine Active:** No LLM API Key detected in `.env`. You can still ask analytical questions using the deterministic Text-to-SQL engine.")

    st.markdown("### 🤖 Ask Your Dataset")
    
    # Suggested questions
    st.write("**Example questions:**")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("Which product generated the highest revenue?"):
            st.session_state.query_input = "Which product generated the highest revenue?"
        if st.button("What is the total profit by region?"):
            st.session_state.query_input = "What is the total profit by region?"
        if st.button("Show monthly revenue."):
            st.session_state.query_input = "Show monthly revenue."
    with col2:
        if st.button("Which category has the highest sales?"):
            st.session_state.query_input = "Which category has the highest sales?"
        if st.button("What are the top 5 customers?"):
            st.session_state.query_input = "What are the top 5 customers?"
        if st.button("Which region generated the most profit?"):
            st.session_state.query_input = "Which region generated the most profit?"

    # Chat history state preservation
    if 'query_input' not in st.session_state:
        st.session_state.query_input = ""

    question = st.text_input("Enter your natural-language question:", value=st.session_state.query_input, placeholder="Example: Which product generated the highest revenue?")
    
    if st.button("🔍 Analyze", type="primary") and question:
        st.session_state.query_input = question
        with st.spinner("Analyzing..."):
            schema = get_schema(st.session_state.table_name)
            
            try:
                max_retries = 2
                retry_count = 0
                sql_query = ""
                is_valid = False
                validation_msg = ""
                result_df = None
                error_msg = None
                
                # Generate and execute with self-healing retry loop
                while retry_count <= max_retries:
                    # 1. Generate SQL (pass previous error if retrying)
                    prompt_question = question
                    if retry_count > 0:
                        prompt_question = f"{question}\n\nNote: The previous query failed with error: {error_msg}. Please fix the query."
                    
                    sql_query = generate_sql(prompt_question, schema, st.session_state.table_name)
                    
                    # 2. Validate SQL
                    is_valid, validation_msg = validate_sql(sql_query)
                    
                    if is_valid:
                        try:
                            # 3. Execute Query
                            result_df = execute_query(sql_query)
                            error_msg = None
                            break  # Success!
                        except Exception as e:
                            error_msg = str(e)
                            retry_count += 1
                            continue # Try again
                    else:
                        error_msg = validation_msg
                        break # Don't retry validation failures
                
                # 4. Save to history
                current_entry = {
                    "question": question,
                    "sql": sql_query,
                    "validation_msg": validation_msg if not error_msg else f"Failed after {retry_count} retries: {error_msg}",
                    "is_valid": is_valid and (error_msg is None),
                    "result_df": result_df,
                    "insight": "",
                    "error": error_msg
                }
                
                if current_entry["is_valid"]:
                    # 5. Generate Insight
                    insight = generate_insight(question, result_df)
                    current_entry["insight"] = insight
                
                    
                st.session_state.history.append(current_entry)
                
            except Exception as e:
                st.error(f"Error during analysis: {str(e)}")
                return
    
    # Display History (latest first)
    if st.session_state.history:
        entry = st.session_state.history[-1]
        
        st.markdown("---")
        st.subheader("Analysis Result")
        
        st.markdown("**1. Generated SQL Query**")
        with st.expander("View SQL", expanded=True):
            st.code(entry['sql'], language='sql')
            if entry['is_valid']:
                st.markdown(f'<p class="success-text">✓ {entry["validation_msg"]}</p>', unsafe_allow_html=True)
            else:
                st.markdown(f'<p class="error-text">❌ {entry["validation_msg"]}</p>', unsafe_allow_html=True)
                
        if entry['is_valid'] and entry['result_df'] is not None:
            if entry['result_df'].empty:
                st.info("No results found for this question.")
            else:
                st.markdown("**2. Query Result Data**")
                st.dataframe(entry['result_df'], use_container_width=True)
                
                st.markdown("**3. AI Insight**")
                st.info(entry['insight'])
                
                st.markdown("**4. Visualization**")
                generate_visualization(entry['result_df'])
        elif entry['error']:
            st.error(entry['error'])
def show_prediction():
    st.header("🔮 Machine Learning Prediction")
    if st.session_state.df is None:
        st.warning("Please upload a dataset first via the 'Upload Dataset' menu.")
        return
        
    df = st.session_state.df
    num_cols = df.select_dtypes(include=['number']).columns.tolist()
    if len(num_cols) < 2:
        st.info("Machine learning prediction requires at least two numerical columns (1 feature + 1 target).")
        return
        
    st.write("Train a Linear Regression model directly on your active dataset to predict continuous numerical metrics.")
    
    col1, col2 = st.columns(2)
    with col1:
        target = st.selectbox("Target Variable (What to predict):", num_cols, index=len(num_cols)-1)
    with col2:
        available_features = [c for c in num_cols if c != target]
        features = st.multiselect("Feature Variables (Predictors):", available_features, default=available_features)
        
    if st.button("🚀 Train Model", type="primary"):
        if not features:
            st.error("Please select at least one feature column.")
            return
        with st.spinner("Training model..."):
            try:
                res = run_prediction(df, target, features)
                st.success("Model trained successfully!")
                
                # Metrics cards
                m1, m2, m3 = st.columns(3)
                m1.metric("R² Score (Accuracy)", f"{res['r2']:.4f}")
                m2.metric("Mean Absolute Error (MAE)", f"{res['mae']:,.2f}")
                m3.metric("Root Mean Squared Error (RMSE)", f"{res['rmse']:,.2f}")
                
                st.markdown("---")
                st.subheader("Learned Regression Formula")
                st.code(res['formula'], language="text")
                
                # Plot Actual vs Predicted
                if res.get('scatter_data'):
                    st.markdown("---")
                    st.subheader("Actual vs. Predicted Performance")
                    plot_df = pd.DataFrame(res['scatter_data'])
                    import plotly.express as px
                    fig = px.scatter(
                        plot_df, x="actual", y="predicted", 
                        title=f"Actual vs Predicted {target}",
                        labels={"actual": f"Actual {target}", "predicted": f"Predicted {target}"}
                    )
                    min_val = min(plot_df["actual"].min(), plot_df["predicted"].min())
                    max_val = max(plot_df["actual"].max(), plot_df["predicted"].max())
                    fig.add_shape(
                        type="line", x0=min_val, y0=min_val, x1=max_val, y1=max_val,
                        line=dict(color="rgba(56, 189, 248, 0.8)", dash="dash")
                    )
                    st.plotly_chart(fig, use_container_width=True)
            except Exception as e:
                st.error(f"Prediction failed: {str(e)}")

def show_reports():
    st.header("📄 Reports")
    if not st.session_state.history:
        st.info("No analysis history available. Ask a question in 'AI Analytics' first.")
        return
        
    st.write("Generate a summary of your recent analysis session.")
    
    report_text = f"AI Data Analytics Report\nDataset: {st.session_state.table_name}\n"
    report_text += "="*40 + "\n\n"
    
    # Add metrics if available
    if st.session_state.metrics:
        report_text += "Dataset Metrics:\n"
        for k, v in st.session_state.metrics.items():
            report_text += f"- {k}: {v}\n"
        report_text += "\n"
    
    for idx, entry in enumerate(reversed(st.session_state.history)):
        st.markdown(f"### Analysis {len(st.session_state.history) - idx}")
        st.markdown(f"**Question:** {entry['question']}")
        
        report_text += f"Question {len(st.session_state.history) - idx}: {entry['question']}\n"
        report_text += f"SQL: {entry['sql']}\n"
        
        if entry['is_valid'] and entry['result_df'] is not None:
            if not entry['result_df'].empty:
                report_text += f"Insight: {entry['insight']}\n\n"
                with st.expander(f"View details for Analysis {len(st.session_state.history) - idx}"):
                    st.code(entry['sql'], language="sql")
                    st.dataframe(entry['result_df'].head(5))
                    st.write(f"**Insight:** {entry['insight']}")
            else:
                report_text += "Insight: No results returned.\n\n"
        else:
            report_text += f"Error: {entry.get('error', 'Unknown error')}\n\n"
            
    st.download_button(
        label="Download Report (TXT)",
        data=report_text,
        file_name="analytics_report.txt",
        mime="text/plain",
        type="primary"
    )

def show_about():
    st.header("ℹ️ About")
    st.markdown("""
    **Project**: AI-Powered Natural Language Data Analytics Assistant
    
    **Purpose**: An AI-based analytics platform that allows users to analyze structured datasets using natural-language questions. No SQL or Python required.
    
    **Technologies Used**:
    - **Python**: Core programming language
    - **Pandas & NumPy**: Data processing and cleaning
    - **SQL & SQLite**: Database management
    - **LLM (OpenAI API)**: Natural language understanding and generation
    - **Streamlit**: Web application framework
    - **Plotly**: Interactive data visualizations
    - **Scikit-learn**: Machine learning predictions
    - **Git/GitHub**: Version control
    
    Developed as a professional showcase for Full-Stack AI Engineering.
    """)

if __name__ == "__main__":
    main()
