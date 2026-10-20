import pandas as pd
import numpy as np
from typing import Optional, List
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

__all__ = [
    'run_prediction',
    'get_prediction_columns',
    'LinearRegression',
    'train_test_split',
    'mean_absolute_error',
    'r2_score',
    'mean_squared_error'
]

def run_prediction(df: pd.DataFrame, target_col: Optional[str] = None, feature_cols: Optional[List[str]] = None) -> dict:
    """Run machine learning prediction (Linear Regression) and return metrics and plot data."""
    if df is None or df.empty:
        raise ValueError("Dataset is empty.")
        
    num_cols = df.select_dtypes(include=['number']).columns.tolist()
    if len(num_cols) < 2:
        raise ValueError("Dataset must have at least 2 numerical columns for prediction.")
        
    # Auto-resolve defaults if omitted
    if target_col is None:
        target_col = num_cols[-1]
        
    if target_col not in num_cols:
        raise ValueError(f"Target column '{target_col}' must be numerical.")
        
    if feature_cols is None:
        feature_cols = [c for c in num_cols if c != target_col]
        
    if not feature_cols:
        raise ValueError("At least one numerical feature column must be selected.")
        
    for col in feature_cols:
        if col not in num_cols:
            raise ValueError(f"Feature column '{col}' must be numerical.")
            
    # Impute numeric missing values with median or zero
    X = df[feature_cols].copy()
    y = df[target_col].copy()
    
    for c in feature_cols:
        med = X[c].median()
        X[c] = X[c].fillna(0 if pd.isna(med) else med)
        
    y_med = y.median()
    y = y.fillna(0 if pd.isna(y_med) else y_med)
    
    if len(X) < 5:
        raise ValueError("Not enough records to train a model (minimum 5 rows required).")
        
    test_size = 0.2 if len(X) >= 10 else 0.5
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    
    # Return metrics and a sample of test predictions for plotting
    results = [{"actual": round(float(act), 2), "predicted": round(float(pred), 2)} for act, pred in zip(y_test, y_pred)]
    
    coef_dict = {col: round(float(c), 4) for col, c in zip(feature_cols, model.coef_)}
    intercept_val = round(float(model.intercept_), 4)
    formula_terms = [f"{coef_dict[col]} * ({col})" for col in feature_cols]
    formula_str = f"{target_col} = {intercept_val} + " + " + ".join(formula_terms)
    
    return {
        "mae": round(float(mae), 4),
        "rmse": round(float(rmse), 4),
        "r2": round(float(r2), 4),
        "intercept": intercept_val,
        "coefficients": coef_dict,
        "formula": formula_str,
        "sample_size": len(X),
        "test_size": len(X_test),
        "scatter_data": results[:100]
    }

def get_prediction_columns(df: pd.DataFrame) -> list:
    """Return a list of numerical columns that can be used for prediction."""
    return df.select_dtypes(include=['number']).columns.tolist()
