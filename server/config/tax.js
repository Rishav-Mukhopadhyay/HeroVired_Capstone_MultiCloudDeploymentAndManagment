// Hardcoded single-jurisdiction sales tax rate applied to taxable order
// totals. There is no per-address/per-state lookup — every taxable item is
// taxed at this one rate regardless of where the order ships.
module.exports = {
  stateCode: 'CA',
  stateName: 'California',
  stateTaxRate: 0.05
};
