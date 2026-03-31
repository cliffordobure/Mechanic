/**
 * Inserts demo mechanics & sellers near Nairobi (same area as the Flutter app default).
 * Run: npm run seed
 * Or:  MONGODB_URI="your-uri" node scripts/seed-dummy.js
 *
 * Removes any previous accounts with email ending in @marketplace.demo
 * Demo password for all: demo123456
 */
const path = require('path');
const backendRoot = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(backendRoot, '.env') });
require('dotenv').config();

const mongoose = require('mongoose');
const { resolveDbName } = require('../src/config/db');
const User = require('../src/models/User');
const Mechanic = require('../src/models/Mechanic');
const Seller = require('../src/models/Seller');

const DEMO_PASSWORD = 'demo123456';

/** GeoJSON Point: [lng, lat] — clustered near app default (Nairobi). */
function loc(lng, lat) {
  return { type: 'Point', coordinates: [lng, lat] };
}

const mechanicsData = [
  {
    email: 'demo-mech-1@marketplace.demo',
    name: 'Joe’s Auto Garage',
    phone: '+254700111001',
    location: loc(36.805, -1.288),
    services: ['Engine repair', 'Oil change', 'Diagnostics'],
    carBrands: ['Toyota', 'Nissan', 'Mazda'],
    pricingNote: 'From KES 2,500 for oil change',
  },
  {
    email: 'demo-mech-2@marketplace.demo',
    name: 'Westlands Quick Fix',
    phone: '+254700111002',
    location: loc(36.838, -1.29),
    services: ['Brake repair', 'Suspension', 'Wheel alignment'],
    carBrands: ['BMW', 'Mercedes', 'VW'],
    pricingNote: 'Brake pads from KES 8,000',
  },
  {
    email: 'demo-mech-3@marketplace.demo',
    name: 'Mobile Mechanic Sam',
    phone: '+254700111003',
    location: loc(36.815, -1.305),
    services: ['Battery jump-start', 'Tire change', 'Minor repairs'],
    carBrands: ['Toyota', 'Honda', 'Subaru'],
    pricingNote: 'Call-out fee KES 1,500',
  },
  {
    email: 'demo-mech-4@marketplace.demo',
    name: 'Diesel Masters Ltd',
    phone: '+254700111004',
    location: loc(36.83, -1.275),
    services: ['Diesel engine', 'Turbo service', 'Injector cleaning'],
    carBrands: ['Isuzu', 'Mitsubishi', 'Toyota'],
    pricingNote: 'Commercial vehicles welcome',
  },
  {
    email: 'demo-mech-5@marketplace.demo',
    name: 'Hybrid & EV Care',
    phone: '+254700111005',
    location: loc(36.8, -1.298),
    services: ['Hybrid battery check', 'AC service', 'Software updates'],
    carBrands: ['Toyota', 'Lexus', 'Nissan'],
    pricingNote: 'Book 24h in advance',
  },
];

const sellersData = [
  {
    email: 'demo-seller-1@marketplace.demo',
    name: 'Parts Hub Karen',
    phone: '+254700222001',
    location: loc(36.825, -1.28),
    shopName: 'Karen Spares & Tyres',
    inventory: [
      { name: 'Brake pads (front)', category: 'Brakes', price: 6500, quantity: 12 },
      { name: 'Engine oil 5W-30 (4L)', category: 'Fluids', price: 4200, quantity: 30 },
      { name: 'Air filter (universal)', category: 'Engine parts', price: 1800, quantity: 25 },
    ],
  },
  {
    email: 'demo-seller-2@marketplace.demo',
    name: 'Eastlands Motors Parts',
    phone: '+254700222002',
    location: loc(36.81, -1.31),
    shopName: 'Eastlands Auto Parts',
    inventory: [
      { name: 'Spark plugs (set of 4)', category: 'Engine parts', price: 3200, quantity: 40 },
      { name: 'Radiator coolant (1L)', category: 'Fluids', price: 950, quantity: 60 },
    ],
  },
  {
    email: 'demo-seller-3@marketplace.demo',
    name: 'Tire World Nairobi',
    phone: '+254700222003',
    location: loc(36.835, -1.3),
    shopName: 'Tire World',
    inventory: [
      { name: 'All-season tire 195/65R15', category: 'Tires', price: 18500, quantity: 8 },
      { name: 'Puncture repair kit', category: 'Accessories', price: 2500, quantity: 15 },
    ],
  },
  {
    email: 'demo-seller-4@marketplace.demo',
    name: 'Battery Plus',
    phone: '+254700222004',
    location: loc(36.818, -1.268),
    shopName: 'Battery Plus Nairobi',
    inventory: [{ name: '12V car battery (60Ah)', category: 'Electrical', price: 14500, quantity: 10 }],
  },
];

/** Extra demos so testers outside Kenya still see results within ~15 km. */
const worldMechanics = [
  {
    email: 'demo-mech-nyc@marketplace.demo',
    name: 'Brooklyn Brake & Tire',
    phone: '+12125550101',
    location: loc(-73.985, 40.698),
    services: ['Brake service', 'Tires', 'Alignment'],
    carBrands: ['Ford', 'Toyota', 'Honda'],
    pricingNote: 'Walk-ins welcome',
  },
  {
    email: 'demo-mech-london@marketplace.demo',
    name: 'Kings Cross Motors',
    phone: '+442079460001',
    location: loc(-0.124, 51.531),
    services: ['Servicing', 'MOT prep', 'Diagnostics'],
    carBrands: ['VW', 'BMW', 'Audi'],
    pricingNote: 'Book online',
  },
  {
    email: 'demo-mech-lagos@marketplace.demo',
    name: 'Victoria Island Auto',
    phone: '+2348001112222',
    location: loc(3.421, 6.428),
    services: ['AC repair', 'Electrical', 'Suspension'],
    carBrands: ['Toyota', 'Lexus', 'Mercedes'],
    pricingNote: 'Same-day diagnostics',
  },
];

const worldSellers = [
  {
    email: 'demo-seller-nyc@marketplace.demo',
    name: 'Manhattan Parts Co',
    phone: '+12125550202',
    location: loc(-73.99, 40.73),
    shopName: 'Manhattan Parts Co',
    inventory: [
      { name: 'OEM brake rotor (front)', category: 'Brakes', price: 89, quantity: 6 },
      { name: 'Cabin air filter', category: 'Engine parts', price: 24, quantity: 20 },
    ],
  },
  {
    email: 'demo-seller-london@marketplace.demo',
    name: 'Camden Spares',
    phone: '+442079460002',
    location: loc(-0.143, 51.539),
    shopName: 'Camden Spares',
    inventory: [
      { name: 'Wiper blades (pair)', category: 'Accessories', price: 18, quantity: 40 },
    ],
  },
];

async function clearDemoAccounts() {
  const users = await User.find({ email: { $regex: /@marketplace\.demo$/ } });
  const ids = users.map((u) => u._id);
  if (ids.length) {
    await Mechanic.deleteMany({ userId: { $in: ids } });
    await Seller.deleteMany({ userId: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    console.log(`Removed ${ids.length} previous demo account(s).`);
  }
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }
  const dbName = resolveDbName(uri);
  await mongoose.connect(uri, { dbName });
  console.log('Connected to MongoDB, database:', dbName);

  await clearDemoAccounts();

  let mIndex = 0;
  const allMechanics = [...mechanicsData, ...worldMechanics];
  for (const m of allMechanics) {
    const user = await User.create({
      name: m.name,
      email: m.email,
      phone: m.phone,
      password: DEMO_PASSWORD,
      role: 'mechanic',
      businessDescription: 'Demo mechanic for marketplace testing.',
      location: m.location,
    });
    await Mechanic.create({
      userId: user._id,
      services: m.services,
      carBrands: m.carBrands,
      pricingNote: m.pricingNote,
      availability: true,
      rating: 4.2 + (mIndex % 3) * 0.2,
    });
    mIndex += 1;
    console.log('Mechanic:', m.name, m.email);
  }

  const allSellers = [...sellersData, ...worldSellers];
  for (const s of allSellers) {
    const user = await User.create({
      name: s.name,
      email: s.email,
      phone: s.phone,
      password: DEMO_PASSWORD,
      role: 'seller',
      businessDescription: 'Demo parts seller for marketplace testing.',
      location: s.location,
    });
    await Seller.create({
      userId: user._id,
      shopName: s.shopName,
      inventory: s.inventory,
    });
    console.log('Seller:', s.shopName, s.email);
  }

  console.log('\nDone. Password for all demo accounts:', DEMO_PASSWORD);
  console.log('Includes Nairobi cluster + demo shops in NYC, London, and Lagos.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
