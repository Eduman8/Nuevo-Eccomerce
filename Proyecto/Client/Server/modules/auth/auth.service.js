const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const repo = require("./auth.repository");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function loginWithGoogle(credential) {
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) throw new Error("Token inválido");

  const { sub, email, name, picture, email_verified } = payload;

  if (!email_verified) {
    throw new Error("Email no verificado");
  }

  let user = await repo.findByGoogleId(sub);

  if (!user) {
    user = await repo.findByEmail(email);
  }

  if (!user) {
    user = await repo.createUser({
      googleId: sub,
      email,
      name,
      picture,
      role: "user",
    });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  );

  return {
    token,
    user,
  };
}

module.exports = { loginWithGoogle };
