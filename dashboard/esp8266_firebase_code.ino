#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <DHT.h>

#define DHTPIN D4
#define DHTTYPE DHT11
#define MQ135PIN A0

DHT dht(DHTPIN, DHTTYPE);

const char* ssid = "RIT A-BLOCK";
const char* password = "RIT@1432#";

String firebaseURL = "https://ecosense-iot-31890-default-rtdb.asia-southeast1.firebasedatabase.app/sensor.json";

void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting...");
  }

  Serial.println("WiFi Connected");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {

    std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
    client->setInsecure();

    HTTPClient http;

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    int airQuality = analogRead(MQ135PIN);

    String data = "{";
    data += "\"temperature\":" + String(temperature) + ",";
    data += "\"humidity\":" + String(humidity) + ",";
    data += "\"airQuality\":" + String(airQuality);
    data += "}";

    http.begin(*client, firebaseURL);
    http.addHeader("Content-Type", "application/json");

    int response = http.PUT(data);

    Serial.print("Firebase Response: ");
    Serial.println(response);

    Serial.println(data);

    http.end();
  }

  delay(5000);
}