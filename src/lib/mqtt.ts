import mqtt, { MqttClient } from 'mqtt';

class MQTTService {
  private client: MqttClient | null = null;
  private isConnected = false;
  private messageCallbacks: Map<string, (message: string) => void> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private clientId: string;

  // MQTT Configuration for Production (HTTPS Compatible)
  private config = {
    // HiveMQ Public WebSocket Broker - Secure WebSocket
    host: 'wss://broker.hivemq.com:8884/mqtt',
    clean: true,
    keepalive: 60,
    connectTimeout: 30 * 1000,
    reconnectPeriod: 1000,
  };

  constructor(clientId?: string) {
    // Use provided clientId or generate a random one for backward compatibility
    this.clientId = clientId || `greenhouse_web_${Math.random().toString(16).slice(3)}`;
  }

  // Connect to MQTT broker
  async connect(): Promise<boolean> {
    try {
      if (this.client && this.isConnected && this.client.connected) {
        console.log('MQTT already connected');
        return true;
      }

      // Disconnect existing client if any
      if (this.client) {
        console.log('Cleaning up existing MQTT client');
        this.client.end(true);
        this.client = null;
        this.isConnected = false;
      }

      console.log('Creating new MQTT connection...');
      
      // Create new MQTT client
      this.client = mqtt.connect(this.config.host, {
        clientId: this.clientId,
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

        // Set timeout for connection
        const timeout = setTimeout(() => {
          console.error('MQTT connection timeout');
          this.isConnected = false;
          resolve(false);
        }, 10000); // 10 second timeout

        // Handle successful connection
        this.client.on('connect', () => {
          clearTimeout(timeout);
          console.log('✅ Connected to MQTT broker via HiveMQ');
          this.isConnected = true;
          this.setupEventHandlers();
          
          // Wait a bit more to ensure connection is stable
          setTimeout(() => {
            console.log('✅ MQTT connection stable and ready');
            resolve(true);
          }, 500);
        });

        // Handle connection errors
        this.client.on('error', (error) => {
          clearTimeout(timeout);
          console.error('❌ MQTT connection failed:', error);
          this.isConnected = false;
          resolve(false);
        });
      });
    } catch (error) {
      console.error('❌ Failed to connect to MQTT:', error);
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
    if (!this.client) {
      console.error(`❌ Cannot publish to ${topic}: MQTT client is null`);
      return false;
    }

    if (!this.isConnected) {
      console.error(`❌ Cannot publish to ${topic}: MQTT not connected (isConnected=false)`);
      return false;
    }

    if (!this.client.connected) {
      console.error(`❌ Cannot publish to ${topic}: MQTT client.connected=false`);
      return false;
    }

    try {
      console.log(`📤 Publishing to ${topic}: ${message}`);
      this.client.publish(topic, message, { qos: 1, retain: false }, (error) => {
        if (error) {
          console.error(`❌ Error publishing to ${topic}:`, error);
        } else {
          console.log(`✅ Successfully published to ${topic}: ${message}`);
        }
      });
      return true;
    } catch (error) {
      console.error(`❌ Exception publishing to ${topic}:`, error);
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

// Create singleton instance for backward compatibility
const mqttService = new MQTTService();

// Export the class for creating custom instances
export { MQTTService };

export default mqttService;
