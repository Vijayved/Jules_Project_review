require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('view engine', 'ejs');

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

const SCOPES = ['https://www.googleapis.com/auth/business.manage'];

// ================= HOME =================
app.get('/', (req, res) => {
  if (req.session.tokens) {
    return res.render('index', { auth: true });
  }

  const client = createOAuthClient();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  res.render('index', { auth: false, url });
});

// ================= CALLBACK =================
app.get('/oauth2callback', async (req, res) => {
  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(req.query.code);
    req.session.tokens = tokens;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.send('Auth Error');
  }
});

// ================= ACCOUNTS =================
app.get('/accounts', async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.redirect('/');
    }

    const client = createOAuthClient();
    client.setCredentials(req.session.tokens);

    const api = google.mybusinessaccountmanagement('v1');

    const response = await api.accounts.list({ auth: client });

    res.render('accounts', {
      accounts: response.data.accounts || []
    });

  } catch (err) {
    if (err.code === 429) {
      return res.send("⚠️ Too many requests. Wait 5 minutes.");
    }

    console.error("Accounts error:", err.message);
    res.send("Error: " + err.message);
  }
});

// ================= LOCATIONS =================
app.get('/locations', async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.redirect('/');
    }

    const client = createOAuthClient();
    client.setCredentials(req.session.tokens);

    const api = google.mybusinessbusinessinformation('v1');

    const response = await api.accounts.locations.list({
      parent: req.query.account,
      readMask: 'name,title',
      auth: client
    });

    res.render('locations', {
      locations: response.data.locations || [],
      account: req.query.account
    });

  } catch (err) {
    console.error("Locations error:", err.message);
    res.send("Error: " + err.message);
  }
});

// ================= REVIEWS =================
app.get('/reviews', async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.redirect('/');
    }

    const client = createOAuthClient();
    client.setCredentials(req.session.tokens);

    const url = `https://mybusiness.googleapis.com/v4/${req.query.location}/reviews`;

    const response = await client.request({ url });

    res.render('reviews', {
      reviews: response.data.reviews || [],
      location: req.query.location
    });

  } catch (err) {
    console.error("Reviews error:", err.message);
    res.send("Error: " + err.message);
  }
});

// ================= REPLY =================
app.post('/reply', async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.redirect('/');
    }

    const client = createOAuthClient();
    client.setCredentials(req.session.tokens);

    await client.request({
      url: `https://mybusiness.googleapis.com/v4/${req.body.review}/reply`,
      method: 'PUT',
      data: { comment: req.body.comment }
    });

    res.redirect(`/reviews?location=${req.body.location}`);

  } catch (err) {
    console.error("Reply error:", err.message);
    res.send("Error replying: " + err.message);
  }
});

// ================= START SERVER =================
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
