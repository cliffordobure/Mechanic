/** Shared defaults when bootstrapping Seller / Mechanic rows from a User. */
function defaultShopName(name) {
  const base = `${String(name).trim()}'s Shop`;
  return base.length > 120 ? base.slice(0, 117) + '...' : base;
}

module.exports = { defaultShopName };
