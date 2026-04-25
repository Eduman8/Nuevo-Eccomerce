import CategoryCard from "../CategoryCard/CategoryCard";
import "./Home.css";

function Home() {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero__content">
          <p className="hero__kicker">HARTA · diseño artesanal premium</p>
          <h1>Diseño argentino para tu ritual diario</h1>
          <p className="hero__subtitle">
            Piezas con identidad, terminaciones cuidadas y stock real para que
            cada pausa se sienta especial.
          </p>
          <div className="hero__actions">
            <a className="hero__cta hero__cta-primary" href="#categorias">
              Comprar ahora
            </a>
            <a className="hero__cta hero__cta-secondary" href="#categorias">
              Ver colección
            </a>
          </div>

          <div className="hero__trust">
            <span>Envíos a todo el país</span>
            <span>Pago seguro</span>
            <span>Stock real</span>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__visual-glow" />
          <img
            src="https://res.cloudinary.com/dbkfkpjjl/image/upload/v1774051224/Captura_de_pantalla_2026-03-20_210005_wb3yvz.png"
            alt="Mate premium HARTA"
          />
          <span className="hero__floating-badge hero__floating-badge-top">+500 clientes</span>
          <span className="hero__floating-badge hero__floating-badge-bottom">Envíos 24hs</span>
        </div>
      </section>

      <header className="products-header" id="categorias">
        <div className="products-header__content">
          <h2>Comprá por categoría</h2>
          <p>Elegí tu estilo y encontrá productos listos para sumar al carrito.</p>
        </div>
      </header>

      <div className="grid">
        <CategoryCard
          title="Tazas"
          category="tazas"
          image="https://res.cloudinary.com/dbkfkpjjl/image/upload/v1774051006/Captura_de_pantalla_2026-03-20_205301_mirfrj.png"
        />

        <CategoryCard
          title="Tazones"
          category="tazones"
          image="https://res.cloudinary.com/dbkfkpjjl/image/upload/v1774051187/Captura_de_pantalla_2026-03-20_205936_jlbff0.png"
        />

        <CategoryCard
          title="Mates"
          category="mates"
          image="https://res.cloudinary.com/dbkfkpjjl/image/upload/v1774051224/Captura_de_pantalla_2026-03-20_210005_wb3yvz.png"
        />
      </div>
    </div>
  );
}

export default Home;
