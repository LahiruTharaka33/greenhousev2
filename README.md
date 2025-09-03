# Smart Greenhouse Controller

A Next.js web application for controlling IoT devices in a smart greenhouse system via MQTT.

## 🚀 Production Features

- **Real-time IoT Control**: Control LED lights, servo motors, and NeoPixel RGB strips
- **Sensor Monitoring**: Real-time temperature and humidity data from DHT22 sensors
- **MQTT Integration**: Uses EMQX public broker for reliable device communication
- **Responsive UI**: Modern, mobile-friendly interface built with Tailwind CSS
- **Production Ready**: Deployed on Vercel with global CDN

## 🏗️ Architecture

```
ESP32 (IoT Devices) ←→ broker.emqx.io:1883 (MQTT Broker) ←→ Web App (Vercel)
```

## 📱 Supported Devices

- **DHT22**: Temperature and humidity sensor
- **LED**: On/Off light control
- **Servo Motor**: 0-180° position control
- **WS2812 RGB Strip**: Full color control

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect your GitHub repository** to Vercel
2. **Automatic deployment** on every push
3. **Global CDN** for fast access worldwide
4. **HTTPS enabled** by default

### Manual Deployment
```bash
# Build the application
pnpm build

# Deploy to Vercel
vercel --prod
```

## 🔧 MQTT Configuration

- **Broker**: `broker.emqx.io`
- **Web Port**: `8083` (WebSocket)
- **Device Port**: `1883` (TCP)
- **Topics**:
  - `lights` - LED control (ON/OFF)
  - `servo` - Servo position (0-180)
  - `lights/neopixel` - RGB color (R,G,B)
  - `Tempdata` - Sensor data (temperature,humidity)

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🌐 Live Demo

Visit: [Your Vercel URL]

## 📄 License

MIT License - see LICENSE file for details. 
