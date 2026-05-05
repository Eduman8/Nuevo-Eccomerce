-- Inserta el producto "Dips para salsa" sin tocar lógica de backend.
WITH product_values AS (
  SELECT
    'Dips para salsa'::text AS name,
    'Tazas pequeñas ideales para acompañar con salsas'::text AS description,
    50::integer AS stock,
    COALESCE(
      (SELECT category FROM products WHERE category = 'Accesorios' LIMIT 1),
      'Cocina'
    )::text AS category,
    '/images/dips.jpg'::text AS image,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'products'
          AND column_name = 'price'
          AND data_type IN ('numeric', 'decimal', 'real', 'double precision')
      ) THEN 1500::numeric
      ELSE 1500::integer
    END AS price
)
INSERT INTO products (name, description, price, stock, category, image, active)
SELECT
  product_values.name,
  product_values.description,
  product_values.price,
  product_values.stock,
  product_values.category,
  product_values.image,
  TRUE
FROM product_values
WHERE NOT EXISTS (
  SELECT 1 FROM products WHERE LOWER(name) = LOWER('Dips para salsa')
);
