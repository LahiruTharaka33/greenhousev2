/**
 * Tank Mapping Utilities
 * Maps physical tanks to MQTT topics and handles fertilizer-tank relationships
 */

/**
 * Maps tank name to MQTT topic
 * Tank A -> fertilizer_1
 * Tank B -> fertilizer_2
 * Tank C -> fertilizer_3
 */
export function getTankTopicFromName(tankName: string): string {
  const tankMap: Record<string, string> = {
    'Tank A': 'fertilizer_1',
    'Tank B': 'fertilizer_2',
    'Tank C': 'fertilizer_3',
  };
  
  return tankMap[tankName] || '';
}

/**
 * Maps tank topic back to tank name
 */
export function getTankNameFromTopic(topic: string): string {
  const topicMap: Record<string, string> = {
    'fertilizer_1': 'Tank A',
    'fertilizer_2': 'Tank B',
    'fertilizer_3': 'Tank C',
  };
  
  return topicMap[topic] || '';
}

/**
 * Gets all tank names in order
 */
export function getAllTankNames(): string[] {
  return ['Tank A', 'Tank B', 'Tank C'];
}

/**
 * Gets all fertilizer topics in order
 */
export function getAllFertilizerTopics(): string[] {
  return ['fertilizer_1', 'fertilizer_2', 'fertilizer_3'];
}

