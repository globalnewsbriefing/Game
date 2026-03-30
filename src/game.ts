export interface Point {
  x: number;
  y: number;
}

export type Direction = "up" | "down" | "left" | "right";

export interface GameState {
  snake: Point[];
  food: Point;
  direction: Direction;
  score: number;
  isRunning: boolean;
  isGameOver: boolean;
  gridSize: number;
  tileCount: number;
}

export function createInitialState(tileCount: number): GameState {
  const center = Math.floor(tileCount / 2);
  return {
    snake: [
      { x: 5, y: center },
      { x: 4, y: center },
      { x: 3, y: center },
    ],
    food: spawnFood(
      [
        { x: 5, y: center },
        { x: 4, y: center },
        { x: 3, y: center },
      ],
      tileCount,
    ),
    direction: "right",
    score: 0,
    isRunning: false,
    isGameOver: false,
    gridSize: 0,
    tileCount,
  };
}

export function spawnFood(snake: Point[], tileCount: number): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];

  for (let x = 0; x < tileCount; x++) {
    for (let y = 0; y < tileCount; y++) {
      if (!occupied.has(`${x},${y}`)) {
        free.push({ x, y });
      }
    }
  }

  if (free.length === 0) {
    return { x: 0, y: 0 };
  }

  return free[Math.floor(Math.random() * free.length)]!;
}

export function nextDirection(
  current: Direction,
  requested: Direction,
): Direction {
  const opposites: Record<Direction, Direction> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  if (opposites[current] === requested) {
    return current;
  }
  return requested;
}

export function moveSnake(state: GameState): GameState {
  if (!state.isRunning || state.isGameOver) return state;

  const head = state.snake[0]!;
  const delta: Record<Direction, Point> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const d = delta[state.direction];
  const newHead: Point = {
    x: head.x + d.x,
    y: head.y + d.y,
  };

  if (
    newHead.x < 0 ||
    newHead.x >= state.tileCount ||
    newHead.y < 0 ||
    newHead.y >= state.tileCount
  ) {
    return { ...state, isRunning: false, isGameOver: true };
  }

  if (state.snake.some((p) => p.x === newHead.x && p.y === newHead.y)) {
    return { ...state, isRunning: false, isGameOver: true };
  }

  const ateFood =
    newHead.x === state.food.x && newHead.y === state.food.y;
  const newSnake = [newHead, ...state.snake];

  if (!ateFood) {
    newSnake.pop();
  }

  return {
    ...state,
    snake: newSnake,
    food: ateFood ? spawnFood(newSnake, state.tileCount) : state.food,
    score: ateFood ? state.score + 10 : state.score,
  };
}

export function keyToDirection(key: string): Direction | null {
  const map: Record<string, Direction> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
    W: "up",
    S: "down",
    A: "left",
    D: "right",
  };
  return map[key] ?? null;
}
