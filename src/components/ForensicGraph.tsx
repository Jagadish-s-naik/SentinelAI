import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Network, User, FileCode, Server, RefreshCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface Node {
  id: string;
  type: 'IP' | 'USER' | 'FILE' | 'SERVICE';
  label: string;
  x?: number;
  y?: number;
}

interface Edge {
  id: string;
  from: string;
  to: string;
  type: string;
}

interface ForensicGraphProps {
  entityId: string;
  depth?: number;
}

const ForensicGraph: React.FC<ForensicGraphProps> = ({ entityId, depth = 2 }) => {
  const [data, setData] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
        const response = await fetch(`${API_URL}/graph/${encodeURIComponent(entityId)}?depth=${depth}`);
        const result = await response.json();
        
        // Simple circular layout for nodes
        const nodes = result.nodes.map((node: Node, i: number) => {
          const angle = (i / result.nodes.length) * 2 * Math.PI;
          const radius = i === 0 ? 0 : 150; // Center the primary node
          return {
            ...node,
            x: 300 + Math.cos(angle) * (radius + (i % 2 === 0 ? 20 : -20)),
            y: 300 + Math.sin(angle) * (radius + (i % 2 === 0 ? 20 : -20))
          };
        });

        setData({ nodes, edges: result.edges });
      } catch (error) {
        console.error("Failed to fetch graph data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (entityId) fetchGraph();
  }, [entityId, depth]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'USER': return <User className="w-5 h-5 text-blue-400" />;
      case 'FILE': return <FileCode className="w-5 h-5 text-emerald-400" />;
      case 'SERVICE': return <Server className="w-5 h-5 text-purple-400" />;
      default: return <Network className="w-5 h-5 text-amber-400" />;
    }
  };

  if (loading) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center space-y-4 bg-slate-900/50 rounded-xl border border-white/10">
        <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-slate-400 animate-pulse">Computing Blast Radius...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] bg-slate-950 rounded-xl border border-white/10 overflow-hidden cursor-crosshair" ref={containerRef}>
      {/* HUD Overlays */}
      <div className="absolute top-4 left-4 z-10 space-y-1">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Blast Radius View</h3>
        <p className="text-sm text-slate-200 font-mono">{entityId}</p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors">
          <ZoomIn className="w-4 h-4 text-slate-400" />
        </button>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors">
          <ZoomOut className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* SVG Interaction Layer */}
      <motion.div 
        className="w-full h-full"
        animate={{ scale: zoom }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <svg viewBox="0 0 600 600" className="w-full h-full">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Edges (Links) */}
          <g>
            {data.edges.map(edge => {
              const srcNode = data.nodes.find(n => n.id === edge.from);
              const destNode = data.nodes.find(n => n.id === edge.to);
              if (!srcNode || !destNode) return null;
              
              return (
                <motion.line
                  key={edge.id}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.3 }}
                  x1={srcNode.x}
                  y1={srcNode.y}
                  x2={destNode.x}
                  y2={destNode.y}
                  stroke="#475569"
                  strokeWidth="2"
                  markerEnd="url(#arrow)"
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {data.nodes.map((node, i) => (
              <motion.g
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group"
              >
                {/* Node Glow */}
                <circle cx={node.x} cy={node.y} r="25" className="fill-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Outer Ring */}
                <circle cx={node.x} cy={node.y} r="20" className="fill-slate-900 stroke-white/20 stroke-2" />
                
                {/* Icon Placeholder */}
                <foreignObject x={(node.x || 0) - 10} y={(node.y || 0) - 10} width="20" height="20">
                  <div className="flex items-center justify-center w-full h-full">
                    {getNodeIcon(node.type)}
                  </div>
                </foreignObject>

                {/* Label */}
                <text 
                  x={node.x} 
                  y={(node.y || 0) + 35} 
                  textAnchor="middle" 
                  className="fill-slate-400 text-[10px] font-mono pointer-events-none"
                >
                  {node.label}
                </text>

                {/* Mini Type Tag */}
                <rect 
                  x={(node.x || 0) - 15} 
                  y={(node.y || 0) - 32} 
                  width="30" 
                  height="12" 
                  rx="4" 
                  className="fill-slate-800 stroke-white/5"
                />
                <text 
                  x={node.x} 
                  y={(node.y || 0) - 23} 
                  textAnchor="middle" 
                  className="fill-slate-500 text-[8px] font-bold tracking-tighter"
                >
                  {node.type}
                </text>
              </motion.g>
            ))}
          </g>
        </svg>
      </motion.div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex space-x-4 bg-slate-900/80 backdrop-blur-md p-2 rounded-lg border border-white/5 text-[10px]">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-slate-500">USER</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-500">FILE</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-slate-500">IP</span>
        </div>
      </div>
    </div>
  );
};

export default ForensicGraph;
