import React, { useEffect, useState, useMemo } from 'react';

/**
 * HolographicOverlay — real HTML/CSS labels that float over the 3D scene.
 * These are DOM elements, not textures, so they remain crisp and accessible.
 * They are absolutely positioned within the landing page's hero area.
 */

const SCHEMA_LABELS = [
  {
    name: 'users',
    fields: ['id PK', 'email', 'created_at'],
    position: { top: '14%', right: '5%' },
    color: '#1D9E75',
    delay: 0,
  },
  {
    name: 'orders',
    fields: ['id PK', 'user_id FK', 'total', 'status'],
    position: { top: '14%', left: '5%' },
    color: '#534AB7',
    delay: 200,
  },
  {
    name: 'products',
    fields: ['id PK', 'name', 'price', 'category_id FK'],
    position: { bottom: '15%', right: '5%' },
    color: '#185FA5',
    delay: 400,
  },
  {
    name: 'payments',
    fields: ['id PK', 'order_id FK', 'amount', 'method'],
    position: { bottom: '15%', left: '5%' },
    color: '#BA7517',
    delay: 600,
  },
];

const DEPENDENCY_BADGES = [
  { text: 'FK: orders.user_id → users.id', position: { top: '48%', left: '4%' }, color: '#22d3ee', delay: 800 },
  { text: 'Louvain: cluster #2', position: { top: '48%', right: '4%' }, color: '#a78bfa', delay: 1000 },
  { text: 'Schema dependency graph', position: { bottom: '6%', left: '16%' }, color: '#1D9E75', delay: 1200 },
];

function SchemaCard({ label, visible }) {
  return (
    <div
      style={{
        position: 'absolute',
        ...label.position,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.95)',
        transition: `opacity 0.8s ${label.delay}ms ease, transform 0.8s ${label.delay}ms ease`,
        background: 'rgba(6, 8, 16, 0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `0.5px solid ${label.color}30`,
        borderRadius: 10,
        padding: '10px 14px',
        minWidth: 130,
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 10,
        fontWeight: 700,
        color: label.color,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: label.color, display: 'inline-block',
          boxShadow: `0 0 6px ${label.color}80`,
        }} />
        {label.name}
      </div>
      {label.fields.map((field) => {
        const isPK = field.includes('PK');
        const isFK = field.includes('FK');
        return (
          <div key={field} style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 9,
            color: isPK ? '#fbbf24' : isFK ? '#22d3ee' : 'rgba(255,255,255,0.35)',
            lineHeight: 1.8,
            paddingLeft: 10,
            borderLeft: `1px solid ${label.color}20`,
          }}>
            {field}
          </div>
        );
      })}
    </div>
  );
}

function DependencyBadge({ badge, visible }) {
  return (
    <div
      style={{
        position: 'absolute',
        ...badge.position,
        opacity: visible ? 0.7 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity 0.6s ${badge.delay}ms ease, transform 0.6s ${badge.delay}ms ease`,
        background: 'rgba(6, 8, 16, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: `0.5px solid ${badge.color}25`,
        borderRadius: 6,
        padding: '5px 10px',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <span style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 9,
        color: badge.color,
        letterSpacing: '0.02em',
      }}>
        {badge.text}
      </span>
    </div>
  );
}

export default function HolographicOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Check for reduced motion
  const prefersReduced = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // On mobile, hide to keep the hero clean
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {SCHEMA_LABELS.map((label) => (
        <SchemaCard key={label.name} label={label} visible={visible} />
      ))}
      {!prefersReduced && DEPENDENCY_BADGES.map((badge, i) => (
        <DependencyBadge key={i} badge={badge} visible={visible} />
      ))}
    </div>
  );
}
