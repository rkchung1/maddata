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
  mmrScore?: number
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

function normalizeCosine(sim: number) {
  // Maps cosine range [-1, 1] to [0, 1] for stable MMR scoring.
  return (sim + 1) / 2
}

function buildGraphFromNotes(notes: Note[], threshold = 0.5, maxLinksPerNode = 4) {
  const nodes: GraphNode[] = notes.map((n, idx) => ({
    id: n.id ?? `note-${idx}`,
    name: (n.title?.trim() || "Untitled").slice(0, 80),
    group: hashToGroup((n.title ?? "") + "|" + (n.content ?? "")),
  }))

  const n = notes.length
  const simMatrix: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => Number.NaN)
  )
  for (let i = 0; i < n; i++) {
    simMatrix[i][i] = 1
  }

  const allPairs: Array<{ i: number; j: number; sim: number }> = []
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const sim = cosineSimilarity(notes[i].embedding, notes[j].embedding)
      if (!Number.isFinite(sim)) continue
      simMatrix[i][j] = sim
      simMatrix[j][i] = sim
      allPairs.push({ i, j, sim })
    }
  }

  const mmrLambda = 0.7
  const selectedEdgeByKey = new Map<string, { i: number; j: number; sim: number; mmrScore: number }>()

  for (let i = 0; i < n; i++) {
    const candidates = Array.from({ length: n }, (_, j) => j).filter((j) => {
      if (i === j) return false
      const sim = simMatrix[i][j]
      return Number.isFinite(sim)
    })

    const chosen: number[] = []
    while (chosen.length < maxLinksPerNode && chosen.length < candidates.length) {
      let bestJ = -1
      let bestScore = Number.NEGATIVE_INFINITY
      let bestRel = Number.NEGATIVE_INFINITY

      for (const j of candidates) {
        if (chosen.includes(j)) continue
        const rel = normalizeCosine(simMatrix[i][j])
        let redundancy = 0
        for (const k of chosen) {
          const simJK = simMatrix[j][k]
          if (!Number.isFinite(simJK)) continue
          redundancy = Math.max(redundancy, normalizeCosine(simJK))
        }
        const mmrScore = mmrLambda * rel - (1 - mmrLambda) * redundancy

        if (mmrScore > bestScore || (mmrScore === bestScore && rel > bestRel)) {
          bestScore = mmrScore
          bestRel = rel
          bestJ = j
        }
      }

      if (bestJ === -1) break
      chosen.push(bestJ)

      const a = Math.min(i, bestJ)
      const b = Math.max(i, bestJ)
      const key = `${a}|${b}`
      const sim = simMatrix[a][b]
      const prev = selectedEdgeByKey.get(key)
      if (!prev) {
        selectedEdgeByKey.set(key, { i: a, j: b, sim, mmrScore: bestScore })
      } else {
        selectedEdgeByKey.set(key, {
          i: a,
          j: b,
          sim: Math.max(prev.sim, sim),
          mmrScore: Math.max(prev.mmrScore, bestScore),
        })
      }
    }
  }

  const mmrEdges = Array.from(selectedEdgeByKey.values()).sort((a, b) => b.sim - a.sim)
  const degreeCount = new Map<string, number>()
  const links: GraphLink[] = []
  for (const edge of mmrEdges) {
    if (edge.mmrScore < threshold) continue
    const source = nodes[edge.i].id
    const target = nodes[edge.j].id
    const sourceDegree = degreeCount.get(source) ?? 0
    const targetDegree = degreeCount.get(target) ?? 0
    if (sourceDegree >= maxLinksPerNode || targetDegree >= maxLinksPerNode) continue
    links.push({ source, target, weight: edge.sim, mmrScore: edge.mmrScore })
    degreeCount.set(source, sourceDegree + 1)
    degreeCount.set(target, targetDegree + 1)
    if (links.length >= n * maxLinksPerNode) {
      break
    }
  }

  const withEmbedding = notes.filter((n) => Array.isArray(n.embedding) && n.embedding.length > 0).length
  const maxSimilarity = allPairs.length > 0 ? allPairs[0].sim : 0
  const maxMmrScore = mmrEdges.reduce(
    (acc, edge) => Math.max(acc, edge.mmrScore),
    Number.NEGATIVE_INFINITY
  )
  return {
    nodes,
    links,
    maxSimilarity,
    maxMmrScore: Number.isFinite(maxMmrScore) ? maxMmrScore : 0,
    withEmbedding,
    pairCount: allPairs.length,
  }
}

type GraphView3DProps = {
  notes: Note[]
  onNodeClick?: (noteId: string) => void
}

export default function GraphView3D({ notes, onNodeClick }: GraphView3DProps) {
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [minMmr, setMinMmr] = useState(0.2)
  const [maxLinksPerNode, setMaxLinksPerNode] = useState(4)

  const data = useMemo(
    () => buildGraphFromNotes(notes ?? [], minMmr, maxLinksPerNode),
    [notes, minMmr, maxLinksPerNode]
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
          Min score
          <input
            className="w-28"
            type="range"
            min={0}
            max={0.5}
            step={0.10}
            value={minMmr}
            onChange={(e) => setMinMmr(Number(e.target.value))}
          />
          <span className="tabular-nums w-10 text-right">{minMmr.toFixed(2)}</span>
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
          <span>max mmr:</span>
          <span className="tabular-nums">{data.maxMmrScore.toFixed(2)}</span>
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
        linkLabel={(l) => `Score: ${(l.mmrScore ?? 0).toFixed(3)}`}
        linkWidth={(l) => 0.6 + (l.weight ?? 0.3) * 1.2}
        linkDirectionalParticles={(l) => ((l.weight ?? 0) > 0.8 ? 2 : 0)}
        linkDirectionalParticleWidth={1.5}
        nodeThreeObjectExtend={true}
        nodeThreeObject={(node: GraphNode) => {
          if (!showLabels) return undefined
          const sprite = new SpriteText(node.name)
          sprite.textHeight = 4
          sprite.color = "rgba(255,255,255,0.9)"
          sprite.backgroundColor = "rgba(0,0,0,0.35)"
          sprite.padding = 2
          return sprite
        }}
        onNodeClick={(node: NodeObject<GraphNode>) => {
          // 1) Navigate back to notes
          onNodeClick?.(String(node.id))

          // 2) Keep your camera animation
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
