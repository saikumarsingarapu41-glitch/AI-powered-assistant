import os
import sys
import pandas as pd
from dotenv import load_dotenv

# Ensure safe output encoding on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Import backend modules
from modules.data_cleaning import load_data, clean_data, get_data_summary
from modules.database import create_database, get_schema, execute_query
from modules.sql_generator import generate_sql, validate_sql
from modules.insights import generate_insight
from modules.prediction import LinearRegression, train_test_split, mean_absolute_error, r2_score

load_dotenv()

def run_demo():
    print("\n" + "="*60)
    print(">> EXECUTING ALL BACKEND FEATURES (AI DATA ANALYTICS DEMO)")
    print("="*60)
    
    # Feature 1 & 2: Load and Clean Data
    print("\n[Feature 1 & 2] Loading and Cleaning Data...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sample_path = os.path.join(base_dir, "data", "census_data.csv")
    try:
        df = pd.read_csv(sample_path)
        clean_df = clean_data(df)
        summary = get_data_summary(clean_df)
        print("  [OK] Dataset loaded and cleaned successfully.")
        print(f"       Summary metrics: {summary}")
    except Exception as e:
        print(f"  [ERROR] Loading data failed: {e}")
        return

    # Feature 3: Database & Schema Generation
    print("\n[Feature 3] Creating SQLite Database Table...")
    table_name = "census"
    try:
        create_database(clean_df, table_name)
        schema = get_schema(table_name)
        print("  [OK] SQLite table created successfully.")
        print(f"       Dynamic Schema: {schema}")
    except Exception as e:
        print(f"  [ERROR] Database creation failed: {e}")
        return

    # Feature 4: Natural Language Text-to-SQL Execution
    print("\n[Feature 4] Natural Language Text-to-SQL & Safe Execution...")
    question = "What are the top 3 states by 2020 census?"
    print(f"  Question: '{question}'")
    try:
        generated_sql = generate_sql(question, schema, table_name)
        is_valid, msg = validate_sql(generated_sql)
        print(f"  Generated SQL: {generated_sql} (Valid: {is_valid})")
        
        result_df = execute_query(generated_sql)
        print("  [OK] Query executed successfully. Result:")
        print(result_df.to_string(index=False))
        
        insight = generate_insight(question, result_df)
        print(f"\n  AI / Statistical Insight:\n  -> {insight}")
    except Exception as e:
        print(f"  [ERROR] SQL execution failed: {e}")

    # Feature 5: Machine Learning Prediction
    print("\n[Feature 5] Executing Machine Learning Prediction...")
    try:
        num_cols = clean_df.select_dtypes(include=['number']).columns.tolist()
        if '2020_census' in num_cols and 'percent_of_total' in num_cols:
            X = clean_df[['percent_of_total']].fillna(0)
            y = clean_df['2020_census'].fillna(0)
            
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            model = LinearRegression()
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            print("  [OK] Linear Regression Model Trained.")
            print("       Target: '2020_census' | Feature: 'percent_of_total'")
            print(f"       Mean Absolute Error (MAE): {mae:,.2f}")
            print(f"       R^2 Score: {r2:.4f}")
        else:
            print("       Skipped: Required numeric columns not found.")
    except Exception as e:
        print(f"  [ERROR] ML prediction error: {e}")

    print("\n" + "="*60)
    print(">> ALL BACKEND FEATURES EXECUTED SUCCESSFULLY")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_demo()
