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

// ================= REPLIES =================
const replies = {
  5: ["Thank you for your wonderful feedback!", "We truly appreciate your support!", "Glad you had a great experience!"],
  4: ["Thanks for your feedback!", "Happy you liked our service!", "We appreciate your review!"],
  3: ["Thanks for your feedback, we’ll improve!", "We value your input!", "We’ll work on doing better!"],
  2: ["We’re sorry for your experience.", "Apologies, we’ll improve.", "Thanks for letting us know."],
  1: ["We sincerely apologize.", "Sorry for your experience.", "We regret the issue."]
};

let counter = 0;
function getReply(star) {
  const arr = replies[star] || replies[5];
  const reply = arr[counter % arr.length];
  counter++;
  return reply;
}

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
    res.send('Auth Error');
  }
});

// ================= AUTO MULTI REPLY =================
app.get('/auto-reply-all', async (req, res) => {
  try {
    if (!req.session.tokens) return res.redirect('/');

    const client = createOAuthClient();
    client.setCredentials(req.session.tokens);

    const accountApi = google.mybusinessaccountmanagement('v1');
    const locationApi = google.mybusinessbusinessinformation('v1');

    const accountsRes = await accountApi.accounts.list({ auth: client });
    const accounts = accountsRes.data.accounts || [];

    let totalReplies = 0;
    const now = new Date();

    for (let acc of accounts) {

      const locRes = await locationApi.accounts.locations.list({
        parent: acc.name,
        readMask: 'name,title',
        auth: client
      });

      const locations = locRes.data.locations || [];

      for (let loc of locations) {

        const reviewsRes = await client.request({
          url: `https://mybusiness.googleapis.com/v4/${loc.name}/reviews`
        });

        const reviews = reviewsRes.data.reviews || [];

        for (let r of reviews) {

          const reviewDate = new Date(r.createTime);
          const diffDays = (now - reviewDate) / (1000 * 60 * 60 * 24);

          // ✅ last 5 days only
          if (diffDays > 5) continue;

          // ✅ skip already replied
          if (r.reviewReply) continue;

          const star = r.starRating || 5;
          const comment = getReply(star);

          await client.request({
            url: `https://mybusiness.googleapis.com/v4/${r.name}/reply`,
            method: 'PUT',
            data: { comment }
          });

          totalReplies++;
          console.log("Replied:", r.name);
        }
      }
    }

    res.send(`✅ Done! Total replies sent: ${totalReplies}`);

  } catch (err) {
    console.error(err);
    res.send("Error: " + err.message);
  }
});

// ================= START =================
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
