/**
 * ============================================================================
 * @file    secrets.example.h
 * @brief   Template for sensitive Wi-Fi and MQTT credentials.
 *          Copy this file to 'secrets.h' and fill in your actual credentials.
 *          'secrets.h' is in .gitignore and will NOT be committed to git.
 * ============================================================================
 */

#pragma once

// Wi-Fi Credentials
#define SECRET_WIFI_SSID    "YOUR_WIFI_SSID"
#define SECRET_WIFI_PASS    "YOUR_WIFI_PASSWORD"

// HiveMQ Cloud / MQTT Broker Credentials
#define SECRET_MQTT_HOST    "your-instance.s1.eu.hivemq.cloud"
#define SECRET_MQTT_PORT    8883
#define SECRET_MQTT_USER    "your_mqtt_username"
#define SECRET_MQTT_PASS    "your_mqtt_password"

// Account Binding: Must match your registered user email
#define SECRET_USER_EMAIL   "farmer@example.com"
