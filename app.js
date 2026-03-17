const express = require('express');
const path = require('path');
const hbs = require('hbs');
const lineByLine = require('linebyline');
const fs = require('fs');
const session = require('express-session'); 
const users = require('./users.json'); // Your JSON credentials
const { createSecureContext } = require('tls');

const app = express();

// --- 1. SETTINGS & MIDDLEWARE ---
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

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

// Login Submission (POST) - This version uses your JSON + Error Labels
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const userRecord = users.find(u => u.username === username);

    if (!userRecord) {
        return res.render('login', { layout: false, error: 'Not a registered username' });
    }

    if (userRecord.password === password) {
        req.session.isLoggedIn = true;
        req.session.username = username;
        res.redirect('/');
    } else {
        res.render('login', { layout: false, error: 'Invalid Password' });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Home Page (Protected)
app.get('/', isAuthenticated, (req, res) => {
    res.render('single-animal', {
        name: 'Welcome to the Wildlife Gallery',
        file: 'wildlife.jpg',
        menuItems: animalList,
        currentUser: req.session.username
    });
});

// Form Handler (Redirects to Dynamic Route)
app.get('/select-animal', isAuthenticated, (req, res) => {
    const selected = req.query.animal;
    if (selected) {
        res.redirect(`/animal/${selected}`);
    } else {
        res.redirect('/');
    }
});

// Dynamic Animal Display (Protected)
app.get('/animal/:type', isAuthenticated, (req, res) => {
    const animalType = req.params.type;
    res.render('single-animal', {
        name: animalType.toUpperCase(),
        file: `${animalType}.jpg`, 
        menuItems: animalList,
        currentUser: req.session.username
    });
});

// --- 5. START SERVER ---
app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});