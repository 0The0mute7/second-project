const express = require('express');
const auth = require('../middleware/auth');
const { supabase, mustGetData, maybeSingle } = require('../lib/supabase');
const { mapMessage } = require('../lib/serializers');

const router = express.Router();

router.post('/send', auth, async (req, res) => {
    try {
        const { to, text } = req.body;

        if (!to || !text) {
            return res.status(400).json({ error: 'Recipient and message text required' });
        }

        const normalizedRecipient = to.trim().toLowerCase();

        if (normalizedRecipient === req.username) {
            return res.status(400).json({ error: 'Cannot message yourself' });
        }

        const recipient = await maybeSingle(
            supabase.from('users').select('id, username').eq('username', normalizedRecipient),
            'Failed to find recipient'
        );

        if (!recipient) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        const insertedMessages = await mustGetData(
            supabase
                .from('messages')
                .insert({
                    from_username: req.username,
                    to_username: normalizedRecipient,
                    text: text.trim()
                })
                .select('*'),
            'Failed to send message'
        );
        const message = insertedMessages[0];

        res.status(201).json({
            message: 'Message sent',
            data: mapMessage(message)
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send message', message: err.message });
    }
});

router.get('/conversation/:otherUser', auth, async (req, res) => {
    try {
        const normalizedOtherUser = req.params.otherUser.trim().toLowerCase();
        const limit = Number.parseInt(req.query.limit, 10) || 50;
        const skip = Number.parseInt(req.query.skip, 10) || 0;

        const messages = await mustGetData(
            supabase
                .from('messages')
                .select('*')
                .or(`and(from_username.eq.${req.username},to_username.eq.${normalizedOtherUser}),and(from_username.eq.${normalizedOtherUser},to_username.eq.${req.username})`)
                .order('created_at', { ascending: true })
                .range(skip, skip + limit - 1),
            'Failed to get conversation'
        );

        const { error } = await supabase
            .from('messages')
            .update({ read: true })
            .eq('from_username', normalizedOtherUser)
            .eq('to_username', req.username)
            .eq('read', false);

        if (error) {
            throw new Error(error.message || 'Failed to mark messages as read');
        }

        res.json({
            messages: messages.map(mapMessage)
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get conversation', message: err.message });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const messages = await mustGetData(
            supabase
                .from('messages')
                .select('*')
                .or(`from_username.eq.${req.username},to_username.eq.${req.username}`)
                .order('created_at', { ascending: false }),
            'Failed to get conversations'
        );

        const conversationsMap = new Map();

        messages.forEach((message) => {
            const otherUser = message.from_username === req.username
                ? message.to_username
                : message.from_username;

            if (!conversationsMap.has(otherUser)) {
                conversationsMap.set(otherUser, {
                    _id: otherUser,
                    lastMessage: message.text,
                    lastMessageTime: message.created_at,
                    unreadCount: 0
                });
            }

            const conversation = conversationsMap.get(otherUser);
            if (message.to_username === req.username && message.read === false) {
                conversation.unreadCount += 1;
            }
        });

        res.json({
            conversations: Array.from(conversationsMap.values())
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get conversations', message: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const message = await maybeSingle(
            supabase.from('messages').select('*').eq('id', req.params.id),
            'Failed to load message'
        );

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.from_username !== req.username) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await mustGetData(
            supabase.from('messages').delete().eq('id', req.params.id).select('id'),
            'Failed to delete message'
        );

        res.json({ message: 'Message deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete message', message: err.message });
    }
});

module.exports = router;
