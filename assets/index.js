const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, CanvasRenderingContext2D } = require("canvas");
const suites = require("./suites.json");
const ranks = require("./ranks.json");

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
function drawIndeces(ctx, rank, suite) {
  ctx.save();
  ctx.translate(20, 20);
  ctx.fillText(rank, 0, 0, 20);
  ctx.translate(0, 25);
  ctx.fillText(suite.icon, 0, 0, 20);
  ctx.restore();

  ctx.save();
  ctx.translate(180, 275);
  ctx.rotate(Math.PI);
  ctx.fillText(suite.icon, 0, 0, 20);
  ctx.translate(0, 25);
  ctx.fillText(rank, 0, 0, 20);
  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
async function drawPips(ctx, rank, suite) {
  const rankInfo = ranks.find((r) => r.rank === rank);
  if (!rankInfo) return;

  for (const pip of rankInfo.pips) {
    ctx.save();
    ctx.translate(pip.x, pip.y);
    if (pip.direction === "down") ctx.rotate(Math.PI);

    if (!pip.icon) {
      ctx.font = [pip.size, "DM Serif Text"].join(" ");
      ctx.fillText(suite.icon, 0, 0);
    } else if (fs.existsSync(pip.icon)) {
    } else {
      ctx.font = [pip.size, "DM Serif Text"].join(" ");
      ctx.fillText(pip.icon, 0, 0);
    }

    ctx.restore();
  }
}

async function main() {
  for (const suite of suites)
    for (let i = 2; i <= 14; i++) {
      const rank = getRank(i);
      const canvas = createCanvas(200, 300);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingQuality = "low";
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 200, 300);
      ctx.font = "20px DM Serif Text";
      ctx.fillStyle = suite.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.save();

      drawIndeces(ctx, rank, suite);
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
