const { MongoClient } = require('mongodb');

const MONGO_URI = "mongodb+srv://AeroX:AeroX@aerox.rv3nxmb.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
const CLIENT_ID = "1514594857824420013";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "ZcEwa62tEEWut3pBZBwTijysmCzRoSHK";
const REDIRECT_URI = "https://project-4zwum.vercel.app/api/callback";

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.redirect("/?error=no_code");
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return res.redirect("/?error=token_failed");
    }

    // Get user info
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const user = await userRes.json();

    // Save to MongoDB
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db("vexon");
    const col = db.collection("verified_users");

    await col.updateOne(
      { userId: user.id },
      {
        $set: {
          userId: user.id,
          username: user.username,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpires: Date.now() + tokenData.expires_in * 1000,
          verifiedAt: new Date(),
        },
      },
      { upsert: true }
    );

    await client.close();

    return res.redirect("/?verified=true");
  } catch (err) {
    console.error("Callback error:", err);
    return res.redirect("/?error=server_error");
  }
}
