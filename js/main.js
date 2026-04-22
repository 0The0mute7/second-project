// ==========================================
// BEYOND 40% - SOCIAL FITNESS TRACKER v2
// Phase 1: Multi-sport + User Profiles
// ==========================================

// GLOBAL STATE
let currentUser = null;
let watchID = null;
let totalDistance = 0;
let lastCoords = null;
let startTime = null;
let timerInterval = null;
let currentSport = 'running';
let alarmInterval = null;

document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    checkUserSession();
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
});

async function checkUserSession() {
    // Check if we have a token from api.js logic
    if (api.isAuthenticated()) {
        const result = await api.getProfile();
        if (result.success) {
            currentUser = result.user;
        } else {
            api.logout();
            showView('login');
            return;
        }
        showAppUI();
        showView('dashboard');
        initAppFeatures();
    } else {
        showView('login');
    }
}

function showAppUI() {
    document.getElementById('user-display').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'block';
    document.getElementById('user-display').textContent = `Hi, ${currentUser.name}`;
}

function hideAppUI() {
    document.getElementById('user-display').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'none';
}

// --- 1. AUTHENTICATION SYSTEM ---

async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    // Call the backend via the API client
    const result = await api.login(username, password);

    if (result.success) {
        currentUser = result.user;
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        
        showAppUI();
        showView('dashboard');
        initAppFeatures();
    } else {
        alert('Invalid username or password');
    }
}

async function handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const name = document.getElementById('register-name').value.trim();

    if (!username || !email || !password || !name) {
        alert('Please fill in all fields');
        return;
    }

    const result = await api.register(username, email, password, name);

    if (result.success) {
        currentUser = result.user;
        document.getElementById('register-username').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-name').value = '';
        showAppUI();
        showView('dashboard');
        initAppFeatures();
    } else {
        alert(result.error || 'Registration failed');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        api.logout();
        currentUser = null;
        showView('login');
        hideAppUI();
    }
}

// --- 2. VIEW SWITCHER ---

function showView(viewId) {
    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.add('hidden'));

    const target = document.getElementById('view-' + viewId);
    if (target) {
        target.classList.remove('hidden');
    }

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        item.style.color = "#888";
    });

    const activeNav = Array.from(navItems).find(item => 
        item.getAttribute('onclick').includes(viewId)
    );
    if (activeNav) activeNav.style.color = "var(--primary-color)";

    // Initialize view-specific data
    switch (viewId) {
        case 'profile': loadProfilePage(); break;
        case 'messages': loadConversationsList(); break;
        case 'feed': loadSocialFeed(); break;
        case 'friends': loadFriendsUI(); break;
    }
}

// --- 3. SPORT SELECTION ---

function selectSport(sport) {
    currentSport = sport;
    
    const buttons = document.querySelectorAll('.sport-btn');
    buttons.forEach(btn => {
        btn.style.borderColor = 'transparent';
        btn.style.background = '#333';
    });

    document.getElementById(`sport-${sport}`).style.borderColor = 'var(--primary-color)';
    document.getElementById(`sport-${sport}`).style.background = 'rgba(72, 145, 255, 0.1)';
}

// --- 4. GPS TRACKING & WORKOUT LOGIC ---

function initGPSControls() {
    const startBtn = document.getElementById('start-tracking');
    if (!startBtn || startBtn.dataset.listenerAttached) return;

    startBtn.addEventListener('click', () => {
        if (watchID === null) {
            startWorkout(startBtn);
        } else {
            stopWorkout(startBtn);
        }
    });
    startBtn.dataset.listenerAttached = "true";
}

function startWorkout(btn) {
    if (!currentSport) {
        alert('Please select a sport first');
        return;
    }

    totalDistance = 0;
    lastCoords = null;
    document.getElementById('live-distance').innerText = "0.00";
    document.getElementById('live-speed').innerText = "0.0";
    document.getElementById('live-pace').innerText = "--:--";

    btn.innerHTML = 'STOP SESSION <i class="fas fa-stop"></i>';
    btn.style.background = "#ff4444";
    document.getElementById('gps-status').innerText = "GPS: ACTIVE";
    document.getElementById('gps-status').style.color = "var(--primary-color)";

    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);

    if ("geolocation" in navigator) {
        watchID = navigator.geolocation.watchPosition(updatePosition, handleGPSError, {
            enableHighAccuracy: true,
            distanceFilter: 1
        });
    } else {
        alert("GPS not supported on this device.");
    }
}

function stopWorkout(btn) {
    navigator.geolocation.clearWatch(watchID);
    watchID = null;
    clearInterval(timerInterval);

    saveActivity();

    btn.innerHTML = 'START SESSION <i class="fas fa-play"></i>';
    btn.style.background = "var(--primary-color)";
    document.getElementById('gps-status').innerText = "GPS: IDLE";
    document.getElementById('gps-status').style.color = "#666";
}

function updatePosition(position) {
    const { latitude, longitude, speed } = position.coords;
    
    // Update Speed (m/s to km/h)
    const kmh = speed ? (speed * 3.6).toFixed(1) : 0;
    document.getElementById('live-speed').innerText = kmh;

    // Calculate Distance
    if (lastCoords) {
        const dist = calculateDistance(lastCoords.latitude, lastCoords.longitude, latitude, longitude);
        totalDistance += dist;
        document.getElementById('live-distance').innerText = totalDistance.toFixed(2);
    }
    lastCoords = { latitude, longitude };
}

function updateTimer() {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    document.getElementById('live-timer').innerText = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Calculate and update pace
    updatePace(elapsed);
}

function updatePace(elapsedMs) {
    if (totalDistance > 0 && elapsedMs > 0) {
        const paceSecondsPerKm = Math.floor((elapsedMs / 1000) / totalDistance);
        const paceMin = Math.floor(paceSecondsPerKm / 60);
        const paceSec = paceSecondsPerKm % 60;
        document.getElementById('live-pace').innerText = 
            `${paceMin.toString().padStart(2, '0')}:${paceSec.toString().padStart(2, '0')}`;
    } else {
        document.getElementById('live-pace').innerText = '--:--';
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth Radius in KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function handleGPSError(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
    document.getElementById('gps-status').innerText = "GPS: ERROR";
}

// --- 6. PROFILE PAGE & STATS ---

async function loadProfilePage() {
    if (!currentUser) return;

    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-username').textContent = `@${currentUser.username}`;
    document.getElementById('profile-email').textContent = currentUser.email;

    const result = await api.getActivities();
    const activities = result.success ? result.activities : [];

    const totalDist = activities.reduce((sum, a) => sum + parseFloat(a.distance), 0);
    const totalTime = activities.reduce((sum, a) => {
        const parts = a.duration.split(':');
        return sum + parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }, 0);

    const totalHours = Math.floor(totalTime / 3600);
    const totalMinutes = Math.floor((totalTime % 3600) / 60);

    let avgPace = '--:--';
    if (activities.length > 0) {
        const totalPaceSeconds = activities.reduce((sum, a) => {
            const parts = a.pace.split(':');
            return sum + parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }, 0);
        const avgPaceSeconds = Math.round(totalPaceSeconds / activities.length);
        const pMin = Math.floor(avgPaceSeconds / 60);
        const pSec = avgPaceSeconds % 60;
        avgPace = `${pMin}:${pSec.toString().padStart(2, '0')}`;
    }

    const sportCounts = {};
    const sportDistance = {};
    activities.forEach(a => {
        sportCounts[a.sport] = (sportCounts[a.sport] || 0) + 1;
        sportDistance[a.sport] = (sportDistance[a.sport] || 0) + parseFloat(a.distance);
    });

    const sportBreakdown = Object.entries(sportCounts).map(([sport, count]) => 
        `<p style="margin: 5px 0;"><strong>${sport.toUpperCase()}:</strong> ${count} activities, ${sportDistance[sport].toFixed(2)} KM</p>`
    ).join('');

    document.getElementById('stat-distance').textContent = totalDist.toFixed(1) + ' KM';
    document.getElementById('stat-activities').textContent = activities.length;
    document.getElementById('stat-duration').textContent = `${totalHours}h ${totalMinutes}m`;
    document.getElementById('stat-pace').textContent = avgPace;
    document.getElementById('sport-breakdown').innerHTML = sportBreakdown || '<p class="opacity-50">No activities yet</p>';

    const allActivitiesHTML = activities.map(a => `
        <div style="padding: 10px; border-left: 3px solid var(--primary-color); margin-bottom: 8px;">
            <div class="flex-between">
                <span class="text-xs fw-bold text-primary">${a.sport.toUpperCase()}</span>
                <span class="text-xs opacity-50">${a.date}</span>
            </div>
            <p class="text-xs" style="margin-top: 3px;">${a.distance} KM • ${a.duration} • ${a.pace}/KM</p>
        </div>
    `).join('');

    document.getElementById('profile-all-activities').innerHTML = allActivitiesHTML || '<p class="opacity-50">No activities recorded</p>';
}

const quotes = ["You are only 40% done when you feel like quitting.", "Discipline is choosing what you want.", "Comfort is the enemy of growth.", "Consistency beats motivation.", "Be stronger than your excuses."];
function generateQuote() {
    const qEl = document.getElementById("daily-quote");
    if (qEl) qEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

// --- 7. TRACKER & DASHBOARD ---
const tasks = [{ id: 'run', text: 'Morning Push' }, { id: 'code', text: 'Deep Work' }, { id: 'read', text: 'Mindset' }, { id: 'cold', text: 'Comfort Break' }];
function initTracker() {
    const checklistEl = document.getElementById('checklist');
    if (!checklistEl || !currentUser) return;
    const savedData = JSON.parse(localStorage.getItem(`beyond40_tasks_${currentUser.username}`)) || {};
    checklistEl.innerHTML = tasks.map(task => `
        <li class="task-item">
            <span class="${savedData[task.id] ? 'strikethrough' : ''}">${task.text}</span>
            <input type="checkbox" ${savedData[task.id] ? 'checked' : ''} onchange="toggleTask('${task.id}')">
        </li>`).join('');
}
function toggleTask(id) {
    if (!currentUser) return;
    const savedData = JSON.parse(localStorage.getItem(`beyond40_tasks_${currentUser.username}`)) || {};
    savedData[id] = !savedData[id];
    localStorage.setItem(`beyond40_tasks_${currentUser.username}`, JSON.stringify(savedData));
    initTracker();
}

// Alarm logic
function setProtocolAlarm() {
    const time = document.getElementById('alarm-time').value;
    localStorage.setItem('protocolAlarm', time);
    alert(`Protocol Locked: ${time}`);
    startAlarmHeartbeat();
}
function startAlarmHeartbeat() {
    if (alarmInterval) clearInterval(alarmInterval);
    alarmInterval = setInterval(() => {
        const saved = localStorage.getItem('protocolAlarm');
        const now = new Date();
        const cur = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
        if (cur === saved) triggerAlarmAction();
    }, 30000);
}
function triggerAlarmAction() {
    alert("🚨 BEYOND 40% 🚨\nWake up.");
    localStorage.removeItem('protocolAlarm');
}

// 40% Calculator
function runDiagnostic() {
    const input = document.getElementById('user-limit').value;
    const resultsArea = document.getElementById('calculator-results');
    if (input > 0) {
        resultsArea.classList.remove('hidden');
        document.getElementById('brain-limit').innerText = input;
        document.getElementById('true-limit').innerText = Math.round(input / 0.4);
    }
}

// --- 8. THEME INITIALIZATION ---
function initTheme() {
    const body = document.body;
    const themeBtn = document.getElementById("theme-toggle");
    if(!themeBtn) return;
    const icon = themeBtn.querySelector("i");
    
    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
        if(icon) icon.classList.replace("fa-moon", "fa-sun");
    }

    themeBtn.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        const isDark = body.classList.contains("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        if(icon) {
            isDark ? icon.classList.replace("fa-moon", "fa-sun") : icon.classList.replace("fa-sun", "fa-moon");
        }
    });
}

// --- 9. INITIALIZE APP FEATURES ---
function initAppFeatures() {
    generateQuote();
    initTracker();
    initGPSControls();
    loadRunHistory();
    selectSport('running');
    initFriendSearch();
    initMessaging();
    loadFriendsUI();
    loadSocialFeed();
}

// ==========================================
// PHASE 2: SOCIAL FEATURES
// ==========================================

// --- 10. FRIEND SYSTEM ---

async function initFriendSearch() {
    const searchInput = document.getElementById('friend-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length < 2) {
            document.getElementById('search-results').style.display = 'none';
            return;
        }
        
        const result = await api.searchUsers(query);
        const results = result.success ? result.users : [];

        const resultsDiv = document.getElementById('search-results');
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p class="text-xs opacity-50">No users found</p>';
        } else {
            // Get current friends to show 'ADDED' status
            const friendsResult = await api.getFriends();
            const currentFriends = friendsResult.success ? friendsResult.friends.map(f => f.username) : [];

            resultsDiv.innerHTML = results.map(user => {
                const username = user.username;
                const isFriend = currentFriends.includes(username);
                if (username === currentUser.username) return ''; // Don't show self
                
                return `
                    <div style="padding: 10px; background: #111; border: 1px solid #333; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <p class="text-xs fw-bold">${user.name}</p>
                            <p class="text-xs opacity-50">@${username}</p>
                        </div>
                        <button onclick="addFriend('${username}')" class="btn-diagnostic" style="padding: 5px 10px; font-size: 0.7rem; background: ${isFriend ? '#333' : 'var(--primary-color)'};">
                            ${isFriend ? 'ADDED' : 'ADD'}
                        </button>
                    </div>
                `;
            }).join('');
        }
        resultsDiv.style.display = 'block';
    });
}

async function addFriend(friendUsername) {
    const result = await api.addFriend(friendUsername);
    if (result.success) {
        loadFriendsUI();
        loadSocialFeed();
        alert(`${friendUsername} added to friends!`);
    } else {
        alert(result.error || 'Failed to add friend');
    }
}

async function removeFriend(friendUsername) {
    if (confirm(`Remove ${friendUsername} from friends?`)) {
        const result = await api.removeFriend(friendUsername);
        if (result.success) {
            loadFriendsUI();
            loadSocialFeed();
        }
    }
}

async function loadFriendsUI() {
    if (!currentUser) return;
    
    const result = await api.getFriends();
    const friends = result.success ? result.friends : [];
    const friendsContent = document.getElementById('friends-content');

    if (friends.length === 0) {
        friendsContent.innerHTML = '<p class="text-sm opacity-50 text-center">No friends yet. Search to add some!</p>';
        return;
    }

    friendsContent.innerHTML = friends.map(friendUser => {
        const friendUsername = friendUser.username;
        return `
            <div style="padding: 12px; border: 1px solid #333; border-radius: 10px; margin-bottom: 10px; background: #0a0a0a;">
                <div class="flex-between mb-1">
                    <div>
                        <p class="text-xs fw-bold text-primary">${friendUser.name}</p>
                        <p class="text-xs opacity-50">@${friendUsername}</p>
                    </div>
                    <button onclick="removeFriend('${friendUsername}')" class="text-xs" style="background: none; border: none; color: #666; cursor: pointer;">✕</button>
                </div>
                <p class="text-xs opacity-50">${friendUser.bio || 'No bio yet'}</p>
                <button onclick="openChat('${friendUsername}')" class="btn-diagnostic" style="width: 100%; padding: 8px; margin-top: 8px; font-size: 0.75rem;">
                    Message
                </button>
            </div>
        `;
    }).join('');
}

// --- 11. MESSAGING SYSTEM ---

let selectedConversation = null;

function initMessaging() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

async function openChat(friendUsername) {
    selectedConversation = friendUsername;
    document.getElementById('chat-header').textContent = `Chat with @${friendUsername}`;
    document.getElementById('chat-input-area').style.display = 'block';
    loadMessages();
}

async function sendMessage() {
    if (!selectedConversation || !currentUser) return;
    
    const messageInput = document.getElementById('message-input');
    const text = messageInput.value.trim();
    if (!text) return;

    const result = await api.sendMessage(selectedConversation, text);
    if (result.success) {
        messageInput.value = '';
        loadMessages();
        loadConversationsList();
    }
}

async function loadMessages() {
    if (!selectedConversation || !currentUser) return;
    
    const result = await api.getConversation(selectedConversation);
    const messages = result.success ? result.messages : [];
    const chatMessagesDiv = document.getElementById('chat-messages');

    if (messages.length === 0) {
        chatMessagesDiv.innerHTML = '<p class="text-sm opacity-50 text-center">No messages yet. Say hi!</p>';
        return;
    }

    chatMessagesDiv.innerHTML = messages.map(msg => {
        const isFromMe = msg.from_username === currentUser.username;
        const time = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        
        return `
            <div style="margin-bottom: 12px; text-align: ${isFromMe ? 'right' : 'left'};">
                <div style="display: inline-block; max-width: 70%; background: ${isFromMe ? 'var(--primary-color)' : '#333'}; padding: 10px 12px; border-radius: 12px; word-wrap: break-word;">
                    <p class="text-xs opacity-70">${isFromMe ? 'You' : '@' + msg.from_username}</p>
                    <p class="text-sm">${msg.text}</p>
                    <p class="text-xs opacity-50">${time}</p>
                </div>
            </div>
        `;
    }).join('');
    
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

async function loadConversationsList() {
    if (!currentUser) return;
    
    const result = await api.getConversations();
    const conversations = result.success ? result.conversations : [];
    const conversationsList = document.getElementById('conversations-list');

    if (conversations.length === 0) {
        conversationsList.innerHTML = '<p class="text-xs opacity-50">No recent conversations</p>';
        return;
    }

    conversationsList.innerHTML = conversations.map(conv => {
        const otherUser = conv.with_username;

        return `
            <div onclick="openChat('${otherUser}')" style="padding: 10px; background: ${selectedConversation === otherUser ? 'var(--primary-color)' : '#111'}; border: 1px solid #333; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: 0.2s;">
                <div class="flex-between mb-1">
                    <p class="text-xs fw-bold">@${otherUser}</p>
                </div>
                <p class="text-xs opacity-50">${conv.last_message.substring(0, 30)}...</p>
            </div>
        `;
    }).join('');
}

function refreshMessages() {
    loadConversationsList();
    if (selectedConversation) {
        loadMessages();
    }
}

// --- 12. SOCIAL FEED ---

async function loadSocialFeed() {
    if (!currentUser) return;
    
    const result = await api.getSocialFeed();
    const allActivities = result.success ? result.activities : [];
    const feedContent = document.getElementById('feed-content');

    if (allActivities.length === 0) {
        feedContent.innerHTML = '<div class="card bg-black text-center"><p class="text-sm opacity-50">No social activities to show. Add friends!</p></div>';
        return;
    }

    feedContent.innerHTML = allActivities.map(activity => `
        <div class="card bg-dark mb-2">
            <div class="flex-between mb-1">
                <div>
                    <p class="text-sm fw-bold text-primary">${activity.name}</p>
                    <p class="text-xs opacity-50">@${activity.username}</p>
                </div>
                <span class="text-xs text-primary fw-bold">${activity.sport.toUpperCase()}</span>
            </div>
            <p class="text-xs opacity-50 mb-1">${activity.date} at ${activity.time}</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; background: #0a0a0a; border-radius: 8px;">
                <div>
                    <p class="text-xs opacity-50">Distance</p>
                    <p class="text-md text-primary fw-bold">${activity.distance} KM</p>
                </div>
                <div>
                    <p class="text-xs opacity-50">Time</p>
                    <p class="text-md text-primary fw-bold">${activity.duration}</p>
                </div>
                <div>
                    <p class="text-xs opacity-50">Pace</p>
                    <p class="text-md text-primary fw-bold">${activity.pace}/KM</p>
                </div>
                <div>
                    <p class="text-xs opacity-50">Speed</p>
                    <p class="text-md text-primary fw-bold">${activity.speed} KM/H</p>
                </div>
            </div>
        </div>
    `).join('');
}

// --- 5. ACTIVITY MANAGEMENT ---

async function saveActivity() {
    if (totalDistance === 0 || !currentUser) return;

    const elapsed = Date.now() - startTime;
    const elapsedMinutes = elapsed / 60000;
    const avgPace = elapsedMinutes / totalDistance;
    const paceMin = Math.floor(avgPace);
    const paceSec = Math.round((avgPace - paceMin) * 60);
    const avgSpeed = (totalDistance / elapsedMinutes * 60).toFixed(1);

    const activity = {
        sport: currentSport,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
        distance: totalDistance.toFixed(2),
        duration: formatDuration(elapsed),
        pace: `${paceMin}:${paceSec.toString().padStart(2, '0')}`,
        speed: avgSpeed
    };

    const result = await api.createActivity(activity);
    if (result.success) {
        loadRunHistory();
        alert(`Great work! ${currentSport.toUpperCase()} saved!\n${totalDistance.toFixed(2)} KM in ${activity.duration}`);
    } else {
        alert('Failed to save activity to server');
    }
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function loadRunHistory() {
    if (!currentUser) return;
    
    const result = await api.getActivities(10);
    const activities = result.success ? result.activities : [];
    const historyEl = document.getElementById('runs-history');

    if (activities.length === 0) {
        historyEl.innerHTML = '<p class="opacity-50 text-center">No activities yet. Start tracking!</p>';
        return;
    }

    historyEl.innerHTML = activities.slice(0, 10).map(activity => `
        <div style="padding: 12px; border: 1px solid #333; border-radius: 10px; margin-bottom: 10px; background: #0a0a0a;">
            <div class="flex-between" style="margin-bottom: 8px;">
                <span class="text-xs text-primary fw-bold">${activity.sport.toUpperCase()}</span>
                <span class="text-xs opacity-50">${activity.date} @ ${activity.time}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <span class="text-xs opacity-50">Distance</span>
                    <h4 class="text-md text-primary fw-bold">${activity.distance} KM</h4>
                </div>
                <div>
                    <span class="text-xs opacity-50">Duration</span>
                    <h4 class="text-md text-primary fw-bold">${activity.duration}</h4>
                </div>
                <div>
                    <span class="text-xs opacity-50">Pace</span>
                    <h4 class="text-md text-primary fw-bold">${activity.pace}/KM</h4>
                </div>
                <div>
                    <span class="text-xs opacity-50">Speed</span>
                    <h4 class="text-md text-primary fw-bold">${activity.speed} KM/H</h4>
                </div>
            </div>
        </div>
    `).join('');
}

async function clearRunHistory() {
    if (!currentUser) return;
    if (confirm('Are you sure? This will delete your local view, but server data remains permanent in this version.')) {
        // In a full implementation, you'd call an API endpoint to bulk delete
        alert('Bulk delete is not yet implemented in the API. Individual activities must be deleted.');
    }
}