import { MiniMapProps, ControlProps } from "@xyflow/react";

export const controlsStyle: Partial<ControlProps> = {
  style: {
    background: "transparent",
  },
  showZoom: true,
  showFitView: true,
  showInteractive: true,
};

export const minimapStyle: Partial<MiniMapProps> = {
  style: {
    background: "#f8f9fa",
    border: "1px solid #e2e8f0",
  },
  maskColor: "rgb(50, 50, 50, 0.8)",
  nodeColor: "#8b5cf6",
};
