'use client';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const metricData = [
  { name: 'Revenue', value: 141500 },
  { name: 'Cost', value: 89000 },
  { name: 'Margin', value: 52500 },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [showChart, setShowChart] = useState(false);

  const handleSend = () => {
    if (input.trim() === '') return;
    setMessages([...messages, input]);

    if (
      input.toLowerCase().includes('revenue') ||
      input.toLowerCase().includes('margin') ||
      input.toLowerCase().includes('breakdown')
    ) {
      setShowChart(true);
    }
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">MetricMind Chat</h1>

      <div className="flex-1 overflow-y-auto border rounded p-4 mb-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className="bg-gray-100 rounded p-2">
            {msg}
          </div>
        ))}

        {showChart && (
          <div className="border rounded p-3 bg-white">
            <p className="text-sm font-semibold mb-2">Revenue vs Cost vs Margin</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metricData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#000000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your metrics..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}