import "./SkeletonBlock.css";

function SkeletonBlock({ className = "", as: Component = "div" }) {
  return <Component className={`skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

export default SkeletonBlock;
