/*
 * File: auth.js
 * Project: task-manager
 * File Created: Sunday, 2nd August 2020 10:42:53 pm
 * Author: Digvijay Rathore (rathore.digvijay10@gmail.com)
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user');


const auth = async (req, res, next) => {
    console.log('Auth middleware');
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const secretKey = process.env.JWT_SECRET_KEY || "DigvijayDeveloper";
        const decoded = jwt.verify(token, secretKey);
        const userData = await User.findOne({_id: decoded._id, 'tokens.token': token});
        if(!userData){
            throw new Error();
        }
        req.user = userData;
        next();
    } catch (error) {
        res.status(401).send({errorMsg : 'Authentication failed.'});
    }
}

module.exports = auth;