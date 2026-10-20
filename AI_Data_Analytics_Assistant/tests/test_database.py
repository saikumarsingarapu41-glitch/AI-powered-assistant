import pandas as pd
from modules.database import create_database, get_schema, execute_query
import sqlite3
import os

def test_database_flow():
    # Use a specific test db name so it doesn't conflict during tests
    import modules.database
    original_db = modules.database.DB_NAME
    modules.database.DB_NAME = "test_analytics.db"
    
    try:
        df = pd.DataFrame({
            'ID': [1, 2],
            'Name': ['Alice', 'Bob']
        })
        create_database(df, "test_table")
        
        schema = get_schema("test_table")
        assert "ID" in schema
        assert "Name" in schema
        
        result = execute_query("SELECT * FROM test_table;")
        assert len(result) == 2
    finally:
        # Cleanup
        if os.path.exists(modules.database.DB_NAME):
            os.remove(modules.database.DB_NAME)
        modules.database.DB_NAME = original_db
