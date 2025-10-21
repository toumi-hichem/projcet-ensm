import React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

function PieChart({
  styles,
  data = [],
  colors = [],
  title = "",
  showLabels = true
}) {


  const effectiveData = data.length > 0 ? data : [];
  const effectiveColors =
    colors.length > 0 ? colors : colors;

  const containerStyle = styles?.pieChart || {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "20px",
    border: "1px solid #e5e5e5",
    margin: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  };

  return (
    <div style={containerStyle}>

      <RechartsPieChart width={250} height={250} >
        <Pie
          data={effectiveData}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          style={{ outline: 'none' }}
        >
          {effectiveData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              style={{ outline: 'none' }}
              fill={effectiveColors[index % effectiveColors.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value}%`, name]}

          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "8px"
          }}
        />
        {showLabels && <Legend />}
      </RechartsPieChart>
    </div>
  );
}

export default PieChart;
