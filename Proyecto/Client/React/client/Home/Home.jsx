import CategoryCard from "../CategoryCard/CategoryCard";
import "./Home.css";

function Home() {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero__content">
          <p className="hero__kicker">Ecommerce oficial HARTA</p>
          <h1>Diseños premium para tu mesa diaria</h1>
          <p className="hero__subtitle">
            Descubrí tazas, tazones y mates con estética moderna, calidad real y
            compra simple en minutos.
          </p>
          <a className="hero__cta" href="#categorias">
            Comprar ahora
          </a>
        </div>

        <div className="hero__panel">
          <p>Envíos a todo el país</p>
          <p>Pagá seguro con Mercado Pago</p>
          <p>Stock actualizado en tiempo real</p>
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
