import React, { useState } from 'react';
import {
  Key,
  Cpu,
  Globe,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Server
} from 'lucide-react';

export default function SettingsTab({
  apiKeyInput,
  setApiKeyInput,
  modelInput,
  setModelInput,
  baseUrlInput,
  setBaseUrlInput,
  handleSaveConfig,
  configSaved,
  backendStatus,
  backendInfo,
  activeTable,
  apiBaseUrl,
  handleClearDb
}) {
  const [showKey, setShowKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch(`${apiBaseUrl}/status`);
      if (res.ok) {
        setTestResult({ success: true, message: 'FastAPI backend connection verified!' });
      } else {
        setTestResult({ success: false, message: `Server returned status ${res.status}` });
      }
    } catch (e) {
      setTestResult({ success: false, message: 'Could not connect to backend server.' });
    }
    setTestingConnection(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-purple">
            <Cpu size={13} /> AI Runtime Configuration
          </span>
        </div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          System & LLM Settings
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', margin: '4px 0 0 0' }}>
          Configure API credentials, choose AI inference models, and manage database persistence.
        </p>
      </div>

      {/* Main Settings Panel */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* API Key */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={16} color="#38bdf8" /> OpenAI / LLM API Key
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-proj-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="input-glass"
              style={{ width: '100%', paddingRight: '42px' }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer'
              }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            Optional: If left blank, the built-in Smart Heuristic SQL synthesizer takes over automatically so you can analyze datasets 100% offline without any API key or subscription.
          </div>
        </div>

        {/* Model Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={16} color="#818cf8" /> Language Model Engine
          </label>
          <select
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            className="input-glass"
            style={{ width: '100%' }}
          >
            <option value="gpt-4o-mini">OpenAI GPT-4o-mini (Fast & Recommended)</option>
            <option value="gpt-4o">OpenAI GPT-4o (High Intelligence)</option>
            <option value="gpt-3.5-turbo">GPT-3.5-turbo (Legacy)</option>
            <option value="custom">Custom / Local LLM (Ollama / vLLM)</option>
          </select>
        </div>

        {/* Custom Base URL (Optional) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={16} color="#34d399" /> Custom Base URL (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. http://localhost:11434/v1 (for local Ollama)"
            value={baseUrlInput}
            onChange={(e) => setBaseUrlInput(e.target.value)}
            className="input-glass"
            style={{ width: '100%' }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
          <button
            onClick={handleSaveConfig}
            className="btn-primary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Save & Persist Configuration
          </button>
          <button
            onClick={testConnection}
            disabled={testingConnection}
            className="btn-secondary"
            style={{ padding: '0.75rem 1.25rem' }}
          >
            {testingConnection ? <RefreshCw size={14} className="pulse-dot" /> : <Server size={14} />}
            <span>Test Connection</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {configSaved && (
          <div
            className="animate-fade-in"
            style={{
              color: '#34d399',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <CheckCircle2 size={16} /> Credentials persisted to server environment successfully!
          </div>
        )}

        {testResult && (
          <div
            className="animate-fade-in"
            style={{
              color: testResult.success ? '#34d399' : '#fb7185',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
            }}
          >
            {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {testResult.message}
          </div>
        )}
      </div>

      {/* Diagnostics Card */}
      <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={17} color="var(--primary)" /> Backend Diagnostics & Telemetry
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Backend URL</span>
            <code style={{ color: '#38bdf8' }}>{apiBaseUrl}</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Connection Status</span>
            <span style={{ color: backendStatus === 'online' ? '#34d399' : '#f43f5e', fontWeight: 700 }}>
              {backendStatus.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Active SQLite Table</span>
            <code>{activeTable || 'None'}</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Inference Mode</span>
            <span>{backendInfo?.llm_configured ? 'OpenAI GPT-4o-mini' : 'Smart Offline Heuristics Engine'}</span>
          </div>
        </div>

        <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fb7185' }}>Reset Analytics Database</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Drops all SQLite tables and clears state cache.</div>
          </div>
          <button
            onClick={handleClearDb}
            className="btn-danger-ghost"
          >
            <Trash2 size={14} /> Reset Database
          </button>
        </div>
      </div>

    </div>
  );
}
