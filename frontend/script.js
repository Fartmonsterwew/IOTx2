
/* =========================================================
   FIELD BEANS - DASHBOARD JAVASCRIPT
   Main purpose: Update sensor values and dashboard elements
   ========================================================= */


/* =========================================================
   1. DOM ELEMENTS
   Get references to HTML elements
   ========================================================= */

// Soil moisture elements
const soilValue = document.getElementById("soilValue");
const soilStatus = document.getElementById("soilStatus");
const soilUpdate = document.getElementById("soilUpdate");

// System connection elements
const deviceStatus = document.getElementById("deviceStatus");
const connectionText = document.getElementById("connectionText");
const connectionDot = document.getElementById("connectionDot");

// Database information
const lastUpdate = document.getElementById("lastUpdate");
const readingCount = document.getElementById("readingCount");

// Historical chart
let soilChart;


/* =========================================================
   2. SENSOR CONFIGURATION
   Define the initial state of sensors not yet integrated
   ========================================================= */

const pendingSensors = [
    {
        name: "temperature",
        valueId: "temperatureValue",
        statusId: "temperatureStatus",
        messageId: "temperatureMessage",
        updateId: "temperatureUpdate"
    },
    {
        name: "humidity",
        valueId: "humidityValue",
        statusId: "humidityStatus",
        messageId: "humidityMessage",
        updateId: "humidityUpdate"
    },
    {
        name: "light",
        valueId: "lightValue",
        statusId: "lightStatus",
        messageId: "lightMessage",
        updateId: "lightUpdate"
    },
    {
        name: "gas",
        valueId: "gasValue",
        statusId: "gasStatus",
        messageId: "gasMessage",
        updateId: "gasUpdate"
    }
];


/* =========================================================
   3. DATE HANDLING
   Convert MySQL timestamps into JavaScript dates
   ========================================================= */

function parseDate(value) {
    if (!value) return null;

    return new Date(value.replace(" ", "T"));
}


/* =========================================================
   4. CONNECTION STATUS
   Update the ESP32 connection indicator
   ========================================================= */

function setConnection(isOnline, label) {
    const text = label || (
        isOnline ? "ESP32 ONLINE" : "ESP32 OFFLINE"
    );

    connectionText.textContent = text;

    connectionDot.classList.toggle(
        "online",
        Boolean(isOnline)
    );

    connectionDot.classList.toggle(
        "offline",
        !isOnline
    );
}


/* =========================================================
   5. PENDING SENSOR INITIALIZATION
   Keep sensors marked as not connected until integration
   ========================================================= */

function initializePendingSensors() {
    pendingSensors.forEach(sensor => {
        document.getElementById(sensor.valueId).textContent = "--";

        document.getElementById(sensor.statusId).textContent =
            "NOT CONNECTED";

        document.getElementById(sensor.messageId).innerHTML =
            "AWAITING SENSOR<br>INTEGRATION";

        document.getElementById(sensor.updateId).textContent =
            "CHANNEL PENDING";
    });
}


/* =========================================================
   6. CHART CONFIGURATION
   Create the historical soil moisture chart
   ========================================================= */

function createChart() {
    const canvas = document.getElementById("soilChart");

    if (!canvas || typeof Chart === "undefined") {
        console.error("Chart.js is unavailable.");
        return;
    }

    soilChart = new Chart(canvas, {
        type: "line",

        data: {
            labels: [],

            datasets: [{
                label: "Soil moisture raw value",
                data: [],
                borderColor: "#75a8ff",
                backgroundColor: "rgba(65, 125, 235, 0.13)",
                borderWidth: 2,
                fill: true,
                tension: 0.22,
                pointRadius: 2,
                pointHoverRadius: 5,
                pointBackgroundColor: "#dce9ff",
                pointBorderColor: "#75a8ff"
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor: "#101a2c",
                    titleColor: "#a9c7ff",
                    bodyColor: "#ffffff",
                    borderColor: "#304568",
                    borderWidth: 1,
                    padding: 12
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#8291ad",
                        maxTicksLimit: 7,

                        font: {
                            family: "DM Sans",
                            size: 10
                        }
                    },

                    grid: {
                        display: false
                    },

                    border: {
                        color: "#263650"
                    }
                },

                y: {
                    beginAtZero: true,

                    ticks: {
                        color: "#8291ad",

                        font: {
                            family: "DM Sans",
                            size: 10
                        }
                    },

                    grid: {
                        color: "rgba(111, 139, 183, 0.13)"
                    },

                    border: {
                        display: false
                    }
                }
            }
        }
    });
}


/* =========================================================
   7. LATEST SOIL MOISTURE READING
   Request the latest measurement from Flask
   ========================================================= */

async function updateLatestReading() {
    try {
        const response = await fetch(
            "/api/soil/latest",
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(
                `Latest endpoint returned ${response.status}`
            );
        }

        const data = await response.json();

        // Check if a measurement exists
        if (!data.reading_id) {
            soilValue.textContent = "--";
            soilStatus.textContent = "NO DATA";
            soilUpdate.textContent = "WAITING FOR DATA";

            deviceStatus.textContent = "NO DATA";
            setConnection(false, "NO MEASUREMENTS");

            return;
        }

        // Display the raw sensor value
        soilValue.textContent =
            data.soil_moisture_raw ?? "--";

        soilStatus.textContent = "ACTIVE SENSOR";

        // Calculate ESP32 connection status
        const readingDate = parseDate(data.timestamp);

        const age = readingDate
            ? Date.now() - readingDate.getTime()
            : Infinity;

        const isOnline = age >= -5000 && age < 20000;

        deviceStatus.textContent = isOnline
            ? "CONNECTED"
            : "OFFLINE";

        soilUpdate.textContent = isOnline
            ? "DATA RECEIVED"
            : "LAST READING";

        setConnection(isOnline);

        // Display the last measurement time
        if (
            readingDate &&
            !Number.isNaN(readingDate.getTime())
        ) {
            lastUpdate.textContent =
                readingDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                });
        }

    } catch (error) {
        console.error("Latest reading error:", error);

        deviceStatus.textContent = "UNAVAILABLE";
        soilStatus.textContent = "UNAVAILABLE";
        soilUpdate.textContent = "SERVER UNAVAILABLE";

        setConnection(false, "SERVER UNAVAILABLE");
    }
}


/* =========================================================
   8. SOIL MOISTURE HISTORY
   Request historical measurements from Flask
   ========================================================= */

async function updateHistory() {
    try {
        const response = await fetch(
            "/api/soil/history",
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(
                `History endpoint returned ${response.status}`
            );
        }

        const readings = await response.json();

        if (!soilChart) return;

        // Convert timestamps into chart labels
        const labels = readings.map(item => {
            const date = parseDate(item.timestamp);

            return date
                ? date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                })
                : "--:--:--";
        });

        // Extract raw sensor values
        const values = readings.map(
            item => item.soil_moisture_raw
        );

        // Update chart data
        soilChart.data.labels = labels;
        soilChart.data.datasets[0].data = values;

        soilChart.update("none");

        // Update measurement counter
        readingCount.textContent =
            `${readings.length} MEASUREMENTS`;

    } catch (error) {
        console.error("History error:", error);
    }
}


/* =========================================================
   9. DASHBOARD REFRESH
   Refresh all currently integrated data
   ========================================================= */

async function updateOtherSensors() {
    try {
        const response = await fetch("/api/sensors/latest");

        if (!response.ok) {
            throw new Error("API error");
        }

        const data = await response.json();

        if (!data || Object.keys(data).length === 0) return;

        const sensors = [
            {
                value: "temperatureValue",
                status: "temperatureStatus",
                message: "temperatureMessage",
                update: "temperatureUpdate",
                field: "temperature"
            },
            {
                value: "humidityValue",
                status: "humidityStatus",
                message: "humidityMessage",
                update: "humidityUpdate",
                field: "humidity"
            },
            {
                value: "lightValue",
                status: "lightStatus",
                message: "lightMessage",
                update: "lightUpdate",
                field: "light_raw"
            },
            {
                value: "gasValue",
                status: "gasStatus",
                message: "gasMessage",
                update: "gasUpdate",
                field: "gas_raw"
            }
        ];

        sensors.forEach(sensor => {
            const value = data[sensor.field];

            if (value === null || value === undefined) return;

            document.getElementById(sensor.value).textContent = value;
            document.getElementById(sensor.status).textContent = "ACTIVE";
            document.getElementById(sensor.message).textContent = "DATA RECEIVED";
            document.getElementById(sensor.update).textContent = "LATEST READING";
        });

        // Day / Night classification
        if (data.day_night) {
            document.getElementById("lightMessage").textContent =
                "DAY / NIGHT: " + data.day_night.toUpperCase();
        }

    } catch (error) {
        console.error("Error updating sensors:", error);
    }
}


async function refreshDashboard() {
    await Promise.all([
        updateLatestReading(),
        updateHistory(),
        updateOtherSensors()
    ]);
}

/* =========================================================
   10. DESKTOP / MOBILE PREVIEW
   Switch between desktop and mobile layouts
   ========================================================= */

const desktopButton = document.getElementById("desktopView");
const mobileButton = document.getElementById("mobileView");

desktopButton?.addEventListener("click", () => {
    document.body.classList.remove("preview-mobile");

    desktopButton.classList.add("active");
    mobileButton.classList.remove("active");
});

mobileButton?.addEventListener("click", () => {
    document.body.classList.add("preview-mobile");

    mobileButton.classList.add("active");
    desktopButton.classList.remove("active");
});


/* =========================================================
   11. DASHBOARD INITIALIZATION
   Start the dashboard and automatic refresh
   ========================================================= */

// Initialize sensors that are not integrated yet
initializePendingSensors();

// Create the soil moisture chart
createChart();

// Load the first measurements
refreshDashboard();

// Refresh data every 5 seconds
setInterval(refreshDashboard, 5000);
