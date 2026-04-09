# Inventario real de endpoints (Fase 0)

Base local observada en código: `http://localhost:3000`.

## Users

### GET `/users`
- Body: none
- Success `200`: array de usuarios (`SELECT * FROM users`).

### POST `/users`
- Body:
  - `name` (string)
  - `email` (string)
- Success `200`: usuario creado.

### PUT `/users/:id`
- Params:
  - `id`
- Body:
  - `name` (string)
  - `email` (string)
- Success `200`: usuario actualizado.

### DELETE `/users/:id`
- Params:
  - `id`
- Success `200`: texto `"Usuario eliminado"`.

## Products

### GET `/products`
- Body: none
- Success `200`: array de productos (`SELECT * FROM products`).

### POST `/products`
- Body:
  - `name` (required)
  - `description` (optional)
  - `price` (required)
  - `category` (required)
  - `image` (required)
  - `stock` (optional, default 0)
- Error `400`: `name, price, category e image son obligatorios`
- Success `201`: producto creado.
- Error `500`: `Error al crear producto`.

### PATCH `/products/:id`
- Params:
  - `id`
- Body:
  - `category`
- Success `200`: producto actualizado.
- Error `404`: `Producto no encontrado`
- Error `500`: `Error al actualizar producto`

### DELETE `/products/:id`
- Params:
  - `id`
- Success `200`: `{ message: "Producto eliminado", product }`
- Error `404`: `Producto no encontrado`
- Error `500`: `Error al eliminar producto`

## Auth

### POST `/auth/google`
- Body:
  - `name`
  - `email`
- Success `200`: usuario existente o creado + `isAdmin`.
- Error `500`: `Error al autenticar con Google`.

## Cart

### POST `/cart`
- Body:
  - `userId`
  - `productId`
  - `quantity`
- Success `200`: item insertado o actualizado.
- Error `500`: `Error en carrito`

### GET `/cart/:userId`
- Params:
  - `userId`
- Success `200`: items de carrito con `name` y `price` de producto.
- Error `500`: `Error al obtener carrito`

### DELETE `/cart/:id`
- Params:
  - `id`
- Success `200`: texto `"Item eliminado del carrito"`.

### PATCH `/cart/:id/decrease`
- Params:
  - `id`
- Success `200`: item actualizado o `{ message: "Item eliminado del carrito" }`
- Error `404`: `Item no encontrado`
- Error `500`: `Error al actualizar carrito`

### DELETE `/cart/user/:userId`
- Params:
  - `userId`
- Success `200`: texto `"Carrito vaciado"`.

## Orders & Payments

### POST `/orders`
- Body:
  - `userId` (required)
  - `shippingAddress` (required; requiere `street`, `city`, `zipCode`)
  - `shippingMethod` (`home_delivery` o `pickup`)
  - `paymentMethod` (`mercadopago` o `cash`)
- Success `201`: `{ message, order, breakdown: { subtotal, shippingCost, total } }`
- Error `400`: validaciones varias (`userId`, dirección, método envío, método pago, carrito vacío)
- Error `500`: `Error al crear orden`

### POST `/orders/:orderId/checkout-pro-preference`
- Params:
  - `orderId`
- Body:
  - `userId`
- Success `200`: `{ init_point, sandbox_init_point, preference_id }`
- Error `400`: orden no mercadopago / carrito vacío
- Error `404`: `Orden no encontrada`
- Error `409`: orden no pending
- Error `500`: configuración/token MP inválido o `Error al crear preferencia de pago`

### POST `/orders/:orderId/confirm-cash`
- Params:
  - `orderId`
- Body:
  - `userId` (required)
  - `shippingReference` (required, min 3 chars)
- Success `200`: `{ message, orderId, status }`
- Error `400/404/409/500`: según validaciones/estado/transacción.

### POST `/orders/:orderId/confirm-mercadopago`
- Params:
  - `orderId`
- Body:
  - `userId` (required)
  - `paymentId`
- Success `200`: `{ message, orderId, status, paymentId }`
- Error `400/404/409/500`: según validaciones y estado del pago.

### PATCH `/orders/:orderId/status`
- Params:
  - `orderId`
- Body:
  - `status` in [`pending`, `paid`, `shipped`, `delivered`, `cancelled`]
- Success `200`: orden actualizada.
- Error `400`: estado inválido
- Error `404`: orden no encontrada
- Error `500`: `Error al actualizar estado`

### GET `/orders/:userId`
- Params:
  - `userId`
- Success `200`: listado de órdenes con join a items/productos.
- Error `500`: `Error al obtener órdenes`

### ALL `/payments/mercadopago/webhook`
- Body/Query: payload de MP
- Success `200` siempre (incluso si no procesa por token/topic/id).

### GET `/payments/mercadopago/status`
- Body: none
- Success `200`: `{ configured, tokenSource, tokenFormatValid, backendBaseUrl, frontendBaseUrl }`
