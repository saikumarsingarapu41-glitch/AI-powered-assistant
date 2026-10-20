import pandas as pd
from modules.insights import generate_statistical_insight, format_metric_value

def test_format_metric_currency():
    assert format_metric_value(152430.50, "revenue") == "$152,430.50"
    assert format_metric_value(5000, "profit") == "$5,000"

def test_format_metric_percent():
    assert format_metric_value(0.1191, "percent_of_total") == "11.91%"
    assert format_metric_value(0.05, "discount") == "5.0%"

def test_format_metric_number():
    assert format_metric_value(39538223, "2020_census") == "39,538,223"

def test_insight_single_cell():
    df = pd.DataFrame({"total_revenue": [56695.0]})
    insight = generate_statistical_insight("What is total revenue in North?", df)
    assert "$56,695" in insight
    assert "Total Revenue" in insight

def test_insight_ranking():
    df = pd.DataFrame({
        "Product": ["Laptop", "Smartphone", "Monitor"],
        "total_revenue": [39720.0, 35200.0, 6540.0]
    })
    insight = generate_statistical_insight("Top products", df)
    assert "**Laptop**" in insight
    assert "#1" in insight
    assert "$39,720" in insight

def test_insight_empty():
    df = pd.DataFrame()
    insight = generate_statistical_insight("Any question", df)
    assert "empty" in insight.lower()
