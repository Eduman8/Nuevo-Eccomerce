const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const createAuthService = ({ authRepository, isAdminEmail }) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  const mapUserResponse = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    picture: user.picture,
  });

  return {
    loginWithGoogle: async (credential) => {
      if (!process.env.GOOGLE_CLIENT_ID) {
        throw new Error("GOOGLE_CLIENT_ID no configurado");
      }

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET no configurado");
      }

      let payload;

      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        payload = ticket.getPayload();
      } catch (error) {
        const authError = new Error("Token de Google inválido");
        authError.code = "INVALID_GOOGLE_TOKEN";
        throw authError;
      }

      if (!payload?.sub || !payload?.email) {
        const authError = new Error("Token de Google inválido");
        authError.code = "INVALID_GOOGLE_TOKEN";
        throw authError;
      }

      if (!payload.email_verified) {
        const authError = new Error("Email de Google no verificado");
        authError.code = "INVALID_GOOGLE_TOKEN";
        throw authError;
      }

      const computedRole =
        typeof isAdminEmail === "function" && isAdminEmail(payload.email)
          ? "admin"
          : "user";

      const googleData = {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        picture: payload.picture || null,
        role: computedRole,
      };

      let user = await authRepository.findByGoogleId(googleData.googleId);

      if (!user) {
        user = await authRepository.findByEmail(googleData.email);

        if (!user) {
          user = await authRepository.createUser(googleData);
        } else {
          user = await authRepository.updateGoogleData(user.id, googleData);
        }
      } else {
        user = await authRepository.updateGoogleData(user.id, googleData);
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
        user: mapUserResponse(user),
      };
    },
  };
};

module.exports = createAuthService;
