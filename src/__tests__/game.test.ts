import { describe, it, expect } from "vitest";
import {
  createInitialState,
  moveSnake,
  nextDirection,
  keyToDirection,
  spawnFood,
} from "../game.js";
import type { GameState } from "../game.js";

describe("createInitialState", () => {
  it("creates a state with a snake of length 3", () => {
    const state = createInitialState(20);
    expect(state.snake).toHaveLength(3);
  });

  it("starts with score 0", () => {
    const state = createInitialState(20);
    expect(state.score).toBe(0);
  });

  it("starts not running and not game over", () => {
    const state = createInitialState(20);
    expect(state.isRunning).toBe(false);
    expect(state.isGameOver).toBe(false);
  });

  it("defaults to direction right", () => {
    const state = createInitialState(20);
    expect(state.direction).toBe("right");
  });

  it("places food on the grid", () => {
    const state = createInitialState(20);
    expect(state.food.x).toBeGreaterThanOrEqual(0);
    expect(state.food.x).toBeLessThan(20);
    expect(state.food.y).toBeGreaterThanOrEqual(0);
    expect(state.food.y).toBeLessThan(20);
  });
});

describe("nextDirection", () => {
  it("allows turning left when going up", () => {
    expect(nextDirection("up", "left")).toBe("left");
  });

  it("allows turning right when going up", () => {
    expect(nextDirection("up", "right")).toBe("right");
  });

  it("prevents reversing direction", () => {
    expect(nextDirection("up", "down")).toBe("up");
    expect(nextDirection("left", "right")).toBe("left");
    expect(nextDirection("right", "left")).toBe("right");
    expect(nextDirection("down", "up")).toBe("down");
  });
});

describe("moveSnake", () => {
  it("does not move when not running", () => {
    const state = createInitialState(20);
    const next = moveSnake(state);
    expect(next).toBe(state);
  });

  it("moves the snake forward", () => {
    const state: GameState = {
      ...createInitialState(20),
      isRunning: true,
      direction: "right",
    };
    const head = state.snake[0]!;
    const next = moveSnake(state);
    expect(next.snake[0]!.x).toBe(head.x + 1);
    expect(next.snake[0]!.y).toBe(head.y);
  });

  it("detects wall collision", () => {
    const state: GameState = {
      ...createInitialState(20),
      isRunning: true,
      direction: "right",
      snake: [{ x: 19, y: 5 }, { x: 18, y: 5 }, { x: 17, y: 5 }],
    };
    const next = moveSnake(state);
    expect(next.isGameOver).toBe(true);
    expect(next.isRunning).toBe(false);
  });

  it("detects self collision", () => {
    const state: GameState = {
      ...createInitialState(20),
      isRunning: true,
      direction: "up",
      snake: [
        { x: 5, y: 5 },
        { x: 5, y: 4 },
        { x: 6, y: 4 },
        { x: 6, y: 5 },
        { x: 5, y: 5 },
      ],
    };
    const next = moveSnake(state);
    expect(next.isGameOver).toBe(true);
  });

  it("grows the snake when eating food", () => {
    const state: GameState = {
      ...createInitialState(20),
      isRunning: true,
      direction: "right",
      snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
      food: { x: 6, y: 5 },
    };
    const next = moveSnake(state);
    expect(next.snake).toHaveLength(4);
    expect(next.score).toBe(10);
  });
});

describe("keyToDirection", () => {
  it("maps arrow keys", () => {
    expect(keyToDirection("ArrowUp")).toBe("up");
    expect(keyToDirection("ArrowDown")).toBe("down");
    expect(keyToDirection("ArrowLeft")).toBe("left");
    expect(keyToDirection("ArrowRight")).toBe("right");
  });

  it("maps WASD keys", () => {
    expect(keyToDirection("w")).toBe("up");
    expect(keyToDirection("a")).toBe("left");
    expect(keyToDirection("s")).toBe("down");
    expect(keyToDirection("d")).toBe("right");
  });

  it("returns null for unknown keys", () => {
    expect(keyToDirection("q")).toBeNull();
    expect(keyToDirection("Enter")).toBeNull();
  });
});

describe("spawnFood", () => {
  it("does not spawn on the snake", () => {
    const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    for (let i = 0; i < 50; i++) {
      const food = spawnFood(snake, 20);
      const onSnake = snake.some((p) => p.x === food.x && p.y === food.y);
      expect(onSnake).toBe(false);
    }
  });

  it("spawns within grid bounds", () => {
    const snake = [{ x: 5, y: 5 }];
    for (let i = 0; i < 50; i++) {
      const food = spawnFood(snake, 10);
      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThan(10);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeLessThan(10);
    }
  });
});
