import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  X,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function DataExplorerTab({
  activeTable,
  previewData,
  previewLoading,
  fetchPreview,
  handleExportCsv
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedColStats, setSelectedColStats] = useState(null);

  const columns = previewData?.columns || [];
  const records = previewData?.records || [];

  // Sort handler
  const handleSort = (col) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Filter & Sort
  const processedRecords = useMemo(() => {
    let result = [...records];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(val => String(val).toLowerCase().includes(term))
      );
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const isNum = typeof valA === 'number' && typeof valB === 'number';
        if (isNum) {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [records, searchTerm, sortColumn, sortDirection]);

  // Pagination calculation
  const totalRecords = processedRecords.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRecords.slice(start, start + pageSize);
  }, [processedRecords, currentPage, pageSize]);

  // Compute Column Statistics
  const computeColumnStats = (col) => {
    const values = records.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== 'N/A' && v !== '');
    const isNum = values.length > 0 && values.every(v => typeof v === 'number' || !isNaN(Number(v)));

    const distinct = new Set(values);
    let min = null, max = null, avg = null, sum = null;

    if (isNum && values.length > 0) {
      const nums = values.map(v => Number(v));
      min = Math.min(...nums);
      max = Math.max(...nums);
      sum = nums.reduce((acc, curr) => acc + curr, 0);
      avg = (sum / nums.length).toFixed(2);
    }

    setSelectedColStats({
      column: col,
      totalRows: records.length,
      nonNullCount: values.length,
      nullCount: records.length - values.length,
      distinctCount: distinct.size,
      isNumeric: isNum,
      min,
      max,
      avg,
      sum
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', width: '100%' }}>
      
      {/* Top Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
              Dataset Grid Explorer
            </h2>
            <span className="badge badge-blue">
              Table: {activeTable}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            Interactive schema viewer, client sorting, filtering, and column distribution analysis.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
            <input
              type="text"
              placeholder="Search across all columns..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-glass"
              style={{
                paddingLeft: '34px',
                paddingRight: '12px',
                fontSize: '0.85rem',
                width: '240px',
                paddingTop: '0.55rem',
                paddingBottom: '0.55rem'
              }}
            />
          </div>

          {/* Rows Per Page */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="input-glass"
            style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={() => fetchPreview(activeTable)}
            disabled={previewLoading}
            className="btn-secondary"
            style={{ padding: '0.55rem 0.95rem' }}
          >
            <RefreshCw size={14} className={previewLoading ? 'pulse-dot' : ''} />
            <span>Refresh</span>
          </button>

          {/* Export button */}
          <button
            onClick={() => handleExportCsv(processedRecords, `${activeTable}_grid_export.csv`)}
            disabled={processedRecords.length === 0}
            className="btn-primary"
            style={{ padding: '0.55rem 1.15rem' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div
        style={{
          flex: 1,
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'auto',
          background: 'rgba(8, 12, 26, 0.7)',
          boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
      >
        {previewLoading ? (
          <div style={{ padding: '4.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="pulse-dot" style={{ marginBottom: '0.75rem' }} />
            <div>Loading records from SQLite...</div>
          </div>
        ) : paginatedRecords.length === 0 ? (
          <div style={{ padding: '4.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Filter size={24} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
            <div>No matching records found for "{searchTerm}".</div>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                {columns.map((col, idx) => (
                  <th key={idx}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span
                        onClick={() => handleSort(col)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {col}
                        {sortColumn === col ? (
                          sortDirection === 'asc' ? <ArrowUp size={13} color="#38bdf8" /> : <ArrowDown size={13} color="#38bdf8" />
                        ) : (
                          <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                        )}
                      </span>
                      <button
                        onClick={() => computeColumnStats(col)}
                        title="View Column Statistics"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Info size={13} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((row, rIdx) => {
                const actualIndex = (currentPage - 1) * pageSize + rIdx + 1;
                return (
                  <tr key={rIdx}>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textAlign: 'center' }}>
                      {actualIndex}
                    </td>
                    {columns.map((col, cIdx) => (
                      <td key={cIdx}>
                        {typeof row[col] === 'number'
                          ? row[col].toLocaleString()
                          : String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' }}>
        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Showing <strong>{totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
          <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> of{' '}
          <strong>{totalRecords.toLocaleString()}</strong> records
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem' }}
          >
            <ChevronLeft size={15} /> Prev
          </button>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem' }}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Column Statistics Modal */}
      {selectedColStats && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
          onClick={() => setSelectedColStats(null)}
        >
          <div
            className="glass-panel-elevated"
            style={{
              width: '450px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: '4px' }}>
                  {selectedColStats.isNumeric ? 'NUMERIC METRIC' : 'CATEGORICAL / TEXT'}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {selectedColStats.column}
                </h3>
              </div>
              <button
                onClick={() => setSelectedColStats(null)}
                className="btn-ghost"
                style={{ padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Non-Null Values</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>
                  {selectedColStats.nonNullCount}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Missing / Nulls</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: selectedColStats.nullCount > 0 ? '#f43f5e' : '#34d399' }}>
                  {selectedColStats.nullCount}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unique Distinct Values</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#818cf8' }}>
                  {selectedColStats.distinctCount}
                </div>
              </div>

              {selectedColStats.isNumeric && (
                <>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mean / Average</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>
                      {selectedColStats.avg}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Minimum Value</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>
                      {selectedColStats.min}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Maximum Value</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ec4899' }}>
                      {selectedColStats.max}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setSelectedColStats(null)}
              className="btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Close Statistics
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
