import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

type ReminderData = Record<string, string | number>;

interface LocalReminder {
  title: string;
  body: string;
  // Must include `matchKey` so the reminder can be found and replaced later.
  data: ReminderData;
  date: Date;
}

// Schedules a one-time on-device notification, replacing any earlier one with the same data[matchKey].
// Returns false when the date is in the past or notification permission is denied.
export async function scheduleLocalReminder(matchKey: string, reminder: LocalReminder): Promise<boolean> {
  try {
    await cancelLocalReminders(matchKey, reminder.data[matchKey]);
    if (Number.isNaN(reminder.date.getTime()) || reminder.date.getTime() <= Date.now()) return false;

    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      if (requested.status !== 'granted') return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { ...reminder.data, remindAt: reminder.date.toISOString() },
        ...(Platform.OS === 'android' ? { sound: 'default' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
      },
    });
    return true;
  } catch {
    // Local reminders are best effort and must not block saving.
    return false;
  }
}

export async function cancelLocalReminders(matchKey: string, value: string | number): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((notification) => notification.content.data?.[matchKey] === value)
        .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)),
    );
  } catch {
    // Best effort, same as scheduling.
  }
}

// Date of the pending reminder with data[matchKey] === value, or null.
export async function getLocalReminderDate(matchKey: string, value: string | number): Promise<Date | null> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const match = scheduled.find((notification) => notification.content.data?.[matchKey] === value);
    const remindAt = match?.content.data?.remindAt;
    return typeof remindAt === 'string' ? new Date(remindAt) : null;
  } catch {
    return null;
  }
}
