const express = require('express');
const router = express.Router();
const Animal = require('../models/Animal'); 

// 1. THIS MUST BE ACTIVE - Handles the sidebar form submission
router.post('/select-animal', (req, res) => {
    if (req.body.animal) {
        const selection = req.body.animal.toLowerCase(); 
        res.redirect(`/animal/${selection}`);
    } else {
        res.redirect('/');
    }
});

// 2. YOUR DIAGNOSTIC GET ROUTE
router.get('/animal/:slug', async (req, res) => {
    const rawSlug = req.params.slug;
    const searchSlug = rawSlug.toLowerCase();
    
    console.log("--- DEBUG START ---");
    console.log("Original URL Slug:", rawSlug);
    console.log("Attempting to find in DB:", searchSlug);
    
    try {
        const animalData = await Animal.findOne({ slug: searchSlug });
        
        if (!animalData) {
            console.log("RESULT: No document found for", searchSlug);
            return res.status(404).send(`Art piece not found: "${searchSlug}"`);
        }

        console.log("RESULT: Found", animalData.name);
        res.render('details', { 
            animal: animalData, 
            currentUser: req.session.username 
        });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).send("DB Error");
    }
});

// 3. THIS MUST BE AT THE VERY BOTTOM
module.exports = router;