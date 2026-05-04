export const formatCAD = (amount: number) => {
  return `CAD $${amount.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
