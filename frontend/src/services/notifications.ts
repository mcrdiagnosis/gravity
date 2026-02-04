import { LocalNotifications } from '@capacitor/local-notifications';

export const NotificationService = {
    async requestPermissions() {
        try {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        } catch (e) {
            console.error("Error requesting notification permissions", e);
            return false;
        }
    },

    async schedule(id: number, title: string, body: string, date: Date) {
        try {
            // Schedule 30 minutes before, or immediate if time is close
            const scheduleTime = new Date(date.getTime() - 30 * 60000);
            const now = new Date();

            const at = scheduleTime > now ? scheduleTime : new Date(now.getTime() + 1000); // 1 sec from now if passed

            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: "🔔 Recordatorio Gravity",
                        body: `${title}: ${body}`,
                        id: id,
                        schedule: { at: at },
                        sound: undefined,
                        attachments: undefined,
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
            return true;
        } catch (e) {
            console.error("Error scheduling notification", e);
            return false;
        }
    },

    async cancel(id: number) {
        try {
            await LocalNotifications.cancel({ notifications: [{ id }] });
            return true;
        } catch (e) {
            console.error("Error cancelling notification", e);
            return false;
        }
    }
};
