const createAuthRepository = (pool) => ({
  findUserByEmail: async (email) => {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    return result.rows[0] || null;
  },

  createUser: async ({ name, email }) => {
    const result = await pool.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email],
    );

    return result.rows[0];
  },
});

module.exports = createAuthRepository;
