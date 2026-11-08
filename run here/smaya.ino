long start = 0;
int max_seconds = 30;
long i = 2;
long found = 0;

void setup() {
    Serial.begin(115200);

    while (!Serial) {}

    Serial.println("");
    Serial.print("Rnning prime benchmark for ");
    Serial.print(max_seconds);
    Serial.println(" Seconds...");

    start = millis();
    
}

void loop() {
    
}
