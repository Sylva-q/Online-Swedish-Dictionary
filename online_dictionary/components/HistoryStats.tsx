import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { SearchHistoryItem } from '../types';
import { POS_COLORS } from '../constants';

interface HistoryStatsProps {
  history: SearchHistoryItem[];
}

const HistoryStats: React.FC<HistoryStatsProps> = ({ history }) => {
  const posData = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach(item => {
      // Normalize simple POS tags
      let pos = item.partOfSpeech.toLowerCase();
      if (pos.includes('noun')) pos = 'noun';
      else if (pos.includes('verb')) pos = 'verb';
      else if (pos.includes('adj')) pos = 'adjective';
      else if (pos.includes('adv')) pos = 'adverb';
      
      counts[pos] = (counts[pos] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="text-center p-8 text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100">
        <p>Search for words to see your learning statistics!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Learning Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pie Chart for Distribution */}
        <div className="h-64 w-full">
          <p className="text-center text-sm text-gray-500 mb-2">Word Types Distribution</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={posData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {posData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={POS_COLORS[entry.name] || POS_COLORS['other']} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart for Simple Count */}
        <div className="h-64 w-full">
           <p className="text-center text-sm text-gray-500 mb-2">Vocabulary Count by Type</p>
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={posData}>
              <XAxis dataKey="name" fontSize={12} tickFormatter={(val) => val.slice(0, 4)} />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {posData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={POS_COLORS[entry.name] || POS_COLORS['other']} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Total words studied</span>
            <span className="text-2xl font-bold text-swedish-blue">{history.length}</span>
        </div>
      </div>
    </div>
  );
};

export default HistoryStats;