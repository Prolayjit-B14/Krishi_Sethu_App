/**
 * ============================================================================
 * @file    new.ino
 * @brief   AgriSense Pro ESP32 Smart Gateway Firmware
 *          Customized for:
 *          - RS485 Modbus NPK Soil Sensor (UART2: RX=16, TX=17, RE=2, DE=15)
 *          - DHT11 (Temp & Humidity on Pin 12)
 *          - Soil Moisture Sensor (Analog on Pin 32)
 *          - Rain Sensor (Analog on Pin 34)
 *          - LDR Light Sensor (Analog on Pin 33)
 *          - Irrigation Relay / Pump (Pin 23)
 *          - 1.3" SH1106 I2C OLED (SDA=21, SCL=22)
 *          - Secure HiveMQ Cloud MQTT Telemetry & Remote Actuator Control
 * ============================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <DHT.h>

// ======================================================
// 1. PIN DEFINITIONS & HARDWARE MAPPING
// ======================================================

// RS485 Transceiver for NPK Sensor
#define RX2_PIN             16
#define TX2_PIN             17
#define RS485_RE            2
#define RS485_DE            15

// Environmental & Analog Sensors
#define DHT_PIN             12
#define DHT_TYPE            DHT11

#define SOIL_MOISTURE_PIN   32
#define RAIN_SENSOR_PIN     34
#define LDR_PIN             33
#define RELAY_PIN           23

// Relay Active State
#define RELAY_ON            HIGH
#define RELAY_OFF           LOW

// Thresholds
#define MOISTURE_DRY_THRESHOLD 2000
#define RAIN_THRESHOLD         2000

// ======================================================
// 2. NPK MODBUS SETTINGS
// ======================================================
#define NPK_ID              0x01
#define NPK_BAUD            9600
#define NPK_START_REGISTER  0x0000

#define RAW_MAX_VALUE       2000
#define NPK_MAX_VALUE       259

// ======================================================
// 3. OLED DISPLAY CONFIG (1.3" SH1106 I2C)
// ======================================================
#define SCREEN_WIDTH        128
#define SCREEN_HEIGHT       64
#define OLED_ADDR           0x3C

Adafruit_SH1106G display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
DHT dht(DHT_PIN, DHT_TYPE);
HardwareSerial RS485Serial(2);

// ======================================================
// 4. NETWORK & MQTT BROKER CONFIGURATION
// ======================================================
#if __has_include("secrets.h")
  #include "secrets.h"
  const char* WIFI_SSID       = SECRET_WIFI_SSID;
  const char* WIFI_PASS       = SECRET_WIFI_PASS;
  const char* MQTT_HOST       = SECRET_MQTT_HOST;
  const int   MQTT_PORT       = SECRET_MQTT_PORT;
  const char* MQTT_USER       = SECRET_MQTT_USER;
  const char* MQTT_PASS       = SECRET_MQTT_PASS;
  const char* USER_EMAIL      = SECRET_USER_EMAIL;
#else
  // ⚠️ WARNING: Create secrets.h from secrets.example.h to store credentials securely!
  const char* WIFI_SSID       = "YOUR_WIFI_SSID";
  const char* WIFI_PASS       = "YOUR_WIFI_PASS";
  const char* MQTT_HOST       = "your-broker.s1.eu.hivemq.cloud";
  const int   MQTT_PORT       = 8883;
  const char* MQTT_USER       = "your_mqtt_user";
  const char* MQTT_PASS       = "your_mqtt_password";
  const char* USER_EMAIL      = "farmer@example.com";
#endif

#define PUBLISH_INTERVAL    3000   // Telemetry published every 3s
#define MQTT_BUFFER_SIZE    1500

String TOPIC_SENSORS;
String TOPIC_COMMANDS;

WiFiClientSecure espClient;
PubSubClient     mqttClient(espClient);

// ======================================================
// 5. GLOBAL STATE VARIABLES
// ======================================================
float temperature   = 0.0;
float humidity      = 0.0;
int   moistureRaw   = 0;
int   rainRaw       = 0;
int   ldrRaw        = 0;

uint16_t nitrogen   = 0;
uint16_t phosphorus = 0;
uint16_t potassium  = 0;
bool     npkStatus  = false;

bool soilIsDry      = false;
bool isRaining      = false;
bool pumpStatus     = false;
bool displayEnabled = false; // Set to true only if OLED hardware & code successfully initialize
bool manualOverride = false;
unsigned long manualOverrideTime = 0;

unsigned long lastPublishTime  = 0;
unsigned long lastMqttRetry    = 0;
unsigned long lastDisplayTime  = 0;

// ======================================================
// 6. MODBUS CRC16 CALCULATION
// ======================================================
uint16_t modbusCRC(uint8_t *buffer, uint8_t length)
{
  uint16_t crc = 0xFFFF;
  for (uint8_t pos = 0; pos < length; pos++) {
    crc ^= buffer[pos];
    for (uint8_t i = 0; i < 8; i++) {
      if (crc & 0x0001) {
        crc >>= 1;
        crc ^= 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc;
}

// ======================================================
// 7. RS485 DIRECTION CONTROL
// ======================================================
void rs485Transmit()
{
  digitalWrite(RS485_RE, HIGH);
  digitalWrite(RS485_DE, HIGH);
  delayMicroseconds(100);
}

void rs485Receive()
{
  RS485Serial.flush();
  delayMicroseconds(100);
  digitalWrite(RS485_DE, LOW);
  digitalWrite(RS485_RE, LOW);
  delayMicroseconds(100);
}

// ======================================================
// 8. READ NPK MODBUS SENSOR
// ======================================================
bool readNPK(uint16_t &nVal, uint16_t &pVal, uint16_t &kVal)
{
  uint8_t request[8];
  request[0] = NPK_ID;
  request[1] = 0x03;
  request[2] = 0x00;
  request[3] = NPK_START_REGISTER;
  request[4] = 0x00;
  request[5] = 0x03;

  uint16_t crc = modbusCRC(request, 6);
  request[6] = crc & 0xFF;
  request[7] = (crc >> 8) & 0xFF;

  // Flush buffer
  while (RS485Serial.available()) {
    RS485Serial.read();
  }

  // Send request
  rs485Transmit();
  RS485Serial.write(request, 8);
  RS485Serial.flush();

  // Receive response
  rs485Receive();

  uint8_t response[11];
  uint8_t index = 0;
  unsigned long startTime = millis();

  while (millis() - startTime < 600) {
    if (RS485Serial.available()) {
      response[index++] = RS485Serial.read();
      if (index >= 11) break;
    }
  }

  if (index != 11) return false;
  if (response[0] != NPK_ID || response[1] != 0x03 || response[2] != 0x06) return false;

  uint16_t receivedCRC   = response[9] | ((uint16_t)response[10] << 8);
  uint16_t calculatedCRC = modbusCRC(response, 9);
  if (receivedCRC != calculatedCRC) return false;

  uint16_t rawNitrogen   = ((uint16_t)response[3] << 8) | response[4];
  uint16_t rawPhosphorus = ((uint16_t)response[5] << 8) | response[6];
  uint16_t rawPotassium  = ((uint16_t)response[7] << 8) | response[8];

  nVal = ((uint32_t)rawNitrogen   * NPK_MAX_VALUE) / RAW_MAX_VALUE;
  pVal = ((uint32_t)rawPhosphorus * NPK_MAX_VALUE) / RAW_MAX_VALUE;
  kVal = ((uint32_t)rawPotassium  * NPK_MAX_VALUE) / RAW_MAX_VALUE;

  if (nVal > NPK_MAX_VALUE) nVal = NPK_MAX_VALUE;
  if (pVal > NPK_MAX_VALUE) pVal = NPK_MAX_VALUE;
  if (kVal > NPK_MAX_VALUE) kVal = NPK_MAX_VALUE;

  return true;
}

// ======================================================
// 9. OLED DISPLAY ROUTINES
// ======================================================
void displayStartup()
{
  display.clearDisplay();
  display.setTextColor(SH110X_WHITE);
  display.setTextSize(1);

  display.setCursor(22, 12);
  display.println("AGRISENSE PRO");

  display.setCursor(20, 26);
  display.println("SMART SOIL NODE");

  display.drawLine(15, 38, 113, 38, SH110X_WHITE);

  display.setCursor(28, 48);
  display.println("STARTING SYSTEM...");

  display.display();
  delay(1500);
}

void updateOledDisplay()
{
  if (!displayEnabled) {
    display.clearDisplay();
    display.display();
    return;
  }

  display.clearDisplay();
  display.setTextColor(SH110X_WHITE);
  display.setTextSize(1);

  // Line 1: Temperature & Humidity
  display.setCursor(2, 2);
  display.print("T:");
  if (isnan(temperature)) display.print("--");
  else display.print(temperature, 1);
  display.print("C");

  display.setCursor(68, 2);
  display.print("H:");
  if (isnan(humidity)) display.print("--");
  else display.print(humidity, 0);
  display.print("%");

  // Line 2: Moisture & Rain
  display.setCursor(2, 13);
  display.print("MOIST:");
  display.print(moistureRaw);

  display.setCursor(68, 13);
  display.print("RAIN:");
  display.print(rainRaw);

  // Line 3: LDR & Pump State
  display.setCursor(2, 24);
  display.print("LDR:");
  display.print(ldrRaw);

  display.setCursor(68, 24);
  display.print("PUMP:");
  display.print(pumpStatus ? "ON" : "OFF");

  // Line 4: Connectivity & Status
  display.setCursor(2, 35);
  display.print(isRaining ? "RAIN:YES" : "RAIN:NO");

  display.setCursor(68, 35);
  display.print(mqttClient.connected() ? "NET:ONLINE" : "NET:OFFLINE");

  // Divider Line
  display.drawLine(0, 45, 127, 45, SH110X_WHITE);

  // NPK Header
  display.setCursor(2, 47);
  display.print("NPK (mg/kg)");

  // NPK Values
  display.setCursor(2, 56);
  if (npkStatus) {
    display.print("N:"); display.print(nitrogen);
    display.print(" P:"); display.print(phosphorus);
    display.print(" K:"); display.print(potassium);
  } else {
    display.print("NPK: OFFLINE/WAIT");
  }

  display.display();
}

// ======================================================
// 10. MQTT INCOMING COMMAND CALLBACK
// ======================================================
void onMessageReceived(char* topic, byte* payload, unsigned int length)
{
  String messageBody = "";
  for (unsigned int i = 0; i < length; i++) {
    messageBody += (char)payload[i];
  }

  Serial.println(F("\n[MQTT] Incoming Remote Command:"));
  Serial.println("   > " + messageBody);

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, messageBody);
  if (error) {
    Serial.print(F("[JSON] Parse Error: "));
    Serial.println(error.c_str());
    return;
  }

  const char* action = doc["action"] | "NONE";

  if (strcmp(action, "PUMP_ON") == 0) {
    manualOverride = true;
    manualOverrideTime = millis();
    digitalWrite(RELAY_PIN, RELAY_ON);
    pumpStatus = true;
    Serial.println(F("[EXEC] PUMP: ACTIVE via Web App Override"));
  }
  else if (strcmp(action, "PUMP_OFF") == 0) {
    manualOverride = true;
    manualOverrideTime = millis();
    digitalWrite(RELAY_PIN, RELAY_OFF);
    pumpStatus = false;
    Serial.println(F("[EXEC] PUMP: STANDBY via Web App Override"));
  }
}

// ======================================================
// 11. TELEMETRY SERIALIZATION & TRANSMISSION
// ======================================================
void publishTelemetry()
{
  StaticJsonDocument<1024> doc;
  doc["user_email"] = USER_EMAIL;

  // Convert raw analog moisture to 0-100% (lower analog = wetter)
  int moisturePercent = map(moistureRaw, 4095, 1200, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  // Convert raw rain to 0-100% (lower analog = heavier rain)
  int rainPercent = map(rainRaw, 4095, 1000, 0, 100);
  rainPercent = constrain(rainPercent, 0, 100);

  // SECTION 1: SOIL TELEMETRY
  JsonObject soil = doc.createNestedObject("soil");
  soil["moisture"] = moisturePercent;
  soil["temp"]     = isnan(temperature) ? 25.0 : temperature;
  soil["ph"]       = 6.5; // Baseline agronomic pH

  JsonObject npkObj = soil.createNestedObject("npk");
  if (npkStatus) {
    npkObj["n"] = nitrogen;
    npkObj["p"] = phosphorus;
    npkObj["k"] = potassium;
  } else {
    // If RS485 communication is disconnected, omit or send last known
    npkObj["n"] = nitrogen;
    npkObj["p"] = phosphorus;
    npkObj["k"] = potassium;
  }
  soil["oledActive"] = displayEnabled ? 1 : 0;

  // SECTION 2: WEATHER & CLIMATE TELEMETRY
  JsonObject weather = doc.createNestedObject("weather");
  weather["temp"]           = isnan(temperature) ? 25.0 : temperature;
  weather["humidity"]       = isnan(humidity) ? 60.0 : humidity;
  // LDR map to relative Lux (0 - 10000)
  weather["lightIntensity"] = map(ldrRaw, 4095, 0, 0, 10000);
  weather["rainLevel"]      = rainPercent;

  // SECTION 3: IRRIGATION & HARDWARE STATE
  JsonObject irrigation = doc.createNestedObject("irrigation");
  irrigation["pump"] = pumpStatus ? "ACTIVE" : "ONLINE";

  JsonObject hardware = doc.createNestedObject("hardware");
  hardware["pump"]    = pumpStatus ? "ACTIVE" : "ONLINE";
  hardware["display"] = displayEnabled ? "ACTIVE" : "OFFLINE";

  // Global Metadata
  doc["node"]   = "AgriSense_Soil_Node";
  doc["status"] = "HEALTHY";
  doc["rssi"]   = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;

  char payloadBuffer[1024];
  serializeJson(doc, payloadBuffer);

  if (mqttClient.publish(TOPIC_SENSORS.c_str(), payloadBuffer)) {
    Serial.println(F("[MQTT] ✅ Telemetry Transmitted to Web App."));
  } else {
    Serial.println(F("[MQTT] ❌ Transmit Failed. Buffer or Broker issue."));
  }
}

// ======================================================
// 12. WIFI & MQTT CONNECTION HANDLERS
// ======================================================
void connectWifi()
{
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print(F("[WIFI] Connecting to: "));
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n[WIFI] Connected! IP: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\n[WIFI] Connect failed. Running in offline mode..."));
  }
}

void connectMqtt()
{
  if (WiFi.status() != WL_CONNECTED) return;
  if (mqttClient.connected()) return;

  if (millis() - lastMqttRetry > 5000) {
    lastMqttRetry = millis();
    Serial.print(F("[MQTT] Connecting to HiveMQ Cloud..."));

    String clientId = "AGRI_ESP32_" + WiFi.macAddress();
    clientId.replace(":", "");

    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println(F(" CONNECTED!"));
      mqttClient.subscribe(TOPIC_COMMANDS.c_str());
      Serial.print(F("[MQTT] Subscribed to: "));
      Serial.println(TOPIC_COMMANDS);
    } else {
      Serial.print(F(" FAILED [RC: "));
      Serial.print(mqttClient.state());
      Serial.println(F("]. Will retry in 5s."));
    }
  }
}

// ======================================================
// 13. SETUP ENTRYPOINT
// ======================================================
void setup()
{
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println(F("========================================"));
  Serial.println(F("   AGRISENSE PRO SMART SOIL GATEWAY     "));
  Serial.println(F("========================================"));

  // RS485 Transceiver Control Pins
  pinMode(RS485_RE, OUTPUT);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_RE, LOW);
  digitalWrite(RS485_DE, LOW);

  // UART2 for NPK Modbus
  RS485Serial.begin(NPK_BAUD, SERIAL_8N1, RX2_PIN, TX2_PIN);

  // DHT11 Sensor
  dht.begin();

  // Analog Inputs
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(RAIN_SENSOR_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);

  // Relay / Pump
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_OFF);

  // I2C OLED (SH1106)
  Wire.begin(21, 22);
  if (display.begin(OLED_ADDR, true)) {
    displayStartup();
    displayEnabled = true;
    Serial.println(F("[OLED] SH1106 OLED display detected and initialized successfully."));
  } else {
    displayEnabled = false;
    Serial.println(F("[OLED] Warning: Display initialization failed or display hardware not present."));
  }

  // Dynamic MQTT Topics based on user email
  TOPIC_SENSORS  = "agrisense/" + String(USER_EMAIL) + "/field_b/sensors";
  TOPIC_COMMANDS = "agrisense/" + String(USER_EMAIL) + "/field_b/commands";

  // WiFi & TLS MQTT Client
  connectWifi();
  espClient.setInsecure(); // Skip certificate verification for development
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(onMessageReceived);
  mqttClient.setBufferSize(MQTT_BUFFER_SIZE);

  Serial.println(F("System Ready!\n"));
}

// ======================================================
// 14. MAIN EXECUTION LOOP
// ======================================================
void loop()
{
  // 1. Maintain Network Connections
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
  } else {
    if (!mqttClient.connected()) {
      connectMqtt();
    }
    mqttClient.loop();
  }

  // 2. Read Sensors Non-blocking
  unsigned long now = millis();

  // Read DHT11
  float readT = dht.readTemperature();
  float readH = dht.readHumidity();
  if (!isnan(readT)) temperature = readT;
  if (!isnan(readH)) humidity = readH;

  // Read Analog Sensors
  moistureRaw = analogRead(SOIL_MOISTURE_PIN);
  rainRaw     = analogRead(RAIN_SENSOR_PIN);
  ldrRaw      = analogRead(LDR_PIN);

  soilIsDry = (moistureRaw > MOISTURE_DRY_THRESHOLD);
  isRaining = (rainRaw < RAIN_THRESHOLD);

  // 3. Clear Manual Pump Override after 60 seconds
  if (manualOverride && (now - manualOverrideTime > 60000)) {
    manualOverride = false;
    Serial.println(F("[AUTO] Resuming Autonomous Pump Control."));
  }

  // 4. Autonomous Pump Logic (if no manual override active)
  if (!manualOverride) {
    if (soilIsDry && !isRaining) {
      digitalWrite(RELAY_PIN, RELAY_ON);
      pumpStatus = true;
    } else {
      digitalWrite(RELAY_PIN, RELAY_OFF);
      pumpStatus = false;
    }
  }

  // 5. Read NPK Modbus Sensor periodically with Telemetry
  if (now - lastPublishTime >= PUBLISH_INTERVAL) {
    lastPublishTime = now;

    uint16_t nTemp = 0, pTemp = 0, kTemp = 0;
    npkStatus = readNPK(nTemp, pTemp, kTemp);
    if (npkStatus) {
      nitrogen   = nTemp;
      phosphorus = pTemp;
      potassium  = kTemp;
    }

    // Publish formatted JSON to AgriSense Web App
    if (mqttClient.connected()) {
      publishTelemetry();
    }

    // Serial Debug Monitor
    Serial.println(F("----------------------------------------"));
    Serial.print(F("TEMP: ")); Serial.print(temperature); Serial.print(F("C | HUM: ")); Serial.print(humidity); Serial.println(F("%"));
    Serial.print(F("SOIL MOIST: ")); Serial.print(moistureRaw); Serial.print(F(" | RAIN: ")); Serial.print(rainRaw); Serial.print(F(" | LDR: ")); Serial.println(ldrRaw);
    Serial.print(F("PUMP: ")); Serial.print(pumpStatus ? "ON" : "OFF"); Serial.print(F(" | MANUAL OVERRIDE: ")); Serial.println(manualOverride ? "YES" : "NO");
    if (npkStatus) {
      Serial.print(F("NPK (mg/kg) -> N: ")); Serial.print(nitrogen); Serial.print(F(" | P: ")); Serial.print(phosphorus); Serial.print(F(" | K: ")); Serial.println(potassium);
    } else {
      Serial.println(F("NPK: Sensor offline or communication timeout"));
    }
  }

  // 6. Refresh OLED Display (every 250ms for responsive UX)
  if (now - lastDisplayTime >= 250) {
    lastDisplayTime = now;
    updateOledDisplay();
  }
}
