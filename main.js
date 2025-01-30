let machineRunning = false;
let copiesProduced = 0;
let startTime = null;
let timerInterval = null;
let copiesToProduce = 0;
let machineLogs = JSON.parse(localStorage.getItem('machineLogs')) || [];
let operationName = '';
let paused = false;
let repairStartTime = null;
let repairTime = 0;
let repairTimerInterval = null;
let startSchedule = null;
let scheduled = false;
let autoPauseCount = 0;
let manualPauseCount = 0;
let manualPause = false;

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_REPO = 'ahmedsayed7702/plastic';
const GITHUB_FILE_PATH = 'data.json';
const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN'; // Replace with your GitHub token

function showError(message) {
    const errorElement = document.getElementById("error");
    errorElement.innerText = message;
    errorElement.style.display = "block";
}

function clearError() {
    const errorElement = document.getElementById("error");
    errorElement.innerText = "";
    errorElement.style.display = "none";
}

function setOperationName() {
    operationName = document.getElementById("operationNameInput").value.trim();
    if (operationName) {
        document.getElementById("copiesInputContainer").style.display = "block";
        document.getElementById("setOperationNameButton").style.display = "none";
        document.getElementById("operationNameInput").disabled = true;
    } else {
        showError("Operation name is required.");
    }
}

function updateCopiesToProduce() {
    copiesToProduce = parseInt(document.getElementById("copiesInput").value, 10);
    if (copiesToProduce > 0) {
        document.getElementById("choiceContainer").style.display = "block";
    } else {
        showError("Number of copies to produce must be greater than 0.");
    }
}

function selectNow() {
    document.getElementById("controlsContainer").style.display = "block";
    document.getElementById("choiceContainer").style.display = "none";
}

function selectSchedule() {
    document.getElementById("scheduleContainer").style.display = "block";
    document.getElementById("choiceContainer").style.display = "none";
}

function scheduleStartStop() {
    const startTimeInput = document.getElementById("startTimeInput").value;
    if (startTimeInput) {
        const startDateTime = new Date(startTimeInput);
        const now = new Date();
        const startDelay = startDateTime - now;
        if (startDelay > 0) {
            startSchedule = setTimeout(() => {
                scheduled = true;
                startMachine();
            }, startDelay);
            console.log(`Machine scheduled to start at ${startDateTime}`);
        }
    } else {
        startMachine();
    }
    document.getElementById("controlsContainer").style.display = "block";
}

function startMachine() {
    try {
        if (!machineRunning) {
            if (!operationName) {
                showError("Operation name is required to start the machine.");
                return;
            }
            machineRunning = true;
            startTime = new Date();
            timerInterval = setInterval(updateTimer, 1000);
            document.getElementById("machineStatus").innerText = "Machine is operating now";
            document.getElementById("status").style.backgroundColor = "green"; // Change background to green
            clearError();
            console.log("Machine started");
            produceCopy(); // Start producing copies when the machine starts
        }
    } catch (error) {
        showError("Failed to start the machine.");
        console.error(error);
    }
}

function stopMachine() {
    try {
        if (machineRunning) {
            machineRunning = false;
            clearInterval(timerInterval);
            clearInterval(repairTimerInterval);
            document.getElementById("machineStatus").innerText = "Machine is off";
            document.getElementById("status").style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // Change background to transparent black
            const stopTime = new Date();
            const elapsedTime = Math.floor((stopTime - startTime) / 1000);
            machineLogs.push({
                operationName: operationName,
                startTime: startTime.toLocaleString(),
                stopTime: stopTime.toLocaleString(),
                elapsedTime: elapsedTime,
                copiesProduced: copiesProduced,
                repairTime: repairTime,
                scheduled: scheduled,
                autoPauseCount: autoPauseCount,
                manualPauseCount: manualPauseCount
            });
            localStorage.setItem('machineLogs', JSON.stringify(machineLogs));
            updateAdminPage();
            updateOperationsPage();
            clearError();
            console.log("Machine stopped");
            document.getElementById("nicePartMessage").style.display = "block"; // Show the nice part message
            document.getElementById("awesomeGif").style.display = "block"; // Show the awesome gif
            resetToChoice();
            enableOperationNameEdit();
            repairTime = 0; // Reset repair time when the machine stops
        }
    } catch (error) {
        showError("Nice part, check the details.");
        console.error(error);
    }
}

function resetToChoice() {
    document.getElementById("controlsContainer").style.display = "none";
    document.getElementById("scheduleContainer").style.display = "none";
    document.getElementById("choiceContainer").style.display = "block";
}

function enableOperationNameEdit() {
    document.getElementById("operationNameInput").disabled = false;
    document.getElementById("setOperationNameButton").style.display = "block";
}

function repairMachine() {
    try {
        if (machineRunning && !paused) {
            paused = true;
            manualPause = true;
            clearInterval(timerInterval);
            repairStartTime = new Date();
            repairTimerInterval = setInterval(updateRepairTimer, 1000);
            document.getElementById("machineStatus").innerText = "Machine is off";
            document.getElementById("status").style.backgroundColor = "red"; // Change background to red
            document.getElementById("repairTime").style.display = "block";
            manualPauseCount++;
            console.log("Machine paused for repair");
        }
    } catch (error) {
        showError("Failed to pause the machine for repair.");
        console.error(error);
    }
}

function continueMachine() {
    try {
        if (machineRunning && paused) {
            paused = false;
            manualPause = false;
            const repairEndTime = new Date();
            repairTime += Math.floor((repairEndTime - repairStartTime) / 1000);
            clearInterval(repairTimerInterval);
            document.getElementById("repairTime").style.display = "none";
            timerInterval = setInterval(updateTimer, 1000);
            document.getElementById("machineStatus").innerText = "Machine is operating now";
            document.getElementById("status").style.backgroundColor = "green"; // Change background to green
            produceCopy(); // Continue producing copies
            console.log("Machine continued");
        }
    } catch (error) {
        showError("Failed to continue the machine.");
        console.error(error);
    }
}

function showFireworks() {
    const fireworks = document.getElementById("fireworks");
    fireworks.style.display = "block";
    setTimeout(() => {
        fireworks.style.display = "none";
    }, 2000); // Show fireworks for 2 seconds
}

function updateStatusBar(message, color) {
    const statusBar = document.getElementById("statusBar");
    statusBar.innerHTML = `<span style="color: ${color};">${message}</span>`;
}

function produceCopy() {
    try {
        if (machineRunning && !paused && copiesToProduce > 0) {
            updateStatusBar("Forward motor is working for 4 seconds", "green");
            setTimeout(() => {
                updateStatusBar("Progress is in Mould", "yellow");
                setTimeout(() => {
                    copiesProduced++;
                    copiesToProduce--;
                    document.getElementById("copiesProduced").innerText = copiesProduced;
                    document.getElementById("copiesInput").value = copiesToProduce;
                    clearError();
                    console.log(`Copies produced: ${copiesProduced}`);
                    const copiesLeft = 30 - (copiesProduced % 30);
                    document.getElementById("copiesLeft").innerText = `You can produce ${copiesLeft} more copies before needing to add more plastic.`;
                    showFireworks();
                    updateStatusBar("One copy produced", "green");
                    if (copiesProduced % 30 === 0) {
                        showError("Please add more plastic.");
                        stopMachine(); // Stop the machine when it needs more plastic
                    } else if (copiesToProduce === 0) {
                        stopMachine(); // Stop the machine when the selected copies are produced
                    } else {
                        if (!manualPause) {
                            produceCopy(); // Start producing the next copy immediately
                        }
                    }
                }, 2000); // Moulding process takes 4 seconds
            }, 2000); // Forward motor works for 4 seconds
        }
    } catch (error) {
        showError("Failed to produce a copy.");
        console.error(error);
    }
}

function updateTimer() {
    if (machineRunning) {
        const currentTime = new Date();
        const elapsedTime = Math.floor((currentTime - startTime) / 1000);
        document.getElementById("runningTime").innerText = elapsedTime;
        console.log(`Machine running for: ${elapsedTime} seconds`);
    }
}

function updateRepairTimer() {
    const currentTime = new Date();
    const elapsedRepairTime = Math.floor((currentTime - repairStartTime) / 1000);
    document.getElementById("repairTimeValue").innerText = elapsedRepairTime;
    console.log(`Repair time: ${elapsedRepairTime} seconds`);
}

function updateTemperature(sensor, temperature) {
    document.getElementById(`temperature${sensor}`).innerText = `${temperature} °C`;
}

// Simulate receiving temperature data from ESP32
function simulateTemperatureData() {
    for (let i = 1; i <= 4; i++) {
        const temperature = (Math.random() * 30 + 20).toFixed(2); // Random temperature between 20 and 50 °C
        updateTemperature(i, temperature);
    }
    setTimeout(simulateTemperatureData, 5000); // Update every 5 seconds
}

function updateAdminPage() {
    const adminTable = document.getElementById("adminTable");
    adminTable.innerHTML = `
        <tr>
            <th>Operation Name</th>
            <th>Start Time</th>
            <th>Stop Time</th>
            <th>Elapsed Time (seconds)</th>
            <th>Copies Produced</th>
            <th>Repair Time (seconds)</th>
            <th>Scheduled</th>
            <th>Auto Pauses</th>
            <th>Manual Pauses</th>
        </tr>
    `;
    machineLogs.forEach(log => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${log.operationName}</td>
            <td>${log.startTime}</td>
            <td>${log.stopTime}</td>
            <td>${log.elapsedTime}</td>
            <td>${log.copiesProduced}</td>
            <td>${log.repairTime}</td>
            <td>${log.scheduled ? 'Yes' : 'No'}</td>
            <td>${log.autoPauseCount}</td>
            <td>${log.manualPauseCount}</td>
        `;
        adminTable.appendChild(row);
    });
}

function updateOperationsPage() {
    const operationList = document.getElementById("operationList");
    operationList.innerHTML = '';
    machineLogs.forEach(log => {
        const li = document.createElement("li");
        li.textContent = `${log.operationName} - ${log.startTime} - ${log.stopTime} - Copies: ${log.copiesProduced} - Repair Time: ${log.repairTime} seconds - Scheduled: ${log.scheduled ? 'Yes' : 'No'} - Auto Pauses: ${log.autoPauseCount} - Manual Pauses: ${log.manualPauseCount}`;
        operationList.appendChild(li);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    simulateTemperatureData();
    updateAdminPage();
    updateOperationsPage();
});

document.getElementById("setOperationNameButton").addEventListener("click", setOperationName);
document.getElementById("copiesInputButton").addEventListener("click", updateCopiesToProduce);
document.getElementById("nowButton").addEventListener("click", selectNow);
document.getElementById("scheduleButton").addEventListener("click", selectSchedule);
document.getElementById("scheduleStartButton").addEventListener("click", scheduleStartStop);
document.getElementById("startButton").addEventListener("click", startMachine);
document.getElementById("stopButton").addEventListener("click", stopMachine);
document.getElementById("repairButton").addEventListener("click", repairMachine);
document.getElementById("continueButton").addEventListener("click", continueMachine);

//
// Function to update machine status
function updateStatus(status) {
    localStorage.setItem("machineStatus", status);
    document.getElementById("machineStatus").textContent = status === "1" ? "Running" : "Stopped";

    // Notify other pages
    window.dispatchEvent(new Event("storage"));
}

// Function to load machine status
function loadStatus() {
    document.getElementById("machineStatus").textContent =
        localStorage.getItem("machineStatus") === "1" ? "Running" : "Stopped";
}

// Event listeners for buttons (only for index.html)
if (document.getElementById("startButton")) {
    document.getElementById("startButton").addEventListener("click", () => updateStatus("1"));
    document.getElementById("stopButton").addEventListener("click", () => updateStatus("0"));
}

// Listen for changes (only for status.html)
if (document.getElementById("status")) {
    window.addEventListener("storage", loadStatus);
    loadStatus();
}
