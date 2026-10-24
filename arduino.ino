

int soilPin = ;
int soilValue = 0; 


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