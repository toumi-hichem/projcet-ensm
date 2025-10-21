function Kpi({ title, value, style }) {
    return (
        <div style={style}>
            <div style={{ fontSize: '12px', opacity: 1, marginBottom: '3px', marginTop: '-15px', color: '#fff' }}>{title}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '-18px' }}>{value}</div>
        </div>
    );
}

export default Kpi;
