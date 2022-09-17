const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
require('dotenv').config();

// Creating Schema (DB Structure) for Adding Users to MongoDB Database
const userSchema = new mongoose.Schema({
    user_name: {
        type: String,
        required: true
    },
    email_add: {
        type: String,
        lowercase: true,
        required: true,
        validate: {
            validator: function(email) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
            },
            message: "Please enter a valid email !"
        },
    },
    password: {
        type: String,
        required: true,
    },
    secret_key: {
        type: String,
    },
    referral_code: {
        type: String
    },
    referred_by: {
        type: ObjectId,
    },
    referral_count: {
        type: Number
    },
    createdAt: {
        type: Date, 
        default: Date.now()
    },
    updatedAt: {
        type: Date, 
        default: Date.now()
    }
});

//////////////// Hashing Password //////////////////
userSchema.pre('save', async function(next) {
    if(this.isModified('password')){
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});


//////////////////// Creating Authentication Tokens /////////////////////
userSchema.methods.generateAuthToken = async (req, res) => {
    try {
        let token = jwt.sign({ _id: this._id.toString() }, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({ token });
        await this.save();
        return token;
    }
    catch(err) {
        res.send("Error: "+err);
    }
}

const User = mongoose.model('User', userSchema);
module.exports = User;