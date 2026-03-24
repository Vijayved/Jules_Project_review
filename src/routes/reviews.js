const express = require('express');
const router = express.Router();

const { generateReply } = require('../services/replyGenerator');
const logger = require('../utils/logger');

// Manual reply generation
router.post('/reply', async (req, res) => {
  try {
    const { reviewText, rating } = req.body;

    if (!reviewText || !rating) {
      return res.status(400).json({
        error: "reviewText and rating are required"
      });
    }

    const reply = await generateReply(reviewText, rating);

    res.json({ success: true, reply });

  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
