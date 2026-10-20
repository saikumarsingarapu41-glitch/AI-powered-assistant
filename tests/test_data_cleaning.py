import pandas as pd
from modules.data_cleaning import clean_data, handle_missing_values, remove_duplicates

def test_remove_duplicates():
    df = pd.DataFrame({
        'A': [1, 2, 2, 3],
        'B': ['x', 'y', 'y', 'z']
    })
    cleaned = remove_duplicates(df)
    assert len(cleaned) == 3

def test_handle_missing_values():
    df = pd.DataFrame({
        'A': [1, None, 3],
        'B': ['x', None, 'z']
    })
    cleaned = handle_missing_values(df)
    assert cleaned['A'].isnull().sum() == 0
    assert cleaned['B'].isnull().sum() == 0
    assert cleaned['B'][1] == "Unknown"
    
def test_clean_data():
    df = pd.DataFrame({
        'A': [1.0, 2.0, 2.0, None],
        'B': [' x ', 'y', 'y', None]
    })
    cleaned = clean_data(df)
    # len should be 3 since one is duplicate (2.0, y) vs (2.0, y)
    assert len(cleaned) == 3
    assert cleaned['B'][0] == 'x' # stripped
