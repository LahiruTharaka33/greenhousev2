import mqttService from './mqtt';

export interface ReleaseChange {
    slotNumber: number; // 1, 2, or 3
    oldTime?: string;
    newTime: string;
    oldQuantity?: number;
    newQuantity: number;
    isNew: boolean; // true if this is a newly added release
}

export interface ResubscribeResult {
    success: boolean;
    subscribedTopics: string[];
    errors: string[];
}

class ScheduleV2Resubscriber {
    /**
     * Ensure MQTT connection is active
     */
    private async ensureConnection(): Promise<boolean> {
        try {
            if (!mqttService.getConnectionStatus()) {
                console.log('MQTT not connected, attempting to connect for resubscription...');
                const connected = await mqttService.connect();
                if (!connected) {
                    console.error('Failed to connect to MQTT broker for resubscription');
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('Error ensuring MQTT connection for resubscription:', error);
            return false;
        }
    }

    /**
     * Convert time from "HH:mm" format to "HHmm" format for ESP32
     */
    private convertTimeToESP32Format(timeString: string): string {
        if (!timeString || timeString === "") {
            return "0000";
        }
        return timeString.replace(':', '');
    }

    /**
     * Detect which release slots have been modified
     */
    detectReleaseChanges(
        oldReleases: Array<{ id?: string; time: string; releaseQuantity: number | { toString(): string }; cancelled?: boolean }>,
        newReleases: Array<{ id?: string; time: string; releaseQuantity: number | { toString(): string }; cancelled?: boolean }>
    ): ReleaseChange[] {
        const changes: ReleaseChange[] = [];

        // Filter out cancelled releases from both old and new
        const activeOldReleases = oldReleases.filter(r => !r.cancelled);
        const activeNewReleases = newReleases.filter(r => !r.cancelled);

        // Sort both arrays by time to ensure consistent slot assignment
        const sortedOld = [...activeOldReleases].sort((a, b) => a.time.localeCompare(b.time));
        const sortedNew = [...activeNewReleases].sort((a, b) => a.time.localeCompare(b.time));

        // Compare up to 3 slots
        const maxSlots = Math.max(sortedOld.length, sortedNew.length, 3);

        for (let i = 0; i < Math.min(maxSlots, 3); i++) {
            const oldRelease = sortedOld[i];
            const newRelease = sortedNew[i];
            const slotNumber = i + 1;

            // Case 1: New release added in this slot
            if (!oldRelease && newRelease) {
                changes.push({
                    slotNumber,
                    newTime: newRelease.time,
                    newQuantity: parseFloat(newRelease.releaseQuantity.toString()),
                    isNew: true
                });
            }
            // Case 2: Release modified in this slot
            else if (oldRelease && newRelease) {
                const timeChanged = oldRelease.time !== newRelease.time;
                const quantityChanged = parseFloat(oldRelease.releaseQuantity.toString()) !== parseFloat(newRelease.releaseQuantity.toString());

                if (timeChanged || quantityChanged) {
                    changes.push({
                        slotNumber,
                        oldTime: oldRelease.time,
                        newTime: newRelease.time,
                        oldQuantity: parseFloat(oldRelease.releaseQuantity.toString()),
                        newQuantity: parseFloat(newRelease.releaseQuantity.toString()),
                        isNew: false
                    });
                }
            }
            // Case 3: Release removed from this slot (old exists, new doesn't)
            else if (oldRelease && !newRelease) {
                // Treat as change to empty/zero values
                changes.push({
                    slotNumber,
                    oldTime: oldRelease.time,
                    newTime: '00:00',
                    oldQuantity: parseFloat(oldRelease.releaseQuantity.toString()),
                    newQuantity: 0,
                    isNew: false
                });
            }
        }

        return changes;
    }

    /**
     * Resubscribe to MQTT topics for modified release slots
     */
    async resubscribeToModifiedReleases(
        waterClientId: string,
        releaseChanges: ReleaseChange[]
    ): Promise<ResubscribeResult> {
        console.log('🔄 Resubscribing to modified release topics...', { waterClientId, releaseChanges });

        // Ensure MQTT connection
        const connected = await this.ensureConnection();
        if (!connected) {
            return {
                success: false,
                subscribedTopics: [],
                errors: ['MQTT connection failed']
            };
        }

        // Wait for connection stability
        await new Promise(resolve => setTimeout(resolve, 100));

        const subscribedTopics: string[] = [];
        const errors: string[] = [];

        // Subscribe to topics for each modified release slot
        for (const change of releaseChanges) {
            const timeTopic = `${waterClientId}/schedule_time${change.slotNumber}`;
            const volumeTopic = `${waterClientId}/schedule_volume${change.slotNumber}`;

            try {
                // Subscribe to time topic
                const timeSubscribed = mqttService.subscribe(timeTopic, (message) => {
                    console.log(`📥 Received update on ${timeTopic}: ${message}`);
                });

                if (timeSubscribed) {
                    subscribedTopics.push(timeTopic);
                    console.log(`✅ Subscribed to ${timeTopic}`);
                } else {
                    errors.push(`Failed to subscribe to ${timeTopic}`);
                    console.error(`❌ Failed to subscribe to ${timeTopic}`);
                }

                // Small delay between subscriptions
                await new Promise(resolve => setTimeout(resolve, 50));

                // Subscribe to volume topic
                const volumeSubscribed = mqttService.subscribe(volumeTopic, (message) => {
                    console.log(`📥 Received update on ${volumeTopic}: ${message}`);
                });

                if (volumeSubscribed) {
                    subscribedTopics.push(volumeTopic);
                    console.log(`✅ Subscribed to ${volumeTopic}`);
                } else {
                    errors.push(`Failed to subscribe to ${volumeTopic}`);
                    console.error(`❌ Failed to subscribe to ${volumeTopic}`);
                }

                // Small delay between subscriptions
                await new Promise(resolve => setTimeout(resolve, 50));

            } catch (error) {
                const errorMsg = `Error subscribing to slot ${change.slotNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        const success = errors.length === 0 && subscribedTopics.length > 0;

        console.log('🔄 Resubscription summary:', {
            success,
            subscribedTopics,
            errors
        });

        return {
            success,
            subscribedTopics,
            errors
        };
    }
}

// Create singleton instance
const scheduleV2Resubscriber = new ScheduleV2Resubscriber();

export default scheduleV2Resubscriber;
