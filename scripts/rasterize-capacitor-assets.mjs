/**
 * FILE: scripts/rasterize-capacitor-assets.mjs
 *
 * PURPOSE:
 *   Rasterizes the brand SVGs in assets/ into the PNG source files that
 *   @capacitor/assets expects (assets/icon.png at 1024x1024 and
 *   assets/splash.png at 2732x2732). Run this before
 *   `npx capacitor-assets generate`.
 *
 * LOGIC OVERVIEW:
 *   1. Render app-icon.svg at high resolution preserving aspect, then
 *      composite it centered on a 1024x1024 brand-orange canvas
 *      (logo paths in the SVG are white, so the orange canvas provides
 *      the contrast needed for an app icon).
 *   2. Render splash-screen.svg at high resolution preserving aspect,
 *      then composite it centered on a 2732x2732 cream canvas.
 *      Logo is sized to ~30% of the canvas width so it stays inside
 *      the safe-area circle that Capacitor crops to on every device.
 *
 * DEPENDENCIES:
 *   sharp (resolved via @capacitor/assets)
 *
 * LAST UPDATED: 2026-05-06 — initial rasterization pipeline
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
// sharp is a transitive dep of @capacitor/assets; resolve through it.
const sharp = require(
  require.resolve("sharp", {
    paths: [require.resolve("@capacitor/assets/package.json")].map((p) =>
      p.replace(/\/package\.json$/, ""),
    ),
  }),
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const assets = path.join(root, "assets");

const ICON_BG = "#D8670E"; // brand orange — contrasts with white logo
const SPLASH_BG = "#fffdf9"; // --mt-cream-bg

async function buildIcon() {
  const target = 1024;
  const inner = Math.round(target * 0.6); // logo occupies ~60% of canvas
  const logo = await sharp(path.join(assets, "app-icon.svg"))
    .resize({
      width: inner,
      height: inner,
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const { width, height } = await sharp(logo).metadata();
  await sharp({
    create: { width: target, height: target, channels: 4, background: ICON_BG },
  })
    .composite([
      {
        input: logo,
        left: Math.round((target - width) / 2),
        top: Math.round((target - height) / 2),
      },
    ])
    .png()
    .toFile(path.join(assets, "icon.png"));
  console.log("wrote assets/icon.png (1024x1024)");
}

async function buildSplash() {
  const target = 2732;
  const inner = Math.round(target * 0.3); // logo within central safe area
  const logo = await sharp(path.join(assets, "splash-screen.svg"))
    .resize({
      width: inner,
      height: inner,
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const { width, height } = await sharp(logo).metadata();
  await sharp({
    create: { width: target, height: target, channels: 4, background: SPLASH_BG },
  })
    .composite([
      {
        input: logo,
        left: Math.round((target - width) / 2),
        top: Math.round((target - height) / 2),
      },
    ])
    .png()
    .toFile(path.join(assets, "splash.png"));
  console.log("wrote assets/splash.png (2732x2732)");
}

await buildIcon();
await buildSplash();
