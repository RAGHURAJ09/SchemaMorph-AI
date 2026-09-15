/**
 * MonolithGraphView
 * "BEFORE" picture — all tables rendered as one unified monolith service.
 * Uniform teal colour, FK edges as directed arrows, no cluster separation.
 */
import { useMemo } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, Handle, Position, MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'

const MONO  = '#1D9E75'
const MONO_DIM = 'rgba(29,158,117,0.4)'

/* ── Table node ──────────────────────────────────────────────────────────── */
function MonolithNode({ data }) {
  return (
    <div
      style={{
        background: '#0e1620',
        border: `1.5px solid ${MONO}66`,
        borderRadius: 14,
        padding: '12px 18px',
        minWidth: 172,
        boxShadow: `0 0 20px ${MONO}14`,
        fontFamily: 'Space Grotesk, sans-serif',
        transition: 'border-color .2s, box-shadow .2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = MONO + 'cc'
        e.currentTarget.style.boxShadow = `0 0 26px ${MONO}30`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = MONO + '66'
        e.currentTarget.style.boxShadow = `0 0 20px ${MONO}14`
      }}
    >
      <Handle type="target" position={Position.Top}
        style={{ background: MONO, border: 'none', width: 9, height: 9 }} />

      {/* Badge */}
      <div style={{ marginBottom: 5 }}>
        <span style={{
          fontSize: 9, background: MONO + '20', color: MONO,
          border: `1px solid ${MONO}44`, borderRadius: 5,
          padding: '1px 7px', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>TABLE</span>
      </div>

      {/* Name */}
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 5 }}>
        {data.label}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'rgba(255,255,255,0.36)' }}>
        <span>📋 {data.columnCount} cols</span>
        {data.incomingFk > 0 && (
          <span style={{ color: MONO + '99' }}>🔗 ×{data.incomingFk} refs</span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom}
        style={{ background: MONO, border: 'none', width: 9, height: 9 }} />
    </div>
  )
}

const NODE_TYPES = { monoNode: MonolithNode }

/* ── Dagre layout ─────────────────────────────────────────────────────────── */
function applyDagre(rfNodes, rfEdges) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 60 })
  rfNodes.forEach(n => g.setNode(n.id, { width: 190, height: 90 }))
  rfEdges.forEach(e => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return rfNodes.map(n => {
    const pos = g.node(n.id)
    return { ...n, position: { x: pos.x - 95, y: pos.y - 45 } }
  })
}

/* ── MonolithGraphView ──────────────────────────────────────────────────── */
export default function MonolithGraphView({ nodes: rawNodes, edges: rawEdges }) {
  const rfEdgesMemo = useMemo(() => rawEdges.map(e => ({
    id: `mono__${e.id}`,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: MONO_DIM, width: 18, height: 18 },
    style: { stroke: MONO_DIM, strokeWidth: 1.5 },
    label: e.fk_count > 0 ? 'FK' : undefined,
    labelStyle: { fill: MONO + 'aa', fontSize: 9, fontFamily: 'Inter, sans-serif', fontWeight: 700 },
    labelBgStyle: { fill: '#0e1620', fillOpacity: 0.92 },
    labelBgPadding: [4, 6],
    labelBgBorderRadius: 4,
  })), [rawEdges])

  const rfNodesMemo = useMemo(() => {
    const mapped = rawNodes.map(n => ({
      id: n.id,
      type: 'monoNode',
      position: { x: 0, y: 0 },
      data: {
        label: n.label,
        columnCount: n.column_count ?? 0,
        incomingFk: n.incoming_fk_count ?? 0,
      },
    }))
    return applyDagre(mapped, rfEdgesMemo)
  }, [rawNodes, rfEdgesMemo])

  const [nodes, , onNodesChange] = useNodesState(rfNodesMemo)
  const [edges, , onEdgesChange] = useEdgesState(rfEdgesMemo)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* Top banner */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, pointerEvents: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 10,
        background: 'rgba(10,14,22,0.9)',
        border: '1px solid rgba(29,158,117,0.3)',
        borderRadius: 24, padding: '7px 20px',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
      }}>
        <span style={{ fontSize: 16 }}>🏛️</span>
        <span style={{
          fontSize: 11, color: MONO, fontWeight: 800,
          fontFamily: 'Space Grotesk, sans-serif',
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>Original Monolithic Schema</span>
        <span style={{
          fontSize: 11, color: 'rgba(255,255,255,0.3)',
          fontFamily: 'Inter, sans-serif',
        }}>
          {rawNodes.length} tables · {rawEdges.length} FK relationships · single service
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
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'Space Grotesk' }}>
          Legend
        </div>
        {[
          { el: <svg width={22} height={10}><line x1="0" y1="5" x2="22" y2="5" stroke={MONO_DIM} strokeWidth={1.5} /><polygon points="18,2 22,5 18,8" fill={MONO_DIM} /></svg>, label: 'Foreign Key' },
          { el: <span style={{ fontSize: 12 }}>📋</span>, label: 'Column count' },
          { el: <span style={{ fontSize: 12, color: MONO }}>🔗</span>, label: 'Incoming FK references' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {item.el}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', fontFamily: 'Inter' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        minZoom={0.15}
        maxZoom={2.5}
        attributionPosition="bottom-right"
      >
        <Background color="#111827" gap={28} size={1} />
        <Controls />
        <MiniMap nodeColor={() => MONO + '88'} maskColor="rgba(10,14,22,0.75)" />
      </ReactFlow>
    </div>
  )
}
