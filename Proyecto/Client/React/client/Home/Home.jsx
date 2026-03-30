import CategoryCard from "../CategoryCard/CategoryCard";
import "./Home.css";

function Home() {
  return (
    <div className="container">
      <h1>Nuestros Productos</h1>

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
