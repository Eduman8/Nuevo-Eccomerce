import { useMemo } from "react";
import { useParams } from "react-router-dom";
import ProductCatalog from "../Products/ProductCatalog";

function CategoryPage() {
  const { category } = useParams();
  const selectedCategory = useMemo(() => {
    try {
      return decodeURIComponent(category || "");
    } catch {
      return category || "";
    }
  }, [category]);

  return (
    <ProductCatalog
      initialCategory={selectedCategory}
      title={selectedCategory || "Categoría"}
      subtitle="Encontrá piezas seleccionadas para sumar a tu carrito."
    />
  );
}

export default CategoryPage;
