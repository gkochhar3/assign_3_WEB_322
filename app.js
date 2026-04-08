const mongoose = require('mongoose');
const Animal = require('./models/Animal'); // Import your new model

// Replace 'your_connection_string' with your actual Mongo URI
const mongoURI = 'mongodb+srv://gurkarank02:Aj4aVARSBzoJ9Nr2@mongodbatlas.2vrwmoh.mongodb.net/wildlifeGallery?retryWrites=true&w=majority';

mongoose.connect(mongoURI)
    .then(() => console.log("Connected to MongoDB!"))
    .catch(err => console.log("Connection Error:", err));

const express = require('express');
const path = require('path');
const hbs = require('hbs');
hbs.registerHelper('eq', function (a, b) {
    return a === b;
});
const lineByLine = require('linebyline');
const fs = require('fs');
const galleryRouter = require('./routes/gallery'); // 
const session = require('express-session'); 
const users = require('./users.json'); // JSON credentials
const { createSecureContext } = require('tls');

const app = express();

// --- 1. SETTINGS & MIDDLEWARE ---
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure Session
app.use(session({
    secret: 'wildlife-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 600000 } 
}));

// --- 2. AUTHENTICATION GUARD ---
function isAuthenticated(req, res, next) {
    if (req.session.isLoggedIn) {
        return next();
    }
    res.redirect('/login');
}

// --- 3. READ ANIMAL LIST ---
const checkPath = path.join(__dirname, 'imagelist.txt');
const animalList = [];

if (fs.existsSync(checkPath)) {
    const rl = lineByLine(checkPath);
    rl.on('line', (line) => {
        const trimmedLine = line.trim();
        if (trimmedLine !== "") {
            const cleanName = trimmedLine.split('.')[0]; 
            animalList.push(cleanName);
        }
    });
}

// --- 4. ROUTES ---



// Login Page (GET)
app.get('/login', (req, res) => {
    res.render('login', { layout: false });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Home Page (Protected)
// Home Page (Protected) - 
app.get('/', isAuthenticated, async (req, res) => {
    const lastViewed = req.query.lastViewed; // This comes from the Cancel button URL

    if (lastViewed) {
        try {
            // Find the animal the user just "Cancelled" on
            const animal = await Animal.findOne({ slug: lastViewed }).lean();
            
            // If we found it, show that animal instead of the welcome screen
            if (animal) {
                return res.render('single-animal', {
                    name: animal.commonName,
                    file: animal.imageFile,
                    description: animal.description, // Added so description shows
                    menuItems: animalList,
                    currentUser: req.session.username
                });
            }
        } catch (err) {
            console.log("Error finding last viewed animal:", err);
        }
    }

    // DEFAULT CASE: (Shows on fresh login, or after clicking BUY)
    res.render('single-animal', {
        name: 'Welcome to the Wildlife Gallery',
        file: 'wildlife.jpg',
        menuItems: animalList,
        currentUser: req.session.username
    });
});




// To update Mongo DB file with status as available or sold 
app.post('/buy-animal/:id', isAuthenticated, async (req, res) => {
    try {
        const animalId = req.params.id;

        // Find the animal by its unique MongoDB ID and update status to 'S'
        await Animal.findByIdAndUpdate(animalId, { availability: "Sold" });

        // Redirect to home (which shows the default gallery image)
        res.redirect('/');
    } catch (err) {
        console.log("Error during purchase:", err);
        res.status(500).send("Update failed");
    }
});

app.post('/login', async (req, res) => { // Added 'async' here
    const { username, password } = req.body;
    const userRecord = users.find(u => u.username === username);

    if (!userRecord) {
        return res.render('login', { layout: false, error: 'Not a registered username' });
    }

    if (userRecord.password === password) {
        try {
            // --- RESET LOGIC START ---
            // This finds EVERY document in the Animals collection 
            // and sets their availability back to "Available"
            await Animal.updateMany({}, { availability: "Available" });
            // --- RESET LOGIC END ---

            req.session.isLoggedIn = true;
            req.session.username = username;
            res.redirect('/');
        } catch (err) {
            console.log("Error resetting database on login:", err);
            res.redirect('/login');
        }
    } else {
        res.render('login', { layout: false, error: 'Invalid Password' });
    }
});

app.use('/', galleryRouter); // This connects all the routes in gallery.js

// Add this export line
module.exports = app;

// Keep your listen block, but use process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});