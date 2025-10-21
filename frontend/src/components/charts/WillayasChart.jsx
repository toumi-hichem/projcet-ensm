import React from 'react';

function WillayasChart({ styles }) {
  const willayas = [
    { name: 'Alger', percentage: 95 },
    { name: 'Annaba', percentage: 73 },
    { name: 'Setif', percentage: 60 },
    { name: 'Jijel', percentage: 40 },
    { name: 'Tipaza', percentage: 30 }
  ];

  return (
    <div style={styles.horizontalBars}>
      {willayas.map((willaya) => (
        <div key={willaya.name} style={styles.horizontalBar}>
          <div style={styles.barLabelLeft}>{willaya.name}</div>
          <div style={styles.barTrack}>
            <div
              style={{
                ...styles.barFill,
                width: `${willaya.percentage}%`,
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default WillayasChart;
