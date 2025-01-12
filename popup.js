//popup.js

// Function to extract the video ID (base ID)
function getVideoID(url) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("v"); // Extract the 'v' parameter
}

document.getElementById("reportAmazingTrailer").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const videoID = getVideoID(tab.url);
    const videoTitle = tab.title.replace(" - YouTube", "").trim(); // Get the video title

    if (!videoTitle.toLowerCase().includes("trailer")) {
        alert("A report has not been submitted because this video is not a trailer.");
        return;
    }

    await fetch("https://trailer-protection.onrender.com/report_trailer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: videoID, title: videoTitle, type: "amazing" })
    });

    alert("Trailer report submitted for an Amazing Trailer!");
});

document.getElementById("reportTooMuch").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const videoID = getVideoID(tab.url);
    const videoTitle = tab.title.replace(" - YouTube", "").trim();

    if (!videoTitle.toLowerCase().includes("trailer")) {
        alert("A report has not been submitted because this video is not a trailer.");
        return;
    }

    await fetch("https://trailer-protection.onrender.com/report_trailer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: videoID, title: videoTitle, type: "too_much" })
    });

    alert("Trailer report submitted for showing too much!");
});

document.getElementById("reportSpoiler").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const videoID = getVideoID(tab.url);
    const videoTitle = tab.title.replace(" - YouTube", "").trim();

    if (!videoTitle.toLowerCase().includes("trailer")) {
        alert("A report has not been submitted because this video is not a trailer.");
        return;
    }

    await fetch("https://trailer-protection.onrender.com/report_trailer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: videoID, title: videoTitle, type: "spoiler" })
    });

    alert("Trailer report submitted for spoiler(s)!");
});
