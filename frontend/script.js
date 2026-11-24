
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
const sensorCharts = {};

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

/* =========================================================
   6. CHART CONFIGURATION
   Create one chart for each sensor
   ========================================================= */

function createSensorChart(canvasId, label, color) {

    const canvas = document.getElementById(canvasId);

    if (!canvas || typeof Chart === "undefined") {
        console.error("Chart unavailable:", canvasId);
        return;
    }

    sensorCharts[canvasId] = new Chart(canvas, {
        type: "line",

        data: {
            labels: [],

            datasets: [{
                label: label,
                data: [],
                borderColor: color,
                backgroundColor: color + "20",
                borderWidth: 2,
                fill: true,
                tension: 0.22,
                spanGaps: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                pointBackgroundColor: color,
                pointBorderColor: color
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
   CREATE ALL FIVE SENSOR CHARTS
   ========================================================= */

function createChart() {

    createSensorChart(
        "soilChart",
        "Soil moisture",
        "#75a8ff"
    );

    createSensorChart(
        "temperatureChart",
        "Air temperature",
        "#ff9875"
    );

    createSensorChart(
        "humidityChart",
        "Air humidity",
        "#65d6c4"
    );

    createSensorChart(
        "lightChart",
        "Light intensity",
        "#f5ce70"
    );

    createSensorChart(
        "gasChart",
        "Gas sensor",
        "#bd91ff"
    );
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

/* =========================================================
   8. SENSOR HISTORY
   Request historical measurements from Flask
   ========================================================= */

async function updateHistory() {

    try {

        const response = await fetch(
            "/api/sensors/history",
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(
                `History endpoint returned ${response.status}`
            );
        }

        const readings = await response.json();

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

        // Associate each chart with its database column
        const chartConfigurations = [
            {
                chart: "soilChart",
                field: "soil_moisture_raw"
            },
            {
                chart: "temperatureChart",
                field: "temperature"
            },
            {
                chart: "humidityChart",
                field: "humidity"
            },
            {
                chart: "lightChart",
                field: "light_raw"
            },
            {
                chart: "gasChart",
                field: "gas_raw"
            }
        ];

        // Update each chart
        chartConfigurations.forEach(config => {

            const chart = sensorCharts[config.chart];

            if (!chart) return;

            const values = readings.map(item => {

                const value = item[config.field];

                return value === null || value === undefined
                    ? null
                    : Number(value);
            });

            chart.data.labels = labels;
            chart.data.datasets[0].data = values;

            chart.update("none");
        });

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

/* =========================================================
   GROWTH PHASE MANAGEMENT
   Select, display and reset the crop growth stage
   ========================================================= */

const growthPhases = [
    {
        name: "Germination / Seedling",
        duration: "10–14 days",
        airTemp: "10–15 / 5–8 °C",
        humidity: "65–75%",
        soilTemp: "7–12 °C",
        sunlight: "0 hours",
        ppfd: "N/A"
    },
    {
        name: "Vegetative",
        duration: "40–50 days",
        airTemp: "14–18 / 6–10 °C",
        humidity: "60–70%",
        soilTemp: "7–12 °C",
        sunlight: "12–14 hours",
        ppfd: "300–450"
    },
    {
        name: "Flowering",
        duration: "20–30 days",
        airTemp: "16–20 / 10–13 °C",
        humidity: "55–65%",
        soilTemp: "7–12 °C",
        sunlight: "14–16 hours",
        ppfd: "500–700"
    },
    {
        name: "Pod Set",
        duration: "25–35 days",
        airTemp: "17–21 / 11–14 °C",
        humidity: "60–65%",
        soilTemp: "7–12 °C",
        sunlight: "15–16 hours",
        ppfd: "600–750"
    },
    {
        name: "Grain Filling",
        duration: "30–40 days",
        airTemp: "18–22 / 11–14 °C",
        humidity: "60–65%",
        soilTemp: "7–12 °C",
        sunlight: "14–15 hours",
        ppfd: "500–650"
    },
    {
        name: "Maturation",
        duration: "15–25 days",
        airTemp: "18–24 / 12–15 °C",
        humidity: "50–55%",
        soilTemp: "7–12 °C",
        sunlight: "12–13 hours",
        ppfd: "300–450"
    }
];


function updateGrowthPhase(phaseIndex) {

    const phase = growthPhases[phaseIndex];

    if (!phase) return;

    document.getElementById("currentPhaseName").textContent =
        phase.name;

    document.getElementById("currentPhaseDuration").textContent =
        `Stage ${phaseIndex + 1} of 6 · ${phase.duration}`;

    document.getElementById("phaseAirTemp").textContent =
        phase.airTemp;

    document.getElementById("phaseHumidity").textContent =
        phase.humidity;

    document.getElementById("phaseSoilTemp").textContent =
        phase.soilTemp;

    document.getElementById("phaseSunlight").textContent =
        phase.sunlight;

    document.getElementById("phasePPFD").textContent =
        phase.ppfd;

    document.getElementById("phaseSelect").value =
        phaseIndex;

    // Save selected phase in the browser
    localStorage.setItem("fieldBeansGrowthPhase", phaseIndex);
}


function initializeGrowthPhase() {

    const phaseSelect = document.getElementById("phaseSelect");
    const resetButton = document.getElementById("resetPhase");

    if (!phaseSelect || !resetButton) return;

    // Load saved phase, or start at the first stage
    const savedPhase = Number(
        localStorage.getItem("fieldBeansGrowthPhase") ?? 0
    );

    const initialPhase =
        Number.isInteger(savedPhase) &&
        savedPhase >= 0 &&
        savedPhase < growthPhases.length
            ? savedPhase
            : 0;

    updateGrowthPhase(initialPhase);

    // Change phase manually
    phaseSelect.addEventListener("change", () => {
        updateGrowthPhase(Number(phaseSelect.value));
    });

    // Reset to the first growth stage
    resetButton.addEventListener("click", () => {
        updateGrowthPhase(0);
    });
}

// Initialize growth phase management
initializeGrowthPhase();