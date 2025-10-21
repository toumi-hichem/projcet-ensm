export const dashboardStyles = {
  dashboard: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8fafc'
  },
  sidebar: {
    width: '250px',
    background: 'white',
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    padding: '20px',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  },
  sidebarCollapsed: {
    width: '0',
    padding: '0'
  },
  menuItemWithArrow: {
    width: '100%',
    padding: '10px 15px',
    marginBottom: '5px',
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#000000'
  },
  arrow: {
    transition: 'transform 0.3s ease',
    fontSize: '14px',
    fontWeight: '300',
    display: 'inline-block'
  },
  arrowExpanded: {
    transform: 'rotate(45deg)'
  },
  sidebarTitle: {
    fontSize: '20px',
    fontWeight: 'bold',

    marginBottom: '20px',
    color: '#000000ff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  hamburgerBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '5px',
    marginRight: '15px',
    color: 'black'
  },
  menuItem: {
    width: '100%',
    padding: '10px 15px',
    marginBottom: '5px',
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#000000'
  },
  menuItemActive: {
    width: '100%',
    padding: '10px 15px',
    marginBottom: '5px',
    background: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  submenu: {
    marginLeft: '20px'
  },
  mainContent: {
    flex: 1,
    overflow: 'auto'
  },
  header: {
    background: 'white',
    padding: '10px 25px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '-20px',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  headerRight: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  },
  searchBox: {
    padding: '8px 15px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    width: '250px',
    color: '#ffffffff'
  },
  downloadBtn: {
    background: '#000',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  content: {
    padding: '30px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '20px',
    marginBottom: '30px',
    fontSize: '100px',
    fontWeight: '400'
  },
  statCard: {
    background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
    color: 'white',
    fontSize: '100px',
    padding: '10px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
  },
  statCardBlue800: {
    background: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
    color: 'white',
    fontSize: '100px',
    padding: '25px',
    borderRadius: '120px',
    boxShadow: '0 4px 15px rgba(30, 64, 175, 0.3)'
  },
  statCardBlue700: {
    background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
    color: 'white',
    fontSize: '100px',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(29, 78, 216, 0.3)'
  },
  statCardCyan: {
    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    color: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)'
  },
  statTitle: {
    fontSize: '100px',
    opacity: 0.9,
    marginBottom: 'auto'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  chartsGrid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  chartCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  chartTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '0px',
    marginTop: '-10px',
    textAlign: 'center',
    color: '#374151',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  pieChart: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: '20px',
    width: '100%',
    height: '250px',
    padding: '10px',
    boxSizing: 'border-box',
    marginBottom: '-30px',
    marginTop: '-30px'
  },
  pieCircle: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    background: 'conic-gradient(#3b82f6 0deg 144deg, #6366f1 144deg 216deg, #8b5cf6 216deg 288deg, #06b6d4 288deg 324deg, #0891b2 324deg 360deg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0
  },
  pieInner: {
    width: '70px',
    height: '70px',
    background: 'white',
    borderRadius: '50%',
    position: 'absolute'
  },
  pieLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
    maxWidth: '200px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#374151'
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    flexShrink: 0
  },
  barChart: {
    display: 'flex',
    alignItems: 'end',
    height: '200px',
    gap: '10px',
    marginBottom: '-20px',
    marginLeft: '-10px'
  },
  barGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%'
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '80%',
    justifyContent: 'end',
    gap: '2px'
  },
  bar: {
    width: '20px',
    borderRadius: '2px',
    transition: 'all 0.3s'
  },
  barLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '100px',
    bottom: '25px'
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap', margintop: '20px'
  },
  distributionChart: {
    height: '150px',
    background: 'linear-gradient(to right, transparent 0%, #3b82f6 50%, transparent 100%)',
    borderRadius: '10px',
    marginBottom: '20px',
    position: 'relative',
    overflow: 'hidden'
  },
  distributionStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    fontSize: '14px'
  },
  successChart: {
    height: '150px',
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    borderRadius: '10px',
    position: 'relative',
    overflow: 'hidden'
  },
  countrySection: {
    marginBottom: '20px'
  },
  countryBoxes: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px'
  },
  countryBoxLight: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '500',
    background: '#e5e7eb',
    color: '#374151',
    maginLeft: '100px'
  },
  countryBoxDark: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '500',
    background: '#6b7280',
    color: 'white',
    maginLeft: '100px'
  },
  chartsGridSmall: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '30px'
  },
  horizontalBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '20px',
    marginLeft: '-60px',
    marginRight: '40px',
    color: '#374151'
  },
  horizontalBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  barLabelLeft: {
    width: '120px',
    textAlign: 'right',
    fontSize: '14px'
  },
  barTrack: {
    flex: 1,
    height: '16px',
    background: '#e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    background: '#3b82f6',
    borderRadius: '8px',
    transition: 'width 0.5s ease'
  },
  barChartContainer: {
    position: 'relative',
    width: '89%',
    height: '250px',
    paddingLeft: '40px',
    paddingBottom: '-20px'
  },
  xAxisLine: {
    position: 'absolute',
    bottom: '30px',
    left: '40px',
    right: '0',
    height: '2px',
    background: '#374151',
    marginBottom: '20px',
    marginLeft: '-20px'
  },
  gridLine: {
    position: 'absolute',
    left: '40px',
    right: '0',
    height: '0px',
    background: '#e5e7eb',
    borderTop: '1px dotted #9ca3af',
    marginLeft: '-20px',
    marginBottom: '20px'
  },
  yAxisLabel: {
    position: 'absolute',
    left: '0',
    fontSize: '12px',
    color: '#6b7280',
    transform: 'translateY(-50%)',
    marginLeft: '-10px',
    marginBottom: '10px'
  }
};
