import mqttService from './mqtt';
import { PrismaClient } from '@prisma/client';
import { getTankTopicFromName } from '@/utils/tankMapping';

const prisma = new PrismaClient();

export interface ScheduleV2TopicData {
  fertilizer_1: number;
  fertilizer_2: number;
  fertilizer_3: number;
  water_volume: number;
  schedule_time1: string;
  schedule_volume1: number;
  schedule_time2: string;
  schedule_volume2: number;
  schedule_time3: string;
  schedule_volume3: number;
}

export interface MQTTPublishResult {
  topic: string;
  message: string;
  success: boolean;
  error?: string;
}

export interface PublishSummary {
  totalTopics: number;
  publishResults: MQTTPublishResult[];
  overallSuccess: boolean;
  timestamp: string;
  warnings?: string[];
}

class ScheduleV2Publisher {
  private async ensureConnection(): Promise<boolean> {
    try {
      if (!mqttService.getConnectionStatus()) {
        console.log('MQTT not connected, attempting to connect...');
        const connected = await mqttService.connect();
        if (!connected) {
          console.error('Failed to connect to MQTT broker');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error ensuring MQTT connection:', error);
      return false;
    }
  }

  /**
   * Convert time from "HH:mm" format to "HHmm" format for ESP32
   * @param timeString - Time in "HH:mm" format (e.g., "13:45", "08:00")
   * @returns Time in "HHmm" format (e.g., "1345", "0800")
   */
  private convertTimeToESP32Format(timeString: string): string {
    if (!timeString || timeString === "") {
      return "0000";  // Default empty time (4-digit format)
    }
    
    // Remove colon to create numeric string: "13:45" -> "1345"
    return timeString.replace(':', '');
  }

  private publishToTopic(topic: string, message: string): Promise<MQTTPublishResult> {
    return new Promise((resolve) => {
      try {
        // Add small delay to ensure MQTT client is ready (especially important on Vercel)
        setTimeout(() => {
          const success = mqttService.publish(topic, message);
          resolve({
            topic,
            message,
            success,
            error: success ? undefined : 'Failed to publish message'
          });
        }, 50); // 50ms delay between each publish
      } catch (error) {
        resolve({
          topic,
          message,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  /**
   * Find which tank contains the specified fertilizer for a tunnel
   */
  private async findTankForFertilizer(tunnelId: string, fertilizerItemId: string): Promise<{ tankName: string; topic: string } | null> {
    try {
      const tankConfig = await prisma.tankConfiguration.findFirst({
        where: {
          tunnelId,
          itemType: 'fertilizer',
          itemId: fertilizerItemId
        },
        select: {
          tankName: true
        }
      });

      if (!tankConfig) {
        return null;
      }

      const topic = getTankTopicFromName(tankConfig.tankName);
      if (!topic) {
        return null;
      }

      return {
        tankName: tankConfig.tankName,
        topic
      };
    } catch (error) {
      console.error('Error finding tank for fertilizer:', error);
      return null;
    }
  }

  async publishScheduleV2(topicData: ScheduleV2TopicData, warnings: string[] = []): Promise<PublishSummary> {
    console.log('Publishing ScheduleV2 to ESP32 via MQTT...', topicData);
    
    // Ensure MQTT connection
    const connected = await this.ensureConnection();
    if (!connected) {
      return {
        totalTopics: 0,
        publishResults: [],
        overallSuccess: false,
        timestamp: new Date().toISOString(),
        warnings
      };
    }
    
    // Wait to ensure connection is fully established and stable (critical for Vercel serverless)
    // MQTT connection now includes 500ms stabilization period
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const results: MQTTPublishResult[] = [];
    
    // Publish fertilizer topics
    results.push(await this.publishToTopic('fertilizer_1', topicData.fertilizer_1.toString()));
    results.push(await this.publishToTopic('fertilizer_2', topicData.fertilizer_2.toString()));
    results.push(await this.publishToTopic('fertilizer_3', topicData.fertilizer_3.toString()));
    
    // Publish water volume
    results.push(await this.publishToTopic('water_volume', topicData.water_volume.toString()));
    
    // Convert times to ESP32 format (HH:mm -> HHmm)
    const time1 = this.convertTimeToESP32Format(topicData.schedule_time1);
    const time2 = this.convertTimeToESP32Format(topicData.schedule_time2);
    const time3 = this.convertTimeToESP32Format(topicData.schedule_time3);
    
    console.log('Converted times for ESP32:', {
      original: [topicData.schedule_time1, topicData.schedule_time2, topicData.schedule_time3],
      converted: [time1, time2, time3]
    });
    
    // Publish schedule time 1 and volume 1
    results.push(await this.publishToTopic('schedule_time1', time1));
    results.push(await this.publishToTopic('schedule_volume1', topicData.schedule_volume1.toString()));
    
    // Publish schedule time 2 and volume 2
    results.push(await this.publishToTopic('schedule_time2', time2));
    results.push(await this.publishToTopic('schedule_volume2', topicData.schedule_volume2.toString()));
    
    // Publish schedule time 3 and volume 3
    results.push(await this.publishToTopic('schedule_time3', time3));
    results.push(await this.publishToTopic('schedule_volume3', topicData.schedule_volume3.toString()));
    
    // Add small delay to avoid overwhelming the ESP32
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const overallSuccess = results.every(r => r.success);
    
    const summary: PublishSummary = {
      totalTopics: results.length,
      publishResults: results,
      overallSuccess,
      timestamp: new Date().toISOString(),
      warnings
    };
    
    console.log('ScheduleV2 MQTT publishing summary:', {
      totalTopics: summary.totalTopics,
      overallSuccess: summary.overallSuccess,
      successfulTopics: results.filter(r => r.success).length,
      failedTopics: results.filter(r => !r.success).length,
      warnings: warnings.length
    });
    
    return summary;
  }

  /**
   * Publish schedule with tank mapping - finds correct tank and publishes to its topic
   */
  async publishScheduleV2WithTankMapping(
    tunnelId: string,
    fertilizerItemId: string,
    fertilizerName: string,
    quantity: number,
    water: number,
    releases: Array<{ time: string; releaseQuantity: number }>
  ): Promise<PublishSummary> {
    console.log('Publishing schedule with tank mapping...', { tunnelId, fertilizerItemId, fertilizerName, quantity, water, releases });
    
    // Find which tank contains this fertilizer
    const tankMapping = await this.findTankForFertilizer(tunnelId, fertilizerItemId);
    
    if (!tankMapping) {
      const error = `Fertilizer "${fertilizerName}" is not configured in any tank for this tunnel. Please configure it in the Configuration page first.`;
      console.error(error);
      return {
        totalTopics: 0,
        publishResults: [],
        overallSuccess: false,
        timestamp: new Date().toISOString(),
        warnings: [error]
      };
    }

    console.log(`Found fertilizer "${fertilizerName}" in ${tankMapping.tankName}, will publish to topic: ${tankMapping.topic}`);

    // Ensure MQTT connection
    const connected = await this.ensureConnection();
    if (!connected) {
      return {
        totalTopics: 0,
        publishResults: [],
        overallSuccess: false,
        timestamp: new Date().toISOString(),
        warnings: ['MQTT connection failed']
      };
    }

    // Wait to ensure connection is fully established and stable (critical for Vercel serverless)
    // MQTT connection now includes 500ms stabilization period
    await new Promise(resolve => setTimeout(resolve, 100));

    const results: MQTTPublishResult[] = [];

    // Publish fertilizer quantity to the correct tank topic (just the quantity as requested)
    results.push(await this.publishToTopic(tankMapping.topic, quantity.toString()));

    // Publish water volume separately
    results.push(await this.publishToTopic('water_volume', water.toString()));

    // Publish release schedule details
    for (let i = 0; i < Math.min(releases.length, 3); i++) {
      const release = releases[i];
      const timeESP32 = this.convertTimeToESP32Format(release.time);
      
      results.push(await this.publishToTopic(`schedule_time${i + 1}`, timeESP32));
      results.push(await this.publishToTopic(`schedule_volume${i + 1}`, release.releaseQuantity.toString()));
    }

    // Fill remaining slots with zeros if less than 3 releases
    for (let i = releases.length; i < 3; i++) {
      results.push(await this.publishToTopic(`schedule_time${i + 1}`, '0000'));
      results.push(await this.publishToTopic(`schedule_volume${i + 1}`, '0'));
    }

    const overallSuccess = results.every(r => r.success);

    const summary: PublishSummary = {
      totalTopics: results.length,
      publishResults: results,
      overallSuccess,
      timestamp: new Date().toISOString(),
      warnings: []
    };

    console.log('Schedule published with tank mapping:', {
      tank: tankMapping.tankName,
      topic: tankMapping.topic,
      totalTopics: summary.totalTopics,
      success: summary.overallSuccess
    });

    return summary;
  }
}

// Create singleton instance
const scheduleV2Publisher = new ScheduleV2Publisher();

export default scheduleV2Publisher;


