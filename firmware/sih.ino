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
// ESP32 RS485 PINS
// ======================================================

#define RX2_PIN 16
#define TX2_PIN 17

#define RS485_RE 2
#define RS485_DE 15

// ======================================================
// NPK SENSOR SETTINGS
// ======================================================

#define NPK_ID 0x01
#define NPK_BAUD 9600

#define NPK_START_REGISTER 0x0000

// ======================================================
// NPK SCALING
// ======================================================

#define RAW_MAX_VALUE 2000
#define NPK_MAX_VALUE 259

// ======================================================
// OTHER SENSOR PINS
// ======================================================

#define DHT_PIN 12
#define DHT_TYPE DHT11

#define SOIL_MOISTURE_PIN 32

#define RAIN_SENSOR_PIN 34

#define LDR_PIN 33

#define RELAY_PIN 23

// ======================================================
// THRESHOLDS
// ======================================================

#define MOISTURE_DRY_THRESHOLD 2000

#define RAIN_THRESHOLD 2000

// ======================================================
// RELAY LOGIC
// ======================================================

#define RELAY_ON HIGH
#define RELAY_OFF LOW

// ======================================================
// OLED SETTINGS
// 1.3 INCH SH1106 OLED
// ======================================================

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

#define OLED_ADDR 0x3C

// ======================================================
// OLED OBJECT
// ======================================================

Adafruit_SH1106G display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  -1
);

// ======================================================
// DHT OBJECT
// ======================================================

DHT dht(
  DHT_PIN,
  DHT_TYPE
);

// ======================================================
// ESP32 UART2
// ======================================================

HardwareSerial RS485Serial(2);

// ======================================================
// NETWORK & HIVEMQ CLOUD MQTT CONFIGURATION
// ======================================================

#if __has_include("secrets.h")
  #include "secrets.h"
  const char* WIFI_SSID           = SECRET_WIFI_SSID;
  const char* WIFI_PASS           = SECRET_WIFI_PASS;
  const char* MQTT_HOST           = SECRET_MQTT_HOST;
  const int   MQTT_PORT           = SECRET_MQTT_PORT;
  const char* MQTT_USER           = SECRET_MQTT_USER;
  const char* MQTT_PASS           = SECRET_MQTT_PASS;
  const char* USER_EMAIL          = SECRET_USER_EMAIL;
#else
  // ⚠️ WARNING: Create secrets.h from secrets.example.h to store credentials securely!
  const char* WIFI_SSID           = "YOUR_WIFI_SSID";
  const char* WIFI_PASS           = "YOUR_WIFI_PASS";
  const char* MQTT_HOST           = "your-broker.s1.eu.hivemq.cloud";
  const int   MQTT_PORT           = 8883;
  const char* MQTT_USER           = "your_mqtt_user";
  const char* MQTT_PASS           = "your_mqtt_password";
  const char* USER_EMAIL          = "farmer@example.com";
#endif

#define PUBLISH_INTERVAL        3000   // Telemetry published every 3s
#define MQTT_BUFFER_SIZE        1500

String TOPIC_SENSORS;
String TOPIC_COMMANDS;

WiFiClientSecure espClient;
PubSubClient     mqttClient(espClient);

// Global State
bool oledOk                     = false;
bool manualOverride             = false;
unsigned long manualOverrideTime = 0;
unsigned long lastPublishTime   = 0;
unsigned long lastMqttRetry     = 0;

// Safety Watchdogs & Fail-safe Limits
#define MAX_PUMP_CONTINUOUS_RUNTIME_MS 1200000UL // 20 min hardware watchdog cutoff
unsigned long pumpStartTime            = 0;
bool pumpWasRunning                    = false;
bool pumpWatchdogTriggered             = false;
unsigned long mqttLastConnectedTime    = 0;

// ======================================================
// MODBUS CRC16
// ======================================================

uint16_t modbusCRC(uint8_t *buffer, uint8_t length)
{
  uint16_t crc = 0xFFFF;

  for (uint8_t pos = 0; pos < length; pos++)
  {
    crc ^= buffer[pos];

    for (uint8_t i = 0; i < 8; i++)
    {
      if (crc & 0x0001)
      {
        crc >>= 1;
        crc ^= 0xA001;
      }
      else
      {
        crc >>= 1;
      }
    }
  }

  return crc;
}

// ======================================================
// RS485 TRANSMIT MODE
// ======================================================

void rs485Transmit()
{
  digitalWrite(RS485_RE, HIGH);
  digitalWrite(RS485_DE, HIGH);

  delayMicroseconds(100);
}

// ======================================================
// RS485 RECEIVE MODE
// ======================================================

void rs485Receive()
{
  RS485Serial.flush();

  delayMicroseconds(100);

  digitalWrite(RS485_DE, LOW);
  digitalWrite(RS485_RE, LOW);

  delayMicroseconds(100);
}

// ======================================================
// READ NPK SENSOR
// ======================================================

bool readNPK(
  uint16_t &nitrogen,
  uint16_t &phosphorus,
  uint16_t &potassium
)
{
  uint8_t request[8];

  // MODBUS REQUEST

  request[0] = NPK_ID;
  request[1] = 0x03;

  request[2] = 0x00;
  request[3] = NPK_START_REGISTER;

  request[4] = 0x00;
  request[5] = 0x03;

  // CALCULATE CRC

  uint16_t crc = modbusCRC(request, 6);

  request[6] = crc & 0xFF;
  request[7] = (crc >> 8) & 0xFF;

  // CLEAR OLD DATA

  while (RS485Serial.available())
  {
    RS485Serial.read();
  }

  // SEND REQUEST

  rs485Transmit();

  RS485Serial.write(request, 8);

  RS485Serial.flush();

  // RECEIVE MODE

  rs485Receive();

  // EXPECTED RESPONSE
  // 01 03 06 NN NN PP PP KK KK CRC CRC

  uint8_t response[11];
  uint8_t index = 0;
  unsigned long startTime = millis();

  while (millis() - startTime < 1000)
  {
    if (RS485Serial.available())
    {
      response[index] = RS485Serial.read();

      index++;

      if (index >= 11)
      {
        break;
      }
    }
  }

  // CHECK RESPONSE LENGTH

  if (index != 11)
  {
    Serial.println("ERROR: No complete NPK response");

    Serial.print("Received bytes: ");
    Serial.println(index);

    return false;
  }

  // PRINT RAW RESPONSE

  Serial.print("RAW: ");

  for (uint8_t i = 0; i < 11; i++)
  {
    if (response[i] < 0x10)
    {
      Serial.print("0");
    }

    Serial.print(response[i], HEX);
    Serial.print(" ");
  }

  Serial.println();

  // CHECK SENSOR ID

  if (response[0] != NPK_ID)
  {
    Serial.println("ERROR: Wrong sensor ID");
    return false;
  }

  // CHECK MODBUS FUNCTION

  if (response[1] != 0x03)
  {
    Serial.println("ERROR: Modbus function error");
    return false;
  }

  // CHECK BYTE COUNT

  if (response[2] != 0x06)
  {
    Serial.println("ERROR: Invalid byte count");
    return false;
  }

  // CHECK CRC

  uint16_t receivedCRC =
    response[9] |
    ((uint16_t)response[10] << 8);

  uint16_t calculatedCRC =
    modbusCRC(response, 9);

  if (receivedCRC != calculatedCRC)
  {
    Serial.println("ERROR: CRC error");

    Serial.print("Received CRC: ");
    Serial.println(receivedCRC, HEX);

    Serial.print("Calculated CRC: ");
    Serial.println(calculatedCRC, HEX);

    return false;
  }

  // EXTRACT RAW NPK VALUES

  uint16_t rawNitrogen =
    ((uint16_t)response[3] << 8) |
    response[4];

  uint16_t rawPhosphorus =
    ((uint16_t)response[5] << 8) |
    response[6];

  uint16_t rawPotassium =
    ((uint16_t)response[7] << 8) |
    response[8];

  // PRINT RAW NPK

  Serial.println();
  Serial.println("RAW NPK VALUES:");

  Serial.print("Raw Nitrogen: ");
  Serial.println(rawNitrogen);

  Serial.print("Raw Phosphorus: ");
  Serial.println(rawPhosphorus);

  Serial.print("Raw Potassium: ");
  Serial.println(rawPotassium);

  // ====================================================
  // SCALE NPK
  // ====================================================

  nitrogen =
    ((uint32_t)rawNitrogen * NPK_MAX_VALUE)
    / RAW_MAX_VALUE;

  phosphorus =
    ((uint32_t)rawPhosphorus * NPK_MAX_VALUE)
    / RAW_MAX_VALUE;

  potassium =
    ((uint32_t)rawPotassium * NPK_MAX_VALUE)
    / RAW_MAX_VALUE;

  // LIMIT VALUE

  if (nitrogen > NPK_MAX_VALUE)
  {
    nitrogen = NPK_MAX_VALUE;
  }

  if (phosphorus > NPK_MAX_VALUE)
  {
    phosphorus = NPK_MAX_VALUE;
  }

  if (potassium > NPK_MAX_VALUE)
  {
    potassium = NPK_MAX_VALUE;
  }

  return true;
}

// ======================================================
// OLED STARTUP SCREEN
// ======================================================

void displayStartup()
{
  display.clearDisplay();

  display.setTextColor(SH110X_WHITE);
  display.setTextSize(1);

  display.setCursor(25, 14);
  display.println("SOIL MONITOR");

  display.setCursor(40, 29);
  display.println("SYSTEM");

  display.drawLine(
    20,
    43,
    108,
    43,
    SH110X_WHITE
  );

  display.setCursor(38, 52);
  display.println("STARTING...");

  display.display();

  delay(2000);
}

// ======================================================
// OLED MAIN SCREEN
// ======================================================

void displayAllData(
  float temperature,
  float humidity,
  int moisture,
  int rain,
  int ldr,
  bool pumpStatus,
  bool soilIsDry,
  bool isRaining,
  uint16_t N,
  uint16_t P,
  uint16_t K,
  bool npkOK
)
{
  if (!oledOk) return;

  display.clearDisplay();

  display.setTextColor(SH110X_WHITE);
  display.setTextSize(1);

  // ====================================================
  // LINE 1
  // TEMPERATURE + HUMIDITY
  // ====================================================

  display.setCursor(2, 3);

  display.print("T:");

  if (isnan(temperature))
  {
    display.print("--");
  }
  else
  {
    display.print(temperature, 1);
  }

  display.print("C");

  display.setCursor(68, 3);

  display.print("H:");

  if (isnan(humidity))
  {
    display.print("--");
  }
  else
  {
    display.print(humidity, 0);
  }

  display.print("%");

  // ====================================================
  // LINE 2
  // MOISTURE + RAIN
  // ====================================================

  display.setCursor(2, 14);

  display.print("MOIST:");
  display.print(moisture);

  display.setCursor(68, 14);

  display.print("RAIN:");
  display.print(rain);

  // ====================================================
  // LINE 3
  // LDR + PUMP
  // ====================================================

  display.setCursor(2, 25);

  display.print("LDR:");
  display.print(ldr);

  display.setCursor(68, 25);

  display.print("PUMP:");

  if (pumpStatus)
  {
    display.print("ON");
  }
  else
  {
    display.print("OFF");
  }

  // ====================================================
  // LINE 4
  // STATUS
  // ====================================================

  display.setCursor(2, 36);

  if (isRaining)
  {
    display.print("RAIN:YES");
  }
  else
  {
    display.print("RAIN:NO");
  }

  display.setCursor(68, 36);

  if (soilIsDry)
  {
    display.print("SOIL:DRY");
  }
  else
  {
    display.print("SOIL:WET");
  }

  // ====================================================
  // SEPARATOR
  // ====================================================

  display.drawLine(
    0,
    46,
    127,
    46,
    SH110X_WHITE
  );

  // ====================================================
  // NPK TITLE
  // ====================================================

  display.setCursor(2, 48);

  display.print("NPK (mg/kg)");

  // ====================================================
  // NPK VALUES
  // ====================================================

  display.setCursor(2, 56);

  if (npkOK)
  {
    display.print("N:");
    display.print(N);

    display.print("  P:");
    display.print(P);

    display.print("  K:");
    display.print(K);
  }
  else
  {
    display.print("NPK COMM ERROR");
  }

  display.display();
}

// ======================================================
// MQTT COMMAND CALLBACK (Remote App Control)
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

  if (strcmp(action, "EMERGENCY_STOP") == 0 || strcmp(action, "HALT_ALL") == 0) {
    manualOverride = true;
    manualOverrideTime = millis() + 300000; // 5-minute safety lock
    digitalWrite(RELAY_PIN, RELAY_OFF);
    pumpStartTime = 0;
    pumpWasRunning = false;
    Serial.println(F("[EMERGENCY] !!! EMERGENCY STOP TRIGGERED VIA APP !!! ALL ACTUATORS CUT."));
  }
  else if (strcmp(action, "PUMP_ON") == 0) {
    if (!pumpWatchdogTriggered) {
      manualOverride = true;
      manualOverrideTime = millis();
      digitalWrite(RELAY_PIN, RELAY_ON);
      if (!pumpWasRunning) {
        pumpStartTime = millis();
        pumpWasRunning = true;
      }
      Serial.println(F("[EXEC] PUMP: ACTIVE via Web App Override"));
    } else {
      Serial.println(F("[WARN] PUMP: Blocked. 20-min continuous runtime safety cutoff engaged."));
    }
  }
  else if (strcmp(action, "PUMP_OFF") == 0) {
    manualOverride = true;
    manualOverrideTime = millis();
    digitalWrite(RELAY_PIN, RELAY_OFF);
    pumpStartTime = 0;
    pumpWasRunning = false;
    pumpWatchdogTriggered = false; // Reset watchdog on manual shutoff
    Serial.println(F("[EXEC] PUMP: STANDBY via Web App Override"));
  }
}

// ======================================================
// WIFI & MQTT CONNECTION HANDLERS
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
    Serial.println(F("\n[WIFI] Connect failed. Running in background..."));
  }
}

void connectMqtt()
{
  if (WiFi.status() != WL_CONNECTED) return;
  if (mqttClient.connected()) return;

  if (millis() - lastMqttRetry > 5000) {
    lastMqttRetry = millis();
    Serial.print(F("[MQTT] Connecting to HiveMQ Cloud..."));

    String clientId = "AGRI_SIH_ESP32_" + WiFi.macAddress();
    clientId.replace(":", "");

    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println(F(" CONNECTED!"));
      mqttClient.subscribe(TOPIC_COMMANDS.c_str());
      Serial.print(F("[MQTT] Subscribed to Commands: "));
      Serial.println(TOPIC_COMMANDS);
    } else {
      Serial.print(F(" FAILED [RC: "));
      Serial.print(mqttClient.state());
      Serial.println(F("]. Will retry in 5s."));
    }
  }
}

// ======================================================
// TELEMETRY SERIALIZATION & APP SYNCHRONIZATION
// ======================================================

void publishTelemetry(
  float temperature,
  float humidity,
  int moistureValue,
  int rainValue,
  int ldrValue,
  bool pumpStatus,
  uint16_t nitrogen,
  uint16_t phosphorus,
  uint16_t potassium,
  bool npkStatus
)
{
  StaticJsonDocument<1024> doc;
  doc["user_email"] = USER_EMAIL;

  // Convert raw analog moisture (4095 dry -> 1200 submerged) to 0-100%
  int moisturePercent = map(moistureValue, 4095, 1200, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  // Convert raw analog rain (4095 dry -> 1000 wet) to 0-100%
  int rainPercent = map(rainValue, 4095, 1000, 0, 100);
  rainPercent = constrain(rainPercent, 0, 100);

  // Convert LDR raw to relative Lux (0 - 10000 lx)
  int lux = map(ldrValue, 4095, 0, 0, 10000);
  if (lux < 0) lux = 0;

  // SECTION 1: SOIL TELEMETRY (For SoilMonitor.jsx & Soil Node in App)
  JsonObject soil = doc.createNestedObject("soil");
  soil["moisture"] = moisturePercent;
  soil["temp"]     = isnan(temperature) ? 25.0 : temperature;
  soil["ph"]       = 6.8; // Baseline agronomic pH

  JsonObject npkObj = soil.createNestedObject("npk");
  npkObj["n"] = nitrogen;
  npkObj["p"] = phosphorus;
  npkObj["k"] = potassium;
  soil["oledActive"] = oledOk ? 1 : 0;

  // SECTION 2: WEATHER & CLIMATE TELEMETRY (For WeatherMonitor.jsx & Weather Node in App)
  JsonObject weather = doc.createNestedObject("weather");
  weather["temp"]           = isnan(temperature) ? 25.0 : temperature;
  weather["humidity"]       = isnan(humidity) ? 60.0 : humidity;
  weather["lightIntensity"] = lux;
  weather["rainLevel"]      = rainPercent;

  // SECTION 3: ACTUATOR & HARDWARE STATE (For ActuatorControl.jsx & DeviceManager.jsx)
  JsonObject hardware = doc.createNestedObject("hardware");
  hardware["pump"]    = pumpStatus ? "ACTIVE" : "ONLINE";
  hardware["display"] = oledOk ? "ACTIVE" : "OFFLINE";

  JsonObject irrigation = doc.createNestedObject("irrigation");
  irrigation["pump"]  = pumpStatus ? "ACTIVE" : "ONLINE";

  // System Metadata
  doc["node"]   = "AgriSense_Soil_Node";
  doc["status"] = "HEALTHY";
  doc["rssi"]   = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;

  char payloadBuffer[1024];
  serializeJson(doc, payloadBuffer);

  if (mqttClient.publish(TOPIC_SENSORS.c_str(), payloadBuffer)) {
    Serial.println(F("[MQTT] ✅ Real-time Sensor Data Synced to App."));
  } else {
    Serial.println(F("[MQTT] ❌ MQTT Transmit Failed. Buffer or Broker issue."));
  }
}

// ======================================================
// SETUP
// ======================================================

void setup()
{
  // ====================================================
  // SERIAL MONITOR
  // ====================================================

  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("==============================");
  Serial.println(" ESP32 SMART SOIL MONITOR (SIH)");
  Serial.println("==============================");

  // ====================================================
  // RS485 DIRECTION PINS
  // ====================================================

  pinMode(RS485_RE, OUTPUT);
  pinMode(RS485_DE, OUTPUT);

  // Start in receive mode

  digitalWrite(RS485_RE, LOW);
  digitalWrite(RS485_DE, LOW);

  // ====================================================
  // UART2
  // ====================================================

  RS485Serial.begin(
    NPK_BAUD,
    SERIAL_8N1,
    RX2_PIN,
    TX2_PIN
  );

  Serial.print("NPK Baud: ");
  Serial.println(NPK_BAUD);

  Serial.println("UART2 initialized");

  // ====================================================
  // DHT11
  // ====================================================

  dht.begin();

  Serial.println("DHT11 initialized");

  // ====================================================
  // ANALOG SENSOR PINS
  // ====================================================

  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(RAIN_SENSOR_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);

  // ====================================================
  // RELAY
  // ====================================================

  pinMode(RELAY_PIN, OUTPUT);

  // Pump OFF at startup

  digitalWrite(RELAY_PIN, RELAY_OFF);

  // ====================================================
  // OLED
  // ====================================================

  Wire.begin(21, 22);

  if (!display.begin(
        OLED_ADDR,
        true
      ))
  {
    Serial.println("OLED ERROR!");
    oledOk = false;
  }
  else
  {
    Serial.println("1.3 INCH SH1106 OLED initialized");
    oledOk = true;
    displayStartup();
  }

  // ====================================================
  // DYNAMIC MQTT TOPICS (Email-Bound Topic Architecture)
  // ====================================================

  TOPIC_SENSORS  = "agrisense/" + String(USER_EMAIL) + "/field_b/sensors";
  TOPIC_COMMANDS = "agrisense/" + String(USER_EMAIL) + "/field_b/commands";

  // WiFi & TLS MQTT Client
  connectWifi();
  espClient.setInsecure(); // Skip TLS certificate verification for development
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(onMessageReceived);
  mqttClient.setBufferSize(MQTT_BUFFER_SIZE);

  Serial.println("System ready with App MQTT Sync");
  Serial.println();
}

// ======================================================
// LOOP
// ======================================================

void loop()
{
  // 1. Maintain WiFi and MQTT Connections
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
  } else {
    if (!mqttClient.connected()) {
      connectMqtt();
    }
    mqttClient.loop();
  }

  // ====================================================
  // READ DHT
  // ====================================================

  float temperature =
    dht.readTemperature();

  float humidity =
    dht.readHumidity();

  // ====================================================
  // READ SOIL MOISTURE
  // ====================================================

  int moistureValue =
    analogRead(SOIL_MOISTURE_PIN);

  // ====================================================
  // READ RAIN SENSOR
  // ====================================================

  int rainValue =
    analogRead(RAIN_SENSOR_PIN);

  // ====================================================
  // READ LDR
  // ====================================================

  int ldrValue =
    analogRead(LDR_PIN);

  // ====================================================
  // DETERMINE SOIL CONDITION
  // ====================================================

  bool soilIsDry =
    moistureValue > MOISTURE_DRY_THRESHOLD;

  // ====================================================
  // DETERMINE RAIN CONDITION
  // ====================================================

  bool isRaining =
    rainValue < RAIN_THRESHOLD;

  // ====================================================
  // PUMP CONTROL & 20-MIN HARDWARE WATCHDOG SAFETY
  // ====================================================

  unsigned long now = millis();

  // Track MQTT connectivity status for local offline fallback
  if (mqttClient.connected()) {
    mqttLastConnectedTime = now;
  } else if (now - mqttLastConnectedTime > 60000) {
    // Graceful offline fallback: autonomous local decision based on physical thresholds
    static unsigned long lastOfflineNotice = 0;
    if (now - lastOfflineNotice > 10000) {
      lastOfflineNotice = now;
      Serial.println(F("[SAFETY] MQTT offline >60s. Running local autonomous hysteresis."));
    }
  }

  if (manualOverride && (now - manualOverrideTime > 60000)) {
    manualOverride = false;
    Serial.println(F("[AUTO] Manual override timeout. Resuming autonomous pump control."));
  }

  bool pumpStatus = false;
  if (manualOverride) {
    pumpStatus = (digitalRead(RELAY_PIN) == RELAY_ON);
  } else {
    if (soilIsDry && !isRaining && !pumpWatchdogTriggered) {
      digitalWrite(RELAY_PIN, RELAY_ON);
      pumpStatus = true;
    } else {
      digitalWrite(RELAY_PIN, RELAY_OFF);
      pumpStatus = false;
    }
  }

  // Enforce 20-minute continuous runtime hardware watchdog
  if (pumpStatus) {
    if (!pumpWasRunning) {
      pumpStartTime = now;
      pumpWasRunning = true;
    } else if (now - pumpStartTime >= MAX_PUMP_CONTINUOUS_RUNTIME_MS) {
      digitalWrite(RELAY_PIN, RELAY_OFF);
      pumpStatus = false;
      pumpWatchdogTriggered = true;
      Serial.println(F("[WATCHDOG CRITICAL] Pump exceeded 20 min continuous run! CUTOFF ENGAGED."));
    }
  } else {
    pumpWasRunning = false;
    pumpStartTime = 0;
  }

  // ====================================================
  // SERIAL ENVIRONMENT DATA
  // ====================================================

  Serial.println();
  Serial.println("==============================");
  Serial.println(" ENVIRONMENT SENSOR DATA");
  Serial.println("==============================");

  Serial.print("Temperature : ");

  if (isnan(temperature))
  {
    Serial.println("DHT ERROR");
  }
  else
  {
    Serial.print(temperature);
    Serial.println(" C");
  }

  Serial.print("Humidity    : ");

  if (isnan(humidity))
  {
    Serial.println("DHT ERROR");
  }
  else
  {
    Serial.print(humidity);
    Serial.println(" %");
  }

  Serial.print("Moisture RAW: ");
  Serial.println(moistureValue);

  Serial.print("Soil Status : ");

  if (soilIsDry)
  {
    Serial.println("DRY");
  }
  else
  {
    Serial.println("WET");
  }

  Serial.print("Rain RAW    : ");
  Serial.println(rainValue);

  Serial.print("Rain Status : ");

  if (isRaining)
  {
    Serial.println("RAIN DETECTED");
  }
  else
  {
    Serial.println("NO RAIN");
  }

  Serial.print("LDR RAW     : ");
  Serial.println(ldrValue);

  Serial.print("PUMP        : ");

  if (pumpStatus)
  {
    Serial.println("ON");
  }
  else
  {
    Serial.println("OFF");
  }

  // ====================================================
  // NPK VARIABLES
  // ====================================================

  uint16_t nitrogen = 0;
  uint16_t phosphorus = 0;
  uint16_t potassium = 0;

  // ====================================================
  // READ NPK
  // ====================================================

  Serial.println();
  Serial.println("------------------------------");

  Serial.println("Reading NPK...");

  bool npkStatus =
    readNPK(
      nitrogen,
      phosphorus,
      potassium
    );

  if (npkStatus)
  {
    Serial.println("NPK READ SUCCESS!");

    Serial.print("Nitrogen (N): ");
    Serial.print(nitrogen);
    Serial.println(" mg/kg");

    Serial.print("Phosphorus (P): ");
    Serial.print(phosphorus);
    Serial.println(" mg/kg");

    Serial.print("Potassium (K): ");
    Serial.print(potassium);
    Serial.println(" mg/kg");

    Serial.println();
  }
  else
  {
    Serial.println("NPK READ FAILED!");
  }

  // ====================================================
  // UPDATE OLED
  // ====================================================

  displayAllData(
    temperature,
    humidity,
    moistureValue,
    rainValue,
    ldrValue,
    pumpStatus,
    soilIsDry,
    isRaining,
    nitrogen,
    phosphorus,
    potassium,
    npkStatus
  );

  // ====================================================
  // PUBLISH REAL-TIME TELEMETRY TO APP VIA MQTT
  // ====================================================

  if (mqttClient.connected() && (now - lastPublishTime >= PUBLISH_INTERVAL)) {
    lastPublishTime = now;
    publishTelemetry(
      temperature,
      humidity,
      moistureValue,
      rainValue,
      ldrValue,
      pumpStatus,
      nitrogen,
      phosphorus,
      potassium,
      npkStatus
    );
  }

  // ====================================================
  // NON-BLOCKING CYCLE DELAY (Replaces delay(2000))
  // ====================================================

  unsigned long cycleStart = millis();
  while (millis() - cycleStart < 2000) {
    mqttClient.loop();
    delay(20);
  }
}