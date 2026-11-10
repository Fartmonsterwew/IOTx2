
#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <DFRobot_DHT20.h>

DFRobot_DHT20 dht20;

float temperature = 0;
float humidity = 0;

// WiFi
const char* ssid = "iPhone de Marta (2)";
const char* password = "holaaaaa";

// Flask server
const char* serverURL = "http://172.20.10.2:5000/sensors";

// Soil moisture sensor
const int soilPin = 34;
int soilValue = 0;

void setup() {
  Serial.begin(115200);

  Wire.begin(21, 22);
  pinMode(18, OUTPUT);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }

  Serial.println("\nWiFi connected!");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());

  while (dht20.begin() != 0) {
    Serial.println("DHT20 sensor not detected!");
    delay(10000);
  }

  Serial.println("DHT20 connected successfully!");
}

void loop() {
  temperature = dht20.getTemperature();
  humidity = dht20.getHumidity();

  // Read soil moisture
  soilValue = analogRead(soilPin);

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" C");

  humidity = humidity * 100;
  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("Soil Moisture: ");
  Serial.println(soilValue);

  Serial.println("--------------------");

  
  atom();

  sendSensorData();

  delay(2000);
}

void atom() {

  if (humidity > 80.0) {
    digitalWrite(18, HIGH);
    Serial.println("Atomizer ON");
    delay(10000);

    digitalWrite(18, LOW);
    Serial.println(digitalRead(18));
    delay(10000);

    humidity = dht20.getHumidity();
  }
  
}

void sendSensorData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    String jsonData = "{";
    jsonData += "\"soil_moisture\":" + String(soilValue) + ",";
    jsonData += "\"temperature\":" + String(temperature, 2) + ",";
    jsonData += "\"humidity\":" + String(humidity, 2);
    jsonData += "}";

    Serial.println("Sending sensor data:");
    Serial.println(jsonData);

    int response = http.POST(jsonData);

    Serial.print("HTTP Response: ");
    Serial.println(response);

    http.end();
  } else {
    Serial.println("WiFi disconnected!");
  }
}
