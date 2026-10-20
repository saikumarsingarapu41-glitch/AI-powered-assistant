import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Zap,
  Compass,
  Activity,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({
  file,
  setFile,
  uploading,
  handleUpload,
  handleLoadSample,
  availableTables,
  activeTable,
  handleSelectTable,
  metrics,
  backendInfo,
  handleClearDb,
  collapsed,
  setCollapsed
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // Compute Cleanliness Score
  const totalRows = metrics ? metrics['Total Rows'] : (backendInfo?.total_rows || 0);
  const missingVals = metrics ? metrics['Missing Values'] : 0;
  const duplicateRows = metrics ? metrics['Duplicate Rows'] : 0;
  const totalCols = metrics ? metrics['Total Columns'] : (backendInfo?.columns?.length || 0);

  const cleanlinessScore = totalRows > 0
    ? Math.max(70, Math.min(100, Math.round(100 - ((missingVals + duplicateRows) / (totalRows * Math.max(1, totalCols))) * 100)))
    : 100;

  if (collapsed) {
    return (
      <aside
        className="glass-panel"
        style={{
          width: '58px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1rem 0.5rem',
          gap: '1.25rem',
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          flexShrink: 0
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          className="btn-ghost"
          title="Expand Sidebar"
          style={{ padding: '8px' }}
        >
          <ChevronRight size={18} />
        </button>

        <div
          title="Upload Dataset"
          onClick={() => setCollapsed(false)}
          style={{ cursor: 'pointer', padding: '8px', color: 'var(--primary)' }}
        >
          <Upload size={18} />
        </div>

        <div
          title="Demo Datasets"
          onClick={() => setCollapsed(false)}
          style={{ cursor: 'pointer', padding: '8px', color: '#818cf8' }}
        >
          <Zap size={18} />
        </div>

        <div
          title="Data Health"
          onClick={() => setCollapsed(false)}
          style={{ cursor: 'pointer', padding: '8px', color: '#34d399' }}
        >
          <Activity size={18} />
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="glass-panel"
      style={{
        width: '320px',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem',
        gap: '1.25rem',
        overflowY: 'auto',
        flexShrink: 0,
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Top Header with Collapse Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3
          style={{
            fontSize: '0.925rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: 0,
            letterSpacing: '0.02em',
            color: 'var(--text-main)'
          }}
        >
          <Upload size={16} color="var(--primary)" /> DATASET PIPELINE
        </h3>
        <button
          onClick={() => setCollapsed(true)}
          className="btn-ghost"
          title="Collapse Sidebar"
          style={{ padding: '4px 8px' }}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: file || dragOver
              ? '2px solid rgba(56, 189, 248, 0.7)'
              : '2px dashed rgba(255, 255, 255, 0.16)',
            borderRadius: '14px',
            padding: '1.2rem 0.85rem',
            textAlign: 'center',
            background: file || dragOver ? 'rgba(56, 189, 248, 0.1)' : 'rgba(8, 12, 24, 0.65)',
            marginBottom: '0.75rem',
            transition: 'all 0.25s ease',
            cursor: 'pointer'
          }}
        >
          <input
            type="file"
            id="file-upload"
            accept=".csv, .xlsx, .xls"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.6rem'
              }}
            >
              <FileSpreadsheet size={20} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: file ? '#38bdf8' : 'var(--text-main)' }}>
              {file ? file.name : 'Drop CSV / Excel File'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or click to browse from device'}
            </div>
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn-primary"
          style={{ width: '100%', padding: '0.65rem' }}
        >
          {uploading ? (
            <>
              <RefreshCw size={15} className="pulse-dot" />
              <span>Cleaning & Loading...</span>
            </>
          ) : (
            <>
              <Upload size={15} />
              <span>Ingest & Clean Data</span>
            </>
          )}
        </button>
      </div>

      {/* 1-Click Demo Datasets */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '0.55rem' }}>
          SAMPLE DATASETS (1-CLICK LOAD)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <button
            onClick={() => handleLoadSample('sales')}
            disabled={uploading}
            className="btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'space-between',
              fontSize: '0.825rem',
              padding: '0.55rem 0.75rem',
              borderColor: activeTable === 'sales_data' ? 'var(--primary)' : 'var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Zap size={14} color="#38bdf8" />
              <span>Sales & Revenue</span>
            </div>
            <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
              33 rows
            </span>
          </button>

          <button
            onClick={() => handleLoadSample('census')}
            disabled={uploading}
            className="btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'space-between',
              fontSize: '0.825rem',
              padding: '0.55rem 0.75rem',
              borderColor: activeTable === 'census_data' ? 'var(--accent-purple)' : 'var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Compass size={14} color="#818cf8" />
              <span>US 2020 Census</span>
            </div>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
              102 rows
            </span>
          </button>
        </div>
      </div>

      {/* Table Switcher */}
      {availableTables && availableTables.length > 1 && (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '0.45rem' }}>
            LOADED DATABASE TABLES
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {availableTables.filter(t => t !== 'dataset').map((t, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectTable(t)}
                className={activeTable === t ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <hr style={{ borderColor: 'var(--border-subtle)', margin: '0' }} />

      {/* Data Health & Quality Metrics */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h4
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              margin: 0,
              color: 'var(--text-main)'
            }}
          >
            <Activity size={15} color="var(--primary)" /> DATA HEALTH GAUGE
          </h4>
          <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
            <ShieldCheck size={12} /> {cleanlinessScore}% Clean
          </span>
        </div>

        {totalRows > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div
              className="glass-panel"
              style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(56, 189, 248, 0.05)' }}
            >
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38bdf8' }}>
                {totalRows.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Rows</div>
            </div>

            <div
              className="glass-panel"
              style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(129, 140, 248, 0.05)' }}
            >
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#818cf8' }}>
                {totalCols}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Columns</div>
            </div>

            <div
              className="glass-panel"
              style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)' }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399' }}>
                {missingVals}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Imputed Nulls</div>
            </div>

            <div
              className="glass-panel"
              style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(245, 158, 11, 0.05)' }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b' }}>
                {duplicateRows}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Deduped Rows</div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '1.25rem 0.85rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.785rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              background: 'rgba(0,0,0,0.2)'
            }}
          >
            No active dataset loaded. Ingest a file or click a sample dataset above.
          </div>
        )}
      </div>

      {/* Database Reset Action */}
      <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
        <button
          onClick={handleClearDb}
          className="btn-danger-ghost"
          style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
        >
          <Trash2 size={14} /> Clear SQLite Database
        </button>
      </div>
    </aside>
  );
}
