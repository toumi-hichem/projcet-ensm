import React from 'react';

function CountryDelivery({ styles }) {
  return (
    <div>
      <div style={styles.countrySection}>
        <div style={{ fontWeight: '600', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', marginLeft: '100px' }}>
          <span style={{ color: 'transparent' }}>to</span>
          <span style={{ color: 'transparent' }}>from</span>
        </div>
        <div style={styles.countryBoxes}>
          <div style={styles.countryBoxLight}>UA</div>
          <div style={styles.countryBoxDark}>US</div>
        </div>
      </div>
      <div style={styles.countrySection}>
        <h4 style={{ fontWeight: '600', marginBottom: '10px', color: '#374151', marginLeft: '78px', fontSize: '120%' }}>Slowest country to deliver</h4>
        <div style={{ fontWeight: '600', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', marginLeft: '100px' }}>
          <span style={{ color: 'transparent' }}>to</span>
          <span style={{ color: 'transparent' }}>from</span>
          <span>to</span>
          <span>from</span>
        </div>
        <div style={styles.countryBoxes}>
          <div style={styles.countryBoxLight}>FR</div>
          <div style={styles.countryBoxDark}>CN</div>
        </div>
      </div>
    </div>
  );
}

export default CountryDelivery;
