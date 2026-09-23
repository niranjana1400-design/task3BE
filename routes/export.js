const express = require("express");
const { generateDocx } = require("../services/documentGenerator");

const router = express.Router();

router.post("/docx", async (req, res) => {
  try {
    const documentData = req.body;

    if (!documentData) {
      return res.status(400).json({
        success: false,
        message: "Document data is required",
      });
    }

    const buffer = await generateDocx(documentData);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="content-document.docx"'
    );

    res.send(buffer);
  } catch (error) {
    console.error("DOCX export error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to generate DOCX",
      error: error.message,
    });
  }
});

module.exports = router;