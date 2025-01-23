// background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log("Trailer Spoiler Checker extension installed!");
});

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "reportSpoiler") {
        console.log("Received spoiler report:", message.title);

        // Get token
        chrome.storage.local.get(['token'], (result) => {
            const token = result.token;
            if (!token) {
                sendResponse({ status: "error", message: "User not authenticated!" });
                return;
            }

            // Send the report to the Flask API
            fetch("https://trailer-protection.onrender.com/report_trailer", {  // Replace with your actual backend URL
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ ID: message.ID, title: message.title, type: "spoiler" }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    sendResponse({ status: "success", message: data.message });
                } else {
                    sendResponse({ status: "error", message: data.error || "Failed to report spoiler!" });
                }
            })
            .catch(() => {
                sendResponse({ status: "error", message: "Failed to report spoiler!" });
            });
        });

        // Required for async responses
        return true;
    }
});
