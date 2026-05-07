const PRODUCT_SELECT_FIELDS = `
  p.id,
  p.name,
  p.description,
  p.price,
  COALESCE(c.name, p.category) AS category,
  p.category_id,
  c.name AS category_name,
  c.image_url AS category_image_url,
  p.image,
  p.image AS image_url,
  COALESCE(
    product_images.images,
    CASE
      WHEN NULLIF(BTRIM(p.image), '') IS NOT NULL THEN json_build_array(BTRIM(p.image))
      ELSE '[]'::json
    END
  ) AS images,
  p.stock,
  p.active,
  p.created_at,
  p.updated_at
`;

const PRODUCT_IMAGES_JOIN = `
  LEFT JOIN LATERAL (
    SELECT json_agg(BTRIM(pi.image_url) ORDER BY pi.position ASC, pi.id ASC) AS images
    FROM product_images pi
    WHERE pi.product_id = p.id
      AND NULLIF(BTRIM(pi.image_url), '') IS NOT NULL
  ) product_images ON TRUE
`;

const getDbClient = async (pool) => pool.connect();

const insertProductImages = async (productId, images, client) => {
  if (!images.length) return;

  const values = [];
  const placeholders = images.map((imageUrl, index) => {
    values.push(productId, imageUrl, index + 1);
    const offset = index * 3;
    return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
  });

  await client.query(
    `INSERT INTO product_images (product_id, image_url, position)
     VALUES ${placeholders.join(", ")}`,
    values,
  );
};

const deleteProductImages = async (productId, client) => {
  await client.query(
    `DELETE FROM product_images
     WHERE product_id = $1`,
    [productId],
  );
};

const replaceProductImages = async (productId, images, client) => {
  await deleteProductImages(productId, client);
  await insertProductImages(productId, images, client);
};

const PRODUCT_RETURN_FIELDS = `
  id,
  name,
  description,
  price,
  category,
  category_id,
  image,
  image AS image_url,
  CASE
    WHEN NULLIF(BTRIM(image), '') IS NOT NULL THEN json_build_array(BTRIM(image))
    ELSE '[]'::json
  END AS images,
  stock,
  active,
  created_at,
  updated_at
`;

const selectProductById = async (pool, id) => {
  const result = await pool.query(
    `SELECT ${PRODUCT_SELECT_FIELDS}
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
${PRODUCT_IMAGES_JOIN}     WHERE p.id = $1`,
    [id],
  );

  return result.rows[0] || null;
};

const createProductsRepository = (pool) => ({
  getPublic: async () => {
    const result = await pool.query(
      `SELECT ${PRODUCT_SELECT_FIELDS}
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
${PRODUCT_IMAGES_JOIN}       WHERE p.active = TRUE
       ORDER BY p.id DESC`,
    );

    return result.rows;
  },

  getAllForAdmin: async () => {
    const result = await pool.query(
      `SELECT ${PRODUCT_SELECT_FIELDS}
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
${PRODUCT_IMAGES_JOIN}       ORDER BY p.id DESC`,
    );

    return result.rows;
  },

  getById: async (id) => selectProductById(pool, id),

  getCategoryById: async (categoryId) => {
    const result = await pool.query(
      `SELECT id, name, image_url, active
       FROM categories
       WHERE id = $1`,
      [categoryId],
    );

    return result.rows[0] || null;
  },

  insertProductImages: async (productId, images, client = pool) =>
    insertProductImages(productId, images, client),

  deleteProductImages: async (productId, client = pool) => deleteProductImages(productId, client),

  replaceProductImages: async (productId, images, client = pool) =>
    replaceProductImages(productId, images, client),

  create: async ({
    name,
    description,
    price,
    category,
    categoryId,
    image,
    images,
    stock,
    active,
  }) => {
    const client = await getDbClient(pool);

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO products (name, description, price, category, category_id, image, stock, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [name, description, price, category, categoryId, image, stock, active],
      );

      const productId = result.rows[0].id;
      if (images !== undefined) {
        await replaceProductImages(productId, images, client);
      }

      const product = await selectProductById(client, productId);
      await client.query("COMMIT");

      return product;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  updateById: async ({
    id,
    name,
    description,
    price,
    category,
    categoryId,
    image,
    images,
    stock,
    active,
  }) => {
    const client = await getDbClient(pool);

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE products
         SET
           name = $1,
           description = $2,
           price = $3,
           category = $4,
           category_id = $5,
           image = $6,
           stock = $7,
           active = $8,
           updated_at = NOW()
         WHERE id = $9
         RETURNING id`,
        [name, description, price, category, categoryId, image, stock, active, id],
      );

      if (!result.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }

      if (images !== undefined) {
        await replaceProductImages(result.rows[0].id, images, client);
      }

      const product = await selectProductById(client, result.rows[0].id);
      await client.query("COMMIT");

      return product;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  hasOrdersByProductId: async (productId) => {
    const result = await pool.query(
      "SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1",
      [productId],
    );

    return result.rowCount > 0;
  },

  deleteById: async (id) => {
    const result = await pool.query(
      `DELETE FROM products
       WHERE id = $1
       RETURNING ${PRODUCT_RETURN_FIELDS}`,
      [id],
    );

    return result.rows[0] || null;
  },
});

module.exports = createProductsRepository;
