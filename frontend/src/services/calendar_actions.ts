import type { CalendarEvent } from '../types/analysis';
import { NotificationService } from './notifications';

export const CalendarService = {
    async handleEventAction(event: CalendarEvent): Promise<{ success: boolean; notificationId?: number }> {
        if (event.type === 'reminder') {
            // Local Notification
            const granted = await NotificationService.requestPermissions();
            if (granted) {
                // Use existing ID if available (re-scheduling), else generate new
                const id = event.notificationId || Math.floor(Math.random() * 100000);
                await NotificationService.schedule(
                    id,
                    event.title,
                    event.description,
                    new Date(event.start_date)
                );
                return { success: true, notificationId: id };
            }
            return { success: false };
        } else {
            // Google Calendar
            const startDate = event.start_date.replace(/[-:]/g, '').split('.')[0] + 'Z';
            const endDate = event.end_date.replace(/[-:]/g, '').split('.')[0] + 'Z';

            const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location || '')}`;

            window.open(googleCalendarUrl, '_blank');
            return { success: true };
        }
    },

    async deleteEvent(event: CalendarEvent): Promise<void> {
        if (event.type === 'reminder' && event.notificationId) {
            await NotificationService.cancel(event.notificationId);
        }
    }
};
