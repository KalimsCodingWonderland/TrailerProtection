//Background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log("Trailer Spoiler Checker extension installed!");
});

// Listener for messages from the content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "reportSpoiler") {
        console.log("Received spoiler report:", message.title);

        // Send the report to the Python API
        fetch("http://127.0.0.1:5000/report_spoiler", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: message.title }),
        })
        .then(() => {
            sendResponse({ status: "success", message: "Spoiler reported successfully!" });
        })
        .catch(() => {
            sendResponse({ status: "error", message: "Failed to report spoiler!" });
        });

        // Required for async responses
        return true;
    }
});
