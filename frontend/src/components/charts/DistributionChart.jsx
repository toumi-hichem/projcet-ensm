import React from 'react';

function DistributionChart({ styles }) {
  // Generate random statistics
  const generateRandomStats = () => {
    const values = Array.from({ length: 100 }, () => Math.floor(Math.random() * 50) + 1);
    values.sort((a, b) => a - b);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const median = values[Math.floor(values.length / 2)];

    // Simple mode calculation (most frequent value)
    const frequency = {};
    values.forEach(val => frequency[val] = (frequency[val] || 0) + 1);
    const mode = parseInt(Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b));

    return { min, max, mean, median, mode };
  };

  const stats = generateRandomStats();

  // Sample data for a normal distribution
  const generateNormalDistribution = () => {
    const points = [];
    const mean = stats.mean;
    const stdDev = 8;

    for (let x = 1; x <= 50; x++) {
      const y = Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2)) / (stdDev * Math.sqrt(2 * Math.PI));
      points.push({ x, y: y * 100 });
    }
    return points;
  };

  const data = generateNormalDistribution();
  const maxY = Math.max(...data.map(d => d.y));

  return (
    <div>
      {/* Distribution chart on top */}
      <div style={{
        ...styles.distributionChart,
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        position: 'relative',
        display: 'flex',
        alignItems: 'end',
        justifyContent: 'space-around',
        padding: '10px',
        marginBottom: '20px',
        marginTop: '25px',
        marginLeft: '0px',
      }}>
        {/* Distribution curve using bars */}
        {data.map((point, index) => (
          <div
            key={index}
            style={{
              width: '6px',
              height: `${(point.y / maxY) * 120}px`,
              background: 'linear-gradient(to top, #3b82f6, #60a5fa)',
              borderRadius: '2px 2px 0 0',
              margin: '0 1px'
            }}
          />
        ))}
      </div>

      {/* Statistics below like a legend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        marginleft: '50px',
        gap: '10px',
        fontSize: '14px'
      }}>
        {/* Top row - 3 items */}
        <div style={styles.legendItem}>
          <strong>Mean:</strong> {stats.mean}
        </div>
        <div style={styles.legendItem}>
          <strong>Max:</strong> {stats.max}
        </div>
        <div style={styles.legendItem}>
          <strong>Min:</strong> {stats.min}
        </div>

        {/* Bottom row - 2 items */}
        <div style={styles.legendItem}>
          <strong>Median:</strong> {stats.median}
        </div>
        <div style={styles.legendItem}>
          <strong>Mode:</strong> {stats.mode}
        </div>
      </div>
    </div>
  );
}

export default DistributionChart;
