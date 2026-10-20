import React from 'react';
import {
  Send,
  Sparkles,
  BarChart3,
  LineChart,
  Table,
  TrendingUp,
  Download,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Terminal,
  Trash2,
  PieChart,
  Compass
} from 'lucide-react';
import ChartRenderer from '../common/ChartRenderer';

export default function ChatAnalyticsTab({
  query,
  setQuery,
  queryLoading,
  handleQuery,
  suggestions,
  history,
  setHistory,
  setCardChartType,
  handleCopySql,
  copiedIndex,
  handleExportCsv,
  onOpenInSqlStudio
}) {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      
      {/* Query Hero Header */}
      <div>
        <div style={{ marginBottom: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-blue">
              <Sparkles size={13} /> Natural Language Query Engine
            </span>
          </div>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 0.35rem 0' }}>
            Ask anything about your data.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Type questions in natural English. Verified SQL is synthesized, executed against SQLite, and distilled into executive takeaways.
          </p>
        </div>

        {/* Big Search Input with Glow */}
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.65rem 0.85rem 0.65rem 1.35rem',
            gap: '0.85rem',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            boxShadow: '0 0 35px rgba(56, 189, 248, 0.16)',
            borderRadius: '16px'
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={suggestions[0] || 'e.g. Which region generated the highest sales revenue?'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '1.05rem',
              outline: 'none',
              fontFamily: 'inherit',
              fontWeight: 500
            }}
            onKeyDown={(e) => e.key === 'Enter' && !queryLoading && handleQuery()}
          />
          <button
            onClick={() => handleQuery()}
            disabled={queryLoading || !query.trim()}
            className="btn-primary"
            style={{ padding: '0.75rem 1.6rem', fontSize: '0.925rem' }}
          >
            {queryLoading ? (
              <>
                <RefreshCw size={17} className="pulse-dot" />
                <span>Analyzing Data...</span>
              </>
            ) : (
              <>
                <Send size={17} />
                <span>Run Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic Suggestion Pills */}
        {suggestions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={12} color="#38bdf8" /> RECOMMENDED PROMPTS:
            </span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                className="suggestion-pill"
                onClick={() => handleQuery(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Query History Header if exists */}
      {history.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing {history.length} {history.length === 1 ? 'analysis inquiry' : 'analysis inquiries'}
          </div>
          <button
            onClick={() => setHistory([])}
            className="btn-ghost"
            style={{ fontSize: '0.785rem', color: '#fb7185' }}
          >
            <Trash2 size={13} /> Clear Inquiries
          </button>
        </div>
      )}

      {/* History Cards & Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {history.length === 0 ? (
          /* Guided Starter Cards */
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
              style={{
                padding: '2.5rem 2rem',
                textAlign: 'center',
                background: 'rgba(13, 18, 36, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                <Sparkles size={28} color="#38bdf8" />
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                Ask Any Business or Analytical Question
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', maxWidth: '580px', margin: '0 auto' }}>
                Type in the search bar above or click any instant exploration card below to synthesize queries:
              </p>
            </div>

            {/* Quick Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div
                className="feature-chip-card"
                onClick={() => handleQuery('Which product generated the highest revenue?')}
              >
                <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '10px', borderRadius: '12px' }}>
                  <BarChart3 size={20} color="#38bdf8" />
                </div>
                <div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Top Revenue Driver
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    "Which product generated the highest revenue?"
                  </div>
                </div>
              </div>

              <div
                className="feature-chip-card"
                onClick={() => handleQuery('What is the total revenue by region?')}
              >
                <div style={{ background: 'rgba(129, 140, 248, 0.15)', padding: '10px', borderRadius: '12px' }}>
                  <Compass size={20} color="#818cf8" />
                </div>
                <div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Regional Breakdown
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    "What is the total revenue by region?"
                  </div>
                </div>
              </div>

              <div
                className="feature-chip-card"
                onClick={() => handleQuery('What are the top 5 states by 2020 census?')}
              >
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px' }}>
                  <TrendingUp size={20} color="#34d399" />
                </div>
                <div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Demographic Population Rank
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    "What are the top 5 states by 2020 census?"
                  </div>
                </div>
              </div>

              <div
                className="feature-chip-card"
                onClick={() => handleQuery('Show all sales where revenue is greater than 1000')}
              >
                <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '10px', borderRadius: '12px' }}>
                  <Table size={20} color="#f472b6" />
                </div>
                <div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    High-Value Filtered Sales
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    "Show all sales where revenue &gt; 1000"
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          history.map((entry, idx) => (
            <article
              key={idx}
              className="glass-panel animate-fade-in"
              style={{
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.45)'
              }}
            >
              {/* Query Top Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>
                    ANALYSIS #{history.length - idx} • {entry.timestamp}
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                    {entry.question}
                  </h3>
                </div>

                {entry.data && entry.data.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* View Switcher Buttons */}
                    <div
                      style={{
                        display: 'flex',
                        background: 'rgba(8, 12, 26, 0.85)',
                        padding: '3px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <button
                        onClick={() => setCardChartType(idx, 'bar')}
                        className={entry.chartType === 'bar' ? 'btn-primary' : 'btn-ghost'}
                        style={{ padding: '5px 9px', borderRadius: '8px' }}
                        title="Bar Chart"
                      >
                        <BarChart3 size={15} />
                      </button>
                      <button
                        onClick={() => setCardChartType(idx, 'line')}
                        className={entry.chartType === 'line' ? 'btn-primary' : 'btn-ghost'}
                        style={{ padding: '5px 9px', borderRadius: '8px' }}
                        title="Line Chart"
                      >
                        <LineChart size={15} />
                      </button>
                      <button
                        onClick={() => setCardChartType(idx, 'area')}
                        className={entry.chartType === 'area' ? 'btn-primary' : 'btn-ghost'}
                        style={{ padding: '5px 9px', borderRadius: '8px' }}
                        title="Area Chart"
                      >
                        <TrendingUp size={15} />
                      </button>
                      <button
                        onClick={() => setCardChartType(idx, 'pie')}
                        className={entry.chartType === 'pie' ? 'btn-primary' : 'btn-ghost'}
                        style={{ padding: '5px 9px', borderRadius: '8px' }}
                        title="Pie Chart"
                      >
                        <PieChart size={15} />
                      </button>
                      <button
                        onClick={() => setCardChartType(idx, 'table')}
                        className={entry.chartType === 'table' ? 'btn-primary' : 'btn-ghost'}
                        style={{ padding: '5px 9px', borderRadius: '8px' }}
                        title="Table View"
                      >
                        <Table size={15} />
                      </button>
                    </div>

                    {/* SQL Studio Link */}
                    {entry.sql && onOpenInSqlStudio && (
                      <button
                        onClick={() => onOpenInSqlStudio(entry.sql)}
                        className="btn-secondary"
                        style={{ padding: '6px 11px', fontSize: '0.8rem' }}
                        title="Open this query in SQL Studio"
                      >
                        <Terminal size={13} /> Edit in SQL
                      </button>
                    )}

                    {/* Export CSV Button */}
                    <button
                      onClick={() => handleExportCsv(entry.data, `analysis_${idx + 1}.csv`)}
                      className="btn-secondary"
                      style={{ padding: '6px 11px', fontSize: '0.8rem' }}
                      title="Download results as CSV"
                    >
                      <Download size={13} /> Export CSV
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {entry.error ? (
                <div
                  style={{
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    padding: '1.15rem',
                    borderRadius: '12px',
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem'
                  }}
                >
                  <AlertCircle size={22} color="#fb7185" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.9rem' }}>{entry.error}</div>
                </div>
              ) : (
                <>
                  {/* SQL Terminal Snippet */}
                  {entry.sql && (
                    <div>
                      <div className="terminal-header">
                        <div className="terminal-dot" style={{ background: '#f43f5e' }} />
                        <div className="terminal-dot" style={{ background: '#f59e0b' }} />
                        <div className="terminal-dot" style={{ background: '#10b981' }} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, marginLeft: '6px' }}>
                          SYNTHESIZED SQLITE QUERY
                        </span>
                        <button
                          onClick={() => handleCopySql(entry.sql, idx)}
                          className="btn-ghost"
                          style={{ padding: '2px 8px', fontSize: '0.74rem', marginLeft: 'auto' }}
                        >
                          {copiedIndex === idx ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                          {copiedIndex === idx ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="code-block" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, margin: 0 }}>
                        <code>{entry.sql}</code>
                      </pre>
                    </div>
                  )}

                  {/* AI Executive Insight Callout */}
                  {entry.insight && (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        borderRadius: '14px',
                        padding: '1.2rem 1.4rem',
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'flex-start',
                        boxShadow: '0 4px 20px rgba(56, 189, 248, 0.1)'
                      }}
                    >
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
                          padding: '8px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)'
                        }}
                      >
                        <Sparkles size={17} color="white" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '4px' }}>
                          EXECUTIVE STRATEGY TAKEAWAY
                        </div>
                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: '#f8fafc' }}>
                          {entry.insight}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Smart Data Visualizer */}
                  {entry.data && entry.data.length > 0 && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <ChartRenderer
                        data={entry.data}
                        chartType={entry.chartType || 'bar'}
                        height={310}
                      />
                    </div>
                  )}
                </>
              )}
            </article>
          ))
        )}
      </div>

    </div>
  );
}
