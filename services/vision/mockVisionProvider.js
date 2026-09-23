const VisionProvider = require("./visionProvider");

class MockVisionProvider extends VisionProvider {
  async analyzeScreenshot(imagePath) {
    console.log(
      "Mock vision provider analyzing:",
      imagePath
    );

    return {
      source: "INFERRED",

      components: [
        {
          type: "Header / Navigation",

          confidence: 0.94,

          content: {
            navigationText: {
              value:
                "Home Services Projects About Contact",

              source: "INFERRED",
            },
          },
        },

        {
          type: "Hero / Highlight",

          confidence: 0.91,

          content: {
            heading: {
              text: "Build Digital Experiences",
              level: "H1",
              source: "INFERRED",
            },

            description: {
              text:
                "Create modern digital experiences for your audience.",

              source: "INFERRED",
            },

            cta: {
              text: "Start a Project",

              url:
                "Not available from image",

              target:
                "Not available from image",

              ariaLabel:
                "Not available from image",

              suggestedAriaLabel:
                "Start a Project",

              source: "INFERRED",
            },

            image: {
              altText:
                "Not available from image",

              source: "UNAVAILABLE",
            },
          },
        },

        {
          type: "Area Heading",

          confidence: 0.88,

          content: {
            heading: {
              text: "Our Services",
              level: "H2",
              source: "INFERRED",
            },
          },
        },

        {
          type: "Card Grid",

          confidence: 0.82,

          content: {
            heading: {
              text: "Services",
              level: "H2",
              source: "INFERRED",
            },

            text: {
              value:
                "Web Experiences\nWeb Development\nResponsive Products\nBusiness Systems",

              source: "INFERRED",
            },
          },
        },

        {
          type: "Footer",

          confidence: 0.91,

          content: {
            text: {
              value:
                "Footer content detected from screenshot.",

              source: "INFERRED",
            },
          },
        },
      ],
    };
  }
}

module.exports = MockVisionProvider;