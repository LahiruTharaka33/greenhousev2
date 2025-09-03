import Paho from 'paho-mqtt';

class MQTTService {
  private client: Paho.Client | null = null;
  private isConnected = false;
  private messageCallbacks: Map<string, (message: string) => void> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;

  // MQTT Configuration for Production (HTTPS Compatible)
  private config = {
    // Eclipse Paho WebSocket Broker - Designed for web browsers
    host: 'mqtt.eclipseprojects.io',
    port: 9001, // WebSocket port (not WSS for better compatibility)
    clientId: `greenhouse_prod_${Math.random().toString(16).slice(3)}`,
    clean: true,
    keepAliveInterval: 60,
    connectTimeout: 30,
    useSSL: false, // Use plain WebSocket for better compatibility
  };

  // Connect to MQTT broker
  async connect(): Promise<boolean> {
    try {
      if (this.client && this.isConnected) {
        return true;
      }

      // Create new Paho client
      this.client = new Paho.Client(
        this.config.host,
        this.config.port,
        this.config.clientId
      );

      return new Promise((resolve) => {
        // Set up connection options
        const connectOptions = {
          useSSL: this.config.useSSL,
          cleanSession: this.config.clean,
          keepAliveInterval: this.config.keepAliveInterval,
          connectTimeout: this.config.connectTimeout,
          onSuccess: () => {
            console.log('Connected to MQTT broker via Eclipse Paho');
            this.isConnected = true;
            this.setupEventHandlers();
            this.startReconnection();
            resolve(true);
          },
          onFailure: (error: any) => {
            console.error('MQTT connection failed:', error);
            this.isConnected = false;
            resolve(false);
          }
        };

        // Connect to broker
        this.client!.connect(connectOptions);
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
    this.client.onConnectionLost = (responseObject) => {
      console.log('MQTT connection lost:', responseObject);
      this.isConnected = false;
      this.stopReconnection();
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, 5000);
    };

    // Handle incoming messages
    this.client.onMessageArrived = (message) => {
      const topic = message.destinationName;
      const messageStr = message.payloadString;
      console.log(`Message received on topic ${topic}: ${messageStr}`);
      
      // Call registered callback for this topic
      const callback = this.messageCallbacks.get(topic);
      if (callback) {
        callback(messageStr);
      }
    };
  }

  // Subscribe to a topic
  subscribe(topic: string, callback: (message: string) => void): boolean {
    if (!this.client || !this.isConnected) {
      console.error('MQTT client not connected');
      return false;
    }

    try {
      this.client.subscribe(topic);
      console.log(`Subscribed to ${topic}`);
      this.messageCallbacks.set(topic, callback);
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
      const mqttMessage = new Paho.Message(message);
      mqttMessage.destinationName = topic;
      mqttMessage.qos = 1;
      
      this.client.send(mqttMessage);
      console.log(`Published to ${topic}: ${message}`);
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

  // Start reconnection logic
  private startReconnection() {
    if (this.reconnectInterval) return;
    
    this.reconnectInterval = setInterval(() => {
      if (!this.isConnected && this.client) {
        console.log('Attempting to reconnect...');
        this.connect();
      }
    }, 30000); // Try every 30 seconds
  }

  // Stop reconnection logic
  private stopReconnection() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  // Disconnect from MQTT broker
  disconnect(): void {
    this.stopReconnection();
    
    if (this.client && this.isConnected) {
      this.client.disconnect();
    }
    
    this.client = null;
    this.isConnected = false;
    this.messageCallbacks.clear();
  }
}

// Create singleton instance
const mqttService = new MQTTService();

export default mqttService;
