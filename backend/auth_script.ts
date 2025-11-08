import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";

// Load .env variables
dotenv.config();

async function main() {
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: process.env.GOOGLE_TEST_ID_TOKEN,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("✅ Token verified successfully!");
    console.log(payload);
  } catch (err) {
    console.error("❌ Verification failed:", err.message);
  }
}

main();
