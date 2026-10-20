import re
from typing import List, Tuple, Optional, Dict, Any
from .llm import ask_llm

def parse_schema_columns(schema: str) -> Tuple[List[str], List[str], List[str]]:
    """
    Parse schema string into all columns, numeric columns, and text columns.
    Accepts: 'col (TYPE)', '`col` (TYPE)', '"col" (TYPE)', etc.
    """
    all_cols = []
    num_cols = []
    text_cols = []
    
    # Matches: col (TYPE) where col may optionally be wrapped in quotes or backticks
    matches = re.findall(r'[`"]?([A-Za-z0-9_]+)[`"]?\s*\(([^)]+)\)', schema)
    for col_name, col_type in matches:
        all_cols.append(col_name)
        col_type_upper = col_type.upper()
        if any(t in col_type_upper for t in ['INT', 'REAL', 'FLOAT', 'NUM', 'DOUBLE', 'DECIMAL']):
            num_cols.append(col_name)
        else:
            text_cols.append(col_name)
            
    # Fallback if regex missed unstandardized schema format
    if not all_cols and schema:
        parts = [p.strip() for p in schema.split(',') if p.strip()]
        for p in parts:
            c = p.split('(')[0].strip().replace('`', '').replace('"', '')
            if c:
                all_cols.append(c)
                if any(w in p.upper() for w in ['INT', 'REAL', 'FLOAT', 'NUM']):
                    num_cols.append(c)
                else:
                    text_cols.append(c)

    return all_cols, num_cols, text_cols

def match_column_by_synonym(query_text: str, candidate_cols: List[str], is_numeric: bool = True) -> Optional[str]:
    """Find the best column match using natural language synonyms."""
    q = query_text.lower()
    
    # Direct mention check first (with singular/plural forms)
    for col in candidate_cols:
        c_low = col.lower()
        patterns = [
            rf'\b{re.escape(c_low)}\b',
            rf'\b{re.escape(c_low)}s\b',
            rf'\b{re.escape(c_low.rstrip("y"))}ies\b',
            rf'\b{re.escape(c_low.replace("_", " "))}\b'
        ]
        if any(re.search(p, q) for p in patterns):
            return col
            
    # Business synonym mappings
    synonyms: Dict[str, List[str]] = {
        # Numeric / Metrics
        'revenue': ['revenue', 'sales', 'turnover', 'earnings', 'income', 'receipts', 'amount', 'total sales'],
        'profit': ['profit', 'margin', 'gain', 'net income', 'net profit', 'earnings'],
        'unit_price': ['price', 'unit price', 'cost per unit', 'rate', 'retail price'],
        'discount': ['discount', 'rebate', 'deduction', 'concession', 'markdown'],
        'quantity': ['quantity', 'volume', 'count', 'units', 'qty', 'number of items', 'items sold'],
        '2020_census': ['population', 'residents', 'people', 'census', 'inhabitants', 'citizens', '2020 census'],
        'percent_of_total': ['percent', 'percentage', 'share', 'proportion', 'ratio', 'percent of total'],
        'rank': ['rank', 'position', 'standing', 'leaderboard', 'top rank'],
        
        # Categorical / Dimensions
        'product': ['product', 'item', 'good', 'merchandise', 'article', 'sku'],
        'category': ['category', 'segment', 'type', 'group', 'class', 'department'],
        'region': ['region', 'territory', 'zone', 'area', 'location', 'geography', 'district'],
        'customer': ['customer', 'client', 'buyer', 'account', 'purchaser', 'shopper', 'company'],
        'state': ['state', 'province', 'state name'],
        'state_code': ['state code', 'abbreviation', 'code'],
        'date': ['date', 'time', 'day', 'month', 'year', 'timestamp', 'period'],
        'order_id': ['order', 'transaction', 'order id', 'invoice']
    }
    
    for col in candidate_cols:
        c_low = col.lower()
        # Check if column matches any known synonym group
        for target_key, syn_list in synonyms.items():
            if target_key in c_low or c_low in syn_list:
                for syn in syn_list:
                    patterns = [
                        rf'\b{re.escape(syn)}\b',
                        rf'\b{re.escape(syn)}s\b',
                        rf'\b{re.escape(syn.rstrip("y"))}ies\b'
                    ]
                    if any(re.search(p, q) for p in patterns):
                        return col
                        
    # Secondary keyword search
    for col in candidate_cols:
        c_parts = [p for p in col.lower().split('_') if len(p) > 2]
        for part in c_parts:
            if re.search(rf'\b{re.escape(part)}\b', q):
                return col
                
    return None

def extract_filter_conditions(question: str, all_cols: List[str], text_cols: List[str], num_cols: List[str], table_name: str) -> List[str]:
    """Detect filter conditions (WHERE clauses) from natural language question."""
    conditions = []
    q_lower = question.lower()
    
    # 1. Check known categorical values dynamically from database if possible
    try:
        from .database import get_distinct_column_values
        for col in text_cols:
            distinct_vals = get_distinct_column_values(table_name, col, limit=40)
            for val in distinct_vals:
                if str(val).strip() and str(val).strip() != "Unknown" and len(str(val)) > 1:
                    val_str = str(val).strip()
                    # Check exact word boundary match in question
                    pattern = rf'\b{re.escape(val_str.lower())}\b'
                    if re.search(pattern, q_lower):
                        escaped_val = val_str.replace("'", "''")
                        conditions.append(f'"{col}" = \'{escaped_val}\'')
                        break
    except Exception:
        pass
        
    # 2. Check sample dataset values
    # Prepositions/stopwords to NEVER match as short codes unless specifically uppercase or prefixed
    stopwords_2letter = {'in', 'or', 'me', 'as', 'ok', 'no', 'is', 'at', 'to', 'by', 'on', 'up', 'so', 'we', 'he', 'it'}
    
    if not conditions:
        common_values = {
            'Region': ['North', 'South', 'East', 'West'],
            'Category': ['Electronics', 'Furniture'],
            'Product': ['Laptop', 'Desk Chair', 'Smartphone', 'Monitor', 'Office Desk', 'Tablet', 'Printer', 'Filing Cabinet'],
            'state': [
                'California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio',
                'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia', 'Washington',
                'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Maryland', 'Missouri'
            ],
            'state_code': ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'MD', 'MO']
        }
        for col, vals in common_values.items():
            if col in all_cols:
                for val in vals:
                    if len(val) <= 2 and val.lower() in stopwords_2letter:
                        # Only match short 2-letter state codes if uppercase in original question or preceded by 'state'
                        if re.search(rf'\b{val}\b', question) or re.search(rf'state\s*(?:code)?\s*{val.lower()}', q_lower):
                            conditions.append(f'"{col}" = \'{val}\'')
                            break
                    elif re.search(rf'\b{re.escape(val.lower())}\b', q_lower):
                        escaped_val = val.replace("'", "''")
                        conditions.append(f'"{col}" = \'{escaped_val}\'')
                        break

    # 3. Numeric comparisons (e.g. > 1000, less than 500)
    for col in num_cols:
        c_low = col.lower()
        if c_low in q_lower or c_low.replace('_', ' ') in q_lower:
            gt_match = re.search(rf'{c_low}\s*(?:>|greater than|more than|above|exceeding)\s*([0-9]+(?:\.[0-9]+)?)', q_lower)
            if gt_match:
                conditions.append(f'"{col}" > {gt_match.group(1)}')
            lt_match = re.search(rf'{c_low}\s*(?:<|less than|lower than|below|under)\s*([0-9]+(?:\.[0-9]+)?)', q_lower)
            if lt_match:
                conditions.append(f'"{col}" < {lt_match.group(1)}')
                
    # 4. Year/Date filter (e.g. "in 2023", "2024", "2025")
    # Avoid matching a year if it's literally part of a column name (e.g. 2020_census)
    date_cols = [c for c in all_cols if any(w in c.lower() for w in ['date', 'time', 'year']) and not any(ch.isdigit() for ch in c)]
    if not date_cols:
        date_cols = [c for c in all_cols if any(w in c.lower() for w in ['date', 'time'])]
        
    if date_cols:
        d_col = date_cols[0]
        # Match year only if preceded by 'in', 'year', or 'during' or standalone year
        year_match = re.search(r'\b(?:in|year|during|from)?\s*(20[12][0-9])\b', q_lower)
        if year_match:
            year_val = year_match.group(1)
            # Ensure the year isn't simply mentioning a column like 2020_census
            col_has_year = any(year_val in col for col in all_cols)
            if not col_has_year or re.search(rf'\b(?:in|year|during)\s*{year_val}\b', q_lower):
                conditions.append(f'("{d_col}" LIKE \'%{year_val}%\' OR "{d_col}" LIKE \'{year_val}%\')')

    return conditions

def generate_fallback_sql(question: str, schema: str, table_name: str = "dataset") -> str:
    """
    Intelligent, deterministic, multi-pattern Text-to-SQL engine for analytics queries.
    Provides robust querying even when no external LLM API key is configured.
    """
    all_cols, num_cols, text_cols = parse_schema_columns(schema)
    q_lower = question.lower()
    
    # Helper to quote identifier safely
    def q(col: str) -> str:
        escaped = col.replace('"', '""')
        return f'"{escaped}"'
        
    safe_table = q(table_name)
    
    # Extract limits
    limit_match = re.search(r'\b(?:top|first|limit|bottom|lowest|highest)\s*(\d+)\b', q_lower)
    if limit_match:
        limit = int(limit_match.group(1))
    elif any(w in q_lower for w in ['top', 'highest', 'best', 'most', 'bottom', 'lowest', 'least']):
        limit = 5
    elif any(w in q_lower for w in ['which ', 'what is the single ']):
        limit = 1
    else:
        limit = 10
        
    # Extract order direction
    is_ascending = any(w in q_lower for w in ['lowest', 'least', 'minimum', 'min', 'bottom', 'worst', 'smallest'])
    order_dir = "ASC" if is_ascending else "DESC"

    # Extract filter conditions
    where_conditions = extract_filter_conditions(question, all_cols, text_cols, num_cols, table_name)
    where_clause = f" WHERE {' AND '.join(where_conditions)}" if where_conditions else ""

    # Check for specific column selections (e.g. "show state and state_code")
    mentioned_cols = []
    for c in all_cols:
        c_low = c.lower()
        if re.search(rf'\b{re.escape(c_low)}\b', q_lower) or re.search(rf'\b{re.escape(c_low.replace("_", " "))}\b', q_lower):
            mentioned_cols.append(c)

    # 1. Distinct Values / Unique Listing (Check before general show all)
    if any(w in q_lower for w in ['distinct', 'unique', 'list all']) and not any(w in q_lower for w in ['sum', 'total', 'avg', 'average', 'how many', 'count']):
        target_dim = match_column_by_synonym(question, text_cols, is_numeric=False) or (text_cols[0] if text_cols else None)
        if target_dim:
            return f'SELECT DISTINCT {q(target_dim)} FROM {safe_table}{where_clause} ORDER BY {q(target_dim)} ASC LIMIT {limit};'

    # 2. Preview / Show all / Select *
    if any(w in q_lower for w in ['show all', 'select *', 'first 10', 'preview', 'sample', 'raw data', 'show data']) or q_lower.startswith('show rows'):
        return f'SELECT * FROM {safe_table}{where_clause} LIMIT {limit};'

    # 3. Total Count / Number of Records (use word boundary so 'discount' doesn't match 'count')
    if any(re.search(rf'\b{w}\b', q_lower) for w in ['how many', 'count', 'number of']):
        # Distinct count check: "how many unique products"
        if any(w in q_lower for w in ['unique', 'distinct', 'different']):
            target_dim = match_column_by_synonym(question, text_cols, is_numeric=False) or (text_cols[0] if text_cols else None)
            if target_dim:
                return f'SELECT COUNT(DISTINCT {q(target_dim)}) AS "unique_{target_dim.lower()}" FROM {safe_table}{where_clause};'
                
        # Grouped count check: "number of orders by region" or "count per category"
        target_group = None
        if any(w in q_lower for w in [' by ', ' per ', ' for each ']):
            target_group = match_column_by_synonym(question, text_cols, is_numeric=False)
            
        if target_group:
            return f'SELECT {q(target_group)}, COUNT(*) AS "total_count" FROM {safe_table}{where_clause} GROUP BY {q(target_group)} ORDER BY "total_count" DESC LIMIT {limit};'
            
        # Single count: "how many states in dataset"
        return f'SELECT COUNT(*) AS "total_records" FROM {safe_table}{where_clause};'

    # 4. Resolve Target Metric & Dimension using synonyms
    target_num = match_column_by_synonym(question, num_cols, is_numeric=True)
    if not target_num:
        # Default priority metric
        for cand in ['revenue', 'profit', 'sales', '2020_census', 'total', 'amount', 'price', 'quantity']:
            for nc in num_cols:
                if cand in nc.lower():
                    target_num = nc
                    break
            if target_num:
                break
    if not target_num and num_cols:
        target_num = num_cols[-1]

    # Explicit group by check
    has_group_intent = any(w in q_lower for w in [' by ', ' per ', ' for each ', 'which ', 'top ', 'highest ', 'lowest ', 'best ', 'worst '])
    
    target_cat = match_column_by_synonym(question, text_cols, is_numeric=False)
    if not target_cat and has_group_intent and text_cols:
        for cand in ['product', 'state', 'category', 'region', 'customer', 'item', 'segment', 'type', 'name']:
            for tc in text_cols:
                if cand in tc.lower():
                    target_cat = tc
                    break
            if target_cat:
                break
        if not target_cat and text_cols:
            target_cat = text_cols[0]

    # 5. Average / Mean Aggregation
    if any(w in q_lower for w in ['average', 'avg', 'mean']) and target_num:
        if target_cat and has_group_intent:
            return f'SELECT {q(target_cat)}, ROUND(AVG({q(target_num)}), 2) AS "avg_{target_num.lower()}" FROM {safe_table}{where_clause} GROUP BY {q(target_cat)} ORDER BY "avg_{target_num.lower()}" {order_dir} LIMIT {limit};'
        return f'SELECT ROUND(AVG({q(target_num)}), 2) AS "avg_{target_num.lower()}" FROM {safe_table}{where_clause};'

    # 6. Specific Columns Projection (e.g. "show state and 2020_census")
    if len(mentioned_cols) >= 2 and not any(w in q_lower for w in ['sum', 'avg', 'average', 'total', 'highest', 'lowest', 'top']):
        cols_sql = ", ".join(q(c) for c in mentioned_cols)
        return f'SELECT {cols_sql} FROM {safe_table}{where_clause} LIMIT {limit};'

    # 7. Single Total / Aggregate (e.g. "What is the total profit?" with NO group by dimension)
    if any(w in q_lower for w in ['total', 'sum', 'overall']) and not has_group_intent and target_num:
        return f'SELECT SUM({q(target_num)}) AS "total_{target_num.lower()}" FROM {safe_table}{where_clause};'

    # 8. Superlative Grouped Aggregation (Top / Highest / Lowest / Sum by Dimension)
    if target_num and target_cat:
        agg_alias = f"total_{target_num.lower()}"
        return f'SELECT {q(target_cat)}, SUM({q(target_num)}) AS "{agg_alias}" FROM {safe_table}{where_clause} GROUP BY {q(target_cat)} ORDER BY "{agg_alias}" {order_dir} LIMIT {limit};'
    elif target_num:
        return f'SELECT SUM({q(target_num)}) AS "total_{target_num.lower()}" FROM {safe_table}{where_clause};'
    elif target_cat:
        return f'SELECT {q(target_cat)}, COUNT(*) AS "count" FROM {safe_table}{where_clause} GROUP BY {q(target_cat)} ORDER BY "count" {order_dir} LIMIT {limit};'
    else:
        return f'SELECT * FROM {safe_table}{where_clause} LIMIT {limit};'

def suggest_sample_questions(schema: str, table_name: str = "dataset") -> List[str]:
    """Dynamically generate tailored analytical questions based on schema columns."""
    all_cols, num_cols, text_cols = parse_schema_columns(schema)
    suggestions = []
    
    # Tailor for Census Data
    if any('census' in c.lower() or 'state' in c.lower() for c in all_cols):
        suggestions.append("What are the top 5 states by 2020_census?")
        suggestions.append("Which state has the lowest 2020_census?")
        suggestions.append("What is the average 2020_census across states?")
        suggestions.append("Show population of California")
        suggestions.append(f"Show the first 10 rows of {table_name}")
        return suggestions
        
    # Tailor for Sales Data
    if any('revenue' in c.lower() or 'profit' in c.lower() or 'product' in c.lower() for c in all_cols):
        suggestions.append("Which product generated the highest revenue?")
        suggestions.append("What is the total revenue by region?")
        suggestions.append("What are the top 5 products by profit?")
        suggestions.append("What is the average discount for each category?")
        suggestions.append(f"Show the first 10 rows of {table_name}")
        return suggestions
        
    # Generic Dynamic Generation
    cat1 = text_cols[0] if text_cols else "category"
    cat2 = text_cols[1] if len(text_cols) > 1 else cat1
    num1 = num_cols[-1] if num_cols else "amount"
    num2 = num_cols[-2] if len(num_cols) > 1 else num1
    
    if num_cols and text_cols:
        suggestions.append(f"Which {cat1} generated the highest {num1}?")
        suggestions.append(f"What is the total {num1} by {cat2}?")
        if len(num_cols) > 1:
            suggestions.append(f"What is the average {num2} for each {cat1}?")
        suggestions.append(f"Show the top 5 {cat1} by {num1}")
    elif text_cols:
        suggestions.append(f"How many records exist per {cat1}?")
        suggestions.append(f"Show the top 5 most frequent {cat1}")
        
    suggestions.append(f"Show the first 10 rows of {table_name}")
    return suggestions

def generate_sql(question: str, schema: str, table_name: str = "dataset") -> str:
    """Generate a SQL query using the LLM with seamless fallback to heuristic engine."""
    system_prompt = (
        "You are an expert SQL developer. Your task is to translate a natural language question into a valid SQLite query.\n"
        f"The table name is `{table_name}`. The schema is: {schema}\n"
        "Guidelines:\n"
        "- ONLY output the SQL query.\n"
        "- Do NOT wrap the query in markdown formatting like ```sql ... ```.\n"
        "- Do NOT add explanations.\n"
        "- Only use columns that exist in the schema.\n"
        "- Quote column and table identifiers using double quotes if they contain numbers, spaces, or keywords.\n"
        "- Query must be strictly read-only (SELECT or WITH ... SELECT)."
    )
    
    try:
        sql_query = ask_llm(system_prompt, question)
        cleaned = clean_sql_response(sql_query)
        is_valid, _ = validate_sql(cleaned)
        if is_valid:
            return cleaned
        return generate_fallback_sql(question, schema, table_name)
    except Exception:
        # Graceful fallback when LLM API key is not configured or network issues occur
        return generate_fallback_sql(question, schema, table_name)

def clean_sql_response(sql: str) -> str:
    """Clean the raw response from LLM."""
    sql = re.sub(r'```sql', '', sql, flags=re.IGNORECASE)
    sql = re.sub(r'```', '', sql)
    # Remove single line comments
    sql = re.sub(r'--.*$', '', sql, flags=re.MULTILINE)
    return sql.strip()

def validate_sql(sql: str) -> Tuple[bool, str]:
    """Ensure the SQL query is safe, read-only, and syntactically sound."""
    if not sql or not sql.strip():
        return False, "Empty query generated."
        
    # Check for stacked queries (multiple semicolons)
    clean = re.sub(r'--.*$', '', sql, flags=re.MULTILINE).strip()
    if clean.count(';') > 1:
        return False, "Multiple SQL statements are not allowed."
        
    sql_upper = clean.upper().strip()
    
    if not (sql_upper.startswith("SELECT") or sql_upper.startswith("WITH")):
        return False, "Only SELECT queries are allowed."
        
    dangerous_keywords = [
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", 
        "REPLACE", "ATTACH", "DETACH", "PRAGMA", "GRANT", "REVOKE", 
        "TRUNCATE", "EXECUTE", "EXEC"
    ]
    
    for kw in dangerous_keywords:
        if re.search(rf'\b{kw}\b', sql_upper):
            return False, f"Dangerous SQL keyword detected: {kw}"
            
    return True, "Query validated successfully."
