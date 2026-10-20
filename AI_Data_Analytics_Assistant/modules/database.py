import sqlite3
import pandas as pd
import os
from typing import List, Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_NAME = os.path.join(BASE_DIR, "analytics.db")

def get_connection() -> sqlite3.Connection:
    """Create a database connection to the SQLite database."""
    conn = sqlite3.connect(DB_NAME, timeout=10.0)
    return conn

def set_active_table(table_name: str) -> None:
    """Persistently store the current active table name in metadata table."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS _assistant_meta (key TEXT PRIMARY KEY, val TEXT);")
        cursor.execute("INSERT OR REPLACE INTO _assistant_meta (key, val) VALUES ('active_table', ?);", (table_name,))
        conn.commit()
    except Exception:
        pass
    finally:
        conn.close()

def get_active_table() -> str:
    """Return the active table name (from metadata, or latest non-dataset table, or fallback)."""
    if not os.path.exists(DB_NAME):
        return "dataset"
        
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='_assistant_meta';")
        if cursor.fetchone():
            cursor.execute("SELECT val FROM _assistant_meta WHERE key='active_table';")
            row = cursor.fetchone()
            if row and row[0]:
                active_candidate = row[0]
                # Verify that this table still exists in SQLite
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name=?;",
                    (active_candidate,)
                )
                if cursor.fetchone():
                    return active_candidate
    except Exception:
        pass
    finally:
        conn.close()
        
    tables = get_tables()
    if not tables:
        return "dataset"
    non_dataset = [t for t in tables if t != "dataset"]
    return non_dataset[-1] if non_dataset else tables[0]

def create_database(df: pd.DataFrame, table_name: str = "dataset") -> None:
    """Store the pandas DataFrame into the SQLite database and set it as active."""
    conn = get_connection()
    try:
        # Save table with index=False
        df.to_sql(table_name, conn, if_exists="replace", index=False)
        # Also mirror to default 'dataset' table for generic fallback
        if table_name != "dataset":
            df.to_sql("dataset", conn, if_exists="replace", index=False)
    finally:
        conn.close()
        
    set_active_table(table_name)

def get_tables() -> List[str]:
    """Return all non-internal tables in the database."""
    if not os.path.exists(DB_NAME):
        return []
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT name FROM sqlite_master "
            "WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_assistant_%';"
        )
        tables = [row[0] for row in cursor.fetchall()]
        return tables
    finally:
        conn.close()

def get_schema(table_name: str = "dataset") -> str:
    """Retrieve the schema of the specified table formatted as Column (TYPE)."""
    if not os.path.exists(DB_NAME):
        return "Database does not exist yet."
        
    conn = get_connection()
    try:
        cursor = conn.cursor()
        # Escape double quotes inside identifier
        escaped_name = table_name.replace('"', '""')
        cursor.execute(f'PRAGMA table_info("{escaped_name}");')
        columns = cursor.fetchall()
        
        if not columns and table_name != "dataset":
            cursor.execute('PRAGMA table_info("dataset");')
            columns = cursor.fetchall()
            
        if not columns:
            return f"Table {table_name} does not exist."
            
        schema_lines = [f"{col[1]} ({col[2]})" for col in columns]
        return ", ".join(schema_lines)
    except sqlite3.OperationalError:
        return f"Table {table_name} does not exist."
    finally:
        conn.close()

def get_table_info(table_name: str) -> List[Dict[str, Any]]:
    """Retrieve structured column information for a table."""
    if not os.path.exists(DB_NAME):
        return []
    conn = get_connection()
    try:
        cursor = conn.cursor()
        escaped_name = table_name.replace('"', '""')
        cursor.execute(f'PRAGMA table_info("{escaped_name}");')
        columns = cursor.fetchall()
        return [{"cid": c[0], "name": c[1], "type": c[2], "notnull": c[3], "dflt_value": c[4], "pk": c[5]} for c in columns]
    finally:
        conn.close()

def get_distinct_column_values(table_name: str, column_name: str, limit: int = 30) -> List[Any]:
    """Retrieve sample distinct values from a column for intelligent semantic filtering."""
    if not os.path.exists(DB_NAME):
        return []
    conn = get_connection()
    try:
        cursor = conn.cursor()
        escaped_tbl = table_name.replace('"', '""')
        escaped_col = column_name.replace('"', '""')
        cursor.execute(f'SELECT DISTINCT "{escaped_col}" FROM "{escaped_tbl}" WHERE "{escaped_col}" IS NOT NULL LIMIT {limit};')
        rows = cursor.fetchall()
        return [r[0] for r in rows if r[0] is not None]
    except Exception:
        return []
    finally:
        conn.close()

def execute_query(query: str) -> pd.DataFrame:
    """Execute a read query and return the result as a DataFrame."""
    conn = get_connection()
    try:
        result = pd.read_sql_query(query, conn)
        return result
    except Exception as e:
        raise Exception(f"SQL execution failed: {str(e)}")
    finally:
        conn.close()

def clear_database() -> tuple[bool, str]:
    """Delete the database file to reset analytics state."""
    if os.path.exists(DB_NAME):
        try:
            os.remove(DB_NAME)
            return True, "Database cleared successfully."
        except Exception as e:
            return False, f"Failed to clear database: {str(e)}"
    return True, "Database is already empty."
