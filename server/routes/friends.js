const express = require('express');
const auth = require('../middleware/auth');
const { supabase, mustGetData, maybeSingle } = require('../lib/supabase');
const { mapUser, mapActivity } = require('../lib/serializers');

const router = express.Router();

router.post('/add/:friendUsername', auth, async (req, res) => {
    try {
        const friendUsername = req.params.friendUsername.trim().toLowerCase();

        if (friendUsername === req.username) {
            return res.status(400).json({ error: 'Cannot add yourself' });
        }

        const user = await maybeSingle(
            supabase.from('users').select('*').eq('id', req.userId),
            'Failed to load user'
        );
        const friend = await maybeSingle(
            supabase.from('users').select('id, username').eq('username', friendUsername),
            'Failed to load friend'
        );

        if (!friend) {
            return res.status(404).json({ error: 'Friend not found' });
        }

        const currentFriends = Array.isArray(user.friends) ? user.friends : [];

        if (currentFriends.includes(friendUsername)) {
            return res.status(400).json({ error: 'Already friends' });
        }

        const updatedUsers = await mustGetData(
            supabase
                .from('users')
                .update({
                    friends: [...currentFriends, friendUsername],
                    updated_at: new Date().toISOString()
                })
                .eq('id', req.userId)
                .select('*'),
            'Failed to add friend'
        );
        const updatedUser = updatedUsers[0];

        res.json({
            message: 'Friend added',
            friends: updatedUser.friends || []
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add friend', message: err.message });
    }
});

router.post('/remove/:friendUsername', auth, async (req, res) => {
    try {
        const friendUsername = req.params.friendUsername.trim().toLowerCase();

        const user = await maybeSingle(
            supabase.from('users').select('friends').eq('id', req.userId),
            'Failed to load user'
        );
        const currentFriends = Array.isArray(user?.friends) ? user.friends : [];

        if (!currentFriends.includes(friendUsername)) {
            return res.status(400).json({ error: 'Not friends with this user' });
        }

        const updatedUsers = await mustGetData(
            supabase
                .from('users')
                .update({
                    friends: currentFriends.filter((friend) => friend !== friendUsername),
                    updated_at: new Date().toISOString()
                })
                .eq('id', req.userId)
                .select('*'),
            'Failed to remove friend'
        );
        const updatedUser = updatedUsers[0];

        res.json({
            message: 'Friend removed',
            friends: updatedUser.friends || []
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove friend', message: err.message });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const user = await maybeSingle(
            supabase.from('users').select('friends').eq('id', req.userId),
            'Failed to load friends'
        );
        const friendUsernames = Array.isArray(user?.friends) ? user.friends : [];
        const friends = friendUsernames.length
            ? await mustGetData(
                supabase.from('users').select('*').in('username', friendUsernames),
                'Failed to load friend profiles'
            )
            : [];

        res.json({
            friends: friends.map(mapUser)
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get friends', message: err.message });
    }
});

router.get('/feed/all', auth, async (req, res) => {
    try {
        const limit = Number.parseInt(req.query.limit, 10) || 50;
        const skip = Number.parseInt(req.query.skip, 10) || 0;

        const user = await maybeSingle(
            supabase.from('users').select('friends').eq('id', req.userId),
            'Failed to load friend usernames'
        );
        const friendUsernames = Array.isArray(user?.friends) ? user.friends : [];
        const activities = friendUsernames.length
            ? await mustGetData(
                supabase
                    .from('activities')
                    .select('*')
                    .in('username', friendUsernames)
                    .order('created_at', { ascending: false })
                    .range(skip, skip + limit - 1),
                'Failed to load feed'
            )
            : [];

        res.json({
            activities: activities.map(mapActivity),
            total: activities.length
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get feed', message: err.message });
    }
});

module.exports = router;
