import React, { useEffect, useState } from 'react';
import '../styles/landing.scss';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

interface Room {
  name: string;
  users: number;
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState('');
  const [room, setRoom] = React.useState('');
  const [joinName, setJoinName] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    const socket = io('/', { path: '/socket.io' });

    socket.on('rooms:list', (roomList: Room[]) => {
      setRooms(roomList);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && room) {
      navigate(`/chat?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}`);
    }
  };

  const handleJoinExisting = (roomName: string) => {
    if (joinName) {
      navigate(`/chat?username=${encodeURIComponent(joinName)}&room=${encodeURIComponent(roomName)}`);
    }
  };

  const hasRooms = rooms.length > 0;

  return (
    <div className="landing-container">
      <header className={`landing-header ${hasRooms ? 'wide' : ''}`}>
        <h1>Realtime Room</h1>
        <p>Join a room and chat in real time</p>
      </header>

      <div className={`landing-boxes ${hasRooms ? 'has-rooms' : ''}`}>
        <div className="landing-box create-box">
          <h2>Create a Room</h2>
          <form className="landing-form" onSubmit={handleCreate}>
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
            <button type="submit">Create &amp; Join</button>
          </form>
        </div>

        {hasRooms && (
          <div className="landing-box join-box">
            <h2>Join an Existing Room</h2>
            <div className="join-name-input">
              <input
                type="text"
                placeholder="Your username"
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
              />
            </div>
            <ul className="room-list">
              {rooms.map(r => (
                <li key={r.name} className="room-item">
                  <div className="room-info">
                    <span className="room-name">{r.name}</span>
                    <span className="room-users">{r.users} online</span>
                  </div>
                  <button
                    className="join-btn"
                    disabled={!joinName}
                    onClick={() => handleJoinExisting(r.name)}
                  >
                    Join
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
