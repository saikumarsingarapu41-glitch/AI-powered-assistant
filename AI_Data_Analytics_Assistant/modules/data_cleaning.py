import pandas as pd
import numpy as np

def load_data(uploaded_file) -> pd.DataFrame:
    """Load data from a CSV or Excel file."""
    name = getattr(uploaded_file, 'name', '')
    if name.endswith('.csv'):
        df = pd.read_csv(uploaded_file)
    elif name.endswith(('.xls', '.xlsx')):
        df = pd.read_excel(uploaded_file)
    else:
        # Fallback inspection if name doesn't have extension
        try:
            df = pd.read_csv(uploaded_file)
        except Exception:
            try:
                df = pd.read_excel(uploaded_file)
            except Exception:
                raise ValueError("Unsupported file format. Please upload a CSV or Excel file.")
    return df

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Perform standard data cleaning."""
    df_clean = df.copy()
    
    # Strip whitespace from column headers
    df_clean.columns = [str(col).strip() for col in df_clean.columns]
    
    # Remove duplicates and impute missing values
    df_clean = remove_duplicates(df_clean)
    df_clean = handle_missing_values(df_clean)
    
    # Strip whitespace from string/object columns (compatible across pandas 2 & 3)
    for col in df_clean.columns:
        if pd.api.types.is_string_dtype(df_clean[col]) or pd.api.types.is_object_dtype(df_clean[col]):
            df_clean[col] = df_clean[col].astype(str).str.strip()
        
    # Attempt safe date conversion for date-like columns
    for col in df_clean.columns:
        if df_clean[col].dtype == 'object':
            col_lower = str(col).lower()
            if any(word in col_lower for word in ['date', 'time', 'timestamp']):
                try:
                    converted = pd.to_datetime(df_clean[col], errors='coerce')
                    # Only convert if at least 50% non-null parsed
                    if converted.notnull().sum() > 0:
                        df_clean[col] = converted
                except (ValueError, TypeError):
                    pass

    return df_clean

def get_data_summary(df: pd.DataFrame) -> dict:
    """Get basic metrics for the dataset."""
    num_cols = df.select_dtypes(include=['number']).columns.tolist()
    cat_cols = [c for c in df.columns if c not in num_cols]
    return {
        "Total Rows": len(df),
        "Total Columns": len(df.columns),
        "Missing Values": int(df.isnull().sum().sum()),
        "Duplicate Rows": int(df.duplicated().sum()),
        "Numerical Columns": len(num_cols),
        "Categorical Columns": len(cat_cols)
    }

def detect_data_types(df: pd.DataFrame) -> dict:
    """Detect pandas data types and map them to standard types."""
    return df.dtypes.astype(str).to_dict()

def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Fill missing values: numeric with median (or 0 if all null), categorical with 'Unknown'."""
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            median_val = df[col].median()
            if pd.isna(median_val):
                df[col] = df[col].fillna(0)
            else:
                df[col] = df[col].fillna(median_val)
        else:
            df[col] = df[col].fillna("Unknown")
    return df

def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """Remove exact duplicate rows."""
    return df.drop_duplicates().reset_index(drop=True)
