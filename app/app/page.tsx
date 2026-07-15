'use client';
import { useState } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() === '') return;
    setMessages([...messages, input]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">MetricMind Chat</h1>

      <div className="flex-1 overflow-y-auto border rounded p-4 mb-4 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="bg-gray-100 rounded p-2">
            {msg}
          </div>
        ))}
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