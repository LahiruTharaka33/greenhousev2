import mqtt, { MqttClient } from 'mqtt';

class MQTTService {
  private client: MqttClient | null = null;
  private isConnected = false;
  private messageCallbacks: Map<string, (message: string) => void> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;

  // MQTT Configuration for Production (HTTPS Compatible)
  private config = {
    // HiveMQ Public WebSocket Broker - Secure WebSocket
    host: 'wss://broker.hivemq.com:8884/mqtt',
    clientId: `greenhouse_web_${Math.random().toString(16).slice(3)}`,
    clean: true,
    keepalive: 60,
    connectTimeout: 30 * 1000,
    reconnectPeriod: 1000,
  };

  // Connect to MQTT broker
  async connect(): Promise<boolean> {
    try {
      if (this.client && this.isConnected) {
        return true;
      }

      // Create new MQTT client
      this.client = mqtt.connect(this.config.host, {
        clientId: this.config.clientId,
        clean: this.config.clean,
        keepalive: this.config.keepalive,
        connectTimeout: this.config.connectTimeout,
        reconnectPeriod: this.config.reconnectPeriod,
      });

      return new Promise((resolve) => {
        if (!this.client) {
          resolve(false);
          return;
        }

        // Handle successful connection
        this.client.on('connect', () => {
          console.log('Connected to MQTT broker via HiveMQ');
          this.isConnected = true;
          this.setupEventHandlers();
          resolve(true);
        });

        // Handle connection errors
        this.client.on('error', (error) => {
          console.error('MQTT connection failed:', error);
          this.isConnected = false;
          resolve(false);
        });
      });
    } catch (error) {
      console.error('Failed to connect to MQTT:', error);
      return false;
    }
  }

  // Setup event handlers
  private setupEventHandlers() {
    if (!this.client) return;

    // Handle connection lost
    this.client.on('offline', () => {
      console.log('MQTT connection lost');
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      console.log('MQTT reconnecting...');
    });

    this.client.on('connect', () => {
      console.log('MQTT reconnected');
      this.isConnected = true;
    });

    // Handle incoming messages
    this.client.on('message', (topic, message) => {
      const messageStr = message.toString();
      console.log(`Message received on topic ${topic}: ${messageStr}`);
      
      // Call registered callback for this topic
      const callback = this.messageCallbacks.get(topic);
      if (callback) {
        callback(messageStr);
      }
    });
  }

  // Subscribe to a topic
  subscribe(topic: string, callback: (message: string) => void): boolean {
    if (!this.client || !this.isConnected) {
      console.error('MQTT client not connected');
      return false;
    }

    try {
      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error(`Error subscribing to ${topic}:`, error);
        } else {
          console.log(`Subscribed to ${topic}`);
          this.messageCallbacks.set(topic, callback);
        }
      });
      return true;
    } catch (error) {
      console.error(`Error subscribing to ${topic}:`, error);
      return false;
    }
  }

  // Unsubscribe from a topic
  unsubscribe(topic: string): boolean {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      this.client.unsubscribe(topic, (error) => {
        if (error) {
          console.error(`Error unsubscribing from ${topic}:`, error);
        } else {
          this.messageCallbacks.delete(topic);
        }
      });
      return true;
    } catch (error) {
      console.error(`Error unsubscribing from ${topic}:`, error);
      return false;
    }
  }

  // Publish message to a topic
  publish(topic: string, message: string): boolean {
    if (!this.client || !this.isConnected) {
      console.error('MQTT client not connected');
      return false;
    }

    try {
      this.client.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          console.error(`Error publishing to ${topic}:`, error);
        } else {
          console.log(`Published to ${topic}: ${message}`);
        }
      });
      return true;
    } catch (error) {
      console.error(`Error publishing to ${topic}:`, error);
      return false;
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected && this.client?.connected === true;
  }

  // Disconnect from MQTT broker
  disconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    if (this.client) {
      this.client.end();
    }
    
    this.client = null;
    this.isConnected = false;
    this.messageCallbacks.clear();
  }
}

// Create singleton instance
const mqttService = new MQTTService();

export default mqttService;
