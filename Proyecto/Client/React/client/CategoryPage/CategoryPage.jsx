import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../ProductCard/productCard";

const API_BASE_URL = "http://localhost:3000/api";

function CategoryPage({ addToCart }) {
  const { category } = useParams();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/products`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase(),
        );
        setProducts(filtered);
      })
      .catch((err) => {
        console.error("Error cargando productos:", err);
      });
  }, [category]);

  return (
    <div className="container">
      <h2>{category}</h2>

      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

export default CategoryPage;