import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = '#38bdf8',
  bgGradient = 'rgba(56, 189, 248, 0.08)',
  onClick
}) {
  return (
    <div
      onClick={onClick}
      className={`glass-panel ${onClick ? 'glass-card-interactive' : ''}`}
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        background: `linear-gradient(135deg, ${bgGradient} 0%, rgba(13, 18, 36, 0.6) 100%)`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              padding: '8px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {value ?? '—'}
        </div>
        {trend && (
          <span
            className="badge badge-green"
            style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          {subtitle}
        </div>
      )}

      {/* Decorative ambient light */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: color,
          opacity: 0.12,
          filter: 'blur(25px)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
