import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Upload, Database, Send, MessageSquare, AlertCircle, CheckCircle2,
  BarChart3, LineChart, Table, Sparkles, RefreshCw, Layers, Settings,
  Key, TrendingUp, Download, Trash2, Copy, Check, ChevronRight,
  PieChart, Activity, Zap, Compass, FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart as ReLineChart, Line,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ScatterChart, Scatter
} from 'recharts';
import './index.css';

const API_URL = "http://localhost:8000";

function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'preview' | 'predict' | 'settings'

  // Backend state
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [backendInfo, setBackendInfo] = useState({
    tables: [],
    active_table: null,
    total_rows: 0,
    columns: [],
    llm_configured: false,
    llm_model: 'gpt-4o-mini'
  });

  // Dataset State
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [activeTable, setActiveTable] = useState('dataset');
  const [suggestions, setSuggestions] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);

  // Query State
  const [query, setQuery] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Data Explorer State
  const [previewData, setPreviewData] = useState({ columns: [], records: [], total_rows: 0 });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Machine Learning State
  const [dataColumns, setDataColumns] = useState({ all_columns: [], numerical_columns: [], categorical_columns: [] });
  const [predictTarget, setPredictTarget] = useState("");
  const [predictFeatures, setPredictFeatures] = useState([]);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictResult, setPredictResult] = useState(null);
  const [predictError, setPredictError] = useState(null);

  // Settings State
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [configSaved, setConfigSaved] = useState(false);

  // Check backend connection & fetch tables
  const checkStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/status`, { timeout: 3500 });
      setBackendStatus('online');
      setBackendInfo(res.data);
      if (res.data.active_table) {
        setActiveTable(res.data.active_table);
      }
      if (res.data.tables) {
        setAvailableTables(res.data.tables);
      }
      if (res.data.has_data && suggestions.length === 0) {
        fetchSuggestions(res.data.active_table);
      }
    } catch {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 7000);
    return () => clearInterval(interval);
  }, []);

  // Fetch suggestions
  const fetchSuggestions = async (tableName) => {
    try {
      const target = tableName || activeTable;
      const res = await axios.get(`${API_URL}/suggestions/${target}`);
      if (res.data.suggestions && res.data.suggestions.length > 0) {
        setSuggestions(res.data.suggestions);
      }
    } catch (e) {
      console.warn("Could not fetch suggestions:", e);
    }
  };

  // Fetch Data Preview
  const fetchPreview = async (tableName) => {
    setPreviewLoading(true);
    try {
      const target = tableName || activeTable;
      const res = await axios.get(`${API_URL}/preview/${target}?limit=50`);
      setPreviewData(res.data);
    } catch (e) {
      console.error("Preview load failed:", e);
    }
    setPreviewLoading(false);
  };

  // Fetch columns for prediction
  const fetchColumns = async (tableName) => {
    try {
      const target = tableName || activeTable;
      const res = await axios.get(`${API_URL}/columns/${target}`);
      setDataColumns(res.data);
      if (res.data.numerical_columns && res.data.numerical_columns.length > 0) {
        setPredictTarget(res.data.numerical_columns[res.data.numerical_columns.length - 1]);
        const otherNums = res.data.numerical_columns.slice(0, -1);
        setPredictFeatures(otherNums.length > 0 ? otherNums : [res.data.numerical_columns[0]]);
      }
    } catch (e) {
      console.warn("Could not fetch column types:", e);
    }
  };

  useEffect(() => {
    if (backendStatus === 'online' && activeTable) {
      if (activeTab === 'preview') {
        fetchPreview(activeTable);
      } else if (activeTab === 'predict') {
        fetchColumns(activeTable);
      }
    }
  }, [activeTab, activeTable, backendStatus]);

  // Handle Table Switch
  const handleSelectTable = async (tName) => {
    setActiveTable(tName);
    try {
      await axios.post(`${API_URL}/select-table`, { table_name: tName });
      checkStatus();
      fetchSuggestions(tName);
      if (activeTab === 'preview') fetchPreview(tName);
      if (activeTab === 'predict') fetchColumns(tName);
    } catch (e) {
      console.error("Table switch failed:", e);
    }
  };

  // Handle File Upload
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API_URL}/upload`, formData);
      setMetrics(res.data.metrics);
      setActiveTable(res.data.table_name);
      if (res.data.suggestions) setSuggestions(res.data.suggestions);
      checkStatus();
      setFile(null);
    } catch (err) {
      alert("Error uploading file: " + (err.response?.data?.detail || err.message));
    }
    setUploading(false);
  };

  // Handle Loading Sample Datasets
  const handleLoadSample = async (type = 'sales') => {
    setUploading(true);
    try {
      const res = await axios.post(`${API_URL}/load-sample?dataset_type=${type}`);
      setMetrics(res.data.metrics);
      setActiveTable(res.data.table_name);
      if (res.data.suggestions) setSuggestions(res.data.suggestions);
      checkStatus();
    } catch (err) {
      alert("Error loading sample dataset: " + (err.response?.data?.detail || err.message));
    }
    setUploading(false);
  };

  // Handle Query Execution
  const handleQuery = async (customPrompt) => {
    const promptToSend = customPrompt || query;
    if (!promptToSend.trim()) return;

    setQueryLoading(true);
    try {
      const res = await axios.post(`${API_URL}/query`, {
        question: promptToSend,
        table_name: activeTable
      });

      const newEntry = {
        question: promptToSend,
        ...res.data,
        chartType: 'bar',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistory(prev => [newEntry, ...prev]);
      if (!customPrompt) setQuery("");
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Backend communication error. Please ensure the backend is running.";
      setHistory(prev => [{
        question: promptToSend,
        sql: "",
        insight: "",
        data: [],
        error: errorMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }, ...prev]);
    }
    setQueryLoading(false);
  };

  // Toggle chart type in history card
  const setCardChartType = (index, type) => {
    setHistory(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], chartType: type };
      return updated;
    });
  };

  // Copy SQL to clipboard
  const handleCopySql = (sqlText, idx) => {
    navigator.clipboard.writeText(sqlText);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Export query result to CSV
  const handleExportCsv = (data, filename = "query_results.csv") => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? "")).join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Machine Learning Run
  const handleRunPrediction = async () => {
    if (!predictTarget || predictFeatures.length === 0) {
      setPredictError("Please select a target variable and at least one feature column.");
      return;
    }
    setPredictLoading(true);
    setPredictError(null);
    try {
      const res = await axios.post(`${API_URL}/predict`, {
        table_name: activeTable,
        target_col: predictTarget,
        feature_cols: predictFeatures
      });
      setPredictResult(res.data);
    } catch (err) {
      setPredictError(err.response?.data?.detail || "Prediction modeling failed.");
      setPredictResult(null);
    }
    setPredictLoading(false);
  };

  // Toggle feature column for prediction
  const toggleFeatureCol = (col) => {
    if (predictFeatures.includes(col)) {
      setPredictFeatures(predictFeatures.filter(c => c !== col));
    } else {
      setPredictFeatures([...predictFeatures, col]);
    }
  };

  // Save Settings Config
  const handleSaveConfig = async () => {
    try {
      await axios.post(`${API_URL}/config`, { api_key: apiKeyInput });
      setConfigSaved(true);
      checkStatus();
      setTimeout(() => setConfigSaved(false), 2500);
    } catch {
      alert("Failed to save configuration.");
    }
  };

  // Clear Database
  const handleClearDb = async () => {
    if (!window.confirm("Are you sure you want to reset the analytics database?")) return;
    try {
      await axios.delete(`${API_URL}/database`);
      setMetrics(null);
      setHistory([]);
      setSuggestions([]);
      setPreviewData({ columns: [], records: [], total_rows: 0 });
      setPredictResult(null);
      checkStatus();
    } catch {
      alert("Failed to reset database.");
    }
  };

  // Filter preview records
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return previewData.records;
    const term = searchTerm.toLowerCase();
    return previewData.records.filter(row =>
      Object.values(row).some(val => String(val).toLowerCase().includes(term))
    );
  }, [previewData.records, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden' }}>
      
      {/* Top Navbar */}
      <header className="glass-panel" style={{
        margin: '0.85rem 1.25rem 0 1.25rem',
        padding: '0.85rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '16px',
        zIndex: 50,
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            padding: '9px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.45)'
          }}>
            <Sparkles size={22} color="white" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 className="gradient-text" style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>
                DataPulse AI
              </h1>
              <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>v2.1</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
              Autonomous Natural Language Data Analytics & Predictions
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          gap: '0.35rem',
          background: 'rgba(8, 12, 24, 0.75)',
          padding: '5px',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(12px)'
        }}>
          <button
            onClick={() => setActiveTab('chat')}
            className={activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '0.5rem 1.15rem', fontSize: '0.875rem' }}
          >
            <MessageSquare size={16} /> AI Analytics
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={activeTab === 'preview' ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '0.5rem 1.15rem', fontSize: '0.875rem' }}
          >
            <Table size={16} /> Data Explorer
          </button>
          <button
            onClick={() => setActiveTab('predict')}
            className={activeTab === 'predict' ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '0.5rem 1.15rem', fontSize: '0.875rem' }}
          >
            <TrendingUp size={16} /> ML Prediction
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={activeTab === 'settings' ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '0.5rem 1.15rem', fontSize: '0.875rem' }}
          >
            <Settings size={16} /> Config
          </button>
        </nav>

        {/* Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Active Dataset Pill */}
          {activeTable && (
            <div className="badge badge-blue" style={{ padding: '0.35rem 0.85rem' }}>
              <Database size={14} />
              <span style={{ fontWeight: 700 }}>{activeTable}</span>
              {backendInfo.total_rows > 0 && (
                <span style={{ opacity: 0.85 }}>• {backendInfo.total_rows} rows</span>
              )}
            </div>
          )}

          {/* Backend Connection Badge */}
          {backendStatus === 'online' ? (
            <div className="badge badge-green" style={{ padding: '0.35rem 0.85rem' }}>
              <span className="pulse-dot" style={{ background: '#10b981' }}></span>
              FastAPI Connected
            </div>
          ) : (
            <div className="badge badge-red" style={{ padding: '0.35rem 0.85rem' }}>
              <span className="pulse-dot" style={{ background: '#f43f5e' }}></span>
              FastAPI Offline
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, padding: '0.85rem 1.25rem 1.25rem 1.25rem', gap: '1.25rem', overflow: 'hidden' }}>
        
        {/* Left Control Sidebar */}
        <aside className="glass-panel" style={{
          width: '340px',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.35rem',
          gap: '1.35rem',
          overflowY: 'auto'
        }}>
          {/* Ingest Dataset Card */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Upload size={17} color="var(--primary)" /> Ingest Dataset
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>CSV / EXCEL</span>
            </div>
            
            {/* Dropzone Card */}
            <div style={{
              border: file ? '2px solid rgba(56, 189, 248, 0.6)' : '2px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '14px',
              padding: '1.25rem 1rem',
              textAlign: 'center',
              background: file ? 'rgba(56, 189, 248, 0.08)' : 'rgba(8, 12, 24, 0.6)',
              marginBottom: '0.85rem',
              transition: 'all 0.25s ease'
            }}>
              <input
                type="file"
                id="file-upload"
                accept=".csv, .xlsx, .xls"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.65rem'
                }}>
                  <FileSpreadsheet size={22} color="var(--primary)" />
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: file ? '#38bdf8' : 'var(--text-main)' }}>
                  {file ? file.name : "Choose CSV or Excel File"}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Automatic schema, cleaning & type imputation
                </div>
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
            >
              {uploading ? <RefreshCw size={16} className="pulse-dot" /> : <Upload size={16} />}
              {uploading ? 'Cleaning & Ingesting...' : 'Upload & Clean Data'}
            </button>
          </div>

          {/* Quick Demo Datasets */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
              READY-TO-TEST DEMO DATASETS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => handleLoadSample('sales')}
                disabled={uploading}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.65rem 0.85rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={15} color="#38bdf8" />
                  <span>Sales & Revenue Data</span>
                </div>
                <span className="badge badge-blue" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>33 rows</span>
              </button>

              <button
                onClick={() => handleLoadSample('census')}
                disabled={uploading}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.65rem 0.85rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Compass size={15} color="#818cf8" />
                  <span>US 2020 Census Data</span>
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>102 rows</span>
              </button>
            </div>
          </div>

          {/* Table Switcher */}
          {availableTables.length > 1 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                SWITCH ACTIVE TABLE
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {availableTables.filter(t => t !== 'dataset').map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectTable(t)}
                    className={activeTable === t ? "btn-primary" : "btn-secondary"}
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <hr style={{ borderColor: 'var(--border-subtle)' }} />

          {/* Dataset Health Metrics */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={17} color="var(--primary)" /> Data Health Metrics
            </h3>

            {metrics || backendInfo.total_rows > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="glass-panel" style={{ padding: '0.85rem', textAlign: 'center', background: 'rgba(56, 189, 248, 0.05)' }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#38bdf8' }}>
                    {metrics ? metrics['Total Rows'] : backendInfo.total_rows}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Rows</div>
                </div>

                <div className="glass-panel" style={{ padding: '0.85rem', textAlign: 'center', background: 'rgba(129, 140, 248, 0.05)' }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#818cf8' }}>
                    {metrics ? metrics['Total Columns'] : backendInfo.columns.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Columns</div>
                </div>

                <div className="glass-panel" style={{ padding: '0.85rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#34d399' }}>
                    {metrics ? metrics['Missing Values'] : 0}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600 }}>Imputed Nulls</div>
                </div>

                <div className="glass-panel" style={{ padding: '0.85rem', textAlign: 'center', background: 'rgba(245, 158, 11, 0.05)' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f59e0b' }}>
                    {metrics ? metrics['Duplicate Rows'] : 0}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600 }}>Deduped Rows</div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '1.75rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                background: 'rgba(0,0,0,0.2)'
              }}>
                No dataset loaded. Click a sample button above to begin.
              </div>
            )}
          </div>

          {/* Quick Database Reset */}
          <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
            <button
              onClick={handleClearDb}
              className="btn-ghost"
              style={{ width: '100%', color: '#fb7185', justifyContent: 'center', fontSize: '0.85rem' }}
            >
              <Trash2 size={15} /> Reset Database
            </button>
          </div>
        </aside>

        {/* Right Main Canvas */}
        <main className="glass-panel" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          overflowY: 'auto'
        }}>

          {/* TAB 1: AI QUERY & NATURAL LANGUAGE ANALYTICS */}
          {activeTab === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1050px', margin: '0 auto', width: '100%' }}>
              
              {/* Query Hero Bar */}
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '2.15rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 0.35rem 0' }}>
                    Ask anything about your data.
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.975rem', margin: 0 }}>
                    Type your question in plain English. The AI generates verified SQL queries, executes them instantly, and crafts executive insights.
                  </p>
                </div>

                {/* Big Search Input with Glow */}
                <div className="glass-panel" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.65rem 0.85rem 0.65rem 1.45rem',
                  gap: '0.85rem',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  boxShadow: '0 0 30px rgba(56, 189, 248, 0.15)',
                  borderRadius: '16px'
                }}>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={suggestions[0] || "e.g. Which product generated the highest revenue?"}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      fontSize: '1.1rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontWeight: 500
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                  />
                  <button
                    onClick={() => handleQuery()}
                    disabled={queryLoading || !query.trim()}
                    className="btn-primary"
                    style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}
                  >
                    {queryLoading ? <RefreshCw size={18} className="pulse-dot" /> : <Send size={18} />}
                    {queryLoading ? 'Analyzing...' : 'Ask AI'}
                  </button>
                </div>

                {/* Dynamic Suggestion Chips */}
                {suggestions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Sparkles size={13} color="#38bdf8" /> SUGGESTED QUESTIONS:
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

              {/* History & Query Results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginTop: '0.5rem' }}>
                {history.length === 0 ? (
                  /* Stunning Interactive Empty State Hero */
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{
                      padding: '2.5rem 2rem',
                      textAlign: 'center',
                      background: 'rgba(13, 18, 36, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '20px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                        border: '1px solid rgba(56, 189, 248, 0.3)'
                      }}>
                        <Sparkles size={28} color="#38bdf8" />
                      </div>
                      <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                        Ready for Analytics Exploration
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '580px', margin: '0 auto' }}>
                        Ask questions about products, regional performance, sales, discounts, or population census.
                        Click any sample exploration card below to run an instant analysis:
                      </p>
                    </div>

                    {/* Quick Exploration Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div
                        className="feature-chip-card"
                        onClick={() => handleQuery("Which product generated the highest revenue?")}
                      >
                        <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '10px', borderRadius: '12px' }}>
                          <BarChart3 size={20} color="#38bdf8" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            Top Revenue Drivers
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            "Which product generated the highest revenue?"
                          </div>
                        </div>
                      </div>

                      <div
                        className="feature-chip-card"
                        onClick={() => handleQuery("What is the total revenue by region?")}
                      >
                        <div style={{ background: 'rgba(129, 140, 248, 0.15)', padding: '10px', borderRadius: '12px' }}>
                          <Compass size={20} color="#818cf8" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            Regional Sales Distribution
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            "What is the total revenue by region?"
                          </div>
                        </div>
                      </div>

                      <div
                        className="feature-chip-card"
                        onClick={() => handleQuery("What are the top 5 states by 2020 census?")}
                      >
                        <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px' }}>
                          <TrendingUp size={20} color="#34d399" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            Census Population Rankings
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            "What are the top 5 states by 2020 census?"
                          </div>
                        </div>
                      </div>

                      <div
                        className="feature-chip-card"
                        onClick={() => handleQuery("Show all sales for Laptop")}
                      >
                        <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '10px', borderRadius: '12px' }}>
                          <Table size={20} color="#f472b6" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            Filtered Product Records
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            "Show all sales for Laptop"
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  history.map((entry, idx) => (
                    <article key={idx} className="glass-panel animate-fade-in" style={{
                      padding: '1.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.35rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 12px 35px rgba(0,0,0,0.45)'
                    }}>
                      
                      {/* Query Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>
                            ANALYSIS #{history.length - idx} • {entry.timestamp}
                          </div>
                          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                            {entry.question}
                          </h3>
                        </div>

                        {entry.data && entry.data.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {/* View Switcher Buttons */}
                            <div style={{ display: 'flex', background: 'rgba(8, 12, 24, 0.8)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                              <button
                                onClick={() => setCardChartType(idx, 'bar')}
                                className={entry.chartType === 'bar' ? 'btn-primary' : 'btn-ghost'}
                                style={{ padding: '5px 10px', borderRadius: '8px' }}
                                title="Bar Chart"
                              >
                                <BarChart3 size={15} />
                              </button>
                              <button
                                onClick={() => setCardChartType(idx, 'line')}
                                className={entry.chartType === 'line' ? 'btn-primary' : 'btn-ghost'}
                                style={{ padding: '5px 10px', borderRadius: '8px' }}
                                title="Line Chart"
                              >
                                <LineChart size={15} />
                              </button>
                              <button
                                onClick={() => setCardChartType(idx, 'area')}
                                className={entry.chartType === 'area' ? 'btn-primary' : 'btn-ghost'}
                                style={{ padding: '5px 10px', borderRadius: '8px' }}
                                title="Area Chart"
                              >
                                <TrendingUp size={15} />
                              </button>
                              <button
                                onClick={() => setCardChartType(idx, 'table')}
                                className={entry.chartType === 'table' ? 'btn-primary' : 'btn-ghost'}
                                style={{ padding: '5px 10px', borderRadius: '8px' }}
                                title="Table View"
                              >
                                <Table size={15} />
                              </button>
                            </div>

                            {/* Export CSV Button */}
                            <button
                              onClick={() => handleExportCsv(entry.data, `analysis_${idx + 1}.csv`)}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.825rem' }}
                              title="Download results as CSV"
                            >
                              <Download size={14} /> Export CSV
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Error Banner */}
                      {entry.error ? (
                        <div style={{
                          background: 'rgba(244, 63, 94, 0.12)',
                          border: '1px solid rgba(244, 63, 94, 0.35)',
                          padding: '1.15rem',
                          borderRadius: '12px',
                          color: '#fca5a5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem'
                        }}>
                          <AlertCircle size={22} color="#fb7185" style={{ flexShrink: 0 }} />
                          <div style={{ fontSize: '0.925rem' }}>{entry.error}</div>
                        </div>
                      ) : (
                        <>
                          {/* SQL Terminal Snippet */}
                          {entry.sql && (
                            <div>
                              <div className="terminal-header">
                                <div className="terminal-dot" style={{ background: '#f43f5e' }}></div>
                                <div className="terminal-dot" style={{ background: '#f59e0b' }}></div>
                                <div className="terminal-dot" style={{ background: '#10b981' }}></div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, marginLeft: '6px' }}>
                                  SQLITE QUERY
                                </span>
                                <button
                                  onClick={() => handleCopySql(entry.sql, idx)}
                                  className="btn-ghost"
                                  style={{ padding: '2px 8px', fontSize: '0.74rem', marginLeft: 'auto' }}
                                >
                                  {copiedIndex === idx ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                                  {copiedIndex === idx ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                              <pre className="code-block" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, margin: 0 }}>
                                <code>{entry.sql}</code>
                              </pre>
                            </div>
                          )}

                          {/* AI Executive Insight Card */}
                          {entry.insight && (
                            <div style={{
                              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              borderRadius: '14px',
                              padding: '1.25rem 1.45rem',
                              display: 'flex',
                              gap: '1rem',
                              alignItems: 'flex-start',
                              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.1)'
                            }}>
                              <div style={{
                                background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
                                padding: '8px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)'
                              }}>
                                <Sparkles size={18} color="white" />
                              </div>
                              <div>
                                <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '3px' }}>
                                  AI EXECUTIVE INSIGHT
                                </div>
                                <p style={{ margin: 0, fontSize: '0.985rem', lineHeight: 1.6, color: '#f8fafc' }}>
                                  {entry.insight}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Data Visualizer (Chart or Table) */}
                          {entry.data && entry.data.length > 0 && (
                            <div style={{ marginTop: '0.5rem' }}>
                              {entry.chartType === 'table' ? (
                                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                                  <table className="custom-table">
                                    <thead>
                                      <tr>
                                        {Object.keys(entry.data[0]).map((col, cIdx) => (
                                          <th key={cIdx}>{col}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {entry.data.map((row, rIdx) => (
                                        <tr key={rIdx}>
                                          {Object.keys(entry.data[0]).map((col, cIdx) => (
                                            <td key={cIdx}>
                                              {typeof row[col] === 'number'
                                                ? row[col].toLocaleString()
                                                : String(row[col])}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div style={{ height: '320px', width: '100%', marginTop: '0.5rem' }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    {entry.chartType === 'line' ? (
                                      <ReLineChart data={entry.data.slice(0, 20)}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey={Object.keys(entry.data[0])[0]} stroke="#94a3b8" fontSize={12} />
                                        <YAxis stroke="#94a3b8" fontSize={12} />
                                        <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }} />
                                        <Line
                                          type="monotone"
                                          dataKey={Object.keys(entry.data[0])[1] || Object.keys(entry.data[0])[0]}
                                          stroke="#38bdf8"
                                          strokeWidth={3}
                                          dot={{ fill: '#818cf8', r: 5 }}
                                          activeDot={{ r: 8, stroke: '#38bdf8', strokeWidth: 2 }}
                                        />
                                      </ReLineChart>
                                    ) : entry.chartType === 'area' ? (
                                      <AreaChart data={entry.data.slice(0, 20)}>
                                        <defs>
                                          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.65}/>
                                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey={Object.keys(entry.data[0])[0]} stroke="#94a3b8" fontSize={12} />
                                        <YAxis stroke="#94a3b8" fontSize={12} />
                                        <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px' }} />
                                        <Area
                                          type="monotone"
                                          dataKey={Object.keys(entry.data[0])[1] || Object.keys(entry.data[0])[0]}
                                          stroke="#38bdf8"
                                          strokeWidth={2}
                                          fillOpacity={1}
                                          fill="url(#colorArea)"
                                        />
                                      </AreaChart>
                                    ) : (
                                      <BarChart data={entry.data.slice(0, 20)}>
                                        <defs>
                                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#38bdf8"/>
                                            <stop offset="100%" stopColor="#6366f1"/>
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey={Object.keys(entry.data[0])[0]} stroke="#94a3b8" fontSize={12} />
                                        <YAxis stroke="#94a3b8" fontSize={12} />
                                        <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px' }} />
                                        <Bar
                                          dataKey={Object.keys(entry.data[0])[1] || Object.keys(entry.data[0])[0]}
                                          fill="url(#barGrad)"
                                          radius={[8, 8, 0, 0]}
                                        />
                                      </BarChart>
                                    )}
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DATA EXPLORER & PREVIEW */}
          {activeTab === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                    Dataset Explorer
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.885rem', margin: '4px 0 0 0' }}>
                    Viewing raw cleaned data for table: <strong style={{ color: '#38bdf8' }}>{activeTable}</strong> ({previewData.total_rows} total rows)
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search in table..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="glass-panel"
                    style={{
                      padding: '0.6rem 1.15rem',
                      color: 'white',
                      border: '1px solid var(--border-subtle)',
                      outline: 'none',
                      fontSize: '0.885rem',
                      width: '240px',
                      borderRadius: '10px'
                    }}
                  />
                  <button
                    onClick={() => fetchPreview(activeTable)}
                    disabled={previewLoading}
                    className="btn-secondary"
                    style={{ padding: '0.6rem 1rem' }}
                  >
                    <RefreshCw size={15} className={previewLoading ? "pulse-dot" : ""} /> Refresh
                  </button>
                  <button
                    onClick={() => handleExportCsv(previewData.records, `${activeTable}_export.csv`)}
                    disabled={previewData.records.length === 0}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1.15rem' }}
                  >
                    <Download size={15} /> Export All
                  </button>
                </div>
              </div>

              {/* Data Table Container */}
              <div style={{
                flex: 1,
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                overflow: 'auto',
                background: 'rgba(8, 12, 24, 0.65)',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
              }}>
                {previewLoading ? (
                  <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading preview rows...
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No rows match your search criteria.
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        {previewData.columns.map((col, idx) => (
                          <th key={idx}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {previewData.columns.map((col, cIdx) => (
                            <td key={cIdx}>
                              {typeof row[col] === 'number'
                                ? row[col].toLocaleString()
                                : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MACHINE LEARNING PREDICTION */}
          {activeTab === 'predict' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '950px', margin: '0 auto', width: '100%' }}>
              <div>
                <h2 style={{ fontSize: '1.85rem', fontWeight: 900, margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
                  Linear Regression Predictive Modeling
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', margin: 0 }}>
                  Train an automated machine learning regression model to discover statistical relationships and predict numerical targets.
                </p>
              </div>

              {/* Variable Selection Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* Target Selection */}
                <div className="glass-panel" style={{ padding: '1.45rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} color="#38bdf8" /> Target Variable (Y)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.15rem' }}>
                    The continuous numerical column you want to predict.
                  </p>
                  
                  {dataColumns.numerical_columns.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>No numerical columns detected.</div>
                  ) : (
                    <select
                      value={predictTarget}
                      onChange={(e) => setPredictTarget(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        background: '#090d1c',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.925rem',
                        outline: 'none'
                      }}
                    >
                      {dataColumns.numerical_columns.map((col, idx) => (
                        <option key={idx} value={col}>{col}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Feature Selection */}
                <div className="glass-panel" style={{ padding: '1.45rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color="#818cf8" /> Feature Predictors (X)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                    Select one or more input variables used to train the model.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '140px', overflowY: 'auto' }}>
                    {dataColumns.numerical_columns
                      .filter(c => c !== predictTarget)
                      .map((col, idx) => {
                        const isSelected = predictFeatures.includes(col);
                        return (
                          <button
                            key={idx}
                            onClick={() => toggleFeatureCol(col)}
                            className={isSelected ? "btn-primary" : "btn-secondary"}
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}
                          >
                            {col}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={handleRunPrediction}
                  disabled={predictLoading || !predictTarget || predictFeatures.length === 0}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.95rem', fontSize: '1.05rem', borderRadius: '14px' }}
                >
                  {predictLoading ? <RefreshCw size={20} className="pulse-dot" /> : <TrendingUp size={20} />}
                  {predictLoading ? "Training Scikit-Learn Model..." : "Train Regression Model"}
                </button>
              </div>

              {/* Error Message */}
              {predictError && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  padding: '1.15rem',
                  borderRadius: '12px',
                  color: '#fca5a5'
                }}>
                  {predictError}
                </div>
              )}

              {/* Prediction Results Banner */}
              {predictResult && (
                <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Model Evaluation Metrics</h3>
                    <div className="badge badge-green">Trained Successfully</div>
                  </div>

                  {/* Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '1.15rem', textAlign: 'center', background: 'rgba(56, 189, 248, 0.06)' }}>
                      <div style={{ fontSize: '2.15rem', fontWeight: 900, color: '#38bdf8' }}>
                        {predictResult.r2}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        R² Score (Accuracy)
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.15rem', textAlign: 'center', background: 'rgba(168, 85, 247, 0.06)' }}>
                      <div style={{ fontSize: '2.15rem', fontWeight: 900, color: '#c084fc' }}>
                        {predictResult.mae}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Mean Absolute Error (MAE)
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.15rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.06)' }}>
                      <div style={{ fontSize: '2.15rem', fontWeight: 900, color: '#34d399' }}>
                        {predictResult.rmse ?? predictResult.mae}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        RMSE Metric
                      </div>
                    </div>
                  </div>

                  {/* Formula Box */}
                  {predictResult.formula && (
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '6px' }}>
                        LEARNED LINEAR FORMULA
                      </div>
                      <pre className="code-block" style={{ margin: 0, fontSize: '0.9rem' }}>
                        <code>{predictResult.formula}</code>
                      </pre>
                    </div>
                  )}

                  {/* Scatter Chart (Actual vs Predicted) */}
                  {predictResult.scatter_data && predictResult.scatter_data.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem' }}>
                        Actual vs. Predicted Performance
                      </h4>
                      <div style={{ height: '280px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis type="number" dataKey="actual" name="Actual" stroke="#94a3b8" fontSize={12} />
                            <YAxis type="number" dataKey="predicted" name="Predicted" stroke="#94a3b8" fontSize={12} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#0b1020', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px' }} />
                            <Scatter name="Predictions" data={predictResult.scatter_data} fill="#38bdf8" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONFIGURATION & SETTINGS */}
          {activeTab === 'settings' && (
            <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '700px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.85rem', fontWeight: 900, margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
                  System Configuration
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Manage your OpenAI API Key and inspect backend telemetry.
                </p>
              </div>

              {/* API Key */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Key size={17} color="#38bdf8" /> OpenAI API Key (Optional)
                </label>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="glass-panel"
                  style={{
                    padding: '0.85rem 1rem',
                    color: 'white',
                    border: '1px solid var(--border-subtle)',
                    outline: 'none',
                    fontSize: '0.925rem',
                    borderRadius: '12px'
                  }}
                />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  If omitted, DataPulse AI seamlessly activates the built-in Smart Heuristic SQL engine so questions still work offline without requiring an API key.
                </div>
                <button
                  onClick={handleSaveConfig}
                  className="btn-primary"
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                >
                  Save API Key
                </button>
                {configSaved && (
                  <div style={{ color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '6px' }}>
                    <CheckCircle2 size={15} /> Saved and persisted configuration!
                  </div>
                )}
              </div>

              <hr style={{ borderColor: 'var(--border-subtle)' }} />

              {/* Diagnostics */}
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.85rem' }}>Backend Diagnostics</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Backend URL</span>
                    <code style={{ color: '#38bdf8' }}>{API_URL}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status</span>
                    <span style={{ color: backendStatus === 'online' ? '#34d399' : '#f43f5e', fontWeight: 700 }}>
                      {backendStatus.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Active Database Table</span>
                    <code>{activeTable || "None"}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>LLM Mode</span>
                    <span>{backendInfo.llm_configured ? "OpenAI GPT-4o-mini" : "Smart Offline Heuristics Engine"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;

