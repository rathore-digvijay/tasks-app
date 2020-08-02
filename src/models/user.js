const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Schema of the user.
 */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a postive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

userSchema.methods.generateAuthToken = async function () {
    const self = this;
    const secretKey = process.env.JWT_SECRET_KEY || "DigvijayDeveloper";
    const authToken = jwt.sign({_id: self._id.toString()}, secretKey);
    self.tokens = self.tokens.concat({token: authToken});
    await self.save();
    return authToken;
}

/**
 * This method verify the user login. This is the model method.
 * @param {string} email Email Id of user
 * @param {String} password Password of user
 */
userSchema.statics.verifyUserLogin = async (email, password) => {
    const user = await User.findOne({ email });
    if(!user){
        throw new Error('No registered Id.');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if(!passwordMatch){
        throw new Error('Wrong Credentials');
    }
    return user;
}

/**
 * This is used while user craete or edit its details and if he chages its password then it is 
 * encrypted and then stored in database. 
 */
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User