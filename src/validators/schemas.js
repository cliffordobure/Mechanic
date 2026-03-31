const Joi = require('joi');

const register = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(32).allow('').optional(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('user', 'mechanic', 'seller').default('user'),
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const locationUpdate = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
});

const profileUpdate = Joi.object({
  name: Joi.string().min(2).max(120),
  phone: Joi.string().max(32).allow(''),
  profilePhoto: Joi.string().max(2048).allow(''),
  businessDescription: Joi.string().max(2000).allow(''),
});

const mechanicUpsert = Joi.object({
  services: Joi.array().items(Joi.string().trim().min(1).max(80)),
  carBrands: Joi.array().items(Joi.string().trim().min(1).max(80)),
  pricingNote: Joi.string().max(500).allow(''),
  availability: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

const sellerUpsert = Joi.object({
  shopName: Joi.string().min(2).max(120),
  inventory: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      category: Joi.string().required(),
      price: Joi.number().min(0).required(),
      quantity: Joi.number().integer().min(0).required(),
      image: Joi.string().max(2048).allow(''),
    })
  ),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

const nearbyQuery = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  radius: Joi.number().integer().min(100).max(100000).default(5000),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  service: Joi.string().trim().max(80).allow(''),
  brand: Joi.string().trim().max(80).allow(''),
  category: Joi.string().trim().max(80).allow(''),
});

module.exports = {
  register,
  login,
  locationUpdate,
  profileUpdate,
  mechanicUpsert,
  sellerUpsert,
  nearbyQuery,
};
