const createAuthRepository = (pool) => ({
  findByGoogleId: async (googleId) => {
    const result = await pool.query(
      "SELECT * FROM users WHERE google_id = $1 LIMIT 1",
      [googleId],
    );

    return result.rows[0] || null;
  },

  findByEmail: async (email) => {
    const result = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [
      email,
    ]);

    return result.rows[0] || null;
  },

  createUser: async ({ googleId, name, email, picture, role }) => {
    const result = await pool.query(
      `INSERT INTO users (google_id, name, email, picture, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [googleId, name, email, picture, role],
    );

    return result.rows[0];
  },

  updateGoogleData: async (userId, { googleId, name, picture }) => {
    const result = await pool.query(
      `UPDATE users
       SET google_id = $1,
           name = COALESCE($2, name),
           picture = COALESCE($3, picture)
       WHERE id = $4
       RETURNING *`,
      [googleId, name, picture, userId],
    );

    return result.rows[0] || null;
  },
});

module.exports = createAuthRepository;
