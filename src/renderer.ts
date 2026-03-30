import type { GameState } from "./game.js";

const COLORS = {
  background: "#16213e",
  grid: "#1a2744",
  snakeHead: "#e94560",
  snakeBody: "#0f3460",
  food: "#f0c040",
  gameOverOverlay: "rgba(0, 0, 0, 0.6)",
  text: "#ffffff",
} as const;

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  const tileSize = ctx.canvas.width / state.tileCount;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= state.tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * tileSize, 0);
    ctx.lineTo(i * tileSize, ctx.canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * tileSize);
    ctx.lineTo(ctx.canvas.width, i * tileSize);
    ctx.stroke();
  }

  ctx.fillStyle = COLORS.food;
  ctx.beginPath();
  ctx.arc(
    state.food.x * tileSize + tileSize / 2,
    state.food.y * tileSize + tileSize / 2,
    tileSize / 2.5,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  state.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snakeBody;
    const padding = 1;
    ctx.fillRect(
      segment.x * tileSize + padding,
      segment.y * tileSize + padding,
      tileSize - padding * 2,
      tileSize - padding * 2,
    );
  });

  if (state.isGameOver) {
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", ctx.canvas.width / 2, ctx.canvas.height / 2 - 10);
    ctx.font = "18px sans-serif";
    ctx.fillText(
      "Press Space to restart",
      ctx.canvas.width / 2,
      ctx.canvas.height / 2 + 20,
    );
  } else if (!state.isRunning) {
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Press Space to start",
      ctx.canvas.width / 2,
      ctx.canvas.height / 2,
    );
  }
}
