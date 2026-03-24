require('dotenv').config();
const express = require('express');
const cors = require('cors');

const reviewRoutes = require('./routes/reviews');
const logger = require('./utils/logger');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/reviews', reviewRoutes);

app.get('/', (req, res) => {
  res.send('🚀 Review Auto Reply Server Running');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
