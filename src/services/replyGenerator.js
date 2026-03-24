// src/services/replyGenerator.js

// Reply pools by rating
const replies = {
  5: [
    "Thank you for your wonderful feedback! We’re glad you had a great experience.",
    "We truly appreciate your 5-star rating. Looking forward to serving you again!",
    "Thank you for your kind words! It means a lot to us."
  ],
  4: [
    "Thank you for your feedback! We're happy you had a good experience.",
    "We appreciate your support and look forward to improving even more.",
    "Thanks for sharing your experience! Hope to serve you again soon."
  ],
  3: [
    "Thank you for your feedback. We will work on improving your experience.",
    "We appreciate your input and will strive to do better.",
    "Thanks for your review. We’re continuously working to improve."
  ],
  2: [
    "We’re sorry your experience wasn’t great. We’ll work on improving.",
    "Thank you for your feedback. We regret the inconvenience caused.",
    "We appreciate your input and will try to improve our services."
  ],
  1: [
    "We sincerely apologize for your experience. Please contact us to resolve this.",
    "We're very sorry for the inconvenience caused. Kindly reach out to us.",
    "Your experience matters to us. Please allow us to make things right."
  ]
};

// Store last used index (in-memory round robin)
const counters = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0
};

function generateReply(reviewText, rating) {
  const safeRating = Math.max(1, Math.min(5, rating));

  const pool = replies[safeRating];

  const index = counters[safeRating] % pool.length;

  const reply = pool[index];

  counters[safeRating]++;

  return reply;
}

module.exports = { generateReply };
