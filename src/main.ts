import {
  createInitialState,
  keyToDirection,
  moveSnake,
  nextDirection,
} from "./game.js";
import { render } from "./renderer.js";
import type { Direction, GameState } from "./game.js";

const TILE_COUNT = 20;
const TICK_MS = 120;

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const scoreEl = document.getElementById("score")!;

let state: GameState = createInitialState(TILE_COUNT);
let pendingDirection: Direction | null = null;
let loopId: ReturnType<typeof setInterval> | null = null;

function tick(): void {
  if (pendingDirection) {
    state = {
      ...state,
      direction: nextDirection(state.direction, pendingDirection),
    };
    pendingDirection = null;
  }

  console.log('Before moveSnake:', { head: state.snake[0], direction: state.direction, isRunning: state.isRunning, isGameOver: state.isGameOver });
  state = moveSnake(state);
  console.log('After moveSnake:', { head: state.snake[0], isRunning: state.isRunning, isGameOver: state.isGameOver });
  scoreEl.textContent = String(state.score);
  render(ctx, state);

  if (state.isGameOver && loopId !== null) {
    clearInterval(loopId);
    loopId = null;
  }
}

function startGame(): void {
  if (loopId !== null) {
    clearInterval(loopId);
  }
  state = createInitialState(TILE_COUNT);
  state = { ...state, isRunning: true };
  scoreEl.textContent = "0";
  pendingDirection = null;
  loopId = setInterval(tick, TICK_MS);
  render(ctx, state);
}

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === " ") {
    e.preventDefault();
    if (!state.isRunning || state.isGameOver) {
      startGame();
    }
    return;
  }

  const dir = keyToDirection(e.key);
  if (dir) {
    e.preventDefault();
    pendingDirection = dir;
  }
});

render(ctx, state);
