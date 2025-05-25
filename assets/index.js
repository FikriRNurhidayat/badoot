const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const YAML = require("yaml");
const deckYAML = fs.readFileSync("deck.yaml", "utf-8");

// CONFIG
const deck = YAML.parse(deckYAML);
const { background, foreground, fontFamily, width, height, column, row, mr } =
  deck.canvas;
const cell = height / row;
const margin = cell * mr;
const font = [`${cell}px`, `"${fontFamily}"`].join(" ");
const halfCell = cell / 2;

// HELPERS

async function setup(ctx) {
  ctx.imageSmoothingEnabled = false;
  ctx.imageSmoothingQuality = "low";
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = foreground;
}

/**
 * @param {{x: number, y: number}} coordinate
 */
function getVertex(coordinate) {
  const position = { ...coordinate };
  const x =
    position.x < 0 ? width - cell * (position.x * -1) : cell * (position.x - 1);

  const y =
    position.y < 0
      ? height - cell * (position.y * -1)
      : cell * (position.y - 1);

  return [x, y];
}

function getRadian(angle) {
  return (angle * Math.PI) / 180;
}

function getSize(size) {
  return size - margin;
}

function getCenter(size) {
  return halfCell - size / 2;
}

// DRAW

async function drawBackground(ctx) {
  ctx.save();
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

async function drawGrid(ctx) {
  for (let c = 0; c <= column; c++) {
    for (let r = 0; r <= row; r++) {
      const x = c * cell;
      const y = r * cell;
      ctx.save();
      ctx.strokeRect(x, y, cell, cell);
      ctx.restore();
    }
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x: number, y: number}} coordinate
 * @param {(CanvasRenderingContext2D) => Promise<void>} callback
 */
async function drawCell(ctx, coordinate, flip, callback) {
  const [x, y] = getVertex(coordinate, flip);
  ctx.save();
  if (flip) {
    ctx.translate(width, height);
    ctx.rotate(Math.PI);
  }
  ctx.translate(x, y);
  await callback(ctx);
  ctx.restore();
}

async function drawIndeces(ctx, suit, rank) {
  for (const item of deck.indeces) {
    await drawCell(ctx, item.rank, item.flip, async (ctx) => {
      ctx.fillStyle = suit.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(rank.name, halfCell, halfCell, cell);
    });

    await drawCell(ctx, item.suit, item.flip, async (ctx) => {
      const size = getSize(cell);
      const center = getCenter(size);
      ctx.drawImage(suit.icon, center, center, size, size);
    });
  }
}

async function drawPips(ctx, suit, rank) {
  if (!Array.isArray(rank.pips)) return;

  for (const pip of rank.pips) {
    await drawCell(ctx, pip.coordinate, pip.flip, async (ctx) => {
      const size = getSize(cell * pip.scale);
      const center = getCenter(size);
      ctx.drawImage(suit.icon, center, center, size, size);
    });
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
async function drawFace(ctx, suit, rank) {
  ctx.save();
  const image = await loadImage(rank.face.file);
  const [tl, tr, br, bl] = rank.face.bounds.map((bound) => getVertex(bound));
  const width = tr[0] - tl[0] + cell;
  const height = bl[1] - tl[1] + cell;

  ctx.translate(tl[0], tl[1]);
  ctx.lineWidth = cell / 8;
  ctx.drawImage(image, 0, 0, width, height);
  ctx.strokeRect(0, 0, width, height);
  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
async function drawCard(ctx, suit, rank) {
  await drawBackground(ctx);
  // await drawGrid(ctx);
  await drawIndeces(ctx, suit, rank);
  if (rank.face) await drawFace(ctx, suit, rank);
  if (Array.isArray(rank.pips)) await drawPips(ctx, suit, rank);
}

// MAIN

async function main() {
  for (const suit of deck.suites) {
    suit.icon = await loadImage(`suits/${suit.name}.png`);
    for (const rank of deck.ranks) {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      await setup(ctx);
      await drawCard(ctx, suit, rank);

      const pngBuffer = canvas.toBuffer("image/png", {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE,
      });

      const isNumber = Number.isInteger(parseInt(rank.name));
      const rankName = isNumber ? rank.name.padStart(2, "0") : rank.name;

      const fileName = `${suit.name}_${rankName}.png`;
      const filePath = path.join(__dirname, "cards", fileName);

      fs.writeFileSync(filePath, pngBuffer);
    }
  }
}

main().catch((error) => console.error(error));
