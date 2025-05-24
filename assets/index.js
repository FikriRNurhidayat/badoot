const fs = require("fs");
const path = require("path");
const { createCanvas, CanvasRenderingContext2D, loadImage } = require("canvas");
const {
  background,
  height,
  fontFamily,
  ranks,
  suites,
} = require("./deck.json");

const width = height * (2 / 3);
const gridSize = width * 0.1;
const font = `${gridSize}px ${fontFamily}`;

const FLIP = true;
const NO_FLIP = false;

const HORIZONTAL_CENTER = width / 2;
const VERTICAL_CENTER = height / 2;
const TOP = gridSize * 2;
const TOP_CORNER = gridSize;
const LEFT_CORNER = gridSize;
const LEFT = gridSize * 3;
const BOTTOM = height - TOP;
const BOTTOM_CORNER = height - TOP_CORNER;
const RIGHT = width - LEFT;
const RIGHT_CORNER = width - LEFT_CORNER;
const MID_TOP = TOP + (BOTTOM - TOP) / 3;
const MID_BOTTOM = BOTTOM - (BOTTOM - TOP) / 3;
const TOP_MID = TOP + (MID_TOP - TOP) / 2;
const BOTTOM_MID = BOTTOM - (BOTTOM - MID_BOTTOM) / 2;

const TOP_LEFT_CORNER = {
  x: LEFT_CORNER,
  y: TOP_CORNER,
};
const TOP_RIGHT_CORNER = {
  x: RIGHT_CORNER,
  y: TOP_CORNER,
};
const BOTTOM_LEFT_CORNER = {
  x: LEFT_CORNER,
  y: BOTTOM_CORNER,
};
const BOTTOM_RIGHT_CORNER = {
  x: RIGHT_CORNER,
  y: BOTTOM_CORNER,
};
const BOTTOM_CENTER = {
  x: HORIZONTAL_CENTER,
  y: BOTTOM,
};
const BOTTOM_LEFT = {
  x: LEFT,
  y: BOTTOM,
};
const BOTTOM_RIGHT = {
  x: RIGHT,
  y: BOTTOM,
};
const MID_CENTER = {
  x: HORIZONTAL_CENTER,
  y: VERTICAL_CENTER,
};
const MID_LEFT = {
  x: LEFT,
  y: VERTICAL_CENTER,
};
const MID_RIGHT = {
  x: RIGHT,
  y: VERTICAL_CENTER,
};
const TOP_CENTER = {
  x: HORIZONTAL_CENTER,
  y: TOP,
};
const TOP_LEFT = {
  x: LEFT,
  y: TOP,
};
const TOP_RIGHT = {
  x: RIGHT,
  y: TOP,
};

const TOP_MID_CENTER = {
  x: HORIZONTAL_CENTER,
  y: TOP_MID,
};

const BOTTOM_MID_CENTER = {
  x: HORIZONTAL_CENTER,
  y: BOTTOM_MID,
};

const MID_TOP_CENTER = {
  x: HORIZONTAL_CENTER,
  y: MID_TOP,
};

const MID_TOP_LEFT = {
  x: LEFT,
  y: MID_TOP,
};

const MID_TOP_RIGHT = {
  x: RIGHT,
  y: MID_TOP,
};

const MID_BOTTOM_CENTER = {
  x: HORIZONTAL_CENTER,
  y: MID_BOTTOM,
};

const MID_BOTTOM_LEFT = {
  x: LEFT,
  y: MID_BOTTOM,
};

const MID_BOTTOM_RIGHT = {
  x: RIGHT,
  y: MID_BOTTOM,
};

const X = {
  START: 0,
  END: width,
  LEFT,
  LEFT_CORNER,
  RIGHT,
  RIGHT_CORNER,
};

const Y = {
  START: 0,
  END: height,
  BOTTOM,
  BOTTOM_CORNER,
  BOTTOM_MID,
  MID_BOTTOM,
  MID_TOP,
  TOP,
  TOP_CORNER,
  TOP_MID,
};

const COORDINATES = {
  BOTTOM_CENTER,
  BOTTOM_LEFT,
  BOTTOM_LEFT_CORNER,
  BOTTOM_MID_CENTER,
  BOTTOM_RIGHT,
  BOTTOM_RIGHT_CORNER,
  MID_BOTTOM_CENTER,
  MID_BOTTOM_LEFT,
  MID_BOTTOM_RIGHT,
  MID_CENTER,
  MID_LEFT,
  MID_RIGHT,
  MID_TOP_CENTER,
  MID_TOP_LEFT,
  MID_TOP_RIGHT,
  TOP_CENTER,
  TOP_LEFT,
  TOP_LEFT_CORNER,
  TOP_MID_CENTER,
  TOP_RIGHT,
  TOP_RIGHT_CORNER,
};

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

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function drawIndex(ctx, rank, suite, position, flip) {
  ctx.save();
  ctx.font = font;
  ctx.translate(position.x, position.y);
  if (flip) {
    ctx.rotate(Math.PI);
  }
  ctx.fillText(rank, 0, 0, gridSize);
  ctx.translate(0, gridSize * 1.25);
  ctx.fillText(suite.icon, 0, 0, gridSize);
  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
async function drawIndeces(ctx, rank, suite) {
  drawIndex(ctx, rank, suite, TOP_LEFT_CORNER, NO_FLIP);
  drawIndex(ctx, rank, suite, BOTTOM_RIGHT_CORNER, FLIP);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
async function drawPipImage(ctx, pip, suite) {
  const left = X[pip.bounds.left];
  const top = Y[pip.bounds.top];
  const right = X[pip.bounds.right];
  const bottom = Y[pip.bounds.bottom];

  if (isEmpty(left) || isEmpty(right) || isEmpty(top) || isEmpty(bottom))
    return;

  const width = right - left;
  const height = bottom - top;

  ctx.save();
  const image = await loadImage(`${suite.color}.png`);
  ctx.drawImage(image, left, top, width, height);
  ctx.restore();
}

async function drawPipSuite(ctx, pip, suite, position) {
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(Math.PI * (pip.rotate / 180));
  ctx.font = [`${pip.scale * gridSize}px`, fontFamily].join(" ");
  ctx.fillText(suite.icon, 0, 0);
  ctx.restore();
}

async function drawPip(ctx, pip, suite) {
  if (pip.type === "IMAGE") return drawPipImage(ctx, pip, suite);
  const position = COORDINATES[pip.position];
  if (!position) return;
  return drawPipSuite(ctx, pip, suite, position);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
async function drawPips(ctx, rank, suite) {
  const rankInfo = ranks.find((r) => r.rank === rank);
  if (!rankInfo) return;
  for (const pip of rankInfo.pips) await drawPip(ctx, pip, suite);
}

async function main() {
  for (const suite of suites)
    for (let i = 2; i <= 14; i++) {
      const rank = getRank(i);
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingQuality = "low";
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = suite.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.save();

      await drawIndeces(ctx, rank, suite);
      await drawPips(ctx, rank, suite);

      const pngBuffer = canvas.toBuffer("image/png", {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE,
      });

      const filePath = path.join(
        __dirname,
        "cards",
        `${suite.name}_${i.toString().padStart(2, "0")}.png`,
      );

      fs.writeFileSync(filePath, pngBuffer);
      console.log(filePath);
    }
}

main().catch((error) => console.error(error));
