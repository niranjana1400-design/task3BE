const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun,
} = require("docx");

function getHeadingLevel(level) {
  const levels = {
    H1: HeadingLevel.HEADING_1,
    H2: HeadingLevel.HEADING_2,
    H3: HeadingLevel.HEADING_3,
    H4: HeadingLevel.HEADING_4,
    H5: HeadingLevel.HEADING_5,
    H6: HeadingLevel.HEADING_6,
  };

  return levels[level] || HeadingLevel.HEADING_2;
}

function getComponentTitle(component) {
  return component?.type || "Other";
}

function getTextValue(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value?.text) {
    return value.text;
  }

  if (value?.value) {
    return value.value;
  }

  return "";
}

function createSourceParagraph(source) {
  return new Paragraph({
    children: [
      new TextRun({
        text: `Source: ${source || "UNAVAILABLE"}`,
        italics: true,
        color: "64748B",
        size: 18,
      }),
    ],
    spacing: {
      after: 120,
    },
  });
}

function createComponentHeading(component) {
  return new Paragraph({
    children: [
      new TextRun({
        text: getComponentTitle(component),
        bold: true,
        size: 28,
      }),
    ],
    spacing: {
      before: 300,
      after: 160,
    },
  });
}

function createHeading(component) {
  const heading = component?.content?.heading;

  if (!heading?.text) {
    return null;
  }

  return new Paragraph({
    text: heading.text,
    heading: getHeadingLevel(heading.level),
    spacing: {
      before: 180,
      after: 120,
    },
  });
}

function createDescription(component) {
  const description = component?.content?.description;

  if (!description?.text) {
    return null;
  }

  return new Paragraph({
    children: [
      new TextRun({
        text: description.text,
        size: 22,
      }),
    ],
    spacing: {
      after: 150,
    },
  });
}

function createRichText(component) {
  const text = component?.content?.text;

  const value = getTextValue(text);

  if (!value) {
    return null;
  }

  return new Paragraph({
    children: [
      new TextRun({
        text: value,
        size: 22,
      }),
    ],
    spacing: {
      after: 150,
    },
  });
}

function createNavigation(component) {
  const navigation = component?.content?.navigationText;

  const value = getTextValue(navigation);

  if (!value) {
    return null;
  }

  return new Paragraph({
    children: [
      new TextRun({
        text: value,
        size: 22,
      }),
    ],
    spacing: {
      after: 150,
    },
  });
}

function createCTA(component) {
  const cta = component?.content?.cta;

  if (!cta) {
    return null;
  }

  const children = [];

  if (cta.text) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Button Text: ${cta.text}`,
            bold: true,
            size: 22,
          }),
        ],
      })
    );
  }

  if (cta.url) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `URL: ${cta.url}`,
            size: 20,
          }),
        ],
      })
    );
  }

  if (cta.target) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Target: ${cta.target}`,
            size: 20,
          }),
        ],
      })
    );
  }

  if (cta.ariaLabel) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Aria Label: ${cta.ariaLabel}`,
            size: 20,
          }),
        ],
      })
    );
  }

  if (cta.suggestedAriaLabel) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Suggested Aria Label: ${cta.suggestedAriaLabel}`,
            size: 20,
            italics: true,
          }),
        ],
      })
    );
  }

  return children;
}

function createImageInformation(component) {
  const image = component?.content?.image;

  if (!image) {
    return null;
  }

  return new Paragraph({
    children: [
      new TextRun({
        text: `Alt Text: ${image.altText || "Not available from image"}`,
        size: 20,
      }),
    ],
    spacing: {
      after: 150,
    },
  });
}

function createGenericContent(component) {
  const text = component?.content?.text;

  const value = getTextValue(text);

  if (!value) {
    return null;
  }

  return new Paragraph({
    children: [
      new TextRun({
        text: value,
        size: 22,
      }),
    ],
    spacing: {
      after: 150,
    },
  });
}

function createComponentContent(component) {
  const paragraphs = [];

  const heading = createHeading(component);

  if (heading) {
    paragraphs.push(heading);
  }

  const description = createDescription(component);

  if (description) {
    paragraphs.push(description);
  }

  if (component.type === "Rich Text") {
    const richText = createRichText(component);

    if (richText) {
      paragraphs.push(richText);
    }
  }

  if (component.type === "Header / Navigation") {
    const navigation = createNavigation(component);

    if (navigation) {
      paragraphs.push(navigation);
    }
  }

  if (
    component.type === "CTA" ||
    component.type === "Hero / Highlight"
  ) {
    const cta = createCTA(component);

    if (cta) {
      paragraphs.push(...cta);
    }
  }

  if (
    component.type === "Image Section" ||
    component.type === "Hero / Highlight"
  ) {
    const image = createImageInformation(component);

    if (image) {
      paragraphs.push(image);
    }
  }

  if (
    component.type === "Footer" ||
    component.type === "Other" ||
    component.type === "Content Card" ||
    component.type === "Card Grid" ||
    component.type === "Highlight Carousel"
  ) {
    const generic = createGenericContent(component);

    if (generic) {
      paragraphs.push(generic);
    }
  }

  if (paragraphs.length === 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Not available from image",
            color: "64748B",
            italics: true,
          }),
        ],
      })
    );
  }

  return paragraphs;
}

function createSeoTable(seo = {}) {
  const rows = [
    ["Title", seo.title || "Not available from image"],
    [
      "Description",
      seo.description || "Not available from image",
    ],
    ["Keywords", seo.keywords || "Not available from image"],
    [
      "Canonical URL",
      seo.canonicalUrl || "Not available from image",
    ],
    ["Source", seo.source || "UNAVAILABLE"],
  ];

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: rows.map(([label, value]) => {
      return new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: String(value),
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }),
  });
}

async function generateDocx(documentData) {
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Content Document",
          bold: true,
          size: 36,
        }),
      ],
      spacing: {
        after: 100,
      },
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Generated from Website Screenshot",
          color: "64748B",
          size: 20,
        }),
      ],
      spacing: {
        after: 400,
      },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Source Information",
          bold: true,
          size: 28,
        }),
      ],
      spacing: {
        after: 150,
      },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `File: ${
            documentData?.source?.fileName ||
            "uploaded-image"
          }`,
          size: 20,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Image Size: ${
            documentData?.source?.image?.width || "Unknown"
          } × ${
            documentData?.source?.image?.height || "Unknown"
          }`,
          size: 20,
        }),
      ],
      spacing: {
        after: 300,
      },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Components",
          bold: true,
          size: 30,
        }),
      ],
      spacing: {
        after: 200,
      },
    })
  );

  const components = documentData?.components || [];

  components.forEach((component) => {
    children.push(createComponentHeading(component));

    children.push(
      createSourceParagraph(component.source)
    );

    const content = createComponentContent(component);

    children.push(...content);
  });

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "SEO Metadata",
          bold: true,
          size: 30,
        }),
      ],
      spacing: {
        before: 400,
        after: 200,
      },
    })
  );

  children.push(createSeoTable(documentData?.seo));

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${
            documentData?.generatedAt ||
            new Date().toISOString()
          }`,
          size: 18,
          color: "64748B",
        }),
      ],
      spacing: {
        before: 300,
      },
    })
  );

  const doc = new Document({
    creator: "Image Content Document Generator",
    title: "Content Document",
    description:
      "Structured content document generated from a website screenshot",
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

module.exports = {
  generateDocx,
};