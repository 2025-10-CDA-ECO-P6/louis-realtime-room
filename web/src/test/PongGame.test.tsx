import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PongGame from '../pong/PongGame.tsx';
import type { Socket } from 'socket.io-client';

function createMockSocket(): Socket {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  return {
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    }),
    off: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(l => l !== cb);
      }
    }),
    emit: vi.fn(),
    _listeners: listeners,
    _trigger: (event: string, ...args: unknown[]) => {
      listeners[event]?.forEach(cb => cb(...args));
    },
  } as unknown as Socket & { _trigger: (event: string, ...args: unknown[]) => void };
}

describe('PongGame Component', () => {
  let mockSocket: ReturnType<typeof createMockSocket> & { _trigger: (event: string, ...args: unknown[]) => void };

  beforeEach(() => {
    mockSocket = createMockSocket() as ReturnType<typeof createMockSocket> & { _trigger: (event: string, ...args: unknown[]) => void };
  });

  it('should render the pong game container', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    expect(screen.getByTestId('pong-container')).toBeInTheDocument();
  });

  it('should show a canvas element', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    expect(screen.getByTestId('pong-canvas')).toBeInTheDocument();
  });

  it('should show a "Start Pong" button when no game is active', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    expect(screen.getByText('Start Pong')).toBeInTheDocument();
  });

  it('should emit pong:join when Start Pong is clicked', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    fireEvent.click(screen.getByText('Start Pong'));
    expect(mockSocket.emit).toHaveBeenCalledWith('pong:join', { room: 'test' });
  });

  it('should show "Waiting for opponent..." when status is waiting', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    fireEvent.click(screen.getByText('Start Pong'));
    act(() => {
      mockSocket._trigger('pong:state', {
        ball: { x: 400, y: 200, dx: 4, dy: 4 },
        paddle1: { x: 10, y: 160 },
        paddle2: { x: 780, y: 160 },
        score1: 0,
        score2: 0,
        status: 'waiting',
        player1: 'alice',
        player2: null,
        winner: null,
      });
    });
    expect(screen.getByText(/waiting for opponent/i)).toBeInTheDocument();
  });

  it('should display scores', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:state', {
        ball: { x: 400, y: 200, dx: 4, dy: 4 },
        paddle1: { x: 10, y: 160 },
        paddle2: { x: 780, y: 160 },
        score1: 3,
        score2: 2,
        status: 'playing',
        player1: 'alice',
        player2: 'bob',
        winner: null,
      });
    });
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should show winner when game is finished', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:state', {
        ball: { x: 400, y: 200, dx: 4, dy: 4 },
        paddle1: { x: 10, y: 160 },
        paddle2: { x: 780, y: 160 },
        score1: 5,
        score2: 2,
        status: 'finished',
        player1: 'alice',
        player2: 'bob',
        winner: 'alice',
      });
    });
    expect(screen.getByText(/alice wins/i)).toBeInTheDocument();
  });

  it('should show spectator label when user is not a player', () => {
    render(<PongGame socket={mockSocket} username="charlie" room="test" />);
    act(() => {
      mockSocket._trigger('pong:state', {
        ball: { x: 400, y: 200, dx: 4, dy: 4 },
        paddle1: { x: 10, y: 160 },
        paddle2: { x: 780, y: 160 },
        score1: 0,
        score2: 0,
        status: 'playing',
        player1: 'alice',
        player2: 'bob',
        winner: null,
      });
    });
    expect(screen.getByText(/spectating/i)).toBeInTheDocument();
  });

  it('should register socket listeners on mount', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    expect(mockSocket.on).toHaveBeenCalledWith('pong:state', expect.any(Function));
  });

  it('should emit pong:move on arrow key press when player', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:state', {
        ball: { x: 400, y: 200, dx: 4, dy: 4 },
        paddle1: { x: 10, y: 160 },
        paddle2: { x: 780, y: 160 },
        score1: 0,
        score2: 0,
        status: 'playing',
        player1: 'alice',
        player2: 'bob',
        winner: null,
      });
    });
    fireEvent.keyDown(screen.getByTestId('pong-container'), { key: 'ArrowUp' });
    expect(mockSocket.emit).toHaveBeenCalledWith('pong:move', { room: 'test', direction: 'up' });
  });
});
