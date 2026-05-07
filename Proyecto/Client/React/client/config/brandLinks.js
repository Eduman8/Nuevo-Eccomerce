const WHATSAPP_MESSAGE = "Hola, quiero hacer una consulta sobre un producto de #HARTA.";

export const BRAND_LINKS = {
  // TODO: reemplazar por el Instagram real de la marca.
  instagramBrand: "https://instagram.com/harta.marca",
  // TODO: reemplazar por el Instagram real de la dueña.
  instagramOwner: "https://instagram.com/duenia.harta",
  // TODO: reemplazar 549XXXXXXXXXX por el número real con código de país, sin + ni espacios.
  whatsappPhone: "549XXXXXXXXXX",
  // TODO: reemplazar por el email real cuando se defina el canal de contacto.
  email: "mailto:contacto@harta.com",
};

export const BRAND_WHATSAPP_URL = `https://wa.me/${BRAND_LINKS.whatsappPhone}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE,
)}`;
