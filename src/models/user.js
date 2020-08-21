const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

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
    }],
    avatar : {
        type : Buffer
    }
}, {
    timestamps : true
})


/**
 * Virtual reference on User Schema to use populate
 */
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

/**
 * This method is used as public profile for the user called when we send the profile data 
 * back to the client.
 */
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
}

/**
 * This method generate the authToken for the player for every signIn and save in tokens array.
 */
userSchema.methods.generateAuthToken = async function () {
    const self = this;
    const secretKey = process.env.JWT_SECRET_KEY || "DigvijayDeveloper";
    const authToken = jwt.sign({ _id: self._id.toString() }, secretKey);
    self.tokens = self.tokens.concat({ token: authToken });
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
    if (!user) {
        throw new Error('No registered Id.');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new Error('Wrong Credentials');
    }
    return user;
}

/**
 * This is used while user craete or edit its details and if he chages its password then it is 
 * encrypted and then stored in database.
 * Hash user password before saving.
 */
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})


userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
})

const User = mongoose.model('User', userSchema)

module.exports = User