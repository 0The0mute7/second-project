const express = require('express');
const auth = require('../middleware/auth');
const { supabase, mustGetData, maybeSingle } = require('../lib/supabase');
const { mapActivity } = require('../lib/serializers');

const router = express.Router();

const parsePositiveNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
};

router.post('/', auth, async (req, res) => {
    try {
        const { sport, distance, duration, pace, speed, date, time, notes } = req.body;
        const parsedDistance = parsePositiveNumber(distance);
        const parsedSpeed = parsePositiveNumber(speed);

        if (!sport || parsedDistance === null || !duration || !pace || parsedSpeed === null || !date || !time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const insertedActivities = await mustGetData(
            supabase
                .from('activities')
                .insert({
                    user_id: req.userId,
                    username: req.username,
                    sport,
                    distance: parsedDistance,
                    duration,
                    pace,
                    speed: parsedSpeed,
                    date,
                    time,
                    notes: notes || ''
                })
                .select('*'),
            'Failed to save activity'
        );
        const activity = insertedActivities[0];

        res.status(201).json({
            message: 'Activity saved',
            activity: mapActivity(activity)
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save activity', message: err.message });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const limit = Number.parseInt(req.query.limit, 10) || 50;
        const skip = Number.parseInt(req.query.skip, 10) || 0;
        const { data: activities, error, count } = await supabase
            .from('activities')
            .select('*', { count: 'exact' })
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false })
            .range(skip, skip + limit - 1);

        if (error) {
            throw new Error(error.message || 'Failed to get activities');
        }

        res.json({
            activities: (activities || []).map(mapActivity),
            total: count || 0,
            limit,
            skip
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get activities', message: err.message });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const activity = await maybeSingle(
            supabase.from('activities').select('*').eq('id', req.params.id),
            'Failed to get activity'
        );

        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        res.json(mapActivity(activity));
    } catch (err) {
        res.status(500).json({ error: 'Failed to get activity', message: err.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const activity = await maybeSingle(
            supabase.from('activities').select('*').eq('id', req.params.id),
            'Failed to load activity'
        );

        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        if (activity.user_id !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const updates = {};
        const allowedFields = ['sport', 'duration', 'pace', 'date', 'time', 'notes'];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (req.body.distance !== undefined) {
            const parsedDistance = parsePositiveNumber(req.body.distance);
            if (parsedDistance === null) {
                return res.status(400).json({ error: 'Invalid distance' });
            }
            updates.distance = parsedDistance;
        }

        if (req.body.speed !== undefined) {
            const parsedSpeed = parsePositiveNumber(req.body.speed);
            if (parsedSpeed === null) {
                return res.status(400).json({ error: 'Invalid speed' });
            }
            updates.speed = parsedSpeed;
        }

        const updatedActivities = await mustGetData(
            supabase
                .from('activities')
                .update(updates)
                .eq('id', req.params.id)
                .select('*'),
            'Failed to update activity'
        );
        const updatedActivity = updatedActivities[0];

        res.json({
            message: 'Activity updated',
            activity: mapActivity(updatedActivity)
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update activity', message: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const activity = await maybeSingle(
            supabase.from('activities').select('id, user_id').eq('id', req.params.id),
            'Failed to load activity'
        );

        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        if (activity.user_id !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await mustGetData(
            supabase.from('activities').delete().eq('id', req.params.id).select('id'),
            'Failed to delete activity'
        );

        res.json({ message: 'Activity deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete activity', message: err.message });
    }
});

router.post('/:id/like', auth, async (req, res) => {
    try {
        const activity = await maybeSingle(
            supabase.from('activities').select('*').eq('id', req.params.id),
            'Failed to load activity'
        );

        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        const likes = Array.isArray(activity.likes) ? activity.likes : [];
        const updatedLikes = likes.includes(req.username)
            ? likes.filter((username) => username !== req.username)
            : [...likes, req.username];

        const updatedActivities = await mustGetData(
            supabase
                .from('activities')
                .update({ likes: updatedLikes })
                .eq('id', req.params.id)
                .select('*'),
            'Failed to toggle like'
        );
        const updatedActivity = updatedActivities[0];

        res.json({
            message: 'Like toggled',
            likes: Array.isArray(updatedActivity.likes) ? updatedActivity.likes.length : 0,
            activity: mapActivity(updatedActivity)
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to like activity', message: err.message });
    }
});

module.exports = router;
