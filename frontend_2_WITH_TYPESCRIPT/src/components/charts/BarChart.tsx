import { useState, type ReactNode } from "react";
import { Bar, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

// Types
interface BarData {
  [key: string]: string | number;
}

interface Margin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

interface CustomBarChartProps {
  data: BarData[];
  children?: ReactNode;
  margin?: Margin;
  style?: React.CSSProperties;
}

interface CartesianGridProps {
  strokeDasharray?: string;
  stroke?: string;
  horizontal?: boolean;
  vertical?: boolean;
}

interface XAxisProps {
  dataKey?: string;
  stroke?: string;
  fontSize?: number;
  axisLine?: boolean;
  tickLine?: boolean;
}

interface YAxisProps {
  stroke?: string;
  fontSize?: number;
  domain?: [number, number];
  ticks?: number[];
  axisLine?: boolean;
  tickLine?: boolean;
}

interface TooltipProps {
  contentStyle?: React.CSSProperties;
}

interface BarProps {
  dataKey: string;
  fill?: string;
  name?: string;
  radius?: number | [number, number, number, number];
}

// Main BarChart component
export function CustomBarChart({
  data = [],
  children,
  margin = { top: 20, right: 30, left: 20, bottom: 5 },
  style = {},
}: CustomBarChartProps) {
  const [hoveredBar, setHoveredBar] = useState<{
    barIndex: number;
    dataIndex: number;
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
  const barComponents = childArray.filter((child: any) => child?.type === Bar);

  // Chart dimensions
  const width = 700;
  const height = 400;
  const padding = {
    top: margin.top || 20,
    right: margin.right || 30,
    bottom: margin.bottom || 40,
    left: margin.left || 60,
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Get X-axis dataKey
  const xDataKey = xAxisProps.dataKey || "name";

  // Get all bar dataKeys
  const bars = barComponents.map((bar: any) => bar.props as BarProps);

  // Extract all values for Y-axis scaling
  const allValues: number[] = [];
  bars.forEach((bar) => {
    data.forEach((d) => {
      const value = d[bar.dataKey];
      if (typeof value === "number") {
        allValues.push(value);
      }
    });
  });

  const labels = data.map((d) => String(d[xDataKey]));

  // Calculate scales
  const minValue = yAxisProps.domain ? yAxisProps.domain[0] : 0;
  const maxValue = yAxisProps.domain
    ? yAxisProps.domain[1]
    : Math.max(...allValues);
  const valueRange = maxValue - minValue || 1;

  const yScale = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Y-axis ticks
  const yTickValues = yAxisProps.ticks || [
    minValue,
    minValue + valueRange * 0.25,
    minValue + valueRange * 0.5,
    minValue + valueRange * 0.75,
    maxValue,
  ];

  // Bar positioning
  const barGroupWidth = chartWidth / data.length;
  const barWidth = barGroupWidth / (bars.length + 1);
  const barPadding = barWidth * 0.2;

  const getBarX = (dataIndex: number, barIndex: number) => {
    return (
      padding.left +
      dataIndex * barGroupWidth +
      barIndex * barWidth +
      barPadding
    );
  };

  // Format number for display
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toFixed(0);
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
      >
        {/* Horizontal Grid lines */}
        {cartesianGridProps.horizontal !== false &&
          yTickValues.map((tick, i) => (
            <line
              key={`grid-h-${i}`}
              x1={padding.left}
              y1={yScale(tick)}
              x2={width - padding.right}
              y2={yScale(tick)}
              stroke={cartesianGridProps.stroke || "#E5E7EB"}
              strokeDasharray={cartesianGridProps.strokeDasharray || "3 3"}
            />
          ))}

        {/* Vertical Grid lines */}
        {cartesianGridProps.vertical === true &&
          data.map((_, i) => (
            <line
              key={`grid-v-${i}`}
              x1={padding.left + i * barGroupWidth + barGroupWidth / 2}
              y1={padding.top}
              x2={padding.left + i * barGroupWidth + barGroupWidth / 2}
              y2={height - padding.bottom}
              stroke={cartesianGridProps.stroke || "#E5E7EB"}
              strokeDasharray={cartesianGridProps.strokeDasharray || "3 3"}
            />
          ))}

        {/* Y-axis */}
        {yAxisProps.axisLine !== false && (
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke={yAxisProps.stroke || "#6B7280"}
            strokeWidth={1}
          />
        )}

        {/* X-axis */}
        {xAxisProps.axisLine !== false && (
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke={xAxisProps.stroke || "#6B7280"}
            strokeWidth={1}
          />
        )}

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
        {labels.map((label, i) => (
          <text
            key={`x-label-${i}`}
            x={padding.left + i * barGroupWidth + barGroupWidth / 2}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fontSize={xAxisProps.fontSize || 12}
            fill={xAxisProps.stroke || "#6B7280"}
          >
            {label}
          </text>
        ))}

        {/* Render bars */}
        {data.map((dataPoint, dataIndex) => (
          <g key={`bar-group-${dataIndex}`}>
            {bars.map((barProps, barIndex) => {
              const value = dataPoint[barProps.dataKey];
              if (typeof value !== "number") return null;

              const barX = getBarX(dataIndex, barIndex);
              const barY = yScale(value);
              const barHeight = yScale(minValue) - barY;
              const isHovered =
                hoveredBar?.dataIndex === dataIndex &&
                hoveredBar?.barIndex === barIndex;

              // Handle radius
              const radius = Array.isArray(barProps.radius)
                ? barProps.radius
                : [barProps.radius || 0, barProps.radius || 0, 0, 0];

              return (
                <g key={`bar-${dataIndex}-${barIndex}`}>
                  {/* Bar with rounded top corners */}
                  <path
                    d={`
                      M ${barX} ${barY + radius[0]}
                      Q ${barX} ${barY} ${barX + radius[0]} ${barY}
                      L ${barX + barWidth - barPadding * 2 - radius[1]} ${barY}
                      Q ${barX + barWidth - barPadding * 2} ${barY} ${barX + barWidth - barPadding * 2} ${barY + radius[1]}
                      L ${barX + barWidth - barPadding * 2} ${barY + barHeight}
                      L ${barX} ${barY + barHeight}
                      Z
                    `}
                    fill={barProps.fill || "#8884d8"}
                    opacity={isHovered ? 0.8 : 1}
                    style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                    onMouseEnter={() => setHoveredBar({ barIndex, dataIndex })}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                </g>
              );
            })}
          </g>
        ))}

        {/* Tooltip */}
        {hoveredBar !== null && (
          <g>
            <foreignObject
              x={
                padding.left +
                hoveredBar.dataIndex * barGroupWidth +
                barGroupWidth / 2 -
                80
              }
              y={padding.top - 60}
              width="160"
              height="80"
            >
              <div style={defaultTooltipStyle}>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  {data[hoveredBar.dataIndex][xDataKey]}
                </div>
                {bars.map((bar, idx) => {
                  const value = data[hoveredBar.dataIndex][bar.dataKey];
                  return (
                    <div
                      key={idx}
                      style={{
                        color: bar.fill,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <span>{bar.name || bar.dataKey}:</span>
                      <span style={{ fontWeight: "bold" }}>
                        {typeof value === "number"
                          ? formatNumber(value)
                          : value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </foreignObject>
          </g>
        )}
      </svg>
    </div>
  );
}

interface BarChartData {
  day: string;
  delivered: number;
  failed: number;
  [key: string]: string | number; // Allow additional properties
}

interface BarChartProps {
  styles?: React.CSSProperties;
  data?: BarChartData[];
  title?: string;
}

export function BarChart({ styles, data = [], title = "" }: BarChartProps) {
  // Default data matching your original structure
  const effectiveData = data.length > 0 ? data : [];

  return (
    <div
      style={{
        width: "200%",
        height: "200px",
        padding: "24px",
        backgroundColor: "transparent",
        marginLeft: "-70px",
        marginRight: "-20px",
        marginTop: "-30px",
        ...styles,
      }}
    >
      {title && (
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            textAlign: "center",
            margin: "0 0 20px 0",
            marginBottom: "10px",
            marginTop: "-15px",
            color: "#374151",
          }}
        >
          <span style={{ color: "#374151" }}>colis</span>{" "}
          <span style={{ color: "#3B82F6" }}>non-livrés</span>{" "}
          <span style={{ color: "#374151" }}>/</span>{" "}
          <span style={{ color: "#6366F1" }}>livrés</span>
        </h2>
      )}

      <div style={{ width: "100%", height: "110%" }}>
        <CustomBarChart
          data={effectiveData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="2 2"
            stroke="#E5E7EB"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="day"
            stroke="#6B7280"
            fontSize={12}
            axisLine={true}
            tickLine={false}
          />
          <YAxis
            stroke="#6B7280"
            fontSize={12}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            axisLine={true}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "black",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Bar
            dataKey="delivered"
            fill="#3b82f6"
            name="delivered"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="failed"
            fill="#6366f1"
            name="failed"
            radius={[2, 2, 0, 0]}
          />
        </CustomBarChart>
      </div>
    </div>
  );
}
