import { useEffect, useMemo, useState } from "react";

export function useLazyList(items, initialCount = 8, increment = initialCount) {
  const safeItems = Array.isArray(items) ? items : [];
  const [visibleCount, setVisibleCount] = useState(initialCount);

  useEffect(() => {
    setVisibleCount(initialCount);
  }, [safeItems, initialCount]);

  const visibleItems = useMemo(
    () => safeItems.slice(0, visibleCount),
    [safeItems, visibleCount]
  );

  const hasMore = visibleCount < safeItems.length;

  const loadMore = () => {
    setVisibleCount((current) => Math.min(current + increment, safeItems.length));
  };

  return {
    visibleItems,
    hasMore,
    visibleCount,
    totalCount: safeItems.length,
    loadMore,
  };
}
