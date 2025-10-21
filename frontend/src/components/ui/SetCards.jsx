import { useState } from 'react';

const SetCard = ({ title, value, color = '#1e40af', onClick, isSelected = false }) => {
    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: color,
                borderRadius: '8px',
                padding: '0',
                minWidth: '70px',
                maxWidth: '440px',
                height: '95px',
                flex: '1 1 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: 'white',
                boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                marginTop: '5px',
                marginBottom: '20px',
                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                cursor: 'pointer',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s ease',
                border: isSelected ? '2px solid #60a5fa' : '2px solid transparent'
            }}
            onMouseEnter={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }
            }}
            onMouseLeave={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }
            }}
        >
            {/* Title Section */}
            <div style={{
                height: '60px',
                padding: '10px 6px 0 6px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                textAlign: 'center',
                lineHeight: '2.8',
                fontSize: 'clamp(24px, 1.2vw, 11px)',
            }}>
                {title}

            </div>
        </div>
    );
};



const SetCards = ({ stats, onCardClick }) => {
    const [selectedCard, setSelectedCard] = useState(null);

    const handleCardClick = (stat, index) => {
        const newSelectedCard = selectedCard === index ? null : index;
        setSelectedCard(newSelectedCard);

        // Call the external callback if provided
        if (onCardClick) {
            onCardClick(newSelectedCard !== null ? stat : null, newSelectedCard);
        }
    };

    return (
        <div>
            {/* Stats Cards Row */}
            <div style={{
                display: 'flex',
                gap: '8px',
                width: '100%',
                alignItems: 'stretch',
                justifyContent: 'space-between',
                flexWrap: 'nowrap',
                minHeight: '95px',
                marginBottom: selectedCard !== null ? '0px' : '0'
            }}>
                {stats.map((stat, index) => (
                    <SetCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        color={stat.color || '#4285f4'}
                        onClick={() => handleCardClick(stat, index)}
                        isSelected={selectedCard === index}
                    />
                ))}
            </div>

            {/* Graph Display Area */}

        </div>
    );
};

export { SetCard, SetCards };
export default SetCards;