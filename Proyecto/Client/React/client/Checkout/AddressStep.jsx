function AddressStep({ address, onChange }) {
  return (
    <section className="checkout-step">
      <h3>2. Dirección de envío</h3>
      <p className="checkout-step-hint">
        El envío a domicilio está sujeto a disponibilidad y coordinación con la tienda.
      </p>
      <div className="checkout-grid">
        <input
          placeholder="Calle y número"
          value={address.street}
          onChange={(e) => onChange("street", e.target.value)}
        />
        <input
          placeholder="Ciudad"
          value={address.city}
          onChange={(e) => onChange("city", e.target.value)}
        />
        <input
          placeholder="Provincia"
          value={address.state}
          onChange={(e) => onChange("state", e.target.value)}
        />
        <input
          placeholder="Código postal"
          value={address.zipCode}
          onChange={(e) => onChange("zipCode", e.target.value)}
        />
      </div>
      <input
        placeholder="Referencia opcional"
        value={address.reference}
        onChange={(e) => onChange("reference", e.target.value)}
      />
    </section>
  );
}

export default AddressStep;
