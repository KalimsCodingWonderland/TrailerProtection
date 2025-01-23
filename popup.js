// popup.js with encryption

// Utility function to switch forms
function showForm(form) {
    document.getElementById('login-form').style.display = (form === 'login') ? 'block' : 'none';
    document.getElementById('register-form').style.display = (form === 'register') ? 'block' : 'none';
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('report-container').style.display = 'none';
}

// Utility function to show report container
function showReport() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('report-container').style.display = 'block';
}

// Show register form
document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    showForm('register');
});

// Show login form
document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    showForm('login');
});

// Handle registration
document.getElementById('register-button').addEventListener('click', async () => {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();

    if (!username || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const response = await fetch("https://trailer-protection.onrender.com/register", {  // Replace with your actual backend URL
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (response.status === 201) {
            alert("Registration successful! Please login.");
            showForm('login');
        } else {
            alert(data.error || "Registration failed.");
        }
    } catch (error) {
        console.error("Error during registration:", error);
        alert("An error occurred during registration. Please try again.");
    }
});

// Handle login
document.getElementById('login-button').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch("https://trailer-protection.onrender.com/login", {  // Replace with your actual backend URL
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.status === 200) {
            // Store token in Chrome storage
            chrome.storage.local.set({ token: data.token }, () => {
                console.log("Token stored:", data.token); // Debugging line (optional)
                showReport();
            });
        } else {
            alert(data.error || "Login failed.");
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred during login. Please try again.");
    }
});

// Handle logout
document.getElementById('logout-button').addEventListener('click', () => {
    chrome.storage.local.remove(['token'], () => {
        showForm('login');
    });
});

// Function to get JWT token
function getToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['token'], (result) => {
            console.log("Token retrieved:", result.token); // Debugging line (optional)
            resolve(result.token);
        });
    });
}

// Report functions
async function reportTrailer(type) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const urlObj = new URL(tab.url);
    const videoID = urlObj.searchParams.get("v");
    const videoTitle = tab.title.replace(" - YouTube", "").trim();

    if (!videoTitle.toLowerCase().includes("trailer")) {
        alert("A report has not been submitted because this video is not a trailer.");
        return;
    }

    const token = await getToken();
    if (!token) {
        alert("You must be logged in to report.");
        return;
    }

    try {
        const response = await fetch("https://trailer-protection.onrender.com/report_trailer", {  // Replace with your actual backend URL
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ ID: videoID, title: videoTitle, type })
        });

        const data = await response.json();

        if (response.ok) { // Equivalent to response.status in the 200 range
            alert(`Trailer report submitted for ${type.replace('_', ' ')}!`);
        } else if (response.status === 401) {
            alert("Session expired. Please log in again.");
            chrome.storage.local.remove(['token'], () => {
                showForm('login');
            });
        } else {
            alert(data.error || "Failed to submit report.");
        }
    } catch (error) {
        console.error(`Error reporting ${type}:`, error);
        alert("An error occurred while submitting the report. Please try again.");
    }
}

// Event listeners for report buttons
document.getElementById("reportAmazingTrailer").addEventListener("click", () => {
    reportTrailer("amazing");
});

document.getElementById("reportTooMuch").addEventListener("click", () => {
    reportTrailer("too_much");
});

document.getElementById("reportSpoiler").addEventListener("click", () => {
    reportTrailer("spoiler");
});

// Initialize popup based on authentication status
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['token'], (result) => {
        if (result.token) {
            showReport();
        } else {
            showForm('login');
        }
    });
});
