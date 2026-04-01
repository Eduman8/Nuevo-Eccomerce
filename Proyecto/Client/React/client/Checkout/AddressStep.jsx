function AddressStep({ address, onChange }) {
  return (
    <section className="checkout-step">
      <h3>1. Dirección</h3>
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
          placeholder="Provincia/Estado"
          value={address.state}
          onChange={(e) => onChange("state", e.target.value)}
        />
        <input
          placeholder="Código postal"
          value={address.zipCode}
          onChange={(e) => onChange("zipCode", e.target.value)}
        />
        <input
          placeholder="País"
          value={address.country}
          onChange={(e) => onChange("country", e.target.value)}
        />
      </div>
    </section>
  );
}

export default AddressStep;
