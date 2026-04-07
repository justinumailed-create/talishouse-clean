export const formatCAD = (amount: number, showDecimals: boolean = true) => {
  return `CAD $${showDecimals ? amount.toFixed(2) : Math.round(amount).toLocaleString()}`
}
