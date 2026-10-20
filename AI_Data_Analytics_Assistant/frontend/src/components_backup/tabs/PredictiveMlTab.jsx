import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Layers,
  RefreshCw,
  Calculator,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export default function PredictiveMlTab({
  dataColumns,
  predictTarget,
  setPredictTarget,
  predictFeatures,
  toggleFeatureCol,
  handleRunPrediction,
  predictLoading,
  predictResult,
  predictError
}) {
  // Local state for the What-If Simulator inputs
  const [simulatorInputs, setSimulatorInputs] = useState({});

  // Real-time What-If scenario output calculation:
  // predictedY = intercept + sum(coeff * value)
  const simulatedOutput = useMemo(() => {
    if (!predictResult || !predictResult.coefficients) return null;
    const intercept = predictResult.intercept || 0;
    let total = intercept;

    predictFeatures.forEach(feat => {
      const coeff = predictResult.coefficients[feat] || 0;
      const val = simulatorInputs[feat] !== undefined ? Number(simulatorInputs[feat]) : 100;
      total += coeff * val;
    });

    return total.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [predictResult, predictFeatures, simulatorInputs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1050px', margin: '0 auto', width: '100%' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-green">
            <TrendingUp size={13} /> Scikit-Learn Regression Engine
          </span>
        </div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          Automated Machine Learning & Forecasting
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', margin: '4px 0 0 0' }}>
          Train multivariable regression models, evaluate statistical accuracy, and run interactive What-If scenario simulations.
        </p>
      </div>

      {/* Feature & Target Picker Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Target Variable (Y) */}
        <div className="glass-panel" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
            <TrendingUp size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
              Target Variable (Y)
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Select the continuous numerical column you wish to forecast:
          </p>

          {dataColumns.numerical_columns.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              No numerical metrics detected in this dataset.
            </div>
          ) : (
            <select
              value={predictTarget}
              onChange={(e) => setPredictTarget(e.target.value)}
              className="input-glass"
              style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.925rem' }}
            >
              {dataColumns.numerical_columns.map((col, idx) => (
                <option key={idx} value={col}>{col}</option>
              ))}
            </select>
          )}
        </div>

        {/* Feature Predictors (X) */}
        <div className="glass-panel" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
            <Layers size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
              Input Feature Predictors (X)
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            Click to toggle the independent variables used to train the model:
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '130px', overflowY: 'auto' }}>
            {dataColumns.numerical_columns
              .filter(c => c !== predictTarget)
              .map((col, idx) => {
                const isSelected = predictFeatures.includes(col);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleFeatureCol(col)}
                    className={isSelected ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: '10px' }}
                  >
                    {col}
                  </button>
                );
              })}
          </div>
        </div>

      </div>

      {/* Train Button */}
      <button
        onClick={handleRunPrediction}
        disabled={predictLoading || !predictTarget || predictFeatures.length === 0}
        className="btn-primary"
        style={{ padding: '0.9rem', fontSize: '1rem', width: '100%', borderRadius: '14px' }}
      >
        {predictLoading ? (
          <>
            <RefreshCw size={18} className="pulse-dot" />
            <span>Training Regression Pipeline...</span>
          </>
        ) : (
          <>
            <TrendingUp size={18} />
            <span>Train Scikit-Learn Model ({predictFeatures.length} features selected)</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {predictError && (
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
          <div>{predictError}</div>
        </div>
      )}

      {/* Results & What-If Studio */}
      {predictResult && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="badge badge-green" style={{ marginBottom: '4px' }}>
                <CheckCircle2 size={13} /> Model Converged Successfully
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                Model Performance & Statistical Metrics
              </h3>
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Target: <strong style={{ color: '#38bdf8' }}>{predictResult.target}</strong>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1.15rem', textAlign: 'center', background: 'rgba(56, 189, 248, 0.08)' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#38bdf8' }}>
                {predictResult.r2}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                R² Determination Score
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                {Number(predictResult.r2) > 0.7 ? 'Strong correlation' : 'Moderate correlation'}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.15rem', textAlign: 'center', background: 'rgba(129, 140, 248, 0.08)' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#818cf8' }}>
                {predictResult.mae}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Mean Absolute Error (MAE)
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Average deviation per row
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.15rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.08)' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#34d399' }}>
                {predictResult.rmse ?? predictResult.mae}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Root Mean Squared Error (RMSE)
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Penalty for outlier divergence
              </div>
            </div>
          </div>

          {/* Learned Linear Equation */}
          {predictResult.formula && (
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '6px' }}>
                CALIBRATED STATISTICAL EQUATION
              </div>
              <pre className="code-block" style={{ margin: 0, fontSize: '0.885rem' }}>
                <code>{predictResult.formula}</code>
              </pre>
            </div>
          )}

          {/* Scatter Chart (Actual vs Predicted) */}
          {predictResult.scatter_data && predictResult.scatter_data.length > 0 && (
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                Actual vs. Predicted Convergence
              </h4>
              <div style={{ height: '280px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      type="number"
                      dataKey="actual"
                      name="Actual"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={val => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                    />
                    <YAxis
                      type="number"
                      dataKey="predicted"
                      name="Predicted"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={val => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ background: '#0b1020', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px' }}
                    />
                    <Scatter name="Points" data={predictResult.scatter_data} fill="#38bdf8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* WHAT-IF SCENARIO CALCULATOR */}
          <div
            className="glass-panel"
            style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.06) 0%, rgba(99, 102, 241, 0.05) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
              <Calculator size={18} color="#38bdf8" />
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Interactive "What-If" Scenario Simulator
              </h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Modify feature values below to test live real-time model predictions:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {predictFeatures.map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {feat}
                  </label>
                  <input
                    type="number"
                    value={simulatorInputs[feat] ?? ''}
                    onChange={(e) => setSimulatorInputs({ ...simulatorInputs, [feat]: Number(e.target.value) })}
                    className="input-glass"
                    style={{ padding: '0.6rem 0.85rem', fontSize: '0.9rem' }}
                  />
                </div>
              ))}
            </div>

            {/* Simulated Result Callout */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                background: 'rgba(8, 12, 26, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.4)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                  SIMULATED PREDICTED {predictResult.target?.toUpperCase()}
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#38bdf8' }}>
                  {simulatedOutput ?? '—'}
                </div>
              </div>
              <span className="badge badge-blue">
                Live Formula Evaluated
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
