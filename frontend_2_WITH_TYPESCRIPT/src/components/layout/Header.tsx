import React from 'react';
const logoUrl = "/poste-algerie-seeklogo.svg";
function Header({ setSidebarOpen, sidebarOpen, getPageTitle, styles }) {
  return (
    <div style={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          style={styles.hamburgerBtn}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          marginRight: '10px',
          marginLeft: '-10px',
        }

        }>
          <img src={logoUrl} alt="Menu" style={{ width: 45, height: 45 }} />
        </div>
        <h1 style={styles.headerTitle}>{getPageTitle()}</h1>
      </div>
      <div style={styles.headerRight}>
        <input
          type="text"
          style={{...styles.searchBox, 
            backgroundColor:'white'
          }}
          placeholder="Search..."

        />
        <button style={styles.downloadBtn}>
          Download
        </button>
      </div>
    </div>
  );
}

export default Header;
