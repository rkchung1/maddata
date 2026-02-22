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

function cosineSimilarity(a: number[] | undefined, b: number[] | undefined) {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) return Number.NaN
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    const ai = a[i]
    const bi = b[i]
    dot += ai * bi
    normA += ai * ai
    normB += bi * bi
  }
  if (normA === 0 || normB === 0) return Number.NaN
  return dot / Math.sqrt(normA * normB)
}

function buildGraphFromNotes(notes: Note[], threshold = 0.5, maxLinksPerNode = 4) {
  const nodes: GraphNode[] = notes.map((n, idx) => ({
    id: n.id ?? `note-${idx}`,
    name: (n.title?.trim() || "Untitled").slice(0, 80),
    group: hashToGroup((n.title ?? "") + "|" + (n.content ?? "")),
  }))

  const allPairs: Array<{ i: number; j: number; sim: number }> = []
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const sim = cosineSimilarity(notes[i].embedding, notes[j].embedding)
      if (Number.isFinite(sim)) allPairs.push({ i, j, sim })
    }
  }
  allPairs.sort((a, b) => b.sim - a.sim)
  const candidates = allPairs.filter((p) => p.sim >= threshold)

  const degreeCount = new Map<string, number>()
  const links: GraphLink[] = []
  for (const c of candidates) {
    const source = nodes[c.i].id
    const target = nodes[c.j].id
    const sourceDegree = degreeCount.get(source) ?? 0
    const targetDegree = degreeCount.get(target) ?? 0
    if (sourceDegree >= maxLinksPerNode || targetDegree >= maxLinksPerNode) continue
    links.push({ source, target, weight: c.sim })
    degreeCount.set(source, sourceDegree + 1)
    degreeCount.set(target, targetDegree + 1)
  }

  // If threshold is too strict, still show strongest semantic links.
  if (links.length === 0 && allPairs.length > 0) {
    for (const c of allPairs) {
      const source = nodes[c.i].id
      const target = nodes[c.j].id
      const sourceDegree = degreeCount.get(source) ?? 0
      const targetDegree = degreeCount.get(target) ?? 0
      if (sourceDegree >= maxLinksPerNode || targetDegree >= maxLinksPerNode) continue
      links.push({ source, target, weight: c.sim })
      degreeCount.set(source, sourceDegree + 1)
      degreeCount.set(target, targetDegree + 1)
      if (links.length >= Math.min(nodes.length, maxLinksPerNode)) break
    }
  }

  const withEmbedding = notes.filter((n) => Array.isArray(n.embedding) && n.embedding.length > 0).length
  const maxSimilarity = allPairs.length > 0 ? allPairs[0].sim : 0
  return { nodes, links, maxSimilarity, withEmbedding, pairCount: allPairs.length }
}

export default function GraphView3D({ notes }: { notes: Note[] }) {
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [minSimilarity, setMinSimilarity] = useState(0.5)
  const [maxLinksPerNode, setMaxLinksPerNode] = useState(4)

  const data = useMemo(
    () => buildGraphFromNotes(notes ?? [], minSimilarity, maxLinksPerNode),
    [notes, minSimilarity, maxLinksPerNode]
  )

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
          Min sim
          <input
            className="w-28"
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={minSimilarity}
            onChange={(e) => setMinSimilarity(Number(e.target.value))}
          />
          <span className="tabular-nums w-10 text-right">{minSimilarity.toFixed(2)}</span>
        </label>

        <label className="text-sm flex items-center gap-2">
          Max links
          <input
            className="w-28"
            type="range"
            min={1}
            max={10}
            value={maxLinksPerNode}
            onChange={(e) => setMaxLinksPerNode(Number(e.target.value))}
          />
          <span className="tabular-nums w-6 text-right">{maxLinksPerNode}</span>
        </label>

        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>nodes:</span>
          <span className="tabular-nums">{data.nodes.length}</span>
          <span>edges:</span>
          <span className="tabular-nums">{data.links.length}</span>
          <span>vec notes:</span>
          <span className="tabular-nums">{data.withEmbedding}</span>
          <span>pairs:</span>
          <span className="tabular-nums">{data.pairCount}</span>
          <span>max sim:</span>
          <span className="tabular-nums">{data.maxSimilarity.toFixed(2)}</span>
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
