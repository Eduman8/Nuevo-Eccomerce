import SkeletonBlock from "../Skeleton/SkeletonBlock";
import "./productCard.css";

function ProductCardSkeleton() {
  return (
    <article className="card card--skeleton" aria-hidden="true">
      <SkeletonBlock className="card__image-wrapper card__image-wrapper--skeleton" />
      <div className="card__body card__body--skeleton">
        <SkeletonBlock className="card__skeleton-line card__skeleton-line--title" />
        <SkeletonBlock className="card__skeleton-line card__skeleton-line--description" />
        <SkeletonBlock className="card__skeleton-line card__skeleton-line--price" />
        <SkeletonBlock className="card__skeleton-line card__skeleton-line--stock" />
      </div>
      <SkeletonBlock className="card__buy-btn card__buy-btn--skeleton" />
    </article>
  );
}

export default ProductCardSkeleton;
