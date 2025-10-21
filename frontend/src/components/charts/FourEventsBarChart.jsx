import React from 'react';

function FourEventsBarChart({ styles }) {
  return (
    <div style={styles.barChart}>
      <div style={styles.barGroup}>
        <div style={styles.barContainer}>
          <div style={{ ...styles.bar, backgroundColor: '#3b82f6', height: '60px' }}></div>
          <div style={{ ...styles.bar, backgroundColor: '#6366f1', height: '40px' }}></div>
          <div style={{ ...styles.bar, backgroundColor: '#06b6d4', height: '30px' }}></div>
          <div style={{ ...styles.bar, backgroundColor: '#0891b2', height: '20px' }}></div>
        </div>
        <div style={styles.barLabel}>Mon</div>
      </div>
      <div style={styles.barGroup}>
        <div style={styles.barContainer}>
          <div style={{ ...styles.bar, backgroundColor: '#3b82f6', height: '80px' }}></div>
          <div style={{ ...styles.bar, backgroundColor: '#6366f1', height: '30px' }}></div>
          <div style={{ ...styles.bar, backgroundColor: '#06b6d4', height: '25px' }}></div>
          <div style={{ ...styles.bar, backgroundColor: '#0891b2', height: '15px' }}></div>
        </div>
        <div style={styles.barLabel}>Tue</div>
      </div>
      <div style={styles.barGroup}>
        <div style={styles.barContainer}>
          <div style={{ ...styles.bar, backgroundColor: '#3b82f6', height: '70px' }}></div>
          <div style={{ ...styles.bar, backgroundColor: '#6366f1', height: '35px' }}></div>
          <div style={{ ...styles.bar, backgroundColor: '#06b6d4', height: '40px' }}></div>
          <div style={{ ...styles.bar, backgroundColor: '#0891b2', height: '25px' }}></div>
        </div>
        <div style={styles.barLabel}>Wed</div>
      </div>
    </div>
  );
}

export default FourEventsBarChart;
