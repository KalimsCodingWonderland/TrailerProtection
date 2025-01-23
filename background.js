// background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log("Trailer Protection extension installed!");
});

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "reportSpoiler") {
        console.log("Received spoiler report:", message.title);

        // Get token
        chrome.storage.local.get(['token'], async (result) => {
            const token = result.token;
            if (!token) {
                sendResponse({ status: "error", message: "User not authenticated!" });
                return;
            }

            try {
                const response = await fetch("https://trailer-protection.onrender.com/report_trailer", {  // Replace with your actual backend URL
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ ID: message.ID, title: message.title, type: "spoiler" }),
                });

                const data = await response.json();

                if (response.ok) {
                    sendResponse({ status: "success", message: data.message });
                } else if (response.status === 401) {
                    sendResponse({ status: "error", message: "Session expired. Please log in again." });
                    chrome.storage.local.remove(['token'], () => {
                        // Optionally, notify the popup to show the login form
                    });
                } else {
                    sendResponse({ status: "error", message: data.error || "Failed to report spoiler!" });
                }
            } catch (error) {
                console.error("Error reporting spoiler:", error);
                sendResponse({ status: "error", message: "Failed to report spoiler!" });
            }
        });

        // Required for async responses
        return true;
    }
});
