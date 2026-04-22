const express = require('express');
const auth = require('../middleware/auth');
const { supabase, mustGetData, maybeSingle } = require('../lib/supabase');
const { mapUser } = require('../lib/serializers');

const router = express.Router();

const parseDurationToSeconds = (duration) => {
    if (!duration || typeof duration !== 'string') {
        return 0;
    }

    const parts = duration.split(':').map((part) => Number.parseInt(part, 10));
    if (parts.some((part) => Number.isNaN(part))) {
        return 0;
    }

    if (parts.length === 3) {
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }

    if (parts.length === 2) {
        return (parts[0] * 60) + parts[1];
    }

    return parts[0] || 0;
};

const buildStats = (activities) => {
    const totalDistance = activities.reduce((sum, activity) => sum + Number(activity.distance || 0), 0);
    const totalActivities = activities.length;
    const totalTimeSeconds = activities.reduce((sum, activity) => sum + parseDurationToSeconds(activity.duration), 0);
    const totalHours = Math.floor(totalTimeSeconds / 3600);
    const totalMinutes = Math.floor((totalTimeSeconds % 3600) / 60);
    const sportBreakdown = {};
    const sportDistance = {};

    activities.forEach((activity) => {
        sportBreakdown[activity.sport] = (sportBreakdown[activity.sport] || 0) + 1;
        sportDistance[activity.sport] = (sportDistance[activity.sport] || 0) + Number(activity.distance || 0);
    });

    return {
        totalDistance: totalDistance.toFixed(1),
        totalActivities,
        totalDuration: `${totalHours}h ${totalMinutes}m`,
        sportBreakdown,
        sportDistance
    };
};

router.get('/profile', auth, async (req, res) => {
    try {
        const user = await maybeSingle(
            supabase.from('users').select('*').eq('id', req.userId),
            'Failed to load user'
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const activities = await mustGetData(
            supabase.from('activities').select('distance, duration, sport').eq('user_id', req.userId),
            'Failed to load activities'
        );

        res.json({
            user: mapUser(user),
            stats: buildStats(activities)
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get profile', message: err.message });
    }
});

router.get('/search/query', auth, async (req, res) => {
    try {
        const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

        if (query.length < 2) {
            return res.json([]);
        }

        const users = await mustGetData(
            supabase
                .from('users')
                .select('*')
                .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
                .limit(10),
            'Search failed'
        );

        res.json(users.map(mapUser));
    } catch (err) {
        res.status(500).json({ error: 'Search failed', message: err.message });
    }
});

router.get('/:username', auth, async (req, res) => {
    try {
        const requestedUsername = req.params.username.trim().toLowerCase();
        const user = await maybeSingle(
            supabase.from('users').select('*').eq('username', requestedUsername),
            'Failed to load user'
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const activities = await mustGetData(
            supabase.from('activities').select('distance, duration, sport').eq('user_id', user.id),
            'Failed to load activities'
        );

        res.json({
            user: mapUser(user),
            stats: buildStats(activities)
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get user', message: err.message });
    }
});

router.put('/profile', auth, async (req, res) => {
    try {
        const { name, bio, profilePicture } = req.body;
        const updates = {
            updated_at: new Date().toISOString()
        };

        if (name !== undefined) updates.name = name;
        if (bio !== undefined) updates.bio = bio;
        if (profilePicture !== undefined) updates.profile_picture = profilePicture;

        const updatedUsers = await mustGetData(
            supabase
                .from('users')
                .update(updates)
                .eq('id', req.userId)
                .select('*'),
            'Update failed'
        );
        const user = updatedUsers[0];

        res.json({
            message: 'Profile updated',
            user: mapUser(user)
        });
    } catch (err) {
        res.status(500).json({ error: 'Update failed', message: err.message });
    }
});

module.exports = router;
