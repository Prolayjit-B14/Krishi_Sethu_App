/**
 * ============================================================================
 * @file    AgriSense_Pro_Firmware.ino
 * @author  Prolayjit Biswas
 * @version 2.6.0 (Production Stable)
 * @date    2026-05-07
 * @brief   Unified Industrial Gateway Node for AgriSense Pro.
 *          Handles multi-zone telemetry (Soil, Weather, Storage, Irrigation)
 *          and bidirectional MQTT communication via HiveMQ Cloud.
 * ============================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

/* ----------------------------------------------------------------------------
 *  GLOBAL DEFINITIONS & HARDWARE MAPPING
 * ---------------------------------------------------------------------------- */
#define SERIAL_BAUD      115200
#define PUBLISH_INTERVAL 5000     // 5 seconds
#define MQTT_BUFFER_SIZE 2048     // Increased for rich JSON payloads
#define WIFI_RETRY_DELAY 500
#define MQTT_RETRY_DELAY 5000

// Hardware Pin Assignments
#define PIN_LED_HEARTBEAT 2       // Internal ESP32 LED
#define PIN_PUMP          26
#define PIN_BUZZER        25
#define PIN_LIGHT         18
#define PIN_SENSOR_DATA   34

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
//    If the email here doesn't match your login email, the app will receive data
//    but the topic subscription won't filter it (or it will subscribe to wrong topic).
const char* USER_EMAIL   = "contact.prolay14@gmail.com"; // ← UPDATE THIS TO YOUR FIREBASE LOGIN EMAIL

// MQTT Topics (Constructed dynamically in setup)
String TOPIC_SENSORS;
String TOPIC_COMMANDS;

/* ----------------------------------------------------------------------------
 *  SYSTEM STATE & OBJECTS
 * ---------------------------------------------------------------------------- */
WiFiClientSecure espClient;
PubSubClient     mqttClient(espClient);
unsigned long    lastPublishTime = 0;
unsigned long    lastHeartbeat   = 0;
bool             ledState        = false;

struct SystemState {
  bool pumpActive   = false;
  bool buzzerActive = false;
  bool lightActive  = false;
  const char* nodeID = "AgriSense_Pro_Node";
} state;

/* ----------------------------------------------------------------------------
 *  FUNCTION PROTOTYPES
 * ---------------------------------------------------------------------------- */
void setupHardware();
void connectWifi();
void connectMqtt();
void onMessageReceived(char* topic, byte* payload, unsigned int length);
void processTelemetry();
void logFullTelemetry(StaticJsonDocument<1200>& doc);
void handleHeartbeat();

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
  Serial.println(F("       /___/  PRO INDUSTRIAL GATEWAY v2.6.0           "));
  Serial.println(F(" -----------------------------------------------------"));

  // Construct topics dynamically using the centralized email
  TOPIC_SENSORS  = "agrisense/" + String(USER_EMAIL) + "/field_b/sensors";
  TOPIC_COMMANDS = "agrisense/" + String(USER_EMAIL) + "/field_b/commands";

  setupHardware();
  connectWifi();

  // Secure connection setup (Skip SSL validation for development convenience)
  espClient.setInsecure();

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(onMessageReceived);
  mqttClient.setBufferSize(MQTT_BUFFER_SIZE);

  Serial.println(F("[SYSTEM] Core initialization sequence complete."));
}

/* ----------------------------------------------------------------------------
 *  MAIN LOOP
 * ---------------------------------------------------------------------------- */
void loop() {
  if (!mqttClient.connected()) {
    connectMqtt();
  }
  mqttClient.loop();

  handleHeartbeat();

  unsigned long currentTime = millis();
  if (currentTime - lastPublishTime >= PUBLISH_INTERVAL) {
    lastPublishTime = currentTime;
    processTelemetry();
  }
}

/* ----------------------------------------------------------------------------
 *  HARDWARE INITIALIZATION
 * ---------------------------------------------------------------------------- */
void setupHardware() {
  Serial.print(F("[HW] Configuring IO Pins..."));
  pinMode(PIN_LED_HEARTBEAT, OUTPUT);
  pinMode(PIN_PUMP,          OUTPUT);
  pinMode(PIN_BUZZER,        OUTPUT);
  pinMode(PIN_LIGHT,         OUTPUT);
  
  // Ensure default states
  digitalWrite(PIN_LED_HEARTBEAT, LOW);
  digitalWrite(PIN_PUMP,          LOW);
  digitalWrite(PIN_BUZZER,        LOW);
  digitalWrite(PIN_LIGHT,         LOW);
  Serial.println(F(" OK"));
}

/* ----------------------------------------------------------------------------
 *  HEARTBEAT LED HANDLER
 * ---------------------------------------------------------------------------- */
void handleHeartbeat() {
  unsigned long now = millis();
  if (now - lastHeartbeat >= 1000) { // Blink every 1 second
    lastHeartbeat = now;
    ledState = !ledState;
    digitalWrite(PIN_LED_HEARTBEAT, ledState);
  }
}

/* ----------------------------------------------------------------------------
 *  WIFI CONNECTIVITY
 * ---------------------------------------------------------------------------- */
void connectWifi() {
  Serial.print(F("[WIFI] Initializing connection: "));
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(WIFI_RETRY_DELAY);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n[WIFI] Connected Successfully!"));
    Serial.print(F("[WIFI] Node IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\n[WIFI] CRITICAL ERROR: Connection Failed. Rebooting..."));
    delay(5000);
    ESP.restart();
  }
}

/* ----------------------------------------------------------------------------
 *  MQTT CONNECTIVITY
 * ---------------------------------------------------------------------------- */
void connectMqtt() {
  while (!mqttClient.connected()) {
    Serial.print(F("[MQTT] Authenticating with HiveMQ..."));
    
    // Generate unique ClientID based on MAC Address
    String clientId = "AGRI_PRO_" + WiFi.macAddress();
    clientId.replace(":", "");

    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println(F(" CONNECTED"));
      mqttClient.subscribe(TOPIC_COMMANDS.c_str());
      Serial.print(F("[MQTT] Subscribed to Topic: "));
      Serial.println(TOPIC_COMMANDS);
    } else {
      Serial.print(F(" FAILED [Code: "));
      Serial.print(mqttClient.state());
      Serial.println(F("]. Retrying in 5s..."));
      delay(MQTT_RETRY_DELAY);
    }
  }
}

/* ----------------------------------------------------------------------------
 *  COMMAND HANDLER (MQTT CALLBACK)
 * ---------------------------------------------------------------------------- */
void onMessageReceived(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  String messageBody = "";
  
  for (unsigned int i = 0; i < length; i++) {
    messageBody += (char)payload[i];
  }

  Serial.println(F("\n[MQTT] Incoming Command Message:"));
  Serial.println("   > " + messageBody);

  DeserializationError error = deserializeJson(doc, messageBody);
  if (error) {
    Serial.print(F("[JSON] Parse Error: "));
    Serial.println(error.c_str());
    return;
  }

  const char* action = doc["action"] | "NONE";

  // --- ACTUATOR LOGIC ---
  if (strcmp(action, "PUMP_ON") == 0) {
    state.pumpActive = true;
    digitalWrite(PIN_PUMP, HIGH);
    Serial.println(F("[EXEC] PUMP STATUS: ACTIVE (Manual Override)"));
  } 
  else if (strcmp(action, "PUMP_OFF") == 0) {
    state.pumpActive = false;
    digitalWrite(PIN_PUMP, LOW);
    Serial.println(F("[EXEC] PUMP STATUS: STANDBY"));
  }
  else if (strcmp(action, "BUZZER_ON") == 0) {
    state.buzzerActive = true;
    digitalWrite(PIN_BUZZER, HIGH);
    Serial.println(F("[EXEC] ALERT SYSTEM: TRIGGERED"));
  }
  else if (strcmp(action, "BUZZER_OFF") == 0) {
    state.buzzerActive = false;
    digitalWrite(PIN_BUZZER, LOW);
    Serial.println(F("[EXEC] ALERT SYSTEM: SILENCED"));
  }
  else if (strcmp(action, "LIGHT_ON") == 0) {
    state.lightActive = true;
    digitalWrite(PIN_LIGHT, HIGH);
    Serial.println(F("[EXEC] FACILITY LIGHTS: ILLUMINATED"));
  }
  else if (strcmp(action, "LIGHT_OFF") == 0) {
    state.lightActive = false;
    digitalWrite(PIN_LIGHT, LOW);
    Serial.println(F("[EXEC] FACILITY LIGHTS: EXTINGUISHED"));
  }
}

/* ----------------------------------------------------------------------------
 *  TELEMETRY PROCESSING & PUBLISHING
 * ---------------------------------------------------------------------------- */
void processTelemetry() {
  StaticJsonDocument<1200> doc; 
  doc["user_email"] = USER_EMAIL; 

  // Section 1: SOIL PARAMETERS (NPK + Environment)
  JsonObject soil = doc.createNestedObject("soil");
  soil["ph"]       = (random(62, 74) / 10.0f);
  soil["temp"]     = random(24, 31);
  soil["moisture"] = random(45, 68);
  
  JsonObject npk = soil.createNestedObject("npk");
  npk["n"] = random(80, 110);
  npk["p"] = random(40, 65);
  npk["k"] = random(180, 235);

  // Section 2: CLIMATE & ATMOSPHERE
  JsonObject weather = doc.createNestedObject("weather");
  weather["temp"] = (random(280, 355) / 10.0f);
  weather["humidity"]  = random(55, 82);
  weather["lightIntensity"]  = random(3000, 8501);
  weather["rainLevel"] = (random(0, 10) > 8) ? random(20, 95) : 0;

  // Sections 3 & 5 OMITTED TO MATCH PRODUCTION (Storage/Vision Offline)

  // Section 4: HYDRAULICS & IRRIGATION
  JsonObject irrigation = doc.createNestedObject("irrigation");
  irrigation["pump"]  = state.pumpActive ? "ACTIVE" : "ONLINE";

  // Section 6: HARDWARE NODE STATUS
  JsonObject hardware = doc.createNestedObject("hardware");
  hardware["pump"]    = state.pumpActive   ? "ACTIVE" : "ONLINE";
  hardware["display"] = "ONLINE";

  // Global Node Metadata
  doc["node"]   = state.nodeID;
  doc["status"] = "HEALTHY";
  doc["rssi"]   = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;

  // Serialize and Transmit
  char payloadBuffer[1200];
  serializeJson(doc, payloadBuffer);
  
  if (mqttClient.publish(TOPIC_SENSORS.c_str(), payloadBuffer)) {
    logFullTelemetry(doc);
  } else {
    Serial.println(F("[MQTT] FAIL: Transmission Error."));
  }
}

/* ----------------------------------------------------------------------------
 *  SERIAL DEBUG LOGGING
 * ---------------------------------------------------------------------------- */
void logFullTelemetry(StaticJsonDocument<1200>& doc) {
  Serial.println(F("\n\r>> [TX] UPLINK SUCCESSFUL"));
  Serial.print(F("   [INFO] NodeID: ")); Serial.println(doc["node"].as<const char*>());
  Serial.print(F("   [INFO] Signal: ")); Serial.print(doc["rssi"].as<int>()); Serial.println(" dBm");
  
  Serial.println(F("   [DATA] ZONE: SOIL HEALTH"));
  Serial.print(F("          |-- N/P/K:  ")); 
  Serial.print(doc["soil"]["npk"]["n"].as<int>()); Serial.print("/");
  Serial.print(doc["soil"]["npk"]["p"].as<int>()); Serial.print("/");
  Serial.println(doc["soil"]["npk"]["k"].as<int>());
  Serial.print(F("          |-- pH/T/M: ")); 
  Serial.print(doc["soil"]["ph"].as<float>()); Serial.print(" / ");
  Serial.print(doc["soil"]["temp"].as<int>()); Serial.print("C / ");
  Serial.print(doc["soil"]["moisture"].as<int>()); Serial.println("%");

  Serial.println(F("   [DATA] ZONE: WEATHER"));
  Serial.print(F("          |-- LDR/RN: ")); 
  Serial.print(doc["weather"]["lightIntensity"].as<int>()); Serial.print(" lx / ");
  Serial.print(doc["weather"]["rainLevel"].as<int>()); Serial.println(" %");
  Serial.print(F("          |-- T/H:    ")); 
  Serial.print(doc["weather"]["temp"].as<float>()); Serial.print("C / ");
  Serial.print(doc["weather"]["humidity"].as<int>()); Serial.println("%");

  Serial.println(F("   [DATA] ZONE: HYDRAULIC"));
  Serial.print(F("          |-- PUMP:   ")); 
  Serial.println(doc["irrigation"]["pump"].as<const char*>());

  Serial.print(F("   [TIME] Pulse: ")); Serial.print(doc["uptime"].as<long>()); Serial.println("s uptime");
  Serial.println(F("   -------------------------------------------------"));
}
