const Top10List = ({
    title = "Top 10 List",
    data = [],
    valueKey = "value",
    labelKey = "label",
    showNumbers = true,
    showValues = true
}) => {
    // Sort and take top 10
    const sortedData = [...data]
        .sort((a, b) => b[valueKey] - a[valueKey])
        .slice(0, 10);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Title */}
            <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center',
                margin: '0 0 20px 0',
                color: '#333',
                borderBottom: '2px solid #f0f0f0',
                paddingBottom: '10px'
            }}>
                {title}
            </h3>

            {/* List Container */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '5px'
            }}>
                {sortedData.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            marginBottom: '6px',
                            backgroundColor: index < 3 ? '#f8f9fa' : '#ffffff',
                            borderRadius: '6px',
                            border: '1px solid #e9ecef',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e3f2fd';
                            e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = index < 3 ? '#f8f9fa' : '#ffffff';
                            e.currentTarget.style.transform = 'translateX(0px)';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            flex: 1
                        }}>
                            {showNumbers && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: index < 3 ? '#2196f3' : '#9e9e9e',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    marginRight: '10px',
                                    flexShrink: 0
                                }}>
                                    {index + 1}
                                </span>
                            )}

                            <span style={{
                                fontSize: '14px',
                                color: '#333',
                                fontWeight: index < 3 ? '600' : '400',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {item[labelKey]}
                            </span>
                        </div>

                        {showValues && (
                            <span style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: index < 3 ? '#2196f3' : '#666',
                                marginLeft: '10px',
                                flexShrink: 0
                            }}>
                                {item[valueKey]
                                }
                            </span>
                        )}
                    </div>
                ))}

                {sortedData.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        color: '#999',
                        fontSize: '14px',
                        marginTop: '20px'
                    }}>
                        No data available
                    </div>
                )}
            </div>
        </div>
    );
};

export default Top10List;