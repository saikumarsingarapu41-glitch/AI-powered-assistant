import os
import uvicorn
import pandas as pd
from io import BytesIO
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

from modules.data_cleaning import load_data, clean_data, get_data_summary, detect_data_types
from modules.database import (
    create_database, get_schema, execute_query, clear_database,
    get_tables, get_active_table, set_active_table, get_table_info
)
from modules.sql_generator import generate_sql, validate_sql, suggest_sample_questions
from modules.insights import generate_insight
from modules.prediction import run_prediction, get_prediction_columns

load_dotenv()

app = FastAPI(
    title="AI Data Analytics API",
    description="Production-grade Backend API for Natural Language Data Analytics, Text-to-SQL, Dynamic Visualizations, and Machine Learning",
    version="2.1.0"
)

# Enable CORS for React frontend (Vite / local ports)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str
    table_name: Optional[str] = None
    
class PredictRequest(BaseModel):
    table_name: Optional[str] = None
    target_col: str
    feature_cols: List[str]

class ConfigRequest(BaseModel):
    api_key: Optional[str] = None
    model: Optional[str] = "gpt-4o-mini"
    base_url: Optional[str] = None

class SelectTableRequest(BaseModel):
    table_name: str

class ExecuteSqlRequest(BaseModel):
    sql: str
    table_name: Optional[str] = None

class QueryResponse(BaseModel):
    sql: str
    insight: str
    data: List[Dict[str, Any]]
    columns: List[str] = []
    row_count: int = 0
    table_name: str = "dataset"
    error: Optional[str] = None

def resolve_table_name(table_name: Optional[str]) -> str:
    """Resolve which table to query: user specified, active, or first available."""
    tables = get_tables()
    if not tables:
        return "dataset"
    if table_name and table_name in tables:
        return table_name
    active = get_active_table()
    if active in tables:
        return active
    return tables[0]

def sanitize_table_name(filename: str) -> str:
    """Transform an arbitrary filename into a valid SQLite identifier."""
    base_name = os.path.splitext(filename)[0]
    cleaned = "".join(c if c.isalnum() or c == "_" else "_" for c in base_name).strip("_").lower()
    if not cleaned:
        cleaned = "dataset"
    # If starting with a digit, prefix with 'tbl_'
    if cleaned[0].isdigit():
        cleaned = f"tbl_{cleaned}"
    return cleaned

def persist_env_config(key: Optional[str], model: Optional[str], base_url: Optional[str] = None):
    """Save API configuration to .env file for persistence across server restarts."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(base_dir, ".env")
    
    current_lines = []
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            current_lines = f.readlines()
            
    config_dict = {}
    for line in current_lines:
        line_s = line.strip()
        if "=" in line_s and not line_s.startswith("#"):
            k, v = line_s.split("=", 1)
            config_dict[k.strip()] = v.strip()
            
    if key is not None:
        config_dict["LLM_API_KEY"] = key
    if model is not None:
        config_dict["LLM_MODEL"] = model
    if base_url is not None:
        config_dict["LLM_BASE_URL"] = base_url
        
    with open(env_path, "w", encoding="utf-8") as f:
        for k, v in config_dict.items():
            f.write(f"{k}={v}\n")

@app.get("/")
@app.get("/health")
@app.get("/status")
async def get_status():
    """Return backend health status, active tables, column counts, and LLM configuration."""
    tables = get_tables()
    active_table = get_active_table() if tables else None
    api_key = os.getenv("LLM_API_KEY", "")
    has_llm = bool(api_key and api_key != "YOUR_API_KEY_HERE")
    
    total_rows = 0
    columns = []
    if active_table:
        try:
            df_count = execute_query(f'SELECT COUNT(*) AS c FROM "{active_table}";')
            total_rows = int(df_count.iloc[0]["c"]) if not df_count.empty else 0
            df_sample = execute_query(f'SELECT * FROM "{active_table}" LIMIT 1;')
            columns = list(df_sample.columns)
        except Exception:
            pass

    return {
        "status": "online",
        "has_data": len(tables) > 0,
        "active_table": active_table,
        "tables": tables,
        "total_rows": total_rows,
        "columns": columns,
        "llm_configured": has_llm,
        "llm_model": os.getenv("LLM_MODEL", "gpt-4o-mini")
    }

@app.get("/tables")
async def list_tables():
    """Retrieve all available tables with row counts and column schemas."""
    tables = get_tables()
    active = get_active_table()
    table_details = []
    
    for t in tables:
        try:
            count_df = execute_query(f'SELECT COUNT(*) AS total FROM "{t}";')
            total = int(count_df.iloc[0]["total"]) if not count_df.empty else 0
            cols = get_table_info(t)
            table_details.append({
                "table_name": t,
                "is_active": t == active,
                "total_rows": total,
                "column_count": len(cols),
                "columns": [c["name"] for c in cols]
            })
        except Exception:
            table_details.append({
                "table_name": t,
                "is_active": t == active,
                "total_rows": 0,
                "column_count": 0,
                "columns": []
            })
            
    return {"tables": table_details, "active_table": active}

@app.post("/select-table")
async def select_active_table(req: SelectTableRequest):
    """Switch the current active table."""
    tables = get_tables()
    if req.table_name not in tables:
        raise HTTPException(status_code=404, detail=f"Table '{req.table_name}' does not exist in database.")
    set_active_table(req.table_name)
    return {"status": "success", "active_table": req.table_name}

@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload CSV or Excel file, clean it, create database table, and return summary."""
    if not file.filename.endswith(('.csv', '.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Only CSV or Excel files are supported.")
        
    try:
        contents = await file.read()
        file_obj = BytesIO(contents)
        file_obj.name = file.filename
        
        raw_df = load_data(file_obj)
        clean_df = clean_data(raw_df)
        table_name = sanitize_table_name(file.filename)
            
        create_database(clean_df, table_name)
        metrics = get_data_summary(clean_df)
        schema = get_schema(table_name)
        suggestions = suggest_sample_questions(schema, table_name)
        dtypes = detect_data_types(clean_df)
        
        # Preview records (up to 15 rows)
        preview_df = clean_df.head(15).fillna("N/A")
        preview = preview_df.to_dict(orient="records")
        
        return {
            "status": "success",
            "table_name": table_name,
            "metrics": metrics,
            "columns": list(clean_df.columns),
            "data_types": dtypes,
            "preview": preview,
            "suggestions": suggestions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/load-sample")
async def load_sample_dataset(dataset_type: str = Query("sales", description="Type of sample: 'sales' or 'census'")):
    """Load default sample dataset (sales_data.csv or census_data.csv) for instant demo testing."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    filename = "census_data.csv" if dataset_type.lower() == "census" else "sales_data.csv"
    table_name = "census_data" if dataset_type.lower() == "census" else "sales_data"
    
    sample_path = os.path.join(base_dir, "data", filename)
    if not os.path.exists(sample_path):
        # Fallback to sales_data.csv
        sample_path = os.path.join(base_dir, "data", "sales_data.csv")
        table_name = "sales_data"
        if not os.path.exists(sample_path):
            raise HTTPException(status_code=404, detail="Sample dataset file not found.")
        
    try:
        with open(sample_path, "rb") as f:
            file_obj = BytesIO(f.read())
            file_obj.name = filename
            raw_df = load_data(file_obj)
            
        clean_df = clean_data(raw_df)
        create_database(clean_df, table_name)
        
        metrics = get_data_summary(clean_df)
        schema = get_schema(table_name)
        suggestions = suggest_sample_questions(schema, table_name)
        dtypes = detect_data_types(clean_df)
        
        preview_df = clean_df.head(15).fillna("N/A")
        preview = preview_df.to_dict(orient="records")
        
        return {
            "status": "success",
            "table_name": table_name,
            "metrics": metrics,
            "columns": list(clean_df.columns),
            "data_types": dtypes,
            "preview": preview,
            "suggestions": suggestions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load sample dataset: {str(e)}")

@app.get("/preview/{table_name}")
async def get_table_preview(table_name: str, limit: int = 50, offset: int = 0):
    """Retrieve preview records and column metadata for a given table with pagination."""
    resolved = resolve_table_name(table_name)
    try:
        df = execute_query(f'SELECT * FROM "{resolved}" LIMIT {limit} OFFSET {offset};')
        df = df.fillna("N/A")
        count_df = execute_query(f'SELECT COUNT(*) AS total FROM "{resolved}";')
        total = int(count_df.iloc[0]["total"]) if not count_df.empty else len(df)
        
        return {
            "table_name": resolved,
            "total_rows": total,
            "limit": limit,
            "offset": offset,
            "columns": list(df.columns),
            "records": df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/suggestions/{table_name}")
async def get_suggestions(table_name: str):
    """Retrieve dynamic prompt suggestions tailored for a specific table."""
    resolved = resolve_table_name(table_name)
    schema = get_schema(resolved)
    suggestions = suggest_sample_questions(schema, resolved)
    return {"table_name": resolved, "suggestions": suggestions}

@app.post("/query", response_model=QueryResponse)
async def query_data(req: QueryRequest):
    """Translate natural language query to SQL, execute safely, and return insight & chart records."""
    table_name = resolve_table_name(req.table_name)
    schema = get_schema(table_name)
    
    if "does not exist" in schema or not schema:
        raise HTTPException(status_code=404, detail="No dataset uploaded yet. Please upload a dataset first.")
        
    max_retries = 2
    retry_count = 0
    error_msg = None
    sql_query = ""
    result_df = None
    
    while retry_count <= max_retries:
        prompt_question = req.question
        if retry_count > 0:
            prompt_question = f"{req.question}\n\nNote: The previous query failed with: {error_msg}. Please adjust column names or syntax."
            
        sql_query = generate_sql(prompt_question, schema, table_name)
        is_valid, validation_msg = validate_sql(sql_query)
        
        if is_valid:
            try:
                result_df = execute_query(sql_query)
                error_msg = None
                break
            except Exception as e:
                error_msg = str(e)
                retry_count += 1
                continue
        else:
            error_msg = validation_msg
            break
            
    if error_msg or result_df is None:
        return QueryResponse(
            sql=sql_query,
            insight="Query execution could not be completed with the current dataset schema.",
            data=[],
            columns=[],
            row_count=0,
            table_name=table_name,
            error=error_msg or "Failed to execute query."
        )
        
    insight = generate_insight(req.question, result_df)
    
    # Replace NaN/Infinity for clean JSON serialization
    result_df = result_df.fillna("N/A")
    data_records = result_df.to_dict(orient="records")
    cols = list(result_df.columns)
    
    return QueryResponse(
        sql=sql_query,
        insight=insight,
        data=data_records,
        columns=cols,
        row_count=len(result_df),
        table_name=table_name,
        error=None
    )

@app.post("/execute-sql", response_model=QueryResponse)
async def execute_custom_sql(req: ExecuteSqlRequest):
    """Directly execute a custom SQL query with strict read-only safety validation."""
    table_name = resolve_table_name(req.table_name)
    is_valid, validation_msg = validate_sql(req.sql)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Validation error: {validation_msg}")
        
    try:
        result_df = execute_query(req.sql)
        insight = generate_insight("Custom SQL execution", result_df)
        result_df = result_df.fillna("N/A")
        
        return QueryResponse(
            sql=req.sql,
            insight=insight,
            data=result_df.to_dict(orient="records"),
            columns=list(result_df.columns),
            row_count=len(result_df),
            table_name=table_name,
            error=None
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL error: {str(e)}")

@app.get("/columns/{table_name}")
async def get_columns(table_name: str):
    """Retrieve numerical, categorical, and all columns for ML prediction and charts."""
    resolved = resolve_table_name(table_name)
    try:
        df = execute_query(f'SELECT * FROM "{resolved}" LIMIT 25;')
        num_cols = get_prediction_columns(df)
        all_cols = list(df.columns)
        cat_cols = [c for c in all_cols if c not in num_cols]
        return {
            "table_name": resolved,
            "all_columns": all_cols,
            "numerical_columns": num_cols,
            "categorical_columns": cat_cols
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
async def predict_data(req: PredictRequest):
    """Train linear regression and return model coefficients, R2, MAE, formula, and actual vs predicted points."""
    resolved = resolve_table_name(req.table_name)
    try:
        df = execute_query(f'SELECT * FROM "{resolved}";')
        if df.empty:
            raise HTTPException(status_code=400, detail="Table contains no records.")
            
        result = run_prediction(df, req.target_col, req.feature_cols)
        return {
            "status": "success",
            "table_name": resolved,
            "target": req.target_col,
            "features": req.feature_cols,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/config")
async def update_config(req: ConfigRequest):
    """Update runtime and persistent LLM API configuration."""
    if req.api_key is not None:
        os.environ["LLM_API_KEY"] = req.api_key
    if req.model:
        os.environ["LLM_MODEL"] = req.model
    if req.base_url:
        os.environ["LLM_BASE_URL"] = req.base_url
        
    try:
        persist_env_config(req.api_key, req.model, req.base_url)
    except Exception:
        pass
        
    return {"status": "success", "message": "Configuration updated and persisted successfully."}

@app.delete("/database")
async def clear_db():
    """Clear and reset the SQLite database."""
    success, msg = clear_database()
    return {"status": "success" if success else "error", "message": msg}

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
