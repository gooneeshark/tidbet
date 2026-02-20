// src/services/notificationService.ts
export interface NotificationPayload {
    id: string;
    title: string;
    body: string;
    icon?: string;
    url?: string;
}

const STORAGE_KEY = 'gemnee_seen_notifications';
const POLL_INTERVAL_MS = 3 * 60 * 1000; // เช็คทุกๆ 3 นาที (3 minutes)

export const initNotifications = () => {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return;
    }

    // Request permission if not granted
    if (Notification.permission === "default") {
        Notification.requestPermission();
    }

    // Start the polling loop
    pollForNotifications();
    setInterval(pollForNotifications, POLL_INTERVAL_MS);
};

const pollForNotifications = async () => {
    // Only proceed if user has granted permission
    if (Notification.permission !== "granted") return;

    try {
        // Append timestamp to bypass browser cache
        const response = await fetch(`/notifications.json?t=${Date.now()}`);
        if (!response.ok) return;

        const data: NotificationPayload = await response.json();
        if (!data || !data.id) return;

        const seenIds: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

        // If we haven't seen this notification yet, trigger it
        if (!seenIds.includes(data.id)) {
            triggerNotification(data);

            // Save to localStorage so we don't show it again
            seenIds.push(data.id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seenIds));
        }

    } catch (error) {
        console.error("Failed to poll notifications:", error);
    }
};

const triggerNotification = (payload: NotificationPayload) => {
    const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/Gemnee.webp', // Default icon
        requireInteraction: true // Keeps the notification on screen until user clicks it
    });

    if (payload.url) {
        notification.onclick = (event) => {
            event.preventDefault();
            window.open(payload.url, '_blank');
            notification.close();
        };
    }
};
