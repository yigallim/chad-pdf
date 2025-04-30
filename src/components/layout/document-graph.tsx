import React, { useRef, useState, useCallback, useEffect } from "react";
import ForceGraph2D, { ForceGraphMethods, LinkObject, NodeObject } from "react-force-graph-2d";
import useMeasure from "react-use-measure";
import { Button, Space, Tooltip, Typography } from "antd";
import { ZoomInOutlined, ZoomOutOutlined } from "@ant-design/icons";
import { withSizeFallback } from "@/libs/font-constant";

type MyNodeObject = NodeObject & {
  id: string;
  label: string;
  type: "document" | "topic";
};

type MyLinkObject = LinkObject & {
  source: string | MyNodeObject;
  target: string | MyNodeObject;
  type: "belongs_to" | "related";
  value?: number;
};

type GraphData = {
  nodes: MyNodeObject[];
  links: MyLinkObject[];
};

type DocumentGraphProps = {
  className?: string;
  style?: React.CSSProperties;
};

const DEFAULT_ZOOM = 4;

const DocumentGraph: React.FC<DocumentGraphProps> = ({ className, style }) => {
  const [ref, bounds] = useMeasure();
  const graphRef = useRef<ForceGraphMethods<MyNodeObject, MyLinkObject>>(null!);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const zoomRatioRef = useRef(1);

  const zoomRatio = zoomLevel / 4;
  zoomRatioRef.current = zoomRatio;

  const data: GraphData = {
    nodes: [
      { id: "topic-nlp", label: "Natural Language Processing", type: "topic" },
      { id: "topic-cv", label: "Computer Vision", type: "topic" },
      { id: "topic-rl", label: "Reinforcement Learning", type: "topic" },
      { id: "topic-ml", label: "Machine Learning", type: "topic" },

      { id: "paper-attention", label: "Attention Is All You Need", type: "document" },
      {
        id: "paper-bert",
        label: "BERT: Pre-training of Deep Bidirectional Transformers",
        type: "document",
      },
      {
        id: "paper-gpt",
        label: "Improving Language Understanding by Generative Pre-Training",
        type: "document",
      },
      {
        id: "paper-word2vec",
        label: "Efficient Estimation of Word Representations in Vector Space",
        type: "document",
      },

      {
        id: "paper-resnet",
        label: "Deep Residual Learning for Image Recognition",
        type: "document",
      },
      {
        id: "paper-yolo",
        label: "You Only Look Once: Unified Real-Time Object Detection",
        type: "document",
      },

      {
        id: "paper-dqn",
        label: "Playing Atari with Deep Reinforcement Learning",
        type: "document",
      },
      {
        id: "paper-alphago",
        label: "Mastering the Game of Go with Deep Neural Networks",
        type: "document",
      },

      {
        id: "paper-dropout",
        label: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting",
        type: "document",
      },
      { id: "paper-adam", label: "Adam: A Method for Stochastic Optimization", type: "document" },
    ],
    links: [
      { source: "paper-attention", target: "topic-nlp", type: "belongs_to", value: 1 },
      { source: "paper-bert", target: "topic-nlp", type: "belongs_to", value: 1 },
      { source: "paper-gpt", target: "topic-nlp", type: "belongs_to", value: 1 },
      { source: "paper-word2vec", target: "topic-nlp", type: "belongs_to", value: 1 },

      { source: "paper-resnet", target: "topic-cv", type: "belongs_to", value: 1 },
      { source: "paper-yolo", target: "topic-cv", type: "belongs_to", value: 1 },

      { source: "paper-dqn", target: "topic-rl", type: "belongs_to", value: 1 },
      { source: "paper-alphago", target: "topic-rl", type: "belongs_to", value: 1 },

      { source: "paper-dropout", target: "topic-ml", type: "belongs_to", value: 1 },
      { source: "paper-adam", target: "topic-ml", type: "belongs_to", value: 1 },

      { source: "paper-attention", target: "paper-bert", type: "related", value: 1 },
      { source: "paper-bert", target: "paper-gpt", type: "related", value: 1 },
      { source: "paper-resnet", target: "paper-yolo", type: "related", value: 1 },
      { source: "paper-dqn", target: "paper-alphago", type: "related", value: 1 },
      { source: "paper-dropout", target: "paper-adam", type: "related", value: 1 },
      { source: "paper-attention", target: "paper-gpt", type: "related", value: 1 },
    ],
  };

  const handleZoom = useCallback((transform: { k: number }) => {
    setZoomLevel(transform.k);
  }, []);

  const zoomIn = useCallback(() => {
    const targetZoom = zoomLevel * 1.2;
    graphRef.current?.zoom(targetZoom, 0);
    setZoomLevel(targetZoom);
  }, [zoomLevel]);

  const zoomOut = useCallback(() => {
    const targetZoom = zoomLevel / 1.2;
    graphRef.current?.zoom(targetZoom, 0);
    setZoomLevel(targetZoom);
  }, [zoomLevel]);

  useEffect(() => {
    if (bounds.width > 0 && bounds.height > 0) {
      graphRef.current.zoom(DEFAULT_ZOOM, 0);
      setZoomLevel(DEFAULT_ZOOM);

      graphRef.current.d3Force("link")!.distance(100);
      graphRef.current.d3Force("charge")!.strength(-50);
    }
  }, [bounds]);

  return (
    <div ref={ref} className={`${className} relative`} style={style}>
      {bounds.width > 0 && bounds.height > 0 && (
        <ForceGraph2D
          ref={graphRef}
          width={bounds.width}
          height={bounds.height}
          graphData={data}
          nodeRelSize={18}
          nodeVal={(node) => (node.type === "topic" ? 2 : 1)}
          nodeAutoColorBy="type"
          cooldownTicks={100}
          cooldownTime={1000}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          nodeCanvasObjectMode={() => "after"}
          nodeCanvasObject={(node: MyNodeObject, ctx, globalScale) => {
            const label = node.label;

            const nodeSize = node.type === "topic" ? 18 * 2 : 18;
            const nodeRadius = Math.sqrt(nodeSize / Math.PI) * 2;

            const maxWidth = (nodeRadius * 18) / globalScale;

            let fontSize = (14 / globalScale) * zoomRatioRef.current;
            if (label.length > 10) {
              fontSize = (12 / globalScale) * zoomRatioRef.current;
            }
            if (label.length > 20) {
              fontSize = (10 / globalScale) * zoomRatioRef.current;
            }
            if (node.type === "topic") {
              fontSize *= 1.4;
            }
            ctx.font = withSizeFallback(fontSize);
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const words = label.split(" ");
            let lines = [];
            let currentLine = "";

            for (let i = 0; i < words.length; i++) {
              const word = words[i];
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const metrics = ctx.measureText(testLine);

              if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }

            if (currentLine) {
              lines.push(currentLine);
            }

            const maxLines = 5;
            if (lines.length > maxLines) {
              lines = lines.slice(0, maxLines);
              let lastLine = lines[maxLines - 1];
              const ellipsis = "...";

              while (ctx.measureText(lastLine + ellipsis).width > maxWidth && lastLine.length > 3) {
                lastLine = lastLine.slice(0, -1);
              }

              lines[maxLines - 1] = lastLine + ellipsis;
            }

            const lineHeight = fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;

            const startY = node.y! - totalHeight / 2 + lineHeight / 2;

            lines.forEach((line, i) => {
              ctx.fillText(line, node.x!, startY + i * lineHeight);
            });
          }}
          linkLabel="type"
          linkCanvasObjectMode={() => "after"}
          linkCanvasObject={(link: MyLinkObject, ctx, globalScale) => {
            const start = link.source as MyNodeObject;
            const end = link.target as MyNodeObject;

            if (typeof start !== "object" || typeof end !== "object") return;

            const textPos = {
              x: start.x! + (end.x! - start.x!) / 2,
              y: start.y! + (end.y! - start.y!) / 2,
            };

            const relLink = link as MyLinkObject;
            const label = relLink.type;

            const fontSize = (16 / globalScale) * zoomRatioRef.current;
            ctx.font = withSizeFallback(fontSize);

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "black";
            ctx.fillText(label, textPos.x, textPos.y);
          }}
          linkDirectionalParticles={(link) => link.value || 0}
          linkDirectionalParticleSpeed={(link) => (link.value || 0) * 0.005}
          onZoom={handleZoom}
        />
      )}

      <div className="absolute bottom-2 right-2 flex flex-col items-center p-2 rounded space-y-1 bg-white/80">
        <Typography.Text type="secondary">Zoom: {zoomLevel.toFixed(2)}×</Typography.Text>
        <Space.Compact>
          <Tooltip title="Zoom In">
            <Button icon={<ZoomInOutlined />} onClick={zoomIn} />
          </Tooltip>
          <Tooltip title="Zoom Out">
            <Button icon={<ZoomOutOutlined />} onClick={zoomOut} />
          </Tooltip>
        </Space.Compact>
      </div>
    </div>
  );
};

export default DocumentGraph;
