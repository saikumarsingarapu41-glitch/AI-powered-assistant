import React, { useState } from 'react';
import axios from 'axios';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Download,
  AlertCircle,
  Database,
  Layers,
  Sparkles,
  RefreshCw,
  BarChart3,
  Table as TableIcon
} from 'lucide-react';
import ChartRenderer from '../common/ChartRenderer';

export default function SqlStudioTab({
  activeTable,
  backendInfo,
  apiBaseUrl,
  sqlCode,
  setSqlCode
}) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [viewType, setViewType] = useState('table'); // 'table' | 'bar'
  const [execTime, setExecTime] = useState(null);

  const defaultQuery = `SELECT * FROM "${activeTable || 'sales_data'}" LIMIT 25;`;
  const currentSql = sqlCode || defaultQuery;

  const handleRunSql = async () => {
    if (!currentSql.trim()) return;
    setRunning(true);
    setError(null);
    const start = performance.now();

    try {
      const res = await axios.post(`${apiBaseUrl}/execute-sql`, {
        sql: currentSql,
        table_name: activeTable
      });
      const end = performance.now();
      setExecTime(Math.round(end - start));
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'SQL execution failed.');
      setResult(null);
    }
    setRunning(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setTemplate = (templateSql) => {
    setSqlCode(templateSql);
  };

  const handleExportCsv = (data) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sql_studio_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-purple">
              <Terminal size={13} /> Direct Database Execution
            </span>
            <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
              Read-Only Safe Mode Active
            </span>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
            Interactive SQL Studio
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            Execute analytical SQL directly against SQLite with automated schema validation and visual rendering.
          </p>
        </div>

        {/* Quick Query Templates */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTemplate(`SELECT * FROM "${activeTable}" LIMIT 25;`)}
            className="btn-secondary"
            style={{ fontSize: '0.785rem', padding: '0.45rem 0.75rem' }}
          >
            Select Top 25
          </button>
          <button
            onClick={() => setTemplate(`SELECT COUNT(*) AS total_rows FROM "${activeTable}";`)}
            className="btn-secondary"
            style={{ fontSize: '0.785rem', padding: '0.45rem 0.75rem' }}
          >
            Count Rows
          </button>
          {backendInfo?.columns && backendInfo.columns.length > 1 && (
            <button
              onClick={() => setTemplate(`SELECT "${backendInfo.columns[0]}", COUNT(*) AS count\nFROM "${activeTable}"\nGROUP BY "${backendInfo.columns[0]}"\nORDER BY count DESC\nLIMIT 10;`)}
              className="btn-secondary"
              style={{ fontSize: '0.785rem', padding: '0.45rem 0.75rem' }}
            >
              Group By Count
            </button>
          )}
        </div>
      </div>

      {/* Editor & Controls */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Terminal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="terminal-dot" style={{ background: '#f43f5e' }} />
            <div className="terminal-dot" style={{ background: '#f59e0b' }} />
            <div className="terminal-dot" style={{ background: '#10b981' }} />
            <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontWeight: 700, marginLeft: '8px' }}>
              SQL QUERY EDITOR • TARGET TABLE: {activeTable}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleCopy}
              className="btn-ghost"
              style={{ padding: '4px 8px', fontSize: '0.76rem' }}
            >
              {copied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleRunSql}
              disabled={running}
              className="btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              {running ? <RefreshCw size={14} className="pulse-dot" /> : <Play size={14} />}
              <span>{running ? 'Executing...' : 'Run Query'}</span>
            </button>
          </div>
        </div>

        {/* Text Area Code Box */}
        <textarea
          value={currentSql}
          onChange={(e) => setSqlCode(e.target.value)}
          rows={6}
          style={{
            width: '100%',
            background: '#070a16',
            border: 'none',
            color: '#7dd3fc',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.925rem',
            padding: '1.15rem 1.35rem',
            outline: 'none',
            resize: 'vertical',
            lineHeight: 1.6
          }}
          placeholder="Enter SELECT SQL query..."
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            padding: '1.15rem',
            borderRadius: '12px',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <AlertCircle size={20} color="#fb7185" style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Query Execution Results
              </h3>
              <span className="badge badge-blue">
                {result.row_count} rows returned
              </span>
              {execTime !== null && (
                <span className="badge badge-green">
                  {execTime} ms
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', background: 'rgba(8, 12, 26, 0.85)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setViewType('table')}
                  className={viewType === 'table' ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem' }}
                >
                  <TableIcon size={14} /> Table
                </button>
                <button
                  onClick={() => setViewType('bar')}
                  className={viewType === 'bar' ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem' }}
                >
                  <BarChart3 size={14} /> Chart
                </button>
              </div>

              <button
                onClick={() => handleExportCsv(result.data)}
                disabled={!result.data || result.data.length === 0}
                className="btn-secondary"
                style={{ padding: '5px 12px', fontSize: '0.825rem' }}
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          {/* AI Executive Insight */}
          {result.insight && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'center'
              }}
            >
              <Sparkles size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.9rem', color: '#f8fafc', lineHeight: 1.5 }}>
                {result.insight}
              </div>
            </div>
          )}

          {/* Data Renderer */}
          {result.data && result.data.length > 0 ? (
            viewType === 'table' ? (
              <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      {Object.keys(result.data[0]).map((col, idx) => (
                        <th key={idx}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {Object.keys(result.data[0]).map((col, cIdx) => (
                          <td key={cIdx}>
                            {typeof row[col] === 'number'
                              ? row[col].toLocaleString()
                              : String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ height: '320px', width: '100%' }}>
                <ChartRenderer data={result.data} chartType="bar" height={320} />
              </div>
            )
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Query executed successfully but returned 0 rows.
            </div>
          )}

        </div>
      )}

    </div>
  );
}
