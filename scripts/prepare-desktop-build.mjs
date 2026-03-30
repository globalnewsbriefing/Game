import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const desktopDistDir = path.join(rootDir, "desktop-dist");
const standaloneDir = path.join(rootDir, ".next", "standalone");
const staticDir = path.join(rootDir, ".next", "static");
const publicDir = path.join(rootDir, "public");

if (!existsSync(standaloneDir)) {
  throw new Error("Missing .next/standalone. Run `next build` before preparing the desktop bundle.");
}

rmSync(desktopDistDir, { recursive: true, force: true });
mkdirSync(desktopDistDir, { recursive: true });

cpSync(standaloneDir, desktopDistDir, { recursive: true });

const nestedNextDir = path.join(desktopDistDir, ".next");
mkdirSync(nestedNextDir, { recursive: true });

if (existsSync(staticDir)) {
  cpSync(staticDir, path.join(nestedNextDir, "static"), { recursive: true });
}

if (existsSync(publicDir)) {
  cpSync(publicDir, path.join(desktopDistDir, "public"), { recursive: true });
}
