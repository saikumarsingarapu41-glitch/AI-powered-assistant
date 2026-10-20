import pytest
from fastapi.testclient import TestClient
from api import app

@pytest.fixture
def client():
    return TestClient(app)

def test_api_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "tables" in data
    assert "llm_model" in data

def test_api_load_sample_sales(client):
    res = client.post("/load-sample?dataset_type=sales")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["table_name"] == "sales_data"
    assert data["metrics"]["Total Rows"] > 0
    assert len(data["suggestions"]) > 0

def test_api_query_endpoint(client):
    # Ensure sample data loaded
    client.post("/load-sample?dataset_type=sales")
    
    # Query top 3 products
    res = client.post("/query", json={
        "question": "What are the top 3 products by revenue?",
        "table_name": "sales_data"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["error"] is None
    assert "SELECT" in data["sql"]
    assert data["row_count"] == 3
    assert len(data["data"]) == 3
    assert len(data["insight"]) > 0

def test_api_filter_query(client):
    client.post("/load-sample?dataset_type=sales")
    res = client.post("/query", json={
        "question": "What is the total revenue in the North region?",
        "table_name": "sales_data"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["error"] is None
    assert "WHERE" in data["sql"]

def test_api_preview(client):
    res = client.get("/preview/sales_data?limit=5")
    assert res.status_code == 200
    data = res.json()
    assert data["table_name"] == "sales_data"
    assert len(data["records"]) <= 5
    assert len(data["columns"]) > 0

def test_api_columns(client):
    res = client.get("/columns/sales_data")
    assert res.status_code == 200
    data = res.json()
    assert "Revenue" in data["numerical_columns"]
    assert "Product" in data["categorical_columns"]

def test_api_predict(client):
    res = client.post("/predict", json={
        "table_name": "sales_data",
        "target_col": "Revenue",
        "feature_cols": ["Quantity", "Unit_Price", "Discount", "Profit"]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "r2" in data
    assert "formula" in data

def test_api_tables(client):
    res = client.get("/tables")
    assert res.status_code == 200
    data = res.json()
    assert "tables" in data
    assert "active_table" in data

def test_api_config(client):
    res = client.post("/config", json={
        "api_key": "test_dummy_key",
        "model": "gpt-4o-mini"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "success"
