const mongoose = require('mongoose');

// The Blueprint for your 7 Art Pieces
const animalSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    imageFile: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    availability: { type: String, required: true, default: "available"}
});

// Create the 'Animal' model based on the schema
module.exports = mongoose.model('Animal', animalSchema, 'animals');