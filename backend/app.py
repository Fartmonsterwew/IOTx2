
from flask import Flask, request, jsonify, send_from_directory
from database import get_connection
from pathlib import Path

app = Flask(__name__)

FRONTEND_FOLDER = Path(__file__).resolve().parent.parent / "frontend"

print("Frontend folder:", FRONTEND_FOLDER)
print("Folder exists:", FRONTEND_FOLDER.exists())
print("Files:", list(FRONTEND_FOLDER.iterdir()) if FRONTEND_FOLDER.exists() else "NOT FOUND")


# Main dashboard
@app.route("/")
def home():
    return send_from_directory(FRONTEND_FOLDER, "index.html")


# Frontend files: CSS, JS and images
@app.route("/frontend/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_FOLDER, filename)


# Receive ESP32 readings
@app.route("/soil", methods=["POST"])
def receive_soil_data():
    data = request.get_json()

    if not data or "soil_moisture" not in data:
        return jsonify({"error": "Missing soil moisture value"}), 400

    soil_value = data["soil_moisture"]

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO Sensor_Readings (soil_moisture_raw)
            VALUES (%s)
        """, (soil_value,))

        connection.commit()
        cursor.close()
        connection.close()

        print("Saved soil moisture:", soil_value)

        return jsonify({"status": "saved"}), 200

    except Exception as e:
        print("Database error:", e)
        return jsonify({"error": str(e)}), 500


# Latest reading
@app.route("/api/soil/latest")
def latest_soil():
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                reading_id,
                DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') AS timestamp,
                soil_moisture_raw
            FROM Sensor_Readings
            WHERE soil_moisture_raw IS NOT NULL
            ORDER BY reading_id DESC
            LIMIT 1
        """)

        result = cursor.fetchone()

        cursor.close()
        connection.close()

        return jsonify(result or {})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Historical readings
@app.route("/api/soil/history")
def soil_history():
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') AS timestamp,
                soil_moisture_raw
            FROM Sensor_Readings
            WHERE soil_moisture_raw IS NOT NULL
            ORDER BY reading_id DESC
            LIMIT 50
        """)

        results = cursor.fetchall()
        results.reverse()

        cursor.close()
        connection.close()

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Receive data from all sensors
@app.route("/sensors", methods=["POST"])
def receive_sensor_data():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No sensor data received"}), 400

    soil = data.get("soil_moisture")
    temperature = data.get("temperature")
    humidity = data.get("humidity")
    light = data.get("light")
    day_night = data.get("day_night")
    gas = data.get("gas")

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO Sensor_Readings (
                soil_moisture_raw,
                temperature,
                humidity,
                light_raw,
                day_night,
                gas_raw
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            soil,
            temperature,
            humidity,
            light,
            day_night,
            gas
        ))

        connection.commit()

        cursor.close()
        connection.close()

        print("Saved sensor data:", data)

        return jsonify({"status": "saved"}), 200

    except Exception as e:
        print("Database error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/sensors/latest", methods=["GET"])
def latest_sensors():
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') AS timestamp,
                soil_moisture_raw,
                temperature,
                humidity,
                light_raw,
                day_night,
                gas_raw
            FROM Sensor_Readings
            WHERE temperature IS NOT NULL
               OR humidity IS NOT NULL
               OR light_raw IS NOT NULL
               OR day_night IS NOT NULL
               OR gas_raw IS NOT NULL
            ORDER BY reading_id DESC
            LIMIT 1
        """)

        result = cursor.fetchone()
        cursor.close()
        connection.close()

        return jsonify(result or {})

    except Exception as e:
        print("Database error:", e)
        return jsonify({"error": str(e)}), 500

    
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
