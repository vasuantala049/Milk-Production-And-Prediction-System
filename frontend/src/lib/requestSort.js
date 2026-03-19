const toTimestamp = (value) => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

const isPending = (status) => String(status || "").toUpperCase() === "PENDING";

const buildComparator = (dateKey) => (left, right) => {
  const dateCompare = toTimestamp(right?.[dateKey]) - toTimestamp(left?.[dateKey]);
  if (dateCompare !== 0) {
    return dateCompare;
  }

  const pendingCompare = Number(isPending(left?.status)) - Number(isPending(right?.status));
  if (pendingCompare !== 0) {
    return pendingCompare;
  }

  const createdAtCompare = toTimestamp(right?.createdAt) - toTimestamp(left?.createdAt);
  if (createdAtCompare !== 0) {
    return createdAtCompare;
  }

  return (Number(right?.id) || 0) - (Number(left?.id) || 0);
};

export const sortOrdersByDateAndPending = (list) => {
  if (!Array.isArray(list)) return [];
  return [...list].sort(buildComparator("orderDate"));
};

export const sortSubscriptionsByDateAndPending = (list) => {
  if (!Array.isArray(list)) return [];
  return [...list].sort(buildComparator("startDate"));
};
