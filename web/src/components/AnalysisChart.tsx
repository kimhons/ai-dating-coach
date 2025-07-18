import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalysisChartProps {
  data: {
    labels: string[];
    matchRates: number[];
    responseRates: number[];
  };
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ data }) => {
  // Transform data for recharts
  const chartData = data.labels.map((label, index) => ({
    name: label,
    matchRate: data.matchRates[index],
    responseRate: data.responseRates[index]
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="matchRate" 
              stroke="#f57c00" 
              name="Match Rate (%)"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="responseRate" 
              stroke="#ec4899" 
              name="Response Rate (%)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalysisChart;