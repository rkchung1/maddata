import React, { useMemo, useRef, useState } from "react"
import ForceGraph3D from "react-force-graph-3d"
import type { ForceGraphMethods, NodeObject } from "react-force-graph-3d"
import SpriteText from "three-spritetext"
import type { Note } from "@/types/Note"

type GraphNode = {
  id: string
  name: string
  group?: number
}

type GraphLink = {
  source: string
  target: string
  weight?: number
}

function hashToGroup(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return (Math.abs(h) % 6) + 1
}

function buildGraphFromNotes(notes: Note[], avgDegree = 3) {
  const nodes: GraphNode[] = notes.map((n, idx) => ({
    id: n.id ?? `note-${idx}`,
    name: (n.title?.trim() || "Untitled").slice(0, 80),
    group: hashToGroup((n.title ?? "") + "|" + (n.content ?? "")),
  }))

  // Super simple deterministic linking for now:
  // each node connects to the next few nodes (wrap-around).
  // This gives you stable edges to test rendering perf without similarity compute.
  const links: GraphLink[] = []
  const N = nodes.length
  const k = Math.max(1, Math.min(avgDegree, Math.max(1, N - 1)))

  for (let i = 0; i < N; i++) {
    for (let j = 1; j <= k; j++) {
      const a = nodes[i].id
      const b = nodes[(i + j) % N].id
      if (a === b) continue
      links.push({ source: a, target: b, weight: 0.4 + (j / (k + 1)) * 0.6 })
    }
  }

  return { nodes, links }
}

export default function GraphView3D({ notes }: { notes: Note[] }) {
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [avgDegree, setAvgDegree] = useState(3)

  const data = useMemo(() => buildGraphFromNotes(notes ?? [], avgDegree), [notes, avgDegree])

  return (
    <div className="flex-1 min-w-0 min-h-0 relative">
      {/* Overlay controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 rounded-xl border bg-background/70 backdrop-blur px-3 py-2">
        <button
          className="text-sm px-2 py-1 rounded-md border hover:bg-muted"
          onClick={() => setShowLabels((v) => !v)}
        >
          Labels: {showLabels ? "On" : "Off"}
        </button>

        <button
          className="text-sm px-2 py-1 rounded-md border hover:bg-muted"
          onClick={() => fgRef.current?.zoomToFit(600)}
        >
          Zoom to fit
        </button>

        <label className="text-sm flex items-center gap-2">
          Degree
          <input
            className="w-28"
            type="range"
            min={1}
            max={8}
            value={avgDegree}
            onChange={(e) => setAvgDegree(Number(e.target.value))}
          />
          <span className="tabular-nums w-6 text-right">{avgDegree}</span>
        </label>

        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>nodes:</span>
          <span className="tabular-nums">{data.nodes.length}</span>
          <span>edges:</span>
          <span className="tabular-nums">{data.links.length}</span>
        </div>
      </div>

      <ForceGraph3D<GraphNode, GraphLink>
        ref={fgRef}
        graphData={data}
        backgroundColor="#0b0b0c"
        nodeAutoColorBy="group"
        nodeLabel={(n) => n.name}
        nodeRelSize={5}
        nodeVal={() => 1.2}
        linkOpacity={0.35}
        linkWidth={(l) => 0.6 + (l.weight ?? 0.3) * 1.2}
        linkDirectionalParticles={(l) => ((l.weight ?? 0) > 0.8 ? 2 : 0)}
        linkDirectionalParticleWidth={1.5}
        nodeThreeObjectExtend={true}
        nodeThreeObject={(node: GraphNode) => {
          if (!showLabels) return undefined
          const sprite = new SpriteText(node.name)
          sprite.textHeight = 6
          sprite.color = "rgba(255,255,255,0.9)"
          sprite.backgroundColor = "rgba(0,0,0,0.35)"
          sprite.padding = 2
          return sprite
        }}
        onNodeClick={(node: NodeObject<GraphNode>) => {
          const nx = node.x ?? 0
          const ny = node.y ?? 0
          const nz = node.z ?? 0

          const distance = 120
          const distRatio = 1 + distance / Math.hypot(nx, ny, nz)

          fgRef.current?.cameraPosition(
            { x: nx * distRatio, y: ny * distRatio, z: nz * distRatio },
            { x: nx, y: ny, z: nz },
            600
          )
        }}
      />
    </div>
  )
}