import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../ProductCard/productCard";

function CategoryPage({ addToCart }) {
  const { category } = useParams();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:3000/products`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase(),
        );
        setProducts(filtered);
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
