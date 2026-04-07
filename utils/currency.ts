export const formatCAD = (amount: number, showDecimals: boolean = false) => {
  return `CAD $${Math.round(amount).toLocaleString()}`
}
