

int soilPin = ;
int soilValue = 0; 

// This is for the temperature and humidity sensor
// DHT20 uses I2C communication
#define DHTTYPE DHT20
DHT dht(DHTTYPE);


void setup() {
    Serial.begin(96000);

    //This is for the water atomizer
    pinMode( , OUTPUT);// Add Me!
    pinMode( , INPUT); //Add Me!
    //water atomizer finish
}

void loop() {

}


void atoms () {

    int D2Sig = digitalRead();//add me!

    if (D2Sig ==1)
    {
        digitalWrite( , HIGH);
        delay(1000);
        digitalWrite( , LOW);
    }
    
}

void soil () {
    sensorValue = analogRead(sensorPin);
    Serial.print("Moisture = " );
    Serial.println(sensorValue);
    delay(1000);
}

void gas () {
    float gas_volt;
    float gasValue;

    gasValue = analogRead();
    gas_volt = gasValue/1024*5.0;

    Serila.print("Gas_volt = ");
    Serial.print(gas_volt);
    Serial.println("V");
    delay(1000);
}

void lightSensor() {
    lightValue = analogRead(lightPin);

    Serial.print("Light = ");
    Serial.println(lightValue);

    delay(1000);
}


void temperatureHumiditySensor() {
    float temp_hum_val[2] = {0};

    if (!dht.readTempAndHumidity(temp_hum_val)) {
        Serial.print("Humidity = ");
        Serial.print(temp_hum_val[0]);
        Serial.println(" %");

        Serial.print("Temperature = ");
        Serial.print(temp_hum_val[1]);
        Serial.println(" °C");
    } else {
        Serial.println("Failed to read temperature and humidity");
    }

    delay(1500);
}
