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

  it('should show a "Join Queue" button initially', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    expect(screen.getByText('Join Queue')).toBeInTheDocument();
  });

  it('should emit pong:queue when Join Queue is clicked', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    fireEvent.click(screen.getByText('Join Queue'));
    expect(mockSocket.emit).toHaveBeenCalledWith('pong:queue', { room: 'test' });
  });

  it('should show Leave Queue button when user is in queue', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: ['alice'],
        player1: null,
        player2: null,
        gameStatus: 'idle',
        winner: null,
      });
    });
    expect(screen.getByText(/leave queue/i)).toBeInTheDocument();
  });

  it('should emit pong:dequeue when Leave Queue is clicked', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: ['alice'],
        player1: null,
        player2: null,
        gameStatus: 'idle',
        winner: null,
      });
    });
    fireEvent.click(screen.getByText(/leave queue/i));
    expect(mockSocket.emit).toHaveBeenCalledWith('pong:dequeue', { room: 'test' });
  });

  it('should show queue position', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: ['bob', 'alice'],
        player1: null,
        player2: null,
        gameStatus: 'idle',
        winner: null,
      });
    });
    expect(screen.getByText(/leave queue \(#2\)/i)).toBeInTheDocument();
  });

  it('should display the queue list', () => {
    render(<PongGame socket={mockSocket} username="charlie" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: ['alice', 'bob'],
        player1: null,
        player2: null,
        gameStatus: 'idle',
        winner: null,
      });
    });
    expect(screen.getByTestId('pong-queue')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('should display scores during game', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: [],
        player1: 'alice',
        player2: 'bob',
        gameStatus: 'playing',
        winner: null,
      });
      mockSocket._trigger('pong:state', {
        ball: { x: 400, y: 200, dx: 4, dy: 4 },
        paddle1: { x: 10, y: 160 },
        paddle2: { x: 780, y: 160 },
        score1: 3,
        score2: 2,
        status: 'playing',
        countdown: null,
        player1: 'alice',
        player2: 'bob',
        winner: null,
      });
    });
    expect(screen.getByTestId('score1').textContent).toBe('3');
    expect(screen.getByTestId('score2').textContent).toBe('2');
  });

  it('should show "Get ready!" during countdown', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: [],
        player1: 'alice',
        player2: 'bob',
        gameStatus: 'countdown',
        winner: null,
      });
    });
    expect(screen.getByText(/get ready/i)).toBeInTheDocument();
  });

  it('should show winner when game is finished', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: [],
        player1: 'alice',
        player2: 'bob',
        gameStatus: 'finished',
        winner: 'alice',
      });
    });
    expect(screen.getByText(/alice wins/i)).toBeInTheDocument();
  });

  it('should show spectator label when user is not a player', () => {
    render(<PongGame socket={mockSocket} username="charlie" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: [],
        player1: 'alice',
        player2: 'bob',
        gameStatus: 'playing',
        winner: null,
      });
    });
    expect(screen.getByText(/spectating/i)).toBeInTheDocument();
  });

  it('should show queue position when spectating and in queue', () => {
    render(<PongGame socket={mockSocket} username="charlie" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: ['charlie'],
        player1: 'alice',
        player2: 'bob',
        gameStatus: 'playing',
        winner: null,
      });
    });
    expect(screen.getByText(/spectating.*#1 in queue/i)).toBeInTheDocument();
  });

  it('should hide Join Queue when user is actively playing', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: [],
        player1: 'alice',
        player2: 'bob',
        gameStatus: 'playing',
        winner: null,
      });
    });
    expect(screen.queryByText('Join Queue')).not.toBeInTheDocument();
  });

  it('should show Join Queue after game finishes for players', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: [],
        player1: 'alice',
        player2: 'bob',
        gameStatus: 'finished',
        winner: 'alice',
      });
    });
    expect(screen.getByText('Join Queue')).toBeInTheDocument();
  });

  it('should register socket listeners on mount', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    expect(mockSocket.on).toHaveBeenCalledWith('pong:lobby', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('pong:state', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('pong:ended', expect.any(Function));
  });

  it('should emit pong:startMove on arrow key press when player', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: [],
        player1: 'alice',
        player2: 'bob',
        gameStatus: 'playing',
        winner: null,
      });
    });
    fireEvent.keyDown(screen.getByTestId('pong-container'), { key: 'ArrowUp' });
    expect(mockSocket.emit).toHaveBeenCalledWith('pong:startMove', { room: 'test', direction: 'up' });
  });

  it('should emit pong:stopMove on arrow key release when player', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: [],
        player1: 'alice',
        player2: 'bob',
        gameStatus: 'playing',
        winner: null,
      });
    });
    const container = screen.getByTestId('pong-container');
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    fireEvent.keyUp(container, { key: 'ArrowDown' });
    expect(mockSocket.emit).toHaveBeenCalledWith('pong:stopMove', { room: 'test', direction: 'down' });
  });

  it('should not emit duplicate pong:startMove for held key', () => {
    render(<PongGame socket={mockSocket} username="alice" room="test" />);
    act(() => {
      mockSocket._trigger('pong:lobby', {
        queue: [],
        player1: 'alice',
        player2: 'bob',
        gameStatus: 'playing',
        winner: null,
      });
    });
    const container = screen.getByTestId('pong-container');
    fireEvent.keyDown(container, { key: 'ArrowUp' });
    fireEvent.keyDown(container, { key: 'ArrowUp' });
    const startMoveCalls = (mockSocket.emit as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c: unknown[]) => c[0] === 'pong:startMove'
    );
    expect(startMoveCalls).toHaveLength(1);
  });
});
