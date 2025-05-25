const fs = require("fs");
const path = require("path");
const { createCanvas, CanvasRenderingContext2D, loadImage } = require("canvas");
const YAML = require("yaml");
const deckYAML = fs.readFileSync("deck.yaml", "utf-8");
const {
  background: BACKGROUND,
  fontFamily: FONT_FAMILY,
  ranks: RANKS,
  suites: SUITS,
} = YAML.parse(deckYAML);

const SCALE = 8;
const CELL = 8 * SCALE;
const HALF_CELL = CELL / 2;
const GRID = 2;
const VERTICAL_GRID = GRID * 3;
const HORIZONTAL_GRID = GRID * 2;
const HEIGHT = VERTICAL_GRID * CELL;
const WIDTH = HORIZONTAL_GRID * CELL;

const FONT = `${CELL}px "${FONT_FAMILY}"`;
const FLIP = true;
const NO_FLIP = false;

const TOP = CELL;
const TOP_CORNER = 0;
const BOTTOM = HEIGHT - CELL * 2;
const LEFT = CELL;
const LEFT_CORNER = 0;
const RIGHT = WIDTH - CELL * 2;
const RIGHT_CORNER = WIDTH - CELL;
const MID = HEIGHT / 2;
const CENTER = WIDTH / 2;
const BOTTOM_CORNER = HEIGHT - CELL;

const TOP_LEFT_CORNER = { x: LEFT_CORNER, y: TOP_CORNER };
const TOP_RIGHT_CORNER = { x: RIGHT_CORNER, y: TOP_CORNER };
const TOP_LEFT = { x: LEFT, y: TOP };
const TOP_RIGHT = { x: RIGHT, y: TOP };
const TOP_CENTER = { x: CENTER, y: TOP };
const MID_LEFT_CORNER = { x: LEFT_CORNER, y: MID };
const MID_RIGHT_CORNER = { x: RIGHT_CORNER, y: MID };
const MID_LEFT = { x: LEFT, y: MID };
const MID_RIGHT = { x: RIGHT, y: MID };
const MID_CENTER = { x: CENTER, y: MID };
const BOTTOM_LEFT_CORNER = { x: LEFT_CORNER, y: BOTTOM_CORNER };
const BOTTOM_RIGHT_CORNER = { x: RIGHT_CORNER, y: BOTTOM_CORNER };
const BOTTOM_LEFT = { x: LEFT, y: BOTTOM };
const BOTTOM_RIGHT = { x: RIGHT, y: BOTTOM };
const BOTTOM_CENTER = { x: CENTER, y: BOTTOM };

const POSITION = {
  TOP_LEFT_CORNER,
  TOP_RIGHT_CORNER,
  TOP_LEFT,
  TOP_RIGHT,
  TOP_CENTER,
  MID_LEFT_CORNER,
  MID_RIGHT_CORNER,
  MID_LEFT,
  MID_RIGHT,
  MID_CENTER,
  BOTTOM_LEFT_CORNER,
  BOTTOM_RIGHT_CORNER,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
  BOTTOM_CENTER,
};

/**
 * @param {CanvasRenderingContext2D} ctx
 */
async function drawIndex(ctx, rank, suit, position, flip) {
  const x = getCenter(position.x);
  const y = getCenter(position.y);
  ctx.save();
  ctx.font = FONT;
  ctx.translate(x, y);
  if (flip) {
    ctx.rotate(Math.PI);
  }
  ctx.fillText(rank, 0, 0, CELL);
  ctx.translate((CELL * -1) / 4, CELL / 1.5);
  // HACK: I have no idea
  ctx.drawImage(suit.icon, 0, 0, CELL / 2, CELL / 2);
  ctx.restore();
}

function isEmpty(value) {
  return typeof value === "undefined";
}

function getRank(i) {
  if (i === 11) return "J";
  if (i === 12) return "Q";
  if (i === 13) return "K";
  if (i === 14) return "A";
  return i.toString();
}

function getCenter(v) {
  return v + HALF_CELL;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
async function drawIndeces(ctx, rank, suit) {
  await drawIndex(ctx, rank, suit, TOP_LEFT_CORNER, NO_FLIP);
  await drawIndex(ctx, rank, suit, BOTTOM_RIGHT_CORNER, FLIP);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
async function drawPipImage(ctx, pip, suit) {
  const left = X[pip.bounds.left];
  const top = Y[pip.bounds.top];
  const right = X[pip.bounds.right];
  const bottom = Y[pip.bounds.bottom];

  if (isEmpty(left) || isEmpty(right) || isEmpty(top) || isEmpty(bottom))
    return;

  const width = right - left;
  const height = bottom - top;

  ctx.save();
  const image = await loadImage(`${suit.color}.png`);
  ctx.drawImage(image, left, top, width, height);
  ctx.restore();
}

async function drawPipSuit(ctx, pip, suit, position) {
  const x = position.x - HALF_CELL;
  const y = position.y;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI * (pip.rotate / 180));
  ctx.drawImage(suit.icon, 0, 0, CELL, CELL);
  ctx.restore();
}

async function drawPip(ctx, pip, suit) {
  if (pip.type === "IMAGE") return; // drawPipImage(ctx, pip, suit);
  const position = POSITION[pip.position];
  if (!position) return;
  return drawPipSuit(ctx, pip, suit, position);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
async function drawPips(ctx, rank, suit) {
  const rankInfo = RANKS.find((r) => r.rank === rank);
  if (!rankInfo) return;
  for (const pip of rankInfo.pips) await drawPip(ctx, pip, suit);
}

async function main() {
  for (const suit of SUITS) {
    suit.icon = await loadImage(`suits/${suit.name}.png`);

    for (let i = 2; i <= 14; i++) {
      const rank = getRank(i);
      const canvas = createCanvas(WIDTH, HEIGHT);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingQuality = "low";
      ctx.font = FONT;
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = suit.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let column = 0; column <= HORIZONTAL_GRID; column++) {
        for (let row = 0; row <= VERTICAL_GRID; row++) {
          const x = column * CELL;
          const y = row * CELL;

          ctx.save();
          ctx.font = FONT;
          ctx.strokeRect(x, y, CELL, CELL);
          ctx.restore();
        }
      }

      await drawIndeces(ctx, rank, suit);
      await drawPips(ctx, rank, suit);

      const pngBuffer = canvas.toBuffer("image/png", {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE,
      });

      const filePath = path.join(
        __dirname,
        "cards",
        `${suit.name}_${i.toString().padStart(2, "0")}.png`,
      );

      fs.writeFileSync(filePath, pngBuffer);
      // console.log(filePath);
    }
  }
}

main().catch((error) => console.error(error));
