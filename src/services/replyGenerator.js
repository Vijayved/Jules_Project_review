const axios = require('axios');

async function generateReply(reviewText, rating) {
  // Cheap mode (no cost)
  if (process.env.MODE === "cheap") {
    return basicReply(reviewText, rating);
  }

  // AI mode
  try {
    const prompt = `
Customer Review: "${reviewText}"
Rating: ${rating}

Generate a short, polite, professional reply.
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 80
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    return basicReply(reviewText, rating);
  }
}

// fallback cheap logic
function basicReply(reviewText, rating) {
  if (rating >= 5) {
    return "Thank you for your wonderful feedback! We look forward to serving you again.";
  }

  if (rating === 4) {
    return "Thank you for your feedback! We're glad you had a good experience.";
  }

  if (rating === 3) {
    return "Thank you for your feedback. We will work on improving your experience.";
  }

  return "We're really sorry for your experience. Please contact us so we can make things right.";
}

module.exports = { generateReply };
