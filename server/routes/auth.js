const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase, mustGetData, maybeSingle } = require('../lib/supabase');
const { mapUser } = require('../lib/serializers');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, email, password, name } = req.body;

        if (!username || !email || !password || !name) {
            return res.status(400).json({ error: 'All fields required' });
        }

        const normalizedUsername = username.trim().toLowerCase();
        const normalizedEmail = email.trim().toLowerCase();

        const existingUsers = await mustGetData(
            supabase
                .from('users')
                .select('id, username, email')
                .or(`username.eq.${normalizedUsername},email.eq.${normalizedEmail}`),
            'Failed to check existing user'
        );

        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const insertedUsers = await mustGetData(
            supabase
                .from('users')
                .insert({
                    username: normalizedUsername,
                    email: normalizedEmail,
                    password_hash: passwordHash,
                    name: name.trim()
                })
                .select('*'),
            'Failed to create user'
        );

        const user = insertedUsers[0];

        if (!user) {
            throw new Error('User was created but could not be retrieved from the database.');
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: mapUser(user)
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed', message: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const normalizedUsername = username.trim().toLowerCase();
        const user = await maybeSingle(
            supabase
                .from('users')
                .select('*')
                .eq('username', normalizedUsername),
            'Failed to load user'
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: mapUser(user)
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed', message: err.message });
    }
});

module.exports = router;
