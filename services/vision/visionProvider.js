/**
 * Vision Provider Interface
 *
 * The rest of the application should never need
 * to know which AI/vision provider is being used.
 */

class VisionProvider {
  async analyzeScreenshot(imagePath) {
    throw new Error(
      "analyzeScreenshot() must be implemented by a vision provider."
    );
  }
}

module.exports = VisionProvider;