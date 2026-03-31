const mongoose = require('mongoose');

const mechanicSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    services: [{ type: String, trim: true }],
    carBrands: [{ type: String, trim: true }],
    pricingNote: { type: String, default: '' },
    availability: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: [
      {
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        stars: { type: Number, min: 1, max: 5 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mechanic', mechanicSchema);
