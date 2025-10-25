import { useState, type ReactNode } from "react";
import type { KPIHistory } from "../../types";

// Component types
interface Margin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

interface CustomLineChartProps {
  data: KPIHistory[];
  children?: ReactNode;
  margin?: Margin;
  style?: React.CSSProperties;
  responsive?: boolean;
  title?: string; // ✅ new
  titleStyle?: React.CSSProperties;
}

interface CartesianGridProps {
  strokeDasharray?: string;
  stroke?: string;
}

interface XAxisProps {
  dataKey?: string;
  stroke?: string;
  fontSize?: number;
}

interface YAxisProps {
  width?: string | number;
  stroke?: string;
  fontSize?: number;
}

interface TooltipProps {
  contentStyle?: React.CSSProperties;
}

interface LegendProps {
  // Empty for now, can be extended
}

interface LineProps {
  type?: "monotone" | "linear" | "step";
  dataKey: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  activeDot?: { r: number } | boolean;
  dot?: { fill?: string; strokeWidth?: number; r?: number } | boolean;
}

// Child components
export function CartesianGrid({
  strokeDasharray = "3 3",
  stroke = "#E5E7EB",
}: CartesianGridProps) {
  return null; // Rendered by parent
}

export function XAxis({
  dataKey = "name",
  stroke = "#6B7280",
  fontSize = 12,
}: XAxisProps) {
  return null; // Rendered by parent
}

export function YAxis({
  width = "auto",
  stroke = "#6B7280",
  fontSize = 12,
}: YAxisProps) {
  return null; // Rendered by parent
}

export function Tooltip({ contentStyle }: TooltipProps) {
  return null; // Rendered by parent
}

export function Legend({}: LegendProps) {
  return null; // Rendered by parent
}

export function Line({
  type = "monotone",
  dataKey,
  stroke = "#8884d8",
  strokeWidth = 3,
  fill,
  activeDot,
  dot = true,
}: LineProps) {
  return null; // Rendered by parent
}

// Main LineChart component
export function CustomLineChart({
  data = [],
  children,
  margin = { top: 5, right: 0, left: 0, bottom: 5 },
  style = {},
  responsive = false,
  title,
  titleStyle = {},
}: CustomLineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    lineIndex: number;
    pointIndex: number;
  } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6B7280",
          ...style,
        }}
      >
        No data available
      </div>
    );
  }

  // Extract props from children
  const childArray = Array.isArray(children) ? children : [children];

  const cartesianGridProps =
    childArray.find((child: any) => child?.type === CartesianGrid)?.props || {};
  const xAxisProps =
    childArray.find((child: any) => child?.type === XAxis)?.props || {};
  const yAxisProps =
    childArray.find((child: any) => child?.type === YAxis)?.props || {};
  const tooltipProps =
    childArray.find((child: any) => child?.type === Tooltip)?.props || {};
  const legendProps =
    childArray.find((child: any) => child?.type === Legend)?.props || {};
  const lineComponents = childArray.filter(
    (child: any) => child?.type === Line,
  );

  // Chart dimensions
  const defaultMargin = { top: 5, right: 0, left: 0, bottom: 5, ...margin };
  const width = 700;
  const height = responsive ? width / 1.618 : 400;
  const padding = {
    top: defaultMargin.top + 20,
    right: defaultMargin.right + 30,
    bottom: defaultMargin.bottom + 40,
    left: defaultMargin.left + 60,
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Get X-axis dataKey
  const xDataKey = xAxisProps.dataKey || "name";

  // Get all line dataKeys
  const lines = lineComponents.map((line: any) => line.props);

  // Extract all values for Y-axis scaling
  const allValues: number[] = [];
  lines.forEach((line: LineProps) => {
    data.forEach((d) => {
      const value = d[line.dataKey];
      if (typeof value === "number") {
        allValues.push(value);
      }
    });
  });

  const labels = data.map((d) => String(d[xDataKey]));

  // Calculate scales
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue || 1;
  const yPadding = valueRange * 0.1;

  const xScale = (index: number) =>
    padding.left + (index / (data.length - 1)) * chartWidth;
  const yScale = (value: number) =>
    padding.top +
    chartHeight -
    ((value - minValue + yPadding) / (valueRange + 2 * yPadding)) * chartHeight;

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    const value = minValue + (valueRange * i) / (yTicks - 1);
    return value;
  });

  // Format number for display
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toFixed(1);
  };

  // Generate paths for each line
  const generatePath = (lineProps: LineProps) => {
    return data
      .map((d, i) => {
        const value = d[lineProps.dataKey];
        if (typeof value !== "number") return "";
        const x = xScale(i);
        const y = yScale(value);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" ");
  };

  const defaultTooltipStyle: React.CSSProperties = {
    backgroundColor: "#1F2937",
    border: "1px solid #374151",
    borderRadius: "8px",
    padding: "8px 12px",
    color: "white",
    fontSize: "12px",
    ...tooltipProps.contentStyle,
  };

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%", ...style }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
      >
        {/* Chart Title */}
        {title && (
          <text
            x={width / 2}
            y={padding.top - 10}
            textAnchor="middle"
            fontSize={16}
            fontWeight={600}
            fill="#111827"
            {...titleStyle}
          >
            {title}
          </text>
        )}

        {/* Grid lines */}
        {yTickValues.map((tick, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            y1={yScale(tick)}
            x2={width - padding.right}
            y2={yScale(tick)}
            stroke={cartesianGridProps.stroke || "#E5E7EB"}
            strokeDasharray={cartesianGridProps.strokeDasharray || "3 3"}
          />
        ))}

        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke={yAxisProps.stroke || "#6B7280"}
          strokeWidth={1}
        />

        {/* X-axis */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke={xAxisProps.stroke || "#6B7280"}
          strokeWidth={1}
        />

        {/* Y-axis labels */}
        {yTickValues.map((tick, i) => (
          <text
            key={`y-label-${i}`}
            x={padding.left - 10}
            y={yScale(tick) + 4}
            textAnchor="end"
            fontSize={yAxisProps.fontSize || 12}
            fill={yAxisProps.stroke || "#6B7280"}
          >
            {formatNumber(tick)}
          </text>
        ))}

        {/* X-axis labels */}
        {labels.map((label, i) => {
          if (labels.length > 10 && i % 2 !== 0) return null;
          return (
            <text
              key={`x-label-${i}`}
              x={xScale(i)}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fontSize={xAxisProps.fontSize || 12}
              fill={xAxisProps.stroke || "#6B7280"}
            >
              {label}
            </text>
          );
        })}

        {/* Render each line */}
        {lines.map((lineProps: LineProps, lineIndex: number) => {
          const pathData = generatePath(lineProps);
          const isHovered = hoveredPoint?.lineIndex === lineIndex;

          return (
            <g key={`line-${lineIndex}`}>
              {/* Line path */}
              <path
                d={pathData}
                fill="none"
                stroke={lineProps.stroke || "#8884d8"}
                strokeWidth={lineProps.strokeWidth || 3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Data points */}
              {lineProps.dot !== false &&
                data.map((d, pointIndex) => {
                  const value = d[lineProps.dataKey];
                  if (typeof value !== "number") return null;

                  const isPointHovered =
                    hoveredPoint?.lineIndex === lineIndex &&
                    hoveredPoint?.pointIndex === pointIndex;

                  const dotProps =
                    typeof lineProps.dot === "object" ? lineProps.dot : {};
                  const activeDotProps =
                    typeof lineProps.activeDot === "object"
                      ? lineProps.activeDot
                      : { r: 8 };

                  const radius = isPointHovered
                    ? activeDotProps.r || 8
                    : dotProps.r || 4;

                  return (
                    <circle
                      key={`point-${lineIndex}-${pointIndex}`}
                      cx={xScale(pointIndex)}
                      cy={yScale(value)}
                      r={radius}
                      fill={dotProps.fill || lineProps.stroke || "#8884d8"}
                      stroke="white"
                      strokeWidth={dotProps.strokeWidth || 2}
                      style={{ cursor: "pointer", transition: "r 0.2s" }}
                      onMouseEnter={() =>
                        setHoveredPoint({ lineIndex, pointIndex })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
            </g>
          );
        })}

        {/* Tooltip */}
        {hoveredPoint !== null && (
          <g>
            <foreignObject
              x={xScale(hoveredPoint.pointIndex) - 80}
              y={
                yScale(
                  data[hoveredPoint.pointIndex][
                    lines[hoveredPoint.lineIndex].dataKey
                  ] as number,
                ) - 60
              }
              width="160"
              height="80"
            >
              <div style={defaultTooltipStyle}>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  {data[hoveredPoint.pointIndex][xDataKey]}
                </div>
                {lines.map((line: LineProps, idx: number) => {
                  const value = data[hoveredPoint.pointIndex][line.dataKey];
                  return (
                    <div key={idx} style={{ color: line.stroke }}>
                      {line.dataKey}:{" "}
                      {typeof value === "number" ? formatNumber(value) : value}
                    </div>
                  );
                })}
              </div>
            </foreignObject>
          </g>
        )}

        {/* Legend */}
        {legendProps && lines.length > 0 && (
          <g transform={`translate(${width / 2}, ${height - 10})`}>
            {lines.map((line: LineProps, idx: number) => {
              const xOffset = (idx - lines.length / 2) * 120;
              return (
                <g key={`legend-${idx}`} transform={`translate(${xOffset}, 0)`}>
                  <line
                    x1={0}
                    y1={0}
                    x2={20}
                    y2={0}
                    stroke={line.stroke}
                    strokeWidth={3}
                  />
                  <text
                    x={25}
                    y={4}
                    fontSize={12}
                    fill="#374151"
                    textAnchor="start"
                  >
                    {line.dataKey}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
