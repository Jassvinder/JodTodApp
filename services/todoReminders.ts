import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function scheduleTodoReminder(todoId: number, title: string, reminderAt: string | null): Promise<void> {
  try {
    await cancelTodoReminder(todoId);
    if (!reminderAt) return;

    const reminderDate = new Date(reminderAt);
    if (Number.isNaN(reminderDate.getTime()) || reminderDate.getTime() <= Date.now()) return;

    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      if (requested.status !== 'granted') return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Task reminders',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: title,
        data: { type: 'todo_reminder', todoId },
        ...(Platform.OS === 'android' ? { sound: 'default' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
  } catch {
    // Local reminders are best effort and must not block saving a task.
  }
}

export async function cancelTodoReminder(todoId: number): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) => notification.content.data?.todoId === todoId)
      .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)),
  );
}
