import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function LineChart({ data = [], styles, title }) {
    // This is your data - change this to your own data


    return (
        <div style={{
            width: '200%',
            height: '200px',
            padding: '24px',
            backgroundColor: 'transparent',
            marginLeft: '-70px',
            marginRight: '-20px',
            marginTop: '-35px',
        }}>
            <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '10px',
                marginTop: '10px',
                textAlign: 'center',
                color: '#374151'
            }}>
                {title}
            </h2>

            <ResponsiveContainer width="100%" height="110%">
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'black',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fill="url(#colorValue)"
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LineChart;