const sharp = require("sharp");
const {
  createWorker,
} = require("tesseract.js");

const {
  analyzeScreenshot:
    analyzeWithVision,
} = require("./vision/visionService");

async function analyzeImage(
  imagePath
) {
  const metadata =
    await sharp(imagePath).metadata();

  
  /* 
   * OCR
   * ----------------------------------------
   */

  const worker =
    await createWorker("eng");

  const result =
    await worker.recognize(
      imagePath
    );

  await worker.terminate();

  const words =
    result.data.words || [];

  const textElements =
    words
      .filter(
        (word) =>
          word.text.trim()
      )
      .map((word) => ({
        text:
          word.text.trim(),

        confidence:
          word.confidence,

        boundingBox: {
          x: word.bbox.x0,

          y: word.bbox.y0,

          width:
            word.bbox.x1 -
            word.bbox.x0,

          height:
            word.bbox.y1 -
            word.bbox.y0,
        },

        source:
          "EXTRACTED",
      }));

  /*
   * ----------------------------------------
   * VISION
   * ----------------------------------------
   */

  let visionResult = null;

  try {
    visionResult =
      await analyzeWithVision(
        imagePath
      );
  } catch (error) {
    console.error(
      "Vision analysis failed:",
      error
    );

    visionResult = {
      source: "UNAVAILABLE",
      components: [],
    };
  }

  return {
    image: {
      width:
        metadata.width,

      height:
        metadata.height,

      format:
        metadata.format,
    },

    textElements,

    fullText:
      textElements
        .map(
          (item) =>
            item.text
        )
        .join(" "),

    vision:
      visionResult,

    source:
      "OCR + VISION",
  };
}

module.exports = {
  analyzeImage,
};