const CATEGORY_SELECT_FIELDS = `
  id,
  name,
  image_url,
  active,
  created_at,
  updated_at
`;

const createCategoriesRepository = (pool) => ({
  getActive: async () => {
    const result = await pool.query(
      `SELECT id, name, image_url
       FROM categories
       WHERE active = TRUE
       ORDER BY id DESC`,
    );

    return result.rows;
  },

  getAllForAdmin: async () => {
    const result = await pool.query(
      `SELECT ${CATEGORY_SELECT_FIELDS}
       FROM categories
       ORDER BY id DESC`,
    );

    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query(
      `SELECT ${CATEGORY_SELECT_FIELDS}
       FROM categories
       WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  },

  create: async ({ name, imageUrl, active }) => {
    const result = await pool.query(
      `INSERT INTO categories (name, image_url, active)
       VALUES ($1, $2, $3)
       RETURNING ${CATEGORY_SELECT_FIELDS}`,
      [name, imageUrl, active],
    );

    return result.rows[0];
  },

  updateById: async ({ id, name, imageUrl, active }) => {
    const result = await pool.query(
      `UPDATE categories
       SET
         name = $1,
         image_url = $2,
         active = $3,
         updated_at = NOW()
       WHERE id = $4
       RETURNING ${CATEGORY_SELECT_FIELDS}`,
      [name, imageUrl, active, id],
    );

    return result.rows[0] || null;
  },

  deactivateById: async (id) => {
    const result = await pool.query(
      `UPDATE categories
       SET active = FALSE,
           updated_at = NOW()
       WHERE id = $1
       RETURNING ${CATEGORY_SELECT_FIELDS}`,
      [id],
    );

    return result.rows[0] || null;
  },
});

module.exports = createCategoriesRepository;
