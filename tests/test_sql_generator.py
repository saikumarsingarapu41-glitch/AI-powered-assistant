import pytest
from modules.sql_generator import (
    generate_fallback_sql, validate_sql, parse_schema_columns, suggest_sample_questions
)

@pytest.fixture
def sales_schema():
    return "Order_ID (INTEGER), Date (TIMESTAMP), Customer (TEXT), Product (TEXT), Category (TEXT), Region (TEXT), Quantity (INTEGER), Unit_Price (REAL), Discount (REAL), Revenue (REAL), Profit (REAL)"

@pytest.fixture
def census_schema():
    return "rank (INTEGER), Date (TIMESTAMP), state (TEXT), state_code (TEXT), 2020_census (REAL), percent_of_total (REAL)"

def test_parse_schema(sales_schema):
    all_cols, num_cols, text_cols = parse_schema_columns(sales_schema)
    assert "Revenue" in num_cols
    assert "Profit" in num_cols
    assert "Product" in text_cols
    assert "Region" in text_cols
    assert len(all_cols) == 11

def test_census_population_synonym(census_schema):
    # 'population' should resolve to 2020_census
    sql = generate_fallback_sql("What are the top 5 states by population?", census_schema, "census")
    assert "2020_census" in sql
    assert "state" in sql
    assert "DESC" in sql
    assert "LIMIT 5" in sql
    is_valid, _ = validate_sql(sql)
    assert is_valid

def test_filter_where_clause(sales_schema):
    # 'North' should be extracted as WHERE condition on Region
    sql = generate_fallback_sql("What is the total revenue in the North region?", sales_schema, "sales_data")
    assert "WHERE" in sql
    assert '"Region" = \'North\'' in sql
    assert "Revenue" in sql
    is_valid, _ = validate_sql(sql)
    assert is_valid

def test_filter_product_sales(sales_schema):
    sql = generate_fallback_sql("Show all sales for Laptop", sales_schema, "sales_data")
    assert '"Product" = \'Laptop\'' in sql
    is_valid, _ = validate_sql(sql)
    assert is_valid

def test_distinct_query(sales_schema):
    sql = generate_fallback_sql("List all unique categories", sales_schema, "sales_data")
    assert "DISTINCT" in sql
    assert "Category" in sql
    is_valid, _ = validate_sql(sql)
    assert is_valid

def test_single_total_aggregate(sales_schema):
    sql = generate_fallback_sql("What is the total profit?", sales_schema, "sales_data")
    assert "SUM" in sql
    assert "Profit" in sql
    assert "GROUP BY" not in sql
    is_valid, _ = validate_sql(sql)
    assert is_valid

def test_average_aggregate(sales_schema):
    sql = generate_fallback_sql("What is the average discount by category?", sales_schema, "sales_data")
    assert "AVG" in sql
    assert "Discount" in sql
    assert "GROUP BY" in sql
    is_valid, _ = validate_sql(sql)
    assert is_valid

def test_suggest_sample_questions(census_schema, sales_schema):
    c_sug = suggest_sample_questions(census_schema, "census")
    assert len(c_sug) >= 3
    assert any("census" in q.lower() or "state" in q.lower() for q in c_sug)
    
    s_sug = suggest_sample_questions(sales_schema, "sales")
    assert len(s_sug) >= 3
    assert any("revenue" in q.lower() or "product" in q.lower() for q in s_sug)
