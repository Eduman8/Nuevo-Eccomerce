import SkeletonBlock from "../Skeleton/SkeletonBlock";
import "./CategoryCard.css";

function CategoryCardSkeleton() {
  return (
    <article className="category-card category-card--skeleton" aria-hidden="true">
      <SkeletonBlock className="category-card__image-skeleton" />
      <div className="category-card__body category-card__body--skeleton">
        <SkeletonBlock className="category-card__skeleton-line category-card__skeleton-line--title" />
        <SkeletonBlock className="category-card__skeleton-line category-card__skeleton-line--copy" />
      </div>
    </article>
  );
}

export default CategoryCardSkeleton;
