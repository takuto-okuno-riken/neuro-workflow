import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  BackgroundVariant,
  Connection,
  MiniMapProps,
  ControlProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// 初期ノードの定義
const initialNodes: Node[] = [
  { 
    id: '1', 
    position: { x: 0, y: 0 }, 
    data: { label: 'Node 1' },
    style: {
      background: '#fff',
      color: '#000',
      border: '1px solid #222',
      width: 180,
    }
  },
  { 
    id: '2', 
    position: { x: 100, y: 100 }, 
    data: { label: 'Node 2' },
    style: {
      background: '#fff',
      color: '#000',
      border: '1px solid #222',
      width: 180,
    }
  },
];

// 初期エッジの定義
const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2',
    style: {
      stroke: '#222',
    }
  }
];

// カスタムスタイル
const controlsStyle: Partial<ControlProps> = {
  style: {
    background: '#fff',
    border: '1px solid #ddd',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  showZoom: true,
  showFitView: true,
  showInteractive: true,
};

const minimapStyle: Partial<MiniMapProps> = {
  style: {
    background: '#f8f9fa',
    border: '1px solid #ddd',
  },
  maskColor: 'rgb(50, 50, 50, 0.8)',
  nodeColor: '#333',
};

const HomeView = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
 
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, style: { stroke: '#222' } }, eds)),
    [setEdges],
  );
 
  return (
    <div style={{ width: '100vw', height: '90vh' }}>
      <style>
        {`
          .react-flow__controls-button {
            background: #fff;
            border-color: #ddd;
            color: #222;
          }
          
          .react-flow__controls-button:hover {
            background: #f5f5f5;
            border-color: #bbb;
          }
          
          .react-flow__controls-button svg {
            fill: currentColor;
          }
          
          .react-flow__minimap {
            background-color: #f8f9fa;
          }
          
          .react-flow__minimap-mask {
            fill: rgb(50, 50, 50, 0.8);
          }
          
          .react-flow__minimap-node {
            fill: #333;
            stroke: #222;
          }
        `}
      </style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls {...controlsStyle} />
        <MiniMap {...minimapStyle} />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#aaa" />
      </ReactFlow>
    </div>
  );
}

export default HomeView;
