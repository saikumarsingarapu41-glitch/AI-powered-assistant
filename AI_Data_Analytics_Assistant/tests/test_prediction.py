import pytest
import pandas as pd
from modules.prediction import run_prediction, get_prediction_columns

@pytest.fixture
def sample_df():
    return pd.DataFrame({
        "feature_1": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        "feature_2": [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
        "category": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"],
        "target": [15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115, 125]
    })

def test_get_prediction_columns(sample_df):
    num_cols = get_prediction_columns(sample_df)
    assert "feature_1" in num_cols
    assert "feature_2" in num_cols
    assert "target" in num_cols
    assert "category" not in num_cols

def test_run_prediction_success(sample_df):
    res = run_prediction(sample_df, "target", ["feature_1", "feature_2"])
    assert "r2" in res
    assert "mae" in res
    assert "formula" in res
    assert "coefficients" in res
    assert res["r2"] > 0.95
    assert len(res["scatter_data"]) > 0

def test_run_prediction_non_numeric_target(sample_df):
    with pytest.raises(ValueError, match="must be numerical"):
        run_prediction(sample_df, "category", ["feature_1"])

def test_run_prediction_empty_df():
    with pytest.raises(ValueError, match="Dataset is empty"):
        run_prediction(pd.DataFrame(), "target", ["feature_1"])
