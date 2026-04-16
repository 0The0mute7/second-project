if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

// ==========================================
// BEYOND 40% - APP ENGINE
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. INITIALIZE APP VIEWS
    showView('dashboard'); 

    // 2. INITIALIZE CORE FEATURES
    generateQuote();
    initTracker();
    initTheme();

    // 3. RESUME ALARMS IF SET
    if (localStorage.getItem('protocolAlarm')) {
        startAlarmHeartbeat();
    }
});

// --- 1. VIEW SWITCHER ---
function showView(viewId) {
    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.add('hidden'));

    const target = document.getElementById('view-' + viewId);
    if (target) {
        target.classList.remove('hidden');
    }

    // Update Nav Icons Styling
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.style.color = "#888";
    });
}

// --- 2. QUOTE SYSTEM ---
const quotes = [
    "You are only 40% done when you feel like quitting.",
    "Discipline is choosing what you want most over what you want now.",
    "Comfort is the enemy of growth.",
    "Consistency beats motivation every time.",
    "Your excuses are weaker than your potential.",
    "Small daily effort creates unstoppable strength.",
    "Pain is temporary. Regret is permanent.",
    "Be stronger than your strongest excuse."
];

function generateQuote() {
    const quoteElement = document.getElementById("daily-quote");
    if (!quoteElement) return;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    quoteElement.textContent = quotes[randomIndex];
}

// --- 3. THEME MANAGEMENT ---
function initTheme() {
    const body = document.body;
    const themeBtn = document.getElementById("theme-toggle");
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

// --- 4. 40% CALCULATOR LOGIC ---
function runDiagnostic() {
    const input = document.getElementById('user-limit').value;
    const resultsArea = document.getElementById('calculator-results');
    const brainLimitSpan = document.getElementById('brain-limit');
    const trueLimitSpan = document.getElementById('true-limit');
    const bar = document.getElementById('bar-40');

    if (input > 0) {
        resultsArea.classList.remove('hidden');
        brainLimitSpan.innerText = input;
        
        const potential = Math.round(input / 0.4);
        trueLimitSpan.innerText = potential;

        if(bar) {
            bar.style.width = "40%";
        }
    } else {
        alert("Excuses don't have numbers. Enter a real value.");
    }
}

// --- 5. DAILY TRACKER & XP LOGIC ---
const tasks = [
    { id: 'run', text: 'Morning Push (Physical)' },
    { id: 'code', text: 'Deep Work (Coding/Project)' },
    { id: 'read', text: 'Mindset Reading' },
    { id: 'cold', text: 'Comfort Zone Break' }
];

function initTracker() {
    const checklistEl = document.getElementById('checklist');
    if (!checklistEl) return;

    const savedData = JSON.parse(localStorage.getItem('beyond40_tasks')) || {};

    checklistEl.innerHTML = tasks.map(task => `
        <li class="task-item">
            <span class="${savedData[task.id] ? 'strikethrough' : ''}">${task.text}</span>
            <input type="checkbox" 
                   ${savedData[task.id] ? 'checked' : ''} 
                   onchange="toggleTask('${task.id}')">
        </li>
    `).join('');

    updateStats(savedData);
}

function toggleTask(id) {
    const savedData = JSON.parse(localStorage.getItem('beyond40_tasks')) || {};
    savedData[id] = !savedData[id];
    localStorage.setItem('beyond40_tasks', JSON.stringify(savedData));
    initTracker();
}

function updateStats(savedData) {
    // 1. Update Streak
    let streak = localStorage.getItem('beyond40_streak') || 0;
    const streakEl = document.getElementById('streak-count');
    if(streakEl) streakEl.innerText = streak;

    // 2. Update XP Bars based on completion
    const completedCount = Object.values(savedData).filter(val => val === true).length;
    const completionPercent = (completedCount / tasks.length) * 100;
    
    const levelBar = document.getElementById('level-xp');
    if (levelBar) levelBar.style.width = completionPercent + "%";
}

// --- 6. OFFLINE ALARM ENGINE ---
function setProtocolAlarm() {
    const alarmTime = document.getElementById('alarm-time').value;
    localStorage.setItem('protocolAlarm', alarmTime);
    alert(`Protocol Locked: ${alarmTime}.`);
    startAlarmHeartbeat();
}

function startAlarmHeartbeat() {
    if (window.alarmInterval) clearInterval(window.alarmInterval);

    window.alarmInterval = setInterval(() => {
        const savedTime = localStorage.getItem('protocolAlarm');
        if (!savedTime) return;

        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ":" + 
                            now.getMinutes().toString().padStart(2, '0');

        if (currentTime === savedTime) {
            triggerAlarmAction();
        }
    }, 30000); 
}

function triggerAlarmAction() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    
    oscillator.type = 'sine';
    oscillator.connect(gain);
    gain.connect(context.destination);
    
    oscillator.start();
    setTimeout(() => oscillator.stop(), 2000);

    alert("🚨 BEYOND 40% 🚨\nWake up. The mission starts now.");
    localStorage.removeItem('protocolAlarm');
}