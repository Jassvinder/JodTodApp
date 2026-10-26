import { cancelLocalReminders, scheduleLocalReminder } from './localReminders';

export async function scheduleTodoReminder(todoId: number, title: string, reminderAt: string | null): Promise<void> {
  if (!reminderAt) {
    await cancelTodoReminder(todoId);
    return;
  }

  await scheduleLocalReminder('todoId', {
    title: 'Task Reminder',
    body: title,
    data: { type: 'todo_reminder', todoId },
    date: new Date(reminderAt),
  });
}

export async function cancelTodoReminder(todoId: number): Promise<void> {
  await cancelLocalReminders('todoId', todoId);
}
