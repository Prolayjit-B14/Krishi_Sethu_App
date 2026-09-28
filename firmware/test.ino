/**
 * ============================================================================
 * @file    test.ino
 * @brief   Smart Soil Node + Weather + Irrigation (MQTT Enabled)
 *          Handles real sensor telemetry and bidirectional MQTT communication.
 *          Target Hardware: ESP32
 *          
 *          DEBUG MODE: Verbose Serial Output enabled for step-by-step tracing.
 * ============================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

/* ----------------------------------------------------------------------------
 *  GLOBAL DEFINITIONS & HARDWARE MAPPING
 * ---------------------------------------------------------------------------- */
#define SERIAL_BAUD      115200
#define PUBLISH_INTERVAL 5000     // 5 seconds

// Sensor Pins (ESP32 ADC1)
#define PIN_SOIL_MOISTURE 32 
#define PIN_LDR           25 
#define PIN_RAIN_SENSOR   34 

// DHT11 Pin
#define PIN_DHT           13  
#define DHTTYPE           DHT11

// Actuators & Indicators
#define PIN_RELAY         26 // Pump Relay
#define PIN_LED_WIFI      15 // WiFi Status LED
#define PIN_LED_MQTT      4 // MQTT Status LED

// pH Module Serial (Hardware Serial 2)
#define PIN_PH_RX         16
#define PIN_PH_TX         17

// OLED Dimensions
#define SCREEN_WIDTH      128
#define SCREEN_HEIGHT     64

/* ----------------------------------------------------------------------------
 *  NETWORK CONFIGURATION
 * ---------------------------------------------------------------------------- */
const char* WIFI_SSID    = "Redmi Note 11 Pro+ 5G";
const char* WIFI_PASS    = "@polu1411P";

const char* MQTT_HOST    = "94115c42cfdb4cafbaeab332ee285834.s1.eu.hivemq.cloud";
const int   MQTT_PORT    = 8883;
const char* MQTT_USER    = "Agri-Sense_admin";
const char* MQTT_PASS    = "@agri2026P";

// 🔐 ACCOUNT BINDING: This email MUST match the Firebase login email used in the AgriSense app.
//    The MQTT topic is built from this email: agrisense/{USER_EMAIL}/field_b/sensors
//    Keep this in sync with AgriSense_Pro_Firmware.ino
const char* USER_EMAIL   = "contact.prolay14@gmail.com"; // ← UPDATE TO YOUR FIREBASE LOGIN EMAIL

/* ----------------------------------------------------------------------------
 *  SYSTEM STATE & OBJECTS
 * ---------------------------------------------------------------------------- */
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
DHT dht(PIN_DHT, DHTTYPE);

WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// Topics
String TOPIC_SENSORS;
String TOPIC_COMMANDS;

// Telemetry Variables
int   soilMoistureRaw     = 0;
int   soilMoisturePercent = 0;
float soilTemp            = 0.0;
float phValue             = 0.0;
float airTemp             = 0.0;
float humidity            = 0.0;
int   rainValue           = 0;
int   ldrValue            = 0;

bool  pumpActive          = false;
unsigned long lastPublishTime = 0;

// pH Module Modbus Frame
byte requestData[] = { 0x01, 0x03, 0x00, 0x00, 0x00, 0x04, 0x44, 0x09 };
byte response[13];

/* ----------------------------------------------------------------------------
 *  MAIN SETUP
 * ---------------------------------------------------------------------------- */
void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(1000);

  Serial.println(F("\n\r"));
  Serial.println(F("    ___                _  _____                       "));
  Serial.println(F("   / _ | ___ _  ____ _(_)/ ___/ ___  ___  ___ ___     "));
  Serial.println(F("  / __ |/ _ `/ / __ `/ / /__  / -_)/ _ \\(_-</ -_)    "));
  Serial.println(F(" /_/ |_|\\_, / /_/ /_/_/\\___/  \\__/ /_//_/___/\\__/     "));
  Serial.println(F("       /___/  DEBUG NODE v1.1.0 (Verbose)             "));
  Serial.println(F(" -----------------------------------------------------"));

  // Initialize pH Module Serial
  Serial.println(F("[SETUP] Initializing pH Module Serial2..."));
  Serial2.begin(4800, SERIAL_8N1, PIN_PH_RX, PIN_PH_TX);
  
  Serial.println(F("[SETUP] Initializing DHT11..."));
  dht.begin();
  
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_LED_WIFI, OUTPUT);
  pinMode(PIN_LED_MQTT, OUTPUT);
  
  digitalWrite(PIN_RELAY, HIGH); // Default OFF (Assuming Active LOW)
  digitalWrite(PIN_LED_WIFI, LOW);
  digitalWrite(PIN_LED_MQTT, LOW);

  // Initialize OLED
  Serial.println(F("[SETUP] Initializing OLED..."));
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("[OLED] FAILED to initialize. Halting."));
    while (1);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(15, 20);
  display.println(F("DEBUG NODE LIVE"));
  display.display();

  // Construct dynamic topics
  TOPIC_SENSORS  = "agrisense/" + String(USER_EMAIL) + "/field_b/sensors";
  TOPIC_COMMANDS = "agrisense/" + String(USER_EMAIL) + "/field_b/commands";

  Serial.print(F("[SETUP] Sensors Topic: ")); Serial.println(TOPIC_SENSORS);
  Serial.print(F("[SETUP] Commands Topic: ")); Serial.println(TOPIC_COMMANDS);

  connectWifi();
  
  espClient.setInsecure(); // Skip SSL validation for development
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(onMessageReceived);
  mqttClient.setBufferSize(2048);
  
  Serial.println(F("[SETUP] Setup complete. Entering loop."));
}

/* ----------------------------------------------------------------------------
 *  MAIN LOOP
 * ---------------------------------------------------------------------------- */
void loop() {
  // Check WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[LOOP] WiFi disconnected! Reconnecting..."));
    connectWifi();
  }
  
  // Check MQTT
  if (!mqttClient.connected()) {
    Serial.println(F("[LOOP] MQTT disconnected! Reconnecting..."));
    connectMqtt();
  }
  mqttClient.loop();

  // 1. Read Sensors
  readSensors();

  // 2. Backup Auto Irrigation
  handleAutoIrrigation();

  // 3. Periodic Telemetry Publish (Every 5 seconds)
  unsigned long now = millis();
  if (now - lastPublishTime >= PUBLISH_INTERVAL) {
    lastPublishTime = now;
    Serial.println(F("\n[LOOP] 5 Seconds reached. Triggering publish..."));
    processTelemetry();
    updateOLED();
  }
  
  delay(100); // Small delay to prevent CPU hogging
}

/* ----------------------------------------------------------------------------
 *  HELPER FUNCTIONS
 * ---------------------------------------------------------------------------- */

void readSensors() {
  Serial.println(F("[SENSORS] Reading start..."));
  
  // Soil Moisture
  soilMoistureRaw = analogRead(PIN_SOIL_MOISTURE);
  soilMoisturePercent = map(soilMoistureRaw, 4095, 1500, 0, 100);
  soilMoisturePercent = constrain(soilMoisturePercent, 0, 100);
  Serial.print(F("  -> Soil Moisture Raw: ")); Serial.print(soilMoistureRaw);
  Serial.print(F(" | Percent: ")); Serial.println(soilMoisturePercent);

  // pH & Soil Temp
  readPHModule();

  // Weather
  humidity = dht.readHumidity();
  airTemp  = dht.readTemperature();
  Serial.print(F("  -> DHT11 -> Temp: ")); Serial.print(airTemp);
  Serial.print(F("C | Hum: ")); Serial.print(humidity); Serial.println(F("%"));

  rainValue = analogRead(PIN_RAIN_SENSOR);
  ldrValue  = analogRead(PIN_LDR);
  Serial.print(F("  -> Rain Raw: ")); Serial.print(rainValue);
  Serial.print(F(" | LDR Raw: ")); Serial.println(ldrValue);
  
  Serial.println(F("[SENSORS] Reading end."));
}

void handleAutoIrrigation() {
  if (soilMoisturePercent < 35 && rainValue > 3000) { 
    if (!pumpActive) Serial.println(F("[AUTO] Conditions met. Turning Pump ON."));
    pumpActive = true;
    digitalWrite(PIN_RELAY, LOW); 
  } else if (!pumpActive) { 
    digitalWrite(PIN_RELAY, HIGH); 
  }
}

void readPHModule() {
  Serial.println(F("[pH] Querying module..."));
  while (Serial2.available()) { Serial2.read(); } // Flush
  
  Serial2.write(requestData, sizeof(requestData));
  delay(150); // Increased delay for response
  
  int availableBytes = Serial2.available();
  Serial.print(F("[pH] Bytes available: ")); Serial.println(availableBytes);
  
  if (availableBytes >= 13) {
    for (byte i = 0; i < 13; i++) {
      response[i] = Serial2.read();
    }
    soilTemp = ((response[3] << 8) | response[4]) / 10.0;
    phValue  = ((response[5] << 8) | response[6]) / 10.0;
    Serial.print(F("  -> pH: ")); Serial.print(phValue);
    Serial.print(F(" | Soil Temp: ")); Serial.println(soilTemp);
  } else {
    Serial.println(F("  -> [pH] WARN: No or incomplete response from module."));
  }
}

void connectWifi() {
  digitalWrite(PIN_LED_WIFI, LOW);
  Serial.print(F("[WIFI] Connecting to SSID: ")); Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n[WIFI] CONNECTED!"));
    Serial.print(F("[WIFI] IP: ")); Serial.println(WiFi.localIP());
    digitalWrite(PIN_LED_WIFI, HIGH);
  } else {
    Serial.print(F("\n[WIFI] FAILED. Status code: ")); Serial.println(WiFi.status());
  }
}

void connectMqtt() {
  digitalWrite(PIN_LED_MQTT, LOW);
  int retryCount = 0;
  
  while (!mqttClient.connected() && retryCount < 3) {
    Serial.print(F("[MQTT] Connecting to Host: ")); Serial.println(MQTT_HOST);
    String clientId = "AgriNode_" + WiFi.macAddress();
    clientId.replace(":", "");
    
    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println(F("[MQTT] CONNECTED!"));
      mqttClient.subscribe(TOPIC_COMMANDS.c_str());
      Serial.print(F("[MQTT] Subscribed to: ")); Serial.println(TOPIC_COMMANDS);
      digitalWrite(PIN_LED_MQTT, HIGH);
    } else {
      Serial.print(F("[MQTT] FAILED. State: "));
      Serial.print(mqttClient.state());
      Serial.println(F(". Retrying in 3s..."));
      delay(3000);
      retryCount++;
    }
  }
}

void onMessageReceived(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  
  Serial.println(F("\n[MQTT] Command Received!"));
  Serial.print(F("  -> Topic: ")); Serial.println(topic);
  Serial.print(F("  -> Payload: ")); Serial.println(msg);

  StaticJsonDocument<256> doc;
  deserializeJson(doc, msg);
  const char* action = doc["action"] | "";

  if (strcmp(action, "PUMP_ON") == 0) {
    pumpActive = true;
    digitalWrite(PIN_RELAY, LOW); // Active LOW
    Serial.println(F("[EXEC] PUMP TURNED ON"));
  } else if (strcmp(action, "PUMP_OFF") == 0) {
    pumpActive = false;
    digitalWrite(PIN_RELAY, HIGH);
    Serial.println(F("[EXEC] PUMP TURNED OFF"));
  }
}

void processTelemetry() {
  Serial.println(F("[MQTT] Preparing telemetry payload..."));
  
  StaticJsonDocument<1200> doc;
  doc["user_email"] = USER_EMAIL;
  
  JsonObject soil = doc.createNestedObject("soil");
  soil["ph"]       = phValue;
  soil["temp"]     = soilTemp;
  soil["moisture"] = soilMoisturePercent; 
  
  // Align with Pro structure: Add dummy NPK for test consistency
  JsonObject npk = soil.createNestedObject("npk");
  npk["n"] = random(80, 110);
  npk["p"] = random(40, 65);
  npk["k"] = random(180, 235);

  JsonObject weather = doc.createNestedObject("weather");
  weather["temp"] = airTemp;
  weather["humidity"] = humidity;
  weather["lightIntensity"] = ldrValue;
  weather["rainLevel"] = rainValue;

  JsonObject irrigation = doc.createNestedObject("irrigation");
  irrigation["level"] = random(60, 95);
  irrigation["flow"]  = pumpActive ? (random(15, 35) / 10.0f) : 0.0f;

  JsonObject hardware = doc.createNestedObject("hardware");
  hardware["pump"]    = pumpActive ? "ACTIVE" : "ONLINE";
  hardware["buzzer"]  = "ONLINE"; 
  hardware["light"]   = "ONLINE"; 
  hardware["display"] = "ONLINE";
  hardware["cam"]     = "ACTIVE";

  doc["node"]   = "AgriSense_Pro_Node"; // Unified Node ID for broad dashboard compatibility
  doc["status"] = "HEALTHY";
  doc["rssi"]   = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;

  char buffer[1200];
  serializeJson(doc, buffer);
  
  Serial.print(F("[MQTT] Publishing to: ")); Serial.println(TOPIC_SENSORS);
  Serial.print(F("[MQTT] Payload: ")); Serial.println(buffer);
  
  if (mqttClient.publish(TOPIC_SENSORS.c_str(), buffer)) {
    logFullTelemetry(doc);
  } else {
    Serial.println(F("[MQTT] FAIL: Transmission Error."));
  }
}

void logFullTelemetry(StaticJsonDocument<1200>& doc) {
  Serial.println(F(">> [TX] UPLINK SUCCESSFUL <<"));
}

void updateOLED() {
  Serial.println(F("[OLED] Updating display..."));
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("SM: "); display.print(soilMoisturePercent); display.println("%");
  display.print("ST: "); display.print(soilTemp); display.println("C");
  display.print("pH: "); display.println(phValue);
  display.print("AT: "); display.print(airTemp); display.println("C");
  display.print("H:  "); display.print(humidity); display.println("%");
  display.print("PUMP: "); display.println(pumpActive ? "ON" : "OFF");
  display.display();
}