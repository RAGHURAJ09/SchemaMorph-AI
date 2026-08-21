import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'

/* ── Custom table node ─────────────────────────────────────────────────────── */
function TableNode({ data }) {
  return (
    <div
      style={{ borderColor: data.color }}
      className="bg-surface-800 rounded-xl px-4 py-3 border-2 min-w-[160px] shadow-lg transition-transform hover:scale-105"
    >
      <Handle type="target" position={Position.Top}    style={{ background: data.color, border: 'none' }} />
      <div className="flex items-center gap-2">
        {data.isHub && <span title="Hub table" className="text-yellow-400 text-xs">★</span>}
        <span className="text-white text-sm font-semibold truncate">{data.label}</span>
      </div>
      <div className="flex gap-2 mt-1">
        <span className="text-xs text-surface-500">{data.columnCount} cols</span>
        {data.isIsolated && <span className="text-xs text-surface-600">isolated</span>}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: data.color, border: 'none' }} />
    </div>
  )
}

const NODE_TYPES = { tableNode: TableNode }

/* ── Dagre layout ──────────────────────────────────────────────────────────── */
function applyDagreLayout(rfNodes, rfEdges) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 })

  rfNodes.forEach(n => g.setNode(n.id, { width: 180, height: 70 }))
  rfEdges.forEach(e => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return rfNodes.map(n => {
    const pos = g.node(n.id)
    return { ...n, position: { x: pos.x - 90, y: pos.y - 35 } }
  })
}

/* ── GraphView ─────────────────────────────────────────────────────────────── */
export default function GraphView({ nodes: rawNodes, edges: rawEdges }) {
  const rfNodes = useMemo(() => {
    const mapped = rawNodes.map(n => ({
      id: n.id,
      type: 'tableNode',
      position: { x: 0, y: 0 },
      data: {
        label: n.label,
        color: n.color,
        isHub: n.is_hub,
        isIsolated: n.is_isolated,
        columnCount: n.column_count,
        clusterId: n.cluster_id,
      },
    }))
    return applyDagreLayout(mapped, rawEdges)
  }, [rawNodes, rawEdges])

  const rfEdges = useMemo(() => rawEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: e.is_cross_service,
    style: {
      stroke: e.is_cross_service ? '#ef4444' : '#4b5563',
      strokeWidth: e.is_cross_service ? 2 : 1.5,
      strokeDasharray: e.is_cross_service ? '6 3' : 'none',
    },
    label: e.is_cross_service ? '⚠ cross' : undefined,
    labelStyle: { fill: '#ef4444', fontSize: 10, fontFamily: 'Inter' },
    labelBgStyle: { fill: '#0f0f14', fillOpacity: 0.8 },
  })), [rawEdges])

  const [nodes, , onNodesChange] = useNodesState(rfNodes)
  const [edges, , onEdgesChange] = useEdgesState(rfEdges)

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-right"
      >
        <Background color="#2e2e42" gap={24} size={1} />
        <Controls />
        <MiniMap
          nodeColor={n => n.data?.color || '#6366f1'}
          maskColor="rgba(15,15,20,0.7)"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass px-3 py-2 text-xs space-y-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-4 border border-gray-500 border-dashed" style={{ borderStyle: 'solid' }} />
          <span className="text-surface-400">Intra-service FK</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 border-2 border-red-500 border-dashed" />
          <span className="text-red-400">Cross-service boundary</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">★</span>
          <span className="text-surface-400">Hub table</span>
        </div>
      </div>
    </div>
  )
}
