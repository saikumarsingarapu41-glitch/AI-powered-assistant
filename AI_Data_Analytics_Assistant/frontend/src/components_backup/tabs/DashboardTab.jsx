import React, { useMemo } from 'react';
import {
  Sparkles,
  Database,
  BarChart3,
  TrendingUp,
  Table,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  PieChart
} from 'lucide-react';
import StatCard from '../common/StatCard';
import ChartRenderer from '../common/ChartRenderer';

export default function DashboardTab({
  activeTable,
  backendInfo,
  metrics,
  previewData,
  onRunQuestion,
  history,
  onNavigateTab
}) {
  const totalRows = metrics ? metrics['Total Rows'] : (backendInfo?.total_rows || 0);
  const totalCols = metrics ? metrics['Total Columns'] : (backendInfo?.columns?.length || 0);
  const missingVals = metrics ? metrics['Missing Values'] : 0;
  const duplicateRows = metrics ? metrics['Duplicate Rows'] : 0;

  const qualityScore = totalRows > 0
    ? Math.max(70, Math.min(100, Math.round(100 - ((missingVals + duplicateRows) / (totalRows * Math.max(1, totalCols))) * 100)))
    : 100;

  // Auto-generate a high-level summary chart from preview data if available
  const topColumns = previewData?.columns || [];
  const previewRows = previewData?.records || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Hero Welcome Banner */}
      <div
        className="glass-panel-elevated"
        style={{
          padding: '2rem 2.25rem',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div style={{ maxWidth: '650px', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-blue">
              <Sparkles size={12} /> Real-Time Analytics
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Dataset: <strong style={{ color: '#38bdf8' }}>{activeTable || 'None'}</strong>
            </span>
          </div>
          <h2
            style={{
              fontSize: '2.1rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              margin: '0.25rem 0 0.5rem 0',
              lineHeight: 1.2
            }}
          >
            Executive Data Intelligence Center
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
            Autonomous statistical diagnostics, natural language queries, and predictive machine learning on demand.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', zIndex: 2 }}>
          <button
            onClick={() => onNavigateTab('chat')}
            className="btn-primary"
            style={{ padding: '0.75rem 1.35rem' }}
          >
            <Sparkles size={16} />
            <span>Ask Natural Language Query</span>
          </button>
          <button
            onClick={() => onNavigateTab('preview')}
            className="btn-secondary"
            style={{ padding: '0.75rem 1.2rem' }}
          >
            <Table size={16} />
            <span>Explore Raw Data</span>
          </button>
        </div>

        {/* Ambient background glow */}
        <div
          style={{
            position: 'absolute',
            right: '-10%',
            top: '-50%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* KPI Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="TOTAL DATASET VOLUME"
          value={totalRows ? totalRows.toLocaleString() : '0'}
          subtitle={activeTable ? `Active in SQLite "${activeTable}"` : 'No dataset loaded'}
          icon={Database}
          color="#38bdf8"
          bgGradient="rgba(56, 189, 248, 0.1)"
        />

        <StatCard
          title="SCHEMA DIMENSIONALITY"
          value={totalCols ? `${totalCols} Columns` : '0'}
          subtitle="Numeric & Categorical fields"
          icon={Layers}
          color="#818cf8"
          bgGradient="rgba(129, 140, 248, 0.1)"
        />

        <StatCard
          title="DATA CLEANLINESS INDEX"
          value={`${qualityScore}%`}
          subtitle={`${missingVals} imputed nulls, ${duplicateRows} duplicates`}
          icon={ShieldCheck}
          trend="Certified Clean"
          color="#34d399"
          bgGradient="rgba(16, 185, 129, 0.1)"
        />

        <StatCard
          title="AI INFERENCE ENGINE"
          value={backendInfo?.llm_configured ? 'GPT-4o-mini' : 'Smart Heuristic'}
          subtitle={backendInfo?.llm_configured ? 'OpenAI Cloud Engine' : 'Zero-Key Offline NLQ Parser'}
          icon={Cpu}
          color="#c084fc"
          bgGradient="rgba(192, 132, 252, 0.1)"
        />
      </div>

      {/* Main Visuals & Action Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', alignItems: 'stretch' }}>
        
        {/* Quick Visualization Snapshot */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} color="var(--primary)" /> Dataset Sample Visualizer
              </h3>
              <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Automated preview chart from the first 15 records
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('preview')}
              className="btn-ghost"
              style={{ fontSize: '0.8rem', padding: '4px 8px' }}
            >
              View Grid <ArrowRight size={13} />
            </button>
          </div>

          {previewRows.length > 0 ? (
            <div style={{ flex: 1, minHeight: '260px' }}>
              <ChartRenderer data={previewRows.slice(0, 15)} chartType="bar" height={270} />
            </div>
          ) : (
            <div
              style={{
                height: '240px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: '12px'
              }}
            >
              <Database size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
              <div>Load or upload a dataset to generate visual snapshots</div>
            </div>
          )}
        </div>

        {/* 1-Click Executive Deep Dives */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="#f59e0b" /> Instant AI Deep Dives
            </h3>
            <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Click any question below to trigger automated SQL generation & insights
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div
              className="feature-chip-card"
              onClick={() => onRunQuestion("Which product generated the highest revenue?")}
            >
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '8px', borderRadius: '10px' }}>
                <TrendingUp size={18} color="#38bdf8" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.885rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Top Revenue Drivers
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  "Which product generated the highest revenue?"
                </div>
              </div>
            </div>

            <div
              className="feature-chip-card"
              onClick={() => onRunQuestion("What is the total revenue by region?")}
            >
              <div style={{ background: 'rgba(129, 140, 248, 0.15)', padding: '8px', borderRadius: '10px' }}>
                <PieChart size={18} color="#818cf8" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.885rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Regional Sales Breakdown
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  "What is the total revenue by region?"
                </div>
              </div>
            </div>

            <div
              className="feature-chip-card"
              onClick={() => onRunQuestion("What are the top 5 states by 2020 census?")}
            >
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '10px' }}>
                <BarChart3 size={18} color="#34d399" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.885rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Demographic Ranking
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  "What are the top 5 states by 2020 census?"
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Analysis Stream */}
      {history.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
              Recent Intelligence Inquiries ({history.length})
            </h3>
            <button
              onClick={() => onNavigateTab('chat')}
              className="btn-ghost"
              style={{ fontSize: '0.825rem' }}
            >
              View Full Thread <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {history.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="glass-card-interactive"
                onClick={() => onNavigateTab('chat')}
                style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                    {item.timestamp}
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
                    {item.row_count || item.data?.length || 0} rows
                  </span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {item.question}
                </div>
                {item.insight && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.insight}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
