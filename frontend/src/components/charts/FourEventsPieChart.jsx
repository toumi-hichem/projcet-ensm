import React from 'react';

function FourEventsPieChart({ styles }) {
  const pieStyle = {
    ...styles.pieCircle,
    background: 'conic-gradient(#1e40af 0deg 120deg, #3b82f6 120deg 200deg, #06b6d4 200deg 280deg, #0891b2 280deg 360deg)'
  };

  return (
    <div style={styles.pieChart}>
      <div style={pieStyle}>
        <div style={styles.pieInner}></div>
      </div>
      <div style={styles.pieLegend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, backgroundColor: '#1e40af' }}></div>
          <span>delivered</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, backgroundColor: '#3b82f6' }}></div>
          <span>failed</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, backgroundColor: '#06b6d4' }}></div>
          <span>fail-to-delivered</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, backgroundColor: '#0891b2' }}></div>
          <span>negative fail-to-delivered</span>
        </div>
      </div>
    </div>
  );
}

export default FourEventsPieChart;
