// scripts/dashboard.js
import { auth, db } from "./config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { collection, doc, getDocs, addDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Global State
let currentUser = null;
let currentDate = new Date().toISOString().split('T')[0];
let activities = [];
let totalMinutes = 0;
let pieChartInstance = null; // Store chart instance to prevent duplicates

document.addEventListener("DOMContentLoaded", () => {
    
    // UI References
    const ui = {
        userEmail: document.getElementById("userEmail"),
        logoutBtn: document.getElementById("logoutBtn"),
        dateInput: document.getElementById("date"),
        nameInput: document.getElementById("activityName"),
        catInput: document.getElementById("category"),
        durInput: document.getElementById("duration"),
        addBtn: document.getElementById("addActivityBtn"),
        list: document.getElementById("activityList"),
        remaining: document.getElementById("remaining"),
        statusText: document.getElementById("statusText"),
        analyseBtn: document.getElementById("analyseBtn"),
        analyticsSection: document.getElementById("analyticsSection"),
        totalTime: document.getElementById("totalTime"),
        totalActivities: document.getElementById("totalActivities"),
        totalCats: document.getElementById("totalCategories"),
        breakdown: document.getElementById("categoryBreakdown")
    };

    // Set Default Date
    ui.dateInput.value = currentDate;

    // --- Authentication ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            ui.userEmail.textContent = user.email;
            loadActivities();
        } else {
            window.location.href = "index.html"; // Redirect if not logged in
        }
    });

    // --- Logout ---
    ui.logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "index.html";
    });

    // --- Date Change ---
    ui.dateInput.addEventListener("change", (e) => {
        currentDate = e.target.value;
        ui.analyticsSection.style.display = "none"; // Hide analytics when date changes
        loadActivities();
    });

    // --- Add Activity ---
    ui.addBtn.addEventListener("click", async () => {
        if (!currentUser) return;

        const name = ui.nameInput.value.trim();
        const category = ui.catInput.value;
        const duration = parseInt(ui.durInput.value);

        // Validation
        if (!name || !category || isNaN(duration) || duration <= 0) {
            alert("Please fill in all fields correctly.");
            return;
        }

        // Strict 1440 Limit Check
        if (totalMinutes + duration > 1440) {
            alert(`Cannot add this activity! You only have ${1440 - totalMinutes} minutes remaining in the day.`);
            return;
        }

        ui.addBtn.disabled = true;
        ui.addBtn.textContent = "Adding...";

        try {
            await addDoc(collection(db, "users", currentUser.uid, "days", currentDate, "activities"), {
                name,
                category,
                duration,
                createdAt: Date.now()
            });
            
            // Clear Form
            ui.nameInput.value = "";
            ui.durInput.value = "";
            loadActivities(); // Reload to update UI
        } catch (error) {
            console.error("Error adding:", error);
            alert("Failed to save activity.");
        } finally {
            ui.addBtn.disabled = false;
            ui.addBtn.textContent = "➕ Add Activity";
        }
    });

    // --- Load Data ---
    async function loadActivities() {
        ui.list.innerHTML = '<div style="text-align:center; padding:20px;">Loading...</div>';
        
        try {
            // Fetch activities
            const q = query(
                collection(db, "users", currentUser.uid, "days", currentDate, "activities"), 
                orderBy("createdAt", "asc")
            );
            const snapshot = await getDocs(q);
            
            activities = [];
            totalMinutes = 0;
            ui.list.innerHTML = "";

            if (snapshot.empty) {
                ui.list.innerHTML = `<div class="no-data"><p>📝 No activities logged for ${currentDate}.</p></div>`;
            } else {
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    const act = { id: docSnap.id, ...data };
                    activities.push(act);
                    totalMinutes += act.duration;
                    
                    // Render Item
                    const div = document.createElement("div");
                    div.className = "activity-card";
                    div.innerHTML = `
                        <div class="activity-info">
                            <strong>${act.name}</strong>
                            <small>${act.category} • ${act.duration} min</small>
                        </div>
                        <button class="delete-btn" data-id="${act.id}">🗑️</button>
                    `;
                    
                    // Delete Logic
                    div.querySelector(".delete-btn").addEventListener("click", async () => {
                        if(confirm("Delete this activity?")) {
                            await deleteDoc(doc(db, "users", currentUser.uid, "days", currentDate, "activities", act.id));
                            ui.analyticsSection.style.display = "none"; // Hide analytics if data changes
                            loadActivities();
                        }
                    });
                    
                    ui.list.appendChild(div);
                });
            }

            updateProgress();

        } catch (error) {
            console.error(error);
            if (error.message.includes("indexes")) {
                // Fallback for missing index error on first run, allows app to work without sorting if needed
                ui.list.innerHTML = `<p style="color:red">Firestore Index Error. Check console.</p>`;
            } else {
                ui.list.innerHTML = `<p>Error loading data.</p>`;
            }
        }
    }

    // --- Update UI State ---
    function updateProgress() {
        const remaining = 1440 - totalMinutes;
        ui.remaining.textContent = remaining;

        if (remaining === 0) {
            ui.analyseBtn.disabled = false;
            ui.analyseBtn.textContent = "📊 Analyse Day (Ready)";
            ui.statusText.textContent = "🎉 Day complete! You can now analyze.";
            ui.statusText.style.color = "#00b894";
        } else {
            ui.analyseBtn.disabled = true;
            ui.analyseBtn.textContent = "Log " + remaining + " more mins to Analyse";
            ui.statusText.textContent = `Log exactly 1440 minutes to unlock analysis.`;
            ui.statusText.style.color = "#666";
        }
    }

    // --- Analysis ---
    ui.analyseBtn.addEventListener("click", () => {
        ui.analyticsSection.style.display = "block";
        ui.analyticsSection.scrollIntoView({ behavior: 'smooth' });

        // 1. Stats
        ui.totalTime.textContent = "24h 0m";
        ui.totalActivities.textContent = activities.length;
        
        const catMap = {};
        activities.forEach(a => {
            catMap[a.category] = (catMap[a.category] || 0) + a.duration;
        });
        ui.totalCats.textContent = Object.keys(catMap).length;

        // 2. Breakdown List
        ui.breakdown.innerHTML = "<h4>Category Details</h4>";
        Object.entries(catMap).forEach(([cat, mins]) => {
            const div = document.createElement("div");
            div.className = "category-item";
            div.innerHTML = `<span>${cat}</span> <strong>${mins}m</strong>`;
            ui.breakdown.appendChild(div);
        });

        // 3. Chart.js Pie Chart
        const ctx = document.getElementById("pieChart").getContext("2d");
        
        // Destroy previous chart if exists
        if (pieChartInstance) {
            pieChartInstance.destroy();
        }

        pieChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(catMap),
                datasets: [{
                    data: Object.values(catMap),
                    backgroundColor: [
                        '#6c5ce7', '#00b894', '#fab1a0', '#fd79a8', 
                        '#ffeaa7', '#0984e3', '#636e72', '#e17055'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    });
});