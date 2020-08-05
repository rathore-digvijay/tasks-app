const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth.js');
const router = new express.Router();

// API Route: Create user
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e)
    }
})

// API Route: Login of the user
router.post('/users/login', async (req, res) => {
    try {
        const userData = await User.verifyUserLogin(req.body.email, req.body.password);
        const token = await userData.generateAuthToken();
        res.send({ userData, token });
    } catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
});

// API Route: Logout from single session
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.token = req.user.tokens.filter((token) => {
            return req.token.token !== req.token;
        })
        await req.user.save();

        res.sendStatus(200);
    } catch (error) {
        console.log(error)
        res.sendStatus(500);
    }
});

// API Route: Logout from all the sessions
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.token = [];
        await req.user.save();
        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});

// API Route: Find Users
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})


// API Route: Update Specific user by Id
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// API Route: Delete Specific user by Id
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router