const createAuthService = ({ authRepository, isAdminEmail }) => ({
  authWithGoogle: async ({ name, email }) => {
    let dbUser = await authRepository.findUserByEmail(email);

    if (!dbUser) {
      dbUser = await authRepository.createUser({ name, email });
    }

    return {
      ...dbUser,
      isAdmin: isAdminEmail(dbUser.email),
    };
  },
});

module.exports = createAuthService;
