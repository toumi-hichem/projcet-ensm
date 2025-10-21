import React from 'react';

function ChartCard({ title, children, styles }) {
  return (
    <div style={styles.chartCard}>
      <h3 style={styles.chartTitle}>{title}</h3>
      {children}
    </div>
  );
}

export default ChartCard;
