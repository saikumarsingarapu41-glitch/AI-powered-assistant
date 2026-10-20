import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  TableProperties,
  Terminal,
  TrendingUp,
  Settings,
  Database,
  RefreshCw,
  Layers
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  backendStatus,
  backendInfo,
  activeTable,
  checkStatus,
  checkingStatus
}) {
  const tabs = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Analytics & NLQ', icon: MessageSquare },
    { id: 'preview', label: 'Data Grid Explorer', icon: TableProperties },
    { id: 'sql', label: 'SQL Studio', icon: Terminal },
    { id: 'predict', label: 'Predictive ML', icon: TrendingUp },
    { id: 'settings', label: 'LLM & Config', icon: Settings },
  ];

  return (
    <header
      className="glass-panel"
      style={{
        margin: '0.85rem 1.25rem 0 1.25rem',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '16px',
        zIndex: 50,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}
    >
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            padding: '9px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.45)'
          }}
        >
          <Sparkles size={20} color="white" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1
              className="gradient-text"
              style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}
            >
              NexusData AI
            </h1>
            <span
              className="badge badge-purple"
              style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}
            >
              v2.5 PRO
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            Enterprise Autonomous Data Intelligence & Predictive Platform
          </p>
        </div>
      </div>

      {/* Navigation Pills */}
      <nav
        style={{
          display: 'flex',
          gap: '0.3rem',
          background: 'rgba(8, 12, 26, 0.75)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(12px)',
          overflowX: 'auto',
          maxWidth: '100%'
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? 'btn-primary' : 'btn-ghost'}
              style={{
                padding: '0.5rem 0.95rem',
                fontSize: '0.85rem',
                borderRadius: '10px',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Status & Live Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Active Dataset Pill */}
        {activeTable ? (
          <div className="badge badge-blue" style={{ padding: '0.35rem 0.85rem' }}>
            <Database size={13} />
            <span style={{ fontWeight: 700 }}>{activeTable}</span>
            {backendInfo?.total_rows > 0 && (
              <span style={{ opacity: 0.85, fontWeight: 500 }}>
                • {backendInfo.total_rows.toLocaleString()} rows
              </span>
            )}
          </div>
        ) : (
          <div className="badge badge-neutral" style={{ padding: '0.35rem 0.85rem' }}>
            <Database size={13} />
            <span>No Table Loaded</span>
          </div>
        )}

        {/* Backend Connectivity Status */}
        <button
          onClick={checkStatus}
          title="Click to recheck API status"
          className={backendStatus === 'online' ? 'badge badge-green' : 'badge badge-red'}
          style={{
            cursor: 'pointer',
            padding: '0.35rem 0.85rem',
            border: 'none',
            fontFamily: 'inherit'
          }}
        >
          <span
            className="pulse-dot"
            style={{ background: backendStatus === 'online' ? '#10b981' : '#f43f5e' }}
          />
          {backendStatus === 'online' ? 'FastAPI Online' : 'FastAPI Offline'}
          <RefreshCw
            size={11}
            style={{
              marginLeft: '4px',
              animation: checkingStatus ? 'spin 1s linear infinite' : 'none'
            }}
          />
        </button>
      </div>
    </header>
  );
}
