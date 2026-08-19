export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};