const express = require('express');
const bodyParser = require('body-parser');
const SpeakEasy = require('speakeasy');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const router = express.Router();
require('dotenv').config();

// Display all Users present in the MongoDB Database
router.get('/users', async(req, res) => {
    try {
        const userList = await User.find();
        res.status(200).json(userList);
    }
    catch(err) {
        res.send('Error: '+err)
    }
});


// Add New User to MongoDB Database (check Dupliate Entries)
router.post('/register', async(req, res) => {
    try {
            const { user_name, email_add, password, conf_password } = req.body
            if (!user_name || !email_add || !password || !conf_password) {
                return res.status(400).json({ erorr: "All Fields Required" });
            }
            const existingUser = await User.findOne({ user_name });
            if (existingUser) {
                return res.status(400).json({ error: "Username already taken !" });
            }
            const existingEmail = await User.findOne({ email_add });
            if (existingEmail) {
                return res.status(400).json({ error: "Email already taken !" });
            }
            if (password != conf_password){
                return res.status(400).json({error: "The Passwords did not match !"});
            }       
            else{
                var secret_key = SpeakEasy.generateSecret({ length: 20 }).base32;
                var referral_code = SpeakEasy.generateSecret({ length: 10}).base32;
                const user = new User({ user_name, email_add, password, conf_password, secret_key, referral_code });
                const newUser = await user.save(); 
                res.status(200).json(newUser);
            }
        }
        catch(err) {
            res.send('Error: '+err)
        }
})





// Query Particular User Details based on Object ID
router.get('/user/:id', async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.json(user);
    }
    catch(err) {
        res.send('Error: '+err)
    }
});


// Route for Loging into Web Application
router.post('/login', async(req, res) => {
    try {
        const { email_add, password, referral_code } = req.body;

        // Verify User Referral
        
        // Verify User Details present in DB
        let user = await User.findOne({ email_add });
        if (!user) {
        return res.status(400).json({ msg: 'Email or password incorrect' });
        }

        // Check if the encrypted password matches to Users Input
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
        return res.status(400).json({ msg: 'Email or password incorrect' });
        }
        else {
            res.status(200).send(`User: ${user.user_name} Successfully Logged In with Referral Code : ${user.referral_code}`)
        }
    }
    catch(err) {
        res.status(500).send("Error: "+err);
    }
});


// Route for Token Verification for 2FA
/////////// Do not use Endpoint beyond Testing Purposes ///////////// 
router.post('/check', (req, res) => {
    res.send({ 
        "token": SpeakEasy.totp({
            secret: req.body.secret,
            encoding: "base32",
        }),
        "remaining": (60 - Math.floor(new Date().getTime() / 1000.0 % 60))
    }); 
});



// Route for Token Validation in 2FA
/////////// Do not use Endpoint beyond Testing Purposes ///////////// 
router.post('/validate', (req,res) => {
    res.send({
        "valid": SpeakEasy.totp.verify({
            secret: req.body.secret,
            encoding: "base32",
            token: req.body.token,
            window: 0    // Give user complete 1 Minute for process
        })
    });
});


// Updating Existing User Details in MongoDB Database
router.patch('/user/:id', async(req, res) => {
    const { user_name, email_add, password } = req.body
    if (!user_name || !email_add || !password) {
        return res.status(400).json({ erorr: "All Fields Required" });
    }
    try {
        const user = await User.findById(req.params.id)
        user.user_name = user_name
        user.email_add = email_add
        user.password = password

        const upUser = await user.save()
        res.json(upUser)
    }
    catch(err) {
        res.send('Error: ' +err);
    }
});


// Deleting Records for User
router.delete('/user/:id', async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        const delUser = await user.remove();
        res.send(`${user.user_name}'s Account Deleted Successfully`);
    }
    catch(err) {
        res.send('Error: '+err)
    }
});


module.exports = router;