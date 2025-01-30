// Function to update machine status
function updateStatus(status) {
    localStorage.setItem("machineStatus", status);
    document.getElementById("machineStatus").textContent = status === "1" ? "1" : "0";

    // Notify other pages
    window.dispatchEvent(new Event("storage"));
}

// Function to load machine status
function loadStatus() {
    document.getElementById("machineStatus").textContent =
        localStorage.getItem("machineStatus") === "1" ? "1" : "0";
}

// Event listeners for buttons (only for index.html)
if (document.getElementById("startButton")) {
    document.getElementById("startButton").addEventListener("click", () => updateStatus("1"));
    document.getElementById("stopButton").addEventListener("click", () => updateStatus("0"));
}

// Listen for changes (only for status.html)
if (document.getElementById("start")) {
    window.addEventListener("storage", loadStatus);
    loadStatus();
}
