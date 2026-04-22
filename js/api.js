// ==========================================
// API CLIENT - Frontend
// Handles all communication with backend
// ==========================================

// Fallback to localhost, but allow production URL configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://your-production-api-url.com/api';

class APIClient {
    constructor() {
        this.token = localStorage.getItem('auth_token');
    }

    // ==========================================
    // AUTH ENDPOINTS
    // ==========================================

    async register(username, email, password, name) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, name })
            });
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('auth_token', data.token);
                this.token = data.token;
            }
            return { success: response.ok, ...data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async login(username, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('auth_token', data.token);
                this.token = data.token;
            }
            return { success: response.ok, ...data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    logout() {
        localStorage.removeItem('auth_token');
        this.token = null;
    }

    // ==========================================
    // USER ENDPOINTS
    // ==========================================

    async getProfile() {
        return this.request('GET', '/users/profile');
    }

    async getPublicProfile(username) {
        return this.request('GET', `/users/${username}`);
    }

    async searchUsers(query) {
        return this.request('GET', `/users/search/query?q=${query}`);
    }

    async updateProfile(name, bio, profilePicture) {
        return this.request('PUT', '/users/profile', { name, bio, profilePicture });
    }

    // ==========================================
    // ACTIVITY ENDPOINTS
    // ==========================================

    async createActivity(activity) {
        return this.request('POST', '/activities', activity);
    }

    async getActivities(limit = 50, skip = 0) {
        return this.request('GET', `/activities?limit=${limit}&skip=${skip}`);
    }

    async getActivity(id) {
        return this.request('GET', `/activities/${id}`);
    }

    async updateActivity(id, notes) {
        return this.request('PUT', `/activities/${id}`, { notes });
    }

    async deleteActivity(id) {
        return this.request('DELETE', `/activities/${id}`);
    }

    async likeActivity(id) {
        return this.request('POST', `/activities/${id}/like`);
    }

    // ==========================================
    // FRIEND ENDPOINTS
    // ==========================================

    async addFriend(username) {
        return this.request('POST', `/friends/add/${username}`);
    }

    async removeFriend(username) {
        return this.request('POST', `/friends/remove/${username}`);
    }

    async getFriends() {
        return this.request('GET', '/friends');
    }

    async getSocialFeed(limit = 50, skip = 0) {
        return this.request('GET', `/friends/feed/all?limit=${limit}&skip=${skip}`);
    }

    // ==========================================
    // MESSAGE ENDPOINTS
    // ==========================================

    async sendMessage(to, text) {
        return this.request('POST', '/messages/send', { to, text });
    }

    async getConversation(otherUser, limit = 50, skip = 0) {
        return this.request('GET', `/messages/conversation/${otherUser}?limit=${limit}&skip=${skip}`);
    }

    async getConversations() {
        return this.request('GET', '/messages');
    }

    async deleteMessage(id) {
        return this.request('DELETE', `/messages/${id}`);
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    async request(method, endpoint, body = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (this.token) {
                options.headers.Authorization = `Bearer ${this.token}`;
            }

            if (body && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`${API_URL}${endpoint}`, options);
            const data = await response.json();

            if (response.status === 401) {
                this.logout();
                window.location.reload();
            }

            return { 
                success: response.ok, 
                status: response.status,
                ...data 
            };
        } catch (err) {
            console.error(`API Error [${method} ${endpoint}]:`, err);
            return { success: false, error: err.message };
        }
    }

    isAuthenticated() {
        return !!this.token;
    }

    getToken() {
        return this.token;
    }
}

// Create global instance
const api = new APIClient();
