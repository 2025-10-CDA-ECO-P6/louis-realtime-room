import React, { useEffect, useRef, useState } from 'react';
import '../styles/chat.scss';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Chat: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const username = query.get('username') || '';
  const room = query.get('room') || '';
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{user: string, text: string}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!username || !room) {
      navigate('/');
    }
  }, [username, room, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      setMessages([...messages, { user: username, text: message }]);
      setMessage('');
    }
  };

  return (
    <div className="chat-layout">
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Room: {room}</h2>
        </div>
        <div className="sidebar-users">
          <span>{username} (You)</span>
        </div>
      </aside>
      <main className="chat-main">
        <div className="chat-header">
          <h1>Realtime Room</h1>
        </div>
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message${msg.user === username ? ' own' : ''}`}>
              <span className="chat-user">{msg.user}:</span> <span>{msg.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-form" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
          <button type="submit">Send</button>
        </form>
      </main>
    </div>
  );
};

export default Chat;
