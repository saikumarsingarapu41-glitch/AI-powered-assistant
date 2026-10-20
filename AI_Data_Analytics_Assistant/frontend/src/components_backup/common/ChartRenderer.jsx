import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

const PALETTE = [
  '#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24',
  '#c084fc', '#2dd4bf', '#fb7185', '#60a5fa', '#a78bfa'
];

export default function ChartRenderer({
  data = [],
  chartType = 'bar', // 'bar' | 'line' | 'area' | 'pie' | 'table'
  height = 320
}) {
  // Determine suitable X (categorical) and Y (numerical) columns
  const { xKey, yKey, isNumericY, chartData } = useMemo(() => {
    if (!data || data.length === 0) {
      return { xKey: null, yKey: null, isNumericY: false, chartData: [] };
    }

    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    if (keys.length === 0) {
      return { xKey: null, yKey: null, isNumericY: false, chartData: [] };
    }

    // Single scalar value case (e.g. SELECT COUNT(*) AS total)
    if (keys.length === 1 && data.length === 1) {
      return {
        xKey: 'Metric',
        yKey: 'Value',
        isNumericY: true,
        chartData: [{ Metric: keys[0], Value: Number(firstRow[keys[0]]) || 0 }]
      };
    }

    // Find numeric columns
    const numericKeys = keys.filter(k => {
      const val = firstRow[k];
      return typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null);
    });

    // Find non-numeric/string keys for X axis
    const nonNumericKeys = keys.filter(k => !numericKeys.includes(k));

    let detectedX = nonNumericKeys[0] || keys[0];
    let detectedY = numericKeys.find(k => k !== detectedX) || (numericKeys.length > 0 ? numericKeys[0] : keys[1] || keys[0]);

    // Sanitize numeric data for charting
    const sanitized = data.slice(0, 30).map(row => {
      const copy = { ...row };
      if (detectedY && copy[detectedY] !== undefined) {
        copy[detectedY] = Number(copy[detectedY]) || 0;
      }
      return copy;
    });

    return {
      xKey: detectedX,
      yKey: detectedY,
      isNumericY: numericKeys.length > 0,
      chartData: sanitized
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
        No records available to visualize
      </div>
    );
  }

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(9, 14, 30, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '10px',
          padding: '0.65rem 0.95rem',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(12px)',
          fontSize: '0.85rem'
        }}>
          <p style={{ color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>{label || payload[0]?.name}</p>
          <p style={{ color: '#38bdf8', margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
            {payload[0]?.value !== undefined ? Number(payload[0].value).toLocaleString() : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  // Table View
  if (chartType === 'table') {
    const cols = Object.keys(data[0]);
    return (
      <div style={{ maxHeight: height, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
        <table className="custom-table">
          <thead>
            <tr>
              {cols.map((col, idx) => (
                <th key={idx}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr key={rIdx}>
                {cols.map((col, cIdx) => (
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
    );
  }

  // Recharts Container
  return (
    <div style={{ height, width: '100%', marginTop: '0.5rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'line' ? (
          <ReLineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey={xKey}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              angle={-20}
              textAnchor="end"
              height={40}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              tickFormatter={val => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ fill: '#818cf8', r: 4 }}
              activeDot={{ r: 7, stroke: '#38bdf8', strokeWidth: 2 }}
            />
          </ReLineChart>
        ) : chartType === 'area' ? (
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.65} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey={xKey}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              angle={-20}
              textAnchor="end"
              height={40}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              tickFormatter={val => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke="#38bdf8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#areaGradient)"
            />
          </AreaChart>
        ) : chartType === 'pie' ? (
          <PieChart margin={{ top: 10, bottom: 10 }}>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={chartData.slice(0, 8)}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
            >
              {chartData.slice(0, 8).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} stroke="rgba(7,9,19,0.8)" strokeWidth={2} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{value}</span>}
            />
          </PieChart>
        ) : (
          /* Default: Bar Chart */
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey={xKey}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              angle={-20}
              textAnchor="end"
              height={40}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              tickFormatter={val => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={yKey}
              fill="url(#barGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
