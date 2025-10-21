import React from "react";

export function ChartCard({ title, children, styles }) {
  return (
    <div style={styles.chartCard}>
      <h3 style={styles.chartTitle}>{title}</h3>
      {children}
    </div>
  );
}
