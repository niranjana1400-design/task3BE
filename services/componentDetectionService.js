const COMPONENT_TYPES = {
  HEADER: "Header / Navigation",
  HERO: "Hero / Highlight",
  AREA_HEADING: "Area Heading",
  RICH_TEXT: "Rich Text",
  CTA: "CTA",
  CONTENT_CARD: "Content Card",
  CARD_GRID: "Card Grid",
  IMAGE_SECTION: "Image Section",
  FOOTER: "Footer",
  OTHER: "Other",
};

const SOURCE_TYPES = {
  EXTRACTED: "EXTRACTED",
  INFERRED: "INFERRED",
  UNAVAILABLE: "UNAVAILABLE",
};


/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

/**
 * Normalize text for comparisons.
 */
function normalizeText(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase();
}


/**
 * Get center X position.
 */
function getCenterX(boundingBox) {
  return (
    boundingBox.x +
    boundingBox.width / 2
  );
}


/**
 * Get center Y position.
 */
function getCenterY(boundingBox) {
  return (
    boundingBox.y +
    boundingBox.height / 2
  );
}


/**
 * Get bounding box area.
 */
function getBoundingArea(boundingBox) {
  return (
    boundingBox.width *
    boundingBox.height
  );
}


/**
 * Calculate vertical distance.
 */
function getVerticalDistance(first, second) {
  return Math.abs(
    first.boundingBox.y -
      second.boundingBox.y
  );
}


/**
 * Determine whether two elements are on approximately
 * the same horizontal line.
 */
function isSameLine(first, second) {
  const firstHeight =
    first.boundingBox.height;

  const secondHeight =
    second.boundingBox.height;

  const tolerance =
    Math.max(
      firstHeight,
      secondHeight
    ) * 0.8;

  return (
    Math.abs(
      first.boundingBox.y -
        second.boundingBox.y
    ) <= tolerance
  );
}


/**
 * Determine whether two elements are horizontally close.
 */
function isHorizontallyClose(first, second) {
  const firstRight =
    first.boundingBox.x +
    first.boundingBox.width;

  const secondLeft =
    second.boundingBox.x;

  const distance =
    secondLeft - firstRight;

  return distance <= 180;
}


/**
 * Merge two bounding boxes.
 */
function mergeBoundingBoxes(
  first,
  second
) {
  const x = Math.min(
    first.x,
    second.x
  );

  const y = Math.min(
    first.y,
    second.y
  );

  const right = Math.max(
    first.x + first.width,
    second.x + second.width
  );

  const bottom = Math.max(
    first.y + first.height,
    second.y + second.height
  );

  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}


/* =========================================================
   STEP 1 — SORT OCR ELEMENTS
========================================================= */

/**
 * Sort OCR elements:
 *
 * Top → Bottom
 * Left → Right
 */
function sortTextElements(textElements) {
  return [...textElements].sort(
    (a, b) => {
      const yDifference =
        a.boundingBox.y -
        b.boundingBox.y;

      if (Math.abs(yDifference) > 25) {
        return yDifference;
      }

      return (
        a.boundingBox.x -
        b.boundingBox.x
      );
    }
  );
}


/* =========================================================
   STEP 2 — GROUP WORDS INTO TEXT BLOCKS
========================================================= */

/**
 * Converts individual OCR words into readable text blocks.
 *
 * Example:
 *
 * Your
 * Health
 * Journey
 * Starts
 * Here
 *
 * becomes:
 *
 * Your Health Journey Starts Here
 */
function groupTextElements(textElements) {
  if (
    !Array.isArray(textElements) ||
    textElements.length === 0
  ) {
    return [];
  }

  const validElements =
    textElements.filter(
      (element) =>
        element &&
        element.text &&
        element.boundingBox
    );

  const sorted =
    sortTextElements(validElements);

  const groups = [];

  for (const element of sorted) {
    const text =
      String(element.text).trim();

    if (!text) {
      continue;
    }

    let matchedGroup = null;

    for (
      let i = groups.length - 1;
      i >= 0;
      i--
    ) {
      const group = groups[i];

      const lastElement =
        group.elements[
          group.elements.length - 1
        ];

      const sameLine =
        isSameLine(
          lastElement,
          element
        );

      const horizontallyClose =
        isHorizontallyClose(
          lastElement,
          element
        );

      const verticalDistance =
        getVerticalDistance(
          lastElement,
          element
        );

      if (
        sameLine &&
        horizontallyClose &&
        verticalDistance < 60
      ) {
        matchedGroup = group;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.text += ` ${text}`;

      matchedGroup.elements.push(
        element
      );

      matchedGroup.boundingBox =
        mergeBoundingBoxes(
          matchedGroup.boundingBox,
          element.boundingBox
        );

      continue;
    }

    groups.push({
      text,

      elements: [element],

      boundingBox: {
        ...element.boundingBox,
      },

      confidence:
        element.confidence ?? null,
    });
  }

  return groups;
}


/* =========================================================
   STEP 3 — NAVIGATION DETECTION
========================================================= */

const NAVIGATION_WORDS = [
  "home",
  "about",
  "about us",
  "services",
  "service",
  "products",
  "product",
  "projects",
  "project",
  "portfolio",
  "contact",
  "contact us",
  "login",
  "sign in",
  "sign up",
  "register",
  "pricing",
  "features",
  "blog",
  "careers",
  "menu",
  "dashboard",
];


/**
 * Detect possible navigation text.
 */
function looksLikeNavigation(text) {
  const normalized =
    normalizeText(text);

  return NAVIGATION_WORDS.some(
    (word) =>
      normalized === word ||
      normalized.includes(` ${word} `)
  );
}


/* =========================================================
   STEP 4 — CTA DETECTION
========================================================= */

const CTA_WORDS = [
  "get started",
  "start now",
  "learn more",
  "read more",
  "contact us",
  "book now",
  "buy now",
  "shop now",
  "sign up",
  "signup",
  "register",
  "login",
  "log in",
  "explore",
  "discover",
  "try now",
  "try free",
  "download",
  "subscribe",
  "join now",
  "apply now",
  "view more",
  "see more",
  "request demo",
  "request a demo",
];


/**
 * Detect possible CTA text.
 */
function looksLikeCTA(text) {
  const normalized =
    normalizeText(text);

  return CTA_WORDS.some(
    (word) =>
      normalized === word ||
      normalized.startsWith(`${word} `) ||
      normalized.endsWith(` ${word}`) ||
      normalized.includes(` ${word} `)
  );
}


/* =========================================================
   STEP 5 — FOOTER DETECTION
========================================================= */

const FOOTER_WORDS = [
  "copyright",
  "privacy policy",
  "terms",
  "terms of service",
  "terms & conditions",
  "cookie policy",
  "all rights reserved",
];


/**
 * Detect possible footer text.
 */
function looksLikeFooter(text) {
  const normalized =
    normalizeText(text);

  return FOOTER_WORDS.some(
    (word) =>
      normalized.includes(word)
  );
}


/* =========================================================
   STEP 6 — HERO DETECTION
========================================================= */

/**
 * Check whether text is located near the top
 * of the webpage.
 */
function isNearTop(
  boundingBox,
  imageHeight
) {
  return (
    boundingBox.y <
    imageHeight * 0.35
  );
}


/**
 * Determine whether text is visually prominent.
 */
function isLargeText(
  group,
  imageHeight
) {
  const textHeight =
    group.boundingBox.height;

  return (
    textHeight >
    imageHeight * 0.018
  );
}


/**
 * Determine whether a text group is likely
 * to be part of the hero section.
 */
function looksLikeHero(
  group,
  index,
  imageHeight
) {
  if (
    !isNearTop(
      group.boundingBox,
      imageHeight
    )
  ) {
    return false;
  }

  if (
    !isLargeText(
      group,
      imageHeight
    )
  ) {
    return false;
  }

  /*
   * Main hero content normally appears
   * very early in the webpage.
   */
  if (index <= 5) {
    return true;
  }

  return false;
}


/* =========================================================
   STEP 7 — HEADING LEVEL DETECTION
========================================================= */

/**
 * Estimate heading level based on relative
 * text size.
 *
 * This is a heuristic.
 */
function detectHeadingLevel(
  group,
  imageHeight
) {
  const textHeight =
    group.boundingBox.height;

  const ratio =
    textHeight / imageHeight;

  if (ratio >= 0.035) {
    return "H1";
  }

  if (ratio >= 0.027) {
    return "H2";
  }

  if (ratio >= 0.021) {
    return "H3";
  }

  if (ratio >= 0.017) {
    return "H4";
  }

  if (ratio >= 0.013) {
    return "H5";
  }

  return "H6";
}


/* =========================================================
   STEP 8 — AREA HEADING DETECTION
========================================================= */

/**
 * Detect section headings.
 */
function looksLikeAreaHeading(
  group,
  imageHeight
) {
  const words =
    group.text
      .split(/\s+/)
      .filter(Boolean);

  /*
   * Long blocks are more likely paragraphs.
   */
  if (words.length > 12) {
    return false;
  }

  /*
   * Very small text is unlikely to be
   * a heading.
   */
  if (
    group.boundingBox.height <
    imageHeight * 0.01
  ) {
    return false;
  }

  return true;
}


/* =========================================================
   STEP 9 — COMPONENT TYPE DETECTION
========================================================= */

/**
 * Detect component type.
 */
function detectComponentType(
  group,
  index,
  imageHeight,
  totalGroups
) {
  const text =
    normalizeText(group.text);

  const isAtBottom =
    group.boundingBox.y >
    imageHeight * 0.85;


  /*
   * FOOTER
   */
  if (
    isAtBottom &&
    looksLikeFooter(text)
  ) {
    return COMPONENT_TYPES.FOOTER;
  }


  /*
   * HEADER / NAVIGATION
   */
  if (
    index < 10 &&
    looksLikeNavigation(text)
  ) {
    return COMPONENT_TYPES.HEADER;
  }


  /*
   * CTA
   */
  if (
    looksLikeCTA(text)
  ) {
    return COMPONENT_TYPES.CTA;
  }


  /*
   * HERO
   */
  if (
    looksLikeHero(
      group,
      index,
      imageHeight
    )
  ) {
    return COMPONENT_TYPES.HERO;
  }


  /*
   * FOOTER AREA
   */
  if (
    isAtBottom &&
    index >
      totalGroups * 0.75
  ) {
    return COMPONENT_TYPES.FOOTER;
  }


  /*
   * AREA HEADING
   */
  if (
    looksLikeAreaHeading(
      group,
      imageHeight
    )
  ) {
    return COMPONENT_TYPES.AREA_HEADING;
  }


  /*
   * DEFAULT
   */
  return COMPONENT_TYPES.RICH_TEXT;
}


/* =========================================================
   STEP 10 — BUILD COMPONENT CONTENT
========================================================= */

/**
 * Create content based on component type.
 */
function buildComponentContent(
  group,
  componentType,
  imageHeight
) {
  const text =
    group.text.trim();


  /* -----------------------------------------
     HERO
  ----------------------------------------- */

  if (
    componentType ===
    COMPONENT_TYPES.HERO
  ) {
    return {
      heading: {
        text,

        level:
          detectHeadingLevel(
            group,
            imageHeight
          ),

        source:
          SOURCE_TYPES.EXTRACTED,
      },

      description: {
        text:
          "Not available from image",

        source:
          SOURCE_TYPES.UNAVAILABLE,
      },

      image: {
        altText:
          "Not available from image",

        source:
          SOURCE_TYPES.UNAVAILABLE,
      },

      cta: {
        text:
          "Not available from image",

        url:
          "Not available from image",

        target:
          "Not available from image",

        ariaLabel:
          "Not available from image",

        suggestedAriaLabel:
          "Not available from image",

        source:
          SOURCE_TYPES.UNAVAILABLE,
      },
    };
  }


  /* -----------------------------------------
     AREA HEADING
  ----------------------------------------- */

  if (
    componentType ===
    COMPONENT_TYPES.AREA_HEADING
  ) {
    return {
      heading: {
        text,

        level:
          detectHeadingLevel(
            group,
            imageHeight
          ),

        source:
          SOURCE_TYPES.EXTRACTED,
      },
    };
  }


  /* -----------------------------------------
     CTA
  ----------------------------------------- */

  if (
    componentType ===
    COMPONENT_TYPES.CTA
  ) {
    return {
      cta: {
        text,

        url:
          "Not available from image",

        target:
          "Not available from image",

        ariaLabel:
          "Not available from image",

        suggestedAriaLabel:
          `Activate ${text}`,

        source:
          SOURCE_TYPES.EXTRACTED,
      },
    };
  }


  /* -----------------------------------------
     RICH TEXT
  ----------------------------------------- */

  if (
    componentType ===
    COMPONENT_TYPES.RICH_TEXT
  ) {
    return {
      text: {
        value: text,

        source:
          SOURCE_TYPES.EXTRACTED,
      },
    };
  }


  /* -----------------------------------------
     HEADER
  ----------------------------------------- */

  if (
    componentType ===
    COMPONENT_TYPES.HEADER
  ) {
    return {
      navigationText: {
        value: text,

        source:
          SOURCE_TYPES.EXTRACTED,
      },
    };
  }


  /* -----------------------------------------
     FOOTER
  ----------------------------------------- */

  if (
    componentType ===
    COMPONENT_TYPES.FOOTER
  ) {
    return {
      text: {
        value: text,

        source:
          SOURCE_TYPES.EXTRACTED,
      },
    };
  }


  /* -----------------------------------------
     DEFAULT
  ----------------------------------------- */

  return {
    text: {
      value: text,

      source:
        SOURCE_TYPES.EXTRACTED,
    },
  };
}


/* =========================================================
   STEP 11 — CREATE COMPONENTS
========================================================= */

/**
 * Convert OCR analysis into normalized components.
 */
function createComponents(analysis) {
  if (!analysis) {
    return [];
  }

  const textElements =
    Array.isArray(
      analysis.textElements
    )
      ? analysis.textElements
      : [];

  const imageInfo =
    analysis.image || {};

  const imageWidth =
    imageInfo.width || 1;

  const imageHeight =
    imageInfo.height || 1;


  /*
   * No OCR result
   */
  if (
    textElements.length === 0
  ) {
    return [];
  }


  /*
   * Group OCR words
   */
  const groups =
    groupTextElements(
      textElements
    );


  /*
   * Create components
   */
  const components =
    groups.map(
      (group, index) => {
        const type =
          detectComponentType(
            group,
            index,
            imageHeight,
            groups.length
          );


        const content =
          buildComponentContent(
            group,
            type,
            imageHeight
          );


        return {
          id:
            `component-${index + 1}`,

          order:
            index + 1,

          type,

          source:
            SOURCE_TYPES.INFERRED,

          confidence:
            group.confidence,

          boundingBox: {
            x:
              group.boundingBox.x,

            y:
              group.boundingBox.y,

            width:
              group.boundingBox.width,

            height:
              group.boundingBox.height,
          },

          content,

          metadata: {
            imageWidth,

            imageHeight,

            centerX:
              getCenterX(
                group.boundingBox
              ),

            centerY:
              getCenterY(
                group.boundingBox
              ),

            area:
              getBoundingArea(
                group.boundingBox
              ),
          },
        };
      }
    );


  return components;
}


/* =========================================================
   STEP 12 — NORMALIZED CONTENT DOCUMENT
========================================================= */

/**
 * Create the complete normalized document.
 *
 * This object becomes the single source of truth
 * for:
 *
 * - Document Preview
 * - Editing
 * - JSON export
 * - DOCX export
 */
function createNormalizedDocument(
  analysis
) {
  const components =
    createComponents(
      analysis
    );


  return {
    documentVersion:
      "1.0",


    source: {
      type:
        "IMAGE",

      fileName:
        analysis?.fileName ||
        "uploaded-image",

      image: {
        width:
          analysis?.image?.width ||
          null,

        height:
          analysis?.image?.height ||
          null,

        format:
          analysis?.image?.format ||
          null,
      },
    },


    components,


    seo: {
      title:
        "Not available from image",

      description:
        "Not available from image",

      keywords:
        "Not available from image",

      canonicalUrl:
        "Not available from image",

      source:
        SOURCE_TYPES.UNAVAILABLE,
    },


    generatedAt:
      new Date().toISOString(),
  };
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  COMPONENT_TYPES,

  SOURCE_TYPES,

  groupTextElements,

  detectHeadingLevel,

  detectComponentType,

  createComponents,

  createNormalizedDocument,
};