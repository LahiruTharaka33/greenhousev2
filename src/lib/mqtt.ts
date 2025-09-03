import mqtt, { MqttClient, IClientOptions } from 'mqtt';

class MQTTService {
  private client: MqttClient | null = null;
  private isConnected = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private messageCallbacks: Map<string, (message: string) => void> = new Map();

  // MQTT Configuration for Production (HTTPS Compatible)
  private config: IClientOptions = {
    // HiveMQ Public Broker - Reliable and documented ports
    host: 'broker.hivemq.com',
    port: 8884,
    protocol: 'wss',
    clientId: `greenhouse_prod_${Math.random().toString(16).slice(3)}`,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    
    // Fallback brokers for production reliability
    // host: 'test.mosquitto.org', port: 8081, protocol: 'ws'
    // host: 'mqtt.eclipseprojects.io', port: 9001, protocol: 'ws'
  };

  // Connect to MQTT broker
  async connect(): Promise<boolean> {
    try {
      if (this.client && this.isConnected) {
        return true;
      }

      this.client = mqtt.connect(this.config);

      return new Promise((resolve) => {
        this.client!.on('connect', () => {
          console.log('Connected to MQTT broker');
          this.isConnected = true;
          this.setupEventHandlers();
          resolve(true);
        });

        this.client!.on('error', (error) => {
          console.error('MQTT connection error:', error);
          this.isConnected = false;
          resolve(false);
        });

        this.client!.on('close', () => {
          console.log('MQTT connection closed');
          this.isConnected = false;
        });

        this.client!.on('reconnect', () => {
          console.log('MQTT reconnecting...');
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
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${topic}:`, err);
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
      this.client.unsubscribe(topic);
      this.messageCallbacks.delete(topic);
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
      this.client.publish(topic, message, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Failed to publish to ${topic}:`, err);
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
    return this.isConnected;
  }

  // Disconnect from MQTT broker
  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
      this.messageCallbacks.clear();
    }
  }
}

// Create singleton instance
const mqttService = new MQTTService();

export default mqttService;
