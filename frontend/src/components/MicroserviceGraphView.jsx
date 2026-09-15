/**
 * MicroserviceGraphView
 * "AFTER" picture — tables grouped into service containers with clear boundaries.
 * Cross-service FK edges are shown in red as boundary violations.
 */
import { useMemo } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, Handle, Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const SVC_COLORS = [
  '#6366f1', '#22d3ee', '#f59e0b', '#10b981',
  '#ec4899', '#8b5cf6', '#f97316', '#14b8a6',
  '#ef4444', '#84cc16',
]

/* ── Service group container node ──────────────────────────────────────── */
function ServiceGroupNode({ data }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      border: `2px solid ${data.color}55`,
      borderRadius: 20,
      background: `${data.color}09`,
      position: 'relative',
      boxShadow: `inset 0 0 40px ${data.color}08`,
    }}>
      {/* Service name badge */}
      <div style={{
        position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
        background: data.color,
        color: '#000',
        fontSize: 11, fontWeight: 800,
        padding: '3px 14px', borderRadius: 20,
        fontFamily: 'Space Grotesk, sans-serif',
        whiteSpace: 'nowrap',
        boxShadow: `0 3px 14px ${data.color}55`,
        letterSpacing: '0.04em',
      }}>
        🏗️ {data.label}
      </div>
      {/* Table count */}
      <div style={{
        position: 'absolute', top: 10, right: 14,
        fontSize: 10, color: data.color + '70',
        fontFamily: 'Inter, sans-serif', fontWeight: 600,
      }}>
        {data.tableCount} table{data.tableCount !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

/* ── Table node inside a service ──────────────────────────────────────── */
function ServiceTableNode({ data }) {
  return (
    <div style={{
      background: '#0d1117',
      border: `1.5px solid ${data.color}60`,
      borderRadius: 13,
      padding: '10px 16px',
      minWidth: 160,
      boxShadow: `0 2px 14px ${data.color}18`,
      fontFamily: 'Space Grotesk, sans-serif',
      transition: 'border-color .2s',
      cursor: 'default',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = data.color + 'cc')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = data.color + '60')}
    >
      <Handle type="target" position={Position.Top}
        style={{ background: data.color, border: 'none', width: 8, height: 8 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        {data.isHub && (
          <span title="Hub table" style={{ color: '#fbbf24', fontSize: 13 }}>★</span>
        )}
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{data.label}</span>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.34)', display: 'flex', gap: 8 }}>
        <span>📋 {data.columnCount} cols</span>
      </div>

      <Handle type="source" position={Position.Bottom}
        style={{ background: data.color, border: 'none', width: 8, height: 8 }} />
    </div>
  )
}

const NODE_TYPES = { svcGroup: ServiceGroupNode, svcTable: ServiceTableNode }

/* ── Layout computation ──────────────────────────────────────────────── */
const TBL_W = 180
const TBL_H = 72
const TBL_GAP = 18
const GRP_PAD_X = 28
const GRP_PAD_TOP = 50
const GRP_PAD_BOT = 24
const GRID_COLS = 2
const GRP_GAP_X = 100
const GRP_GAP_Y = 90

function buildLayout(services) {
  const rfNodes = []

  // Per-group dimensions
  const dims = services.map(svc => ({
    w: TBL_W + GRP_PAD_X * 2,
    h: GRP_PAD_TOP + svc.tables.length * (TBL_H + TBL_GAP) - TBL_GAP + GRP_PAD_BOT,
  }))

  // Row heights (max group height per row)
  const rowHeights = []
  for (let i = 0; i < services.length; i += GRID_COLS) {
    const rowH = Math.max(...services.slice(i, i + GRID_COLS).map((_, j) => dims[i + j]?.h ?? 0))
    rowHeights.push(rowH)
  }

  services.forEach((svc, idx) => {
    const col = idx % GRID_COLS
    const row = Math.floor(idx / GRID_COLS)
    const color = SVC_COLORS[idx % SVC_COLORS.length]
    const d = dims[idx]

    const gx = col * (d.w + GRP_GAP_X)
    const gy = rowHeights.slice(0, row).reduce((s, h) => s + h + GRP_GAP_Y, 0)

    // Group container
    rfNodes.push({
      id: svc.service_id,
      type: 'svcGroup',
      position: { x: gx, y: gy },
      style: { width: d.w, height: d.h },
      data: { label: svc.service_name, color, tableCount: svc.table_count },
      selectable: true,
      draggable: true,
      zIndex: 0,
    })

    // Table child nodes
    const details = svc.table_details ?? svc.tables.map(t => ({ name: t, column_count: 0, is_hub: false }))
    details.forEach((tbl, ti) => {
      rfNodes.push({
        id: tbl.name,
        type: 'svcTable',
        parentId: svc.service_id,
        extent: 'parent',
        position: {
          x: GRP_PAD_X,
          y: GRP_PAD_TOP + ti * (TBL_H + TBL_GAP),
        },
        data: {
          label: tbl.name,
          color,
          columnCount: tbl.column_count ?? 0,
          isHub: tbl.is_hub ?? false,
        },
        zIndex: 10,
      })
    })
  })

  return rfNodes
}

/* ── MicroserviceGraphView ─────────────────────────────────────────────── */
export default function MicroserviceGraphView({ nodes: rawNodes, edges: rawEdges, services }) {
  const rfNodes = useMemo(() => buildLayout(services), [services])

  const rfEdges = useMemo(() => rawEdges.map(e => ({
    id: `ms__${e.id}`,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    animated: e.is_cross_service,
    zIndex: e.is_cross_service ? 20 : 8,
    style: {
      stroke: e.is_cross_service ? '#ef4444' : 'rgba(255,255,255,0.18)',
      strokeWidth: e.is_cross_service ? 2.5 : 1.5,
      strokeDasharray: e.is_cross_service ? '7 4' : 'none',
    },
    label: e.is_cross_service ? '⚠ cross-service' : undefined,
    labelStyle: { fill: '#f87171', fontSize: 10, fontFamily: 'Inter', fontWeight: 700 },
    labelBgStyle: { fill: '#0d1117', fillOpacity: 0.9 },
    labelBgPadding: [5, 8],
    labelBgBorderRadius: 6,
  })), [rawEdges])

  const [nodes, , onNodesChange] = useNodesState(rfNodes)
  const [edges, , onEdgesChange] = useEdgesState(rfEdges)

  const crossCount = rawEdges.filter(e => e.is_cross_service).length

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* Top banner */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, pointerEvents: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 10,
        background: 'rgba(10,14,22,0.9)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 24, padding: '7px 20px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        <span style={{ fontSize: 16 }}>🏗️</span>
        <span style={{
          fontSize: 11, color: '#6366f1', fontWeight: 800,
          fontFamily: 'Space Grotesk, sans-serif',
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>Proposed Microservices</span>
        <span style={{
          fontSize: 11, color: 'rgba(255,255,255,0.3)',
          fontFamily: 'Inter, sans-serif',
        }}>
          {services.length} services · {rawNodes.length} tables
          {crossCount > 0 && ` · ${crossCount} cross-boundary FK${crossCount > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 68, left: 14,
        zIndex: 10, pointerEvents: 'none',
        background: 'rgba(10,14,22,0.9)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '10px 14px',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7, fontFamily: 'Space Grotesk' }}>
          Legend
        </div>
        {[
          { dash: false, color: 'rgba(255,255,255,0.22)', label: 'Intra-service FK' },
          { dash: true,  color: '#ef4444',               label: 'Cross-service boundary' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <svg width={26} height={10}>
              <line x1="0" y1="5" x2="26" y2="5"
                stroke={item.color} strokeWidth={item.dash ? 2 : 1.5}
                strokeDasharray={item.dash ? '6 3' : 'none'} />
            </svg>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', fontFamily: 'Inter' }}>{item.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#fbbf24', fontSize: 14 }}>★</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', fontFamily: 'Inter' }}>Hub table</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2.5}
        attributionPosition="bottom-right"
      >
        <Background color="#0d1117" gap={28} size={1} />
        <Controls />
        <MiniMap
          nodeColor={n => {
            if (n.type === 'svcGroup') return (n.data?.color ?? '#444') + '28'
            return n.data?.color ?? '#6366f1'
          }}
          maskColor="rgba(8,10,18,0.78)"
        />
      </ReactFlow>
    </div>
  )
}
