import SkeletonBlock from "../Skeleton/SkeletonBlock";
import "./ProductDetailPage.css";

function ProductDetailSkeleton() {
  return (
    <main className="product-detail product-detail--skeleton" aria-hidden="true">
      <div className="product-detail__breadcrumb product-detail__breadcrumb--skeleton">
        <SkeletonBlock className="product-detail__skeleton-line product-detail__skeleton-line--crumb" />
        <SkeletonBlock className="product-detail__skeleton-line product-detail__skeleton-line--crumb-small" />
      </div>

      <section className="product-detail__hero">
        <div className="product-detail__gallery">
          <SkeletonBlock className="product-detail__main-image product-detail__main-image--skeleton" />
          <div className="product-detail__thumbs product-detail__thumbs--skeleton">
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonBlock key={index} className="product-detail__thumb product-detail__thumb--skeleton" />
            ))}
          </div>
        </div>

        <aside className="product-detail__info product-detail__info--skeleton">
          <SkeletonBlock className="product-detail__skeleton-line product-detail__skeleton-line--eyebrow" />
          <SkeletonBlock className="product-detail__skeleton-line product-detail__skeleton-line--title" />
          <SkeletonBlock className="product-detail__skeleton-line product-detail__skeleton-line--price" />
          <div className="product-detail__skeleton-stock">
            <SkeletonBlock className="product-detail__skeleton-line product-detail__skeleton-line--stock-title" />
            <SkeletonBlock className="product-detail__skeleton-line product-detail__skeleton-line--stock-copy" />
          </div>
          <div className="product-detail__skeleton-description">
            <SkeletonBlock className="product-detail__skeleton-line product-detail__skeleton-line--section" />
            <SkeletonBlock className="product-detail__skeleton-line product-detail__skeleton-line--copy" />
            <SkeletonBlock className="product-detail__skeleton-line product-detail__skeleton-line--copy-short" />
          </div>
          <SkeletonBlock className="product-detail__cta product-detail__cta--skeleton" />
        </aside>
      </section>
    </main>
  );
}

export default ProductDetailSkeleton;
