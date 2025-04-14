import { Expo } from 'expo-server-sdk';

// Create a new Expo SDK client
const expo = new Expo();

// Send push notification function
export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  try {
    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.error(`Push token ${expoPushToken} is not a valid Expo push token`);
      return;
    }

    const messages = [{
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    }];

    // Chunking the notifications (if needed for larger numbers of messages)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    // Send notifications in chunks
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }
  } catch (err) {
    console.error('Push notification error:', err);
  }
};
