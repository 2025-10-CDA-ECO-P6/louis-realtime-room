import React, { useEffect, useRef, useState } from 'react';
import '../styles/chat.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

interface Message {
  user: string;
  text: string;
}

const Chat: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const username = query.get('username') || '';
  const room = query.get('room') || '';
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!username || !room) {
      navigate('/');
      return;
    }

  
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');
    socketRef.current = socket;


    socket.emit('join', { username, room });


    socket.on('message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });


    socket.on('roomUsers', (users: string[]) => {
      setRoomUsers(users);
    });


    return () => {
      socket.disconnect();
    };
  }, [username, room, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && socketRef.current) {
      socketRef.current.emit('sendMessage', message);
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
          <h3>Users ({roomUsers.length})</h3>
          {roomUsers.map((user, idx) => (
            <span key={idx}>
              {user} {user === username && '(You)'}
            </span>
          ))}
        </div>
      </aside>
      <main className="chat-main">
        <div className="chat-header">
          <h1>Realtime Room</h1>
        </div>
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message${msg.user === username ? ' own' : msg.user === 'System' ? ' system' : ''}`}>
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
