# 🛰️ AgriSense Pro
### Smart Agriculture IoT & AI Ecosystem
**AgriSense Pro** is a high-performance, industrial-grade monitoring platform designed for real-time precision farming. It bridges the gap between IoT hardware (ESP32/SoilNodes) and actionable intelligence using the Gemini AI Engine.

---

## 💎 Key Features

*   **⚡ Real-Time Telemetry**: Instant data synchronization for Soil Moisture, Temperature, Humidity, and NPK levels via MQTT.
*   **🤖 AgriBot AI**: Advanced agronomy assistant powered by Google Gemini (Flash 1.5) for diagnostic insights and crop recommendations.
*   **🌍 Smart Weather**: Hyper-local weather forecasting and AQI monitoring based on real-time field GPS coordinates.
*   **📸 Vision Feed**: Live MJPEG streaming for visual field monitoring and remote observation.
*   **🕹️ Remote Actuation**: One-tap control for Pumps, Buzzers, and Sprayers directly from the dashboard.
*   **🔒 Secure Architecture**: Fully isolated environment configuration using `.env` to protect API keys and Firebase credentials.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19 + Vite (High-Performance Build System)
*   **Styling**: Vanilla CSS with Crystal-Smooth Premium UI Design
*   **Mobile**: Capacitor.js (Native Android/iOS wrapper)
*   **Backend**: Firebase (Firestore, Authentication, Storage)
*   **Communication**: MQTT (HiveMQ Cloud WSS)
*   **Intelligence**: Google Gemini API

---

## 🚀 Quick Setup

### 1. Prerequisites
- Node.js (v18+)
- Firebase Account
- HiveMQ Cloud (or any MQTT Broker)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Prolayjit-B14/Agri-Sense.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add your keys:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=your_id
VITE_MQTT_BROKER=your_broker_url
VITE_GEMINI_API_KEY=your_gemini_key
VITE_OPENWEATHER_API_KEY=your_weather_key
```

---

## 📱 Mobile Build (Android)
To generate the production APK:
```bash
npm run production:sync
npm run production:build:apk
```

---

## 🤝 Contribution & Credits
Designed and Developed by **Prolayjit Biswas**.

---
*© 2026 AgriSense Pro • SemiColon Team*
