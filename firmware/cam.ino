/*
 * AgriSense — Camera Node (ESP32-CAM)
 * ─────────────────────────────────────
 * Board: AI Thinker ESP32-CAM
 *
 * Role:
 *   - Connects to your Home Wi-Fi network.
 *   - Serves MJPEG stream at port 81 and snapshot at port 80.
 *   - Connects to MQTT to dynamically report its IP address to the dashboard.
 *   - Listens to MQTT commands to trigger the bright Flash LED.
 */

#include "esp_camera.h"
#include "esp_http_server.h"
#include "WiFi.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ─── Network Credentials ──────────────────────────────────────────────────────
#define WIFI_SSID  "Redmi Note 11 Pro+ 5G"
#define WIFI_PASS  "@polu1411P"

const char* MQTT_HOST    = "94115c42cfdb4cafbaeab332ee285834.s1.eu.hivemq.cloud";
const int   MQTT_PORT    = 8883;
const char* MQTT_USER    = "Agri-Sense_admin";
const char* MQTT_PASS    = "@agri2026P";

const char* USER_EMAIL   = "contact.prolay14@gmail.com";

String TOPIC_SENSORS;
String TOPIC_COMMANDS;

WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);
unsigned long lastTelemetryTime = 0;

// AI-Thinker ESP32-CAM pin map (do NOT change)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define FLASH_LED_PIN      4

static camera_config_t cam_cfg = {
  .pin_pwdn     = PWDN_GPIO_NUM,  .pin_reset    = RESET_GPIO_NUM,
  .pin_xclk     = XCLK_GPIO_NUM,
  .pin_sscb_sda = SIOD_GPIO_NUM,  .pin_sscb_scl = SIOC_GPIO_NUM,
  .pin_d7 = Y9_GPIO_NUM, .pin_d6 = Y8_GPIO_NUM, .pin_d5 = Y7_GPIO_NUM,
  .pin_d4 = Y6_GPIO_NUM, .pin_d3 = Y5_GPIO_NUM, .pin_d2 = Y4_GPIO_NUM,
  .pin_d1 = Y3_GPIO_NUM, .pin_d0 = Y2_GPIO_NUM,
  .pin_vsync = VSYNC_GPIO_NUM, .pin_href = HREF_GPIO_NUM, .pin_pclk = PCLK_GPIO_NUM,
  .xclk_freq_hz  = 20000000,
  .ledc_timer    = LEDC_TIMER_0,
  .ledc_channel  = LEDC_CHANNEL_0,
  .pixel_format  = PIXFORMAT_JPEG,
  .frame_size    = FRAMESIZE_VGA,
  .jpeg_quality  = 12,
  .fb_count      = 1, // Default to 1, updated dynamically in setup()
  .grab_mode     = CAMERA_GRAB_WHEN_EMPTY
};

// ─── Standard MJPEG Stream Boundaries ──────────────────────────────────────────
#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

static esp_err_t streamHandler(httpd_req_t *req) {
  camera_fb_t *fb = NULL;
  esp_err_t res = ESP_OK;
  char part_buf[64];

  res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
  if (res != ESP_OK) return res;
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("[CAM] Frame capture failed");
      res = ESP_FAIL;
      break;
    }

    size_t hlen = snprintf(part_buf, 64, _STREAM_PART, fb->len);
    res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
    if (res == ESP_OK) res = httpd_resp_send_chunk(req, part_buf, hlen);
    if (res == ESP_OK) res = httpd_resp_send_chunk(req, (const char *)fb->buf, fb->len);

    esp_camera_fb_return(fb);
    if (res != ESP_OK) break;
  }
  return res;
}

static esp_err_t captureHandler(httpd_req_t *req) {
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }
  httpd_resp_set_type(req, "image/jpeg");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "GET, OPTIONS");
  httpd_resp_set_hdr(req, "Content-Disposition", "attachment; filename=agrisense.jpg");
  httpd_resp_send(req, (const char *)fb->buf, fb->len);
  esp_camera_fb_return(fb);
  return ESP_OK;
}

static void startCamServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 80;
  
  httpd_handle_t server = NULL;
  if (httpd_start(&server, &config) == ESP_OK) {
    httpd_uri_t capture_uri = { .uri = "/capture", .method = HTTP_GET, .handler = captureHandler };
    httpd_register_uri_handler(server, &capture_uri);
    Serial.println("[CAM] Control server started on port 80 (/capture)");
  }

  config.server_port = 81;
  config.ctrl_port = 32769; 
  httpd_handle_t stream_server = NULL;
  if (httpd_start(&stream_server, &config) == ESP_OK) {
    httpd_uri_t stream_uri  = { .uri = "/stream",  .method = HTTP_GET, .handler = streamHandler  };
    httpd_register_uri_handler(stream_server, &stream_uri);
    Serial.println("[CAM] Stream server started on port 81 (/stream)");
  }
}

void onMessageReceived(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  deserializeJson(doc, payload, length);
  const char* action = doc["action"];

  if (action && strcmp(action, "LIGHT_ON") == 0) {
    digitalWrite(FLASH_LED_PIN, HIGH);
    Serial.println("[MQTT] Flash LED ON");
  } else if (action && strcmp(action, "LIGHT_OFF") == 0) {
    digitalWrite(FLASH_LED_PIN, LOW);
    Serial.println("[MQTT] Flash LED OFF");
  }
}

void connectMqtt() {
  while (!mqttClient.connected()) {
    Serial.print("[MQTT] Connecting...");
    String clientId = "AGRI_CAM_" + String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println(" CONNECTED");
      mqttClient.subscribe(TOPIC_COMMANDS.c_str());
    } else {
      Serial.print(" failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n=== AgriSense Camera Node ===");

  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);

  // Dynamic PSRAM Memory Configuration for Stream Stability
  if (psramFound()) {
    Serial.println("[CAM] PSRAM Found. High Quality Enabled.");
    cam_cfg.frame_size = FRAMESIZE_VGA;
    cam_cfg.jpeg_quality = 10;
    cam_cfg.fb_count = 2;
    cam_cfg.grab_mode = CAMERA_GRAB_LATEST;
  } else {
    Serial.println("[CAM] No PSRAM. Using Low Quality Fallback.");
    cam_cfg.frame_size = FRAMESIZE_VGA;
    cam_cfg.jpeg_quality = 12;
    cam_cfg.fb_count = 1;
    cam_cfg.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  }

  esp_err_t err = esp_camera_init(&cam_cfg);
  if (err != ESP_OK) {
    Serial.printf("[CAM] Camera init FAILED with error 0x%x\n", err);
    return;
  }
  Serial.println("[CAM] Camera OK");

  // Join the Home Wi-Fi using DHCP so it dynamically connects to the Hotspot
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("[WiFi] Joining '%s'", WIFI_SSID);

  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - t0 > 25000) {
      Serial.println("\n[WiFi] Timeout — could not join AP. Please restart.");
      return;
    }
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n[WiFi] Connected!");
  Serial.printf("[CAM] IP Address: %s\n", WiFi.localIP().toString().c_str());

  startCamServer();

  TOPIC_SENSORS  = "agrisense/" + String(USER_EMAIL) + "/field_b/sensors";
  TOPIC_COMMANDS = "agrisense/" + String(USER_EMAIL) + "/field_b/commands";

  espClient.setInsecure();
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(onMessageReceived);
  connectMqtt();
}

void loop() {
  if (!mqttClient.connected()) {
    connectMqtt();
  }
  mqttClient.loop();

  // Send a heartbeat every 5 seconds to the dashboard so it knows the Camera's dynamic IP
  if (millis() - lastTelemetryTime > 5000) {
    lastTelemetryTime = millis();
    
    StaticJsonDocument<256> doc;
    doc["user_email"] = USER_EMAIL;
    
    JsonObject vision = doc.createNestedObject("vision");
    vision["active"] = true;
    vision["ip"] = WiFi.localIP().toString();
    vision["detection"] = "Healthy Plant";
    
    JsonObject hardware = doc.createNestedObject("hardware");
    hardware["cam"] = "ACTIVE";
    hardware["light"] = digitalRead(FLASH_LED_PIN) ? "ACTIVE" : "ONLINE";

    char buffer[256];
    serializeJson(doc, buffer);
    mqttClient.publish(TOPIC_SENSORS.c_str(), buffer);
  }
}