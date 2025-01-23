// content.js

(async function () {
    function getVideoID(url) {
        const urlObj = new URL(url);
        return urlObj.searchParams.get("v"); // Extract the 'v' parameter
    }

    function getVideoTitle() {
        return document.title.replace(" - YouTube", "").trim(); // Extract video title from the page
    }

    const videoID = getVideoID(window.location.href);
    const videoTitle = getVideoTitle();

    try {
        const response = await fetch("https://trailer-protection.onrender.com/check_trailer", {  // Replace with your actual backend URL
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ID: videoID, title: videoTitle })
        });

        const data = await response.json();
        if (response.status !== 200) {
            console.error("Error fetching trailer data:", data.error);
            return;
        }
        const { counts, total_reports } = data;

        function createAlert(message, className, percentage) {
            const warningDiv = document.createElement("div");
            warningDiv.classList.add(className);

            const messageWithPercentage = `${message} (${percentage.toFixed(1)}%)`;

            // Add close button
            const closeButton = document.createElement("span");
            closeButton.textContent = "✖";
            closeButton.classList.add("close-button");
            closeButton.onclick = () => warningDiv.remove(); // Remove the alert on click

            // Add message and close button to the alert
            warningDiv.textContent = messageWithPercentage;
            warningDiv.appendChild(closeButton);
            document.body.appendChild(warningDiv);
        }

        if (data.amazing) {
            const percentage = (counts.amazing / total_reports) * 100;
            createAlert("🤩 Amazing Alert: This trailer has been flagged for being Amazing!", "amazing-warning", percentage);
        }

        if (data.too_much) {
            const percentage = (counts.too_much / total_reports) * 100;
            createAlert("😬 Too Much Alert: This trailer has been flagged for Showing Too Much!", "toomuch-warning", percentage);
        }

        if (data.spoiler) {
            const percentage = (counts.spoiler / total_reports) * 100;
            createAlert("⚠️ Spoiler Alert: This trailer has been flagged for spoilers!", "spoiler-warning", percentage);
        }
    } catch (error) {
        console.error("Error in content script:", error);
    }
})();
