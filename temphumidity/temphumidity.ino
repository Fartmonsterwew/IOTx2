
#include <Wire.h>
#include <DFRobot_DHT20.h>

DFRobot_DHT20 dht20;

float temperature = 0;
float humidity = 0;

void setup() {
  Serial.begin(115200);

  Wire.begin(21, 22);
  pinMode(18, OUTPUT);

  while (dht20.begin() != 0) {
    Serial.println("DHT20 sensor not detected!");
    delay(10000);
  }

  Serial.println("DHT20 connected successfully!");
}

void loop() {
  temperature = dht20.getTemperature();
  humidity = dht20.getHumidity();

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" C");

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.println("--------------------");

  atom();

  delay(2000);

 
}

void atom(){
  while (humidity > 80.0) {
    digitalWrite(18, HIGH);
    Serial.println("Atomizer ON");
    delay(10000);

    digitalWrite(18, LOW);
    Serial.println(digitalRead(18));
    delay(10000);

    humidity = dht20.getHumidity();
  }
}
