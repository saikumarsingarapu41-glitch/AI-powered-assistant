from modules.sql_generator import validate_sql

def test_validate_sql_valid():
    is_valid, msg = validate_sql("SELECT * FROM sales;")
    assert is_valid == True
    
    is_valid, msg = validate_sql("WITH cte AS (SELECT * FROM sales) SELECT * FROM cte;")
    assert is_valid == True

def test_validate_sql_invalid_drop():
    is_valid, msg = validate_sql("DROP TABLE sales;")
    assert is_valid == False
    assert "Dangerous SQL keyword" in msg or "Only SELECT" in msg

def test_validate_sql_invalid_update():
    is_valid, msg = validate_sql("UPDATE sales SET Revenue = 0;")
    assert is_valid == False
    assert "Only SELECT" in msg or "Dangerous SQL keyword" in msg

def test_validate_sql_multiple():
    is_valid, msg = validate_sql("SELECT * FROM sales; DELETE FROM sales;")
    assert is_valid == False
    assert "Multiple SQL statements" in msg
