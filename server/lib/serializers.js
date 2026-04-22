const mapUser = (user) => {
    if (!user) return null;

    return {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        profilePicture: user.profile_picture,
        bio: user.bio || '',
        friends: Array.isArray(user.friends) ? user.friends : [],
        createdAt: user.created_at,
        updatedAt: user.updated_at
    };
};

const mapActivity = (activity) => {
    if (!activity) return null;

    return {
        _id: activity.id,
        id: activity.id,
        userId: activity.user_id,
        username: activity.username,
        sport: activity.sport,
        distance: activity.distance,
        duration: activity.duration,
        pace: activity.pace,
        speed: activity.speed,
        date: activity.date,
        time: activity.time,
        notes: activity.notes || '',
        calories: activity.calories || 0,
        likes: Array.isArray(activity.likes) ? activity.likes : [],
        comments: Array.isArray(activity.comments) ? activity.comments : [],
        createdAt: activity.created_at
    };
};

const mapMessage = (message) => {
    if (!message) return null;

    return {
        _id: message.id,
        id: message.id,
        from: message.from_username,
        to: message.to_username,
        text: message.text,
        read: message.read,
        createdAt: message.created_at
    };
};

module.exports = {
    mapUser,
    mapActivity,
    mapMessage
};
