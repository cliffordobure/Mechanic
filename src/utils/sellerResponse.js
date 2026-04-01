/**
 * Ensure seller JSON always includes a plain `inventory` array and a consistent `user` + `userId` shape.
 * Fixes clients not showing stock when subdocs or populated refs serialize oddly.
 */
function normalizeInventory(inv) {
  if (!Array.isArray(inv)) return [];
  return inv.map((item) => ({
    _id: item._id,
    name: item.name,
    category: item.category,
    price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
    quantity: typeof item.quantity === 'number' ? item.quantity : Math.floor(Number(item.quantity)) || 0,
    image: item.image || '',
  }));
}

function formatSellerForClient(raw) {
  if (!raw || !raw._id) return raw;
  const o = typeof raw.toObject === 'function' ? raw.toObject() : { ...raw };
  o.inventory = normalizeInventory(o.inventory);

  const uid = o.userId;
  // ObjectId is an object too — detect populated User by profile fields, not `uid._id`.
  const isPopulatedUser =
    uid &&
    typeof uid === 'object' &&
    (Object.prototype.hasOwnProperty.call(uid, 'email') ||
      Object.prototype.hasOwnProperty.call(uid, 'name') ||
      Object.prototype.hasOwnProperty.call(uid, 'role'));
  if (isPopulatedUser) {
    const u = { ...uid };
    delete u.password;
    o.user = u;
    o.userId = uid._id;
  } else if (o.user && typeof o.user === 'object') {
    if (o.user.password) delete o.user.password;
  }

  return o;
}

module.exports = { formatSellerForClient, normalizeInventory };
