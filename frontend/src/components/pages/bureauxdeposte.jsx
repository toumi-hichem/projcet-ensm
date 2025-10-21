import { useState } from 'react';
import { StatCards } from '../ui';
import { LineChart } from '../charts';
import { useEffect } from 'react';
import { mapping } from '../../data/kpi-mapping';
const getstates1 = async (path) => {
    const response = await fetch(path);
    const data = await response.json();
    const kpi1 = data.donnees.kpi1;

 

    const color = "#2e75e7ff";
    const realstats = [];
    const stats = [];

    for (const [title, datakey] of Object.entries(mapping)) {
        const value = kpi1[title];
        const chartData = kpi1[datakey] || [];
        stats.push({
            title,
            value,
            color,
            chartData
        });
    }

    realstats.push({ id: 1, name: "CTNI", location: 'Centre de Tri National International', stats: stats });

    return realstats;
}
const getstates2 = async (path) => {
    const response = await fetch(path);
    const data = await response.json();
    const kpi2 = data.donnees.kpi2;


    const color = "#2e75e7ff";
    const realstats = [];
    const stats = [];

    for (const [title, datakey] of Object.entries(mapping)) {
        const value = kpi2[title];
        const chartData = kpi2[datakey] || [];
        stats.push({
            title,
            value,
            color,
            chartData
        });
    }

    realstats.push({ id: 2, name: "CPX", location: 'Centre Postal d éhange', stats: stats });

    return realstats;
}
const getstates3 = async (path) => {
    const response = await fetch(path);
    const data = await response.json();
    const kpi3 = data.donnees.kpi3;

    const color = "#2e75e7ff";
    const realstats = [];
    const stats = [];

    for (const [title, datakey] of Object.entries(mapping)) {
        const value = kpi3[title];
        const chartData = kpi3[datakey] || [];
        stats.push({
            title,
            value,
            color,
            chartData
        });
    }

    realstats.push({ id: 3, name: "Centre Aero Postal", location: 'Aéroport', stats: stats });

    return realstats;
}
const Bureauxdeposte = () => {
    const [selectedOffice, setSelectedOffice] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [stats1, setStats1] = useState([]);
    const [stats2, setStats2] = useState([]);
    const [stats3, setStats3] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getstates1("/post_offices_data.json");
            setStats1(data);
        };
        fetchData();
    }, []);
    useEffect(() => {
        const fetchData = async () => {
            const data = await getstates2("/post_offices_data.json");
            setStats2(data);
        };
        fetchData();
    }, []);
    useEffect(() => {
        const fetchData = async () => {
            const data = await getstates3("/post_offices_data.json");
            setStats3(data);
        };
        fetchData();
    }, []);

    const handleOfficeSelect = (office) => {
        setSelectedOffice(office);
        setSelectedCard(null); // Reset selected card when changing office
    };
    const handleCardClick = (stat, index) => {
        setSelectedCard(index === selectedCard ? null : index);
    };
    const sampleData = [...stats1, ...stats2, ...stats3];
    return (
        <div style={{
            padding: '20px',
            backgroundColor: '#f8fafc',
            minHeight: '80vh',
            minWidth: '100%',
            marginBottom: '-15000px',
            marginLeft: '-20px'
        }}>
            {/* Header */}
            <div style={{
                marginTop: '-40px',
                marginBottom: '30px',
                textAlign: 'center'
            }}>


            </div>

            {/* Office Selection Buttons */}
            <div style={{
                display: 'flex',
                gap: '20px',
                justifyContent: 'center',
                marginBottom: '30px',
                //flexWrap: 'wrap'
            }}>

                {/* CTNI */}
                <button
                    onClick={() => handleOfficeSelect(sampleData?.find(office => office.name === 'CTNI'))}
                    style={{
                        padding: '15px 25px',
                        borderRadius: '10px',
                        border: selectedOffice?.name === 'CTNI' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                        backgroundColor: selectedOffice?.name === 'CTNI' ? '#3b82f6' : 'white',
                        color: selectedOffice?.name === 'CTNI' ? 'white' : '#3b1e31ff',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedOffice?.name === 'CTNI' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                        minWidth: '200px',
                        textAlign: 'center',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        msUserSelect: 'none'

                    }}
                    onMouseEnter={(e) => {
                        if (selectedOffice?.name !== 'CTNI') {
                            e.target.style.backgroundColor = null;
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (selectedOffice?.name !== 'CTNI') {
                            e.target.style.backgroundColor = null;
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        }
                    }}
                >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>CTNI</div>
                    <div style={{
                        fontSize: '14px',
                        opacity: selectedOffice?.name === 'CTNI' ? 0.9 : 0.7
                    }}>
                        Centre de Tri National International
                    </div>
                </button>



















                {/* CPX */}
                <button
                    onClick={() => handleOfficeSelect(sampleData?.find(office => office.name === 'CPX'))}
                    style={{
                        padding: '15px 25px',
                        borderRadius: '10px',
                        border: selectedOffice?.name === 'CPX' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                        backgroundColor: selectedOffice?.name === 'CPX' ? '#3b82f6' : 'white',
                        color: selectedOffice?.name === 'CPX' ? 'white' : '#1e293b',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedOffice?.name === 'CPX' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                        minWidth: '200px',
                        textAlign: 'center',
                        userSelect: 'none',        // 👈 prevents text selection
                        WebkitUserSelect: 'none',  // 👈 Safari
                        msUserSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                        if (selectedOffice?.name !== 'CPX') {
                            e.target.style.backgroundColor = null;
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (selectedOffice?.name !== 'CPX') {
                            e.target.style.backgroundColor = null;
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        }
                    }}
                >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>CPX</div>
                    <div style={{
                        fontSize: '14px',
                        opacity: selectedOffice?.name === 'CPX' ? 0.9 : 0.7
                    }}>
                        Centre Postal d'Échange
                    </div>
                </button>













                {/* Centre Aero Postal */}
                <button
                    onClick={() => handleOfficeSelect(sampleData?.find(office => office.name === 'Centre Aero Postal'))}
                    style={{
                        padding: '15px 25px',
                        borderRadius: '10px',
                        border: selectedOffice?.name === 'Centre Aero Postal' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                        backgroundColor: selectedOffice?.name === 'Centre Aero Postal' ? '#3b82f6' : 'white',
                        color: selectedOffice?.name === 'Centre Aero Postal' ? 'white' : '#1e293b',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedOffice?.name === 'Centre Aero Postal' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                        minWidth: '200px',
                        textAlign: 'center',
                        userSelect: 'none',        // 👈 prevents text selection
                        WebkitUserSelect: 'none',  // 👈 Safari
                        msUserSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                        if (selectedOffice?.name !== 'Centre Aero Postal') {
                            e.target.style.backgroundColor = null;
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (selectedOffice?.name !== 'Centre Aero Postal') {
                            e.target.style.backgroundColor = null;
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        }
                    }}
                >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Centre Aero Postal</div>
                    <div style={{
                        fontSize: '14px',
                        opacity: selectedOffice?.name === 'Centre Aero Postal' ? 0.9 : 0.7
                    }}>
                        Centre Aéroportuaire
                    </div>
                </button>
            </div>




            {/* Office Details */}
            {selectedOffice ? (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '25px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e5e5'
                }}>
                    {/* Office Info Header */}
                    <div style={{
                        marginBottom: '0px',
                        textAlign: 'center'
                    }}>


                    </div>

                    {/* KPI Cards */}
                    <StatCards
                        stats={selectedOffice.stats}
                        onCardClick={handleCardClick}
                        selectedCard={selectedCard}
                        setSelectedCard={setSelectedCard}
                    />

                    {/* Charts Section */}
                    <div style={{
                        display: "flex",
                        gap: "20px",
                        alignItems: "stretch",
                        marginBottom: "0px",
                        marginTop: "20px"
                    }}>
                        {/* Main LineChart block (left) */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            padding: '19px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e5e5e5',
                            flex: 1.5,
                            height: '250px',
                            display: 'flex',
                        }}>
                            <LineChart
                                data={selectedOffice.stats[1]?.chartData} // Default to delivery rate chart
                                title="Evolution Mensuelle du taux de livraison"
                                showLabels={true}
                            />
                        </div>

                        {/* Selected stat chart block (right) */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            padding: '19px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e5e5e5',
                            flex: 1.5,
                            height: '250px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {selectedCard !== null ? (
                                <div style={{
                                    width: '150%',
                                    height: '150%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '45px' }}>
                                        {selectedOffice.stats[selectedCard].title}
                                    </div>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: '#000000ff',
                                        marginBottom: '10px'
                                    }}>
                                        Evolution mensuelle : {selectedOffice.stats[selectedCard].title}
                                    </div>

                                    <div style={{
                                        flex: 1,
                                        width: '100%',
                                        display: 'flex'
                                    }}>
                                        <LineChart
                                            data={selectedOffice.stats[selectedCard].chartData}
                                            title=""
                                            showLabels={true}
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    color: '#3a62e6ff',
                                    fontSize: '18px',
                                    textAlign: 'center',
                                }}>
                                    Cliquez sur une carte KPI ci-dessus pour voir son graphique d'évolution
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // No office selected state
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '60px 25px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e5e5',
                    textAlign: 'center',
                    marginBottom: '-500px'
                }}>
                    <div style={{
                        fontSize: '48px',
                        marginBottom: '0px'
                    }}>
                        📮
                    </div>
                    <h3 style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#1e293b',
                        marginBottom: '-10px'
                    }}>
                        Aucun bureau sélectionné
                    </h3>
                    <p style={{
                        fontSize: '16px',
                        color: '#64748b'
                    }}>
                        Veuillez sélectionner un bureau de poste ci-dessus pour voir ses indicateurs de performance
                    </p>
                </div>
            )}
        </div>
    );
};

export default Bureauxdeposte;