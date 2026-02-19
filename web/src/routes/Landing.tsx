import React from 'react';
import '../styles/landing.scss';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState('');
  const [room, setRoom] = React.useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && room) {
      navigate(`/chat?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}`);
    }
  };

  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>Realtime Room</h1>
        <p>Join a room and chat in real time</p>
      </header>
      <form className="landing-form" onSubmit={handleJoin}>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Enter room name"
          value={room}
          onChange={e => setRoom(e.target.value)}
          required
        />
        <button type="submit">Join Room</button>
      </form>
    </div>
  );
};

export default Landing;
