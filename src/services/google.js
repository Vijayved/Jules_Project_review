const axios = require('axios');

async function fetchReviews() {
  try {
    const response = await axios.get(
      'https://mybusiness.googleapis.com/v4/accounts/YOUR_ACCOUNT/locations/YOUR_LOCATION/reviews',
      {
        headers: {
          Authorization: `Bearer ${process.env.GOOGLE_ACCESS_TOKEN}`
        }
      }
    );

    return response.data.reviews;

  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    return [];
  }
}

module.exports = { fetchReviews };
