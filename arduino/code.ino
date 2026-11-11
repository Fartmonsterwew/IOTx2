
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

//light sensor
const int lightPin = ;

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

  while (dht20.begin() != 0) {                    // Error checking for DHT20 sensor
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

  // Read light value
  lightValue = analogRead(lightPin);

  Serial.print("Temperature: ");  // Display for Temprature level
  Serial.print(temperature);
  Serial.println(" C");

  humidity = humidity * 100;  // Display for humidity level
  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("Soil Moisture: ");  // Display for soil level
  Serial.println(soilValue);

  Serial.print("light value: "); // Display for light level 
  Serial.println(lightValue);

  Serial.println("--------------------");

  
  if (humidity > 80.0) {
    digitalWrite(18, HIGH);
    Serial.println("Atomizer ON");
    delay(10000);

    digitalWrite(18, LOW);
    Serial.println(digitalRead(18));
    delay(10000);
  }
  sendSensorData();

  delay(2000);
}


void sendSensorData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    String jsonData = "{";
    jsonData += "\"soil_moisture\":" + String(soilValue) + ",";
    jsonData += "\"temperature\":" + String(temperature, 2) + ",";
    jsonData += "\"humidity\":" + String(humidity, 2) + ",";

    jsonData += "\"light\":" + String(lightValue, 2);  //MARTAAAAAAAA pls check me ;-;

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
