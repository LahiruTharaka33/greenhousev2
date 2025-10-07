import mqttService from './mqtt';

export interface ScheduleData {
  id: string;
  scheduledDate: Date;
  scheduledTime: string;
  quantity: number;
  item: {
    itemName: string;
    itemCategory: string;
  };
  customer: {
    customerName: string;
  };
  tunnel?: {
    tunnelName: string;
  };
}

export interface MQTTPublishResult {
  topic: string;
  message: string;
  success: boolean;
  error?: string;
}

export interface SchedulePublishResult {
  date: string;
  time: string;
  results: MQTTPublishResult[];
  success: boolean;
}

export interface PublishSummary {
  totalSchedules: number;
  uniqueDates: number;
  publishResults: SchedulePublishResult[];
  overallSuccess: boolean;
  timestamp: string;
}

class SchedulePublisher {
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

  private publishToTopic(topic: string, message: string): Promise<MQTTPublishResult> {
    return new Promise((resolve) => {
      try {
        const success = mqttService.publish(topic, message);
        resolve({
          topic,
          message,
          success,
          error: success ? undefined : 'Failed to publish message'
        });
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

  private groupSchedulesByDate(schedules: ScheduleData[]): Map<string, ScheduleData[]> {
    const grouped = new Map<string, ScheduleData[]>();
    
    schedules.forEach(schedule => {
      const dateKey = schedule.scheduledDate.toISOString().split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(schedule);
    });
    
    return grouped;
  }

  private async publishScheduleGroup(date: string, schedules: ScheduleData[]): Promise<SchedulePublishResult> {
    const results: MQTTPublishResult[] = [];
    
    // Get the time from the first schedule (assuming all schedules for the same date have the same time)
    const time = schedules[0].scheduledTime;
    
    // Publish date
    const dateResult = await this.publishToTopic('scheduled_date', date);
    results.push(dateResult);
    
    // Publish time
    const timeResult = await this.publishToTopic('scheduled_time', time);
    results.push(timeResult);
    
    // Group fertilizers and publish them
    const fertilizers = schedules.map(s => ({
      name: s.item.itemName,
      quantity: s.quantity.toString()
    }));
    
    // Publish up to 3 fertilizers
    for (let i = 0; i < Math.min(fertilizers.length, 3); i++) {
      const fertilizerTopic = `fertilizer_${i + 1}`;
      const fertilizerResult = await this.publishToTopic(fertilizerTopic, fertilizers[i].quantity);
      results.push(fertilizerResult);
    }
    
    // Add a small delay between groups to avoid overwhelming the ESP32
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const success = results.every(r => r.success);
    
    return {
      date,
      time,
      results,
      success
    };
  }

  async publishSchedules(schedules: ScheduleData[]): Promise<PublishSummary> {
    console.log(`Publishing ${schedules.length} schedules to ESP32...`);
    
    // Ensure MQTT connection
    const connected = await this.ensureConnection();
    if (!connected) {
      return {
        totalSchedules: schedules.length,
        uniqueDates: 0,
        publishResults: [],
        overallSuccess: false,
        timestamp: new Date().toISOString()
      };
    }
    
    // Group schedules by date
    const groupedSchedules = this.groupSchedulesByDate(schedules);
    const publishResults: SchedulePublishResult[] = [];
    
    // Process each date group
    for (const [date, dateSchedules] of groupedSchedules) {
      try {
        const result = await this.publishScheduleGroup(date, dateSchedules);
        publishResults.push(result);
        
        console.log(`Published schedule group for ${date}:`, {
          success: result.success,
          fertilizers: result.results.filter(r => r.topic.startsWith('fertilizer_')).length
        });
      } catch (error) {
        console.error(`Error publishing schedule group for ${date}:`, error);
        publishResults.push({
          date,
          time: dateSchedules[0].scheduledTime,
          results: [{
            topic: 'error',
            message: '',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }],
          success: false
        });
      }
    }
    
    const overallSuccess = publishResults.every(r => r.success);
    
    const summary: PublishSummary = {
      totalSchedules: schedules.length,
      uniqueDates: groupedSchedules.size,
      publishResults,
      overallSuccess,
      timestamp: new Date().toISOString()
    };
    
    console.log('Schedule publishing summary:', {
      totalSchedules: summary.totalSchedules,
      uniqueDates: summary.uniqueDates,
      overallSuccess: summary.overallSuccess
    });
    
    return summary;
  }
}

// Create singleton instance
const schedulePublisher = new SchedulePublisher();

export default schedulePublisher;
