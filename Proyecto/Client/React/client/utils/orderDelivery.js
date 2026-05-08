export const PICKUP_LOCATION_LABEL = "#HARTA — Armstrong, Santa Fe";

const cleanText = (value) => String(value || "").trim();

const getRawAddress = (order) => {
  const shippingAddress = order?.shippingAddress || order?.shipping_address || null;

  if (!shippingAddress || typeof shippingAddress !== "object") {
    return {};
  }

  return shippingAddress.raw && typeof shippingAddress.raw === "object"
    ? shippingAddress.raw
    : shippingAddress;
};

const getMappedAddress = (order) => {
  const shippingAddress = order?.shippingAddress || order?.shipping_address || null;
  return shippingAddress && typeof shippingAddress === "object" ? shippingAddress : {};
};

export const getOrderContactName = (order) => {
  const mappedAddress = getMappedAddress(order);
  const rawAddress = getRawAddress(order);

  return cleanText(
    order?.contactName ||
      order?.contact_name ||
      mappedAddress.contactName ||
      mappedAddress.contact_name ||
      rawAddress.contactName ||
      rawAddress.contact_name,
  );
};

export const getOrderContactPhone = (order) => {
  const mappedAddress = getMappedAddress(order);
  const rawAddress = getRawAddress(order);

  return cleanText(
    order?.contactPhone ||
      order?.contact_phone ||
      mappedAddress.contactPhone ||
      mappedAddress.contact_phone ||
      rawAddress.contactPhone ||
      rawAddress.contact_phone,
  );
};

export const getOrderShippingReference = (order) => {
  const mappedAddress = getMappedAddress(order);
  const rawAddress = getRawAddress(order);
  const reference = cleanText(
    order?.shippingReference ||
      order?.shipping_reference ||
      mappedAddress.shippingReference ||
      mappedAddress.shipping_reference ||
      mappedAddress.reference ||
      rawAddress.shippingReference ||
      rawAddress.shipping_reference ||
      rawAddress.reference ||
      rawAddress.note,
  );

  return reference.startsWith("checkout:") ? "" : reference;
};

export const getDeliveryAddressRows = (order) => {
  const mappedAddress = getMappedAddress(order);
  const rawAddress = getRawAddress(order);
  const street = cleanText(
    rawAddress.street ||
      rawAddress.address ||
      [mappedAddress.address, mappedAddress.addressNumber].filter(Boolean).join(" "),
  );
  const city = cleanText(rawAddress.city || mappedAddress.city);
  const province = cleanText(
    rawAddress.province || rawAddress.state || mappedAddress.province || mappedAddress.state,
  );
  const postalCode = cleanText(
    rawAddress.postalCode || rawAddress.postal_code || rawAddress.zipCode || mappedAddress.postalCode,
  );
  const reference = getOrderShippingReference(order);

  return [
    { label: "Dirección", value: street },
    { label: "Ciudad", value: city },
    { label: "Provincia", value: province },
    { label: "Código postal", value: postalCode },
    { label: "Referencia", value: reference },
  ].filter((row) => row.value);
};

export const getPickupRows = (order) => [
  { label: "Nombre", value: getOrderContactName(order) },
  { label: "Teléfono", value: getOrderContactPhone(order) },
  { label: "Nota", value: getOrderShippingReference(order) },
].filter((row) => row.value);

export const isPickupOrder = (order) => order?.shippingMethod === "pickup" || order?.shipping_method === "pickup";
