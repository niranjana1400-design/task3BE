const MockVisionProvider = require("./mockVisionProvider");

function getVisionProvider() {
  const provider =
    process.env.VISION_PROVIDER || "mock";

  switch (provider) {
    case "mock":
      return new MockVisionProvider();

    default:
      console.warn(
        `Unknown vision provider "${provider}". Using mock provider.`
      );

      return new MockVisionProvider();
  }
}

async function analyzeScreenshot(imagePath) {
  const visionProvider =
    getVisionProvider();

  return visionProvider.analyzeScreenshot(
    imagePath
  );
}

module.exports = {
  analyzeScreenshot,
  getVisionProvider,
};