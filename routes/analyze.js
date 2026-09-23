const express = require("express");
const multer = require("multer");

const {
  analyzeImage,
} = require("../services/imageAnalysisService");

const {
  createComponents,
} = require("../services/componentDetectionService");

const router =
  express.Router();

const upload =
  multer({
    dest: "uploads/",

    limits: {
      fileSize:
        15 * 1024 * 1024,
    },

    fileFilter:
      (
        req,
        file,
        cb
      ) => {
        const allowedTypes = [
          "image/png",
          "image/jpeg",
          "image/webp",
        ];

        if (
          !allowedTypes.includes(
            file.mimetype
          )
        ) {
          return cb(
            new Error(
              "Only PNG, JPG, JPEG and WEBP images are allowed."
            )
          );
        }

        cb(null, true);
      },
  });

router.post(
  "/",
  upload.single("image"),
  async (
    req,
    res
  ) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "No image uploaded",
          });
      }

      const analysis =
        await analyzeImage(
          req.file.path
        );

      /*
       * If the vision provider returned
       * structured components, use them.
       *
       * Otherwise fall back to the
       * existing OCR/component detector.
       */

      let components = [];

      if (
        analysis.vision?.components
          ?.length
      ) {
        components =
          analysis.vision.components.map(
            (
              component,
              index
            ) => ({
              id:
                `vision-${Date.now()}-${index}`,

              order:
                index + 1,

              type:
                component.type ||
                "Other",

              source:
                component.source ||
                "INFERRED",

              confidence:
                component.confidence ??
                0.5,

              boundingBox:
                component.boundingBox ||
                null,

              content:
                component.content ||
                {},

              metadata: {
                detectionMethod:
                  "VISION",
              },
            })
          );
      } else {
        components =
          createComponents(
            analysis
          );
      }

      res.json({
        success: true,

        file: {
          originalName:
            req.file.originalname,

          fileName:
            req.file.filename,

          mimeType:
            req.file.mimetype,

          size:
            req.file.size,
        },

        analysis: {
          ...analysis,

          components,
        },
      });
    } catch (error) {
      console.error(
        "Analysis error:",
        error
      );

      res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to analyze image",

          error:
            error.message,
        });
    }
  }
);

module.exports = router;