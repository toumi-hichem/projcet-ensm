import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

function BarChart({ styles, data = [], title = "" }) {
  // Default data matching your original structure


  const effectiveData = data.length > 0 ? data : data;

  return (
    <div style={{
      width: '200%',
      height: '200px',
      padding: '24px',
      backgroundColor: 'transparent',
      marginLeft: '-70px',
      marginRight: '-20px',
      marginTop: '-30px',
    }}>
      {title && (
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center',
          margin: '0 0 20px 0',
          marginBottom: '10px',
          marginTop: '-15px',
          color: '#374151',
        }}>
          <span style={{ color: '#374151' }}>colis</span>{' '}
          <span style={{ color: '#3B82F6' }}>non-livrés</span>{' '}
          <span style={{ color: '#374151' }}>/</span>{' '}
          <span style={{ color: '#6366F1' }}>livrés</span>
        </h2>
      )}

      <ResponsiveContainer width="100%" height="110%">
        <RechartsBarChart
          data={effectiveData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}

        >
          <CartesianGrid
            strokeDasharray="2 2"
            stroke="#E5E7EB"
            horizontal={true}
            vertical={false}
          />

          <XAxis
            dataKey="day"
            stroke="#6B7280"
            fontSize={12}
            axisLine={true}
            tickLine={false}
          />
          <YAxis
            stroke="#6B7280"
            fontSize={12}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            axisLine={true}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'black',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />

          <Bar
            dataKey="delivered"
            fill="#3b82f6"
            name="delivered"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="failed"
            fill="#6366f1"
            name="failed"
            radius={[2, 2, 0, 0]}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;