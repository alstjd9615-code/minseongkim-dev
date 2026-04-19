import { useContext } from 'react';
import { TasksContext, type TasksContextValue } from './_tasksContext';

export function useTasksContext(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasksContext must be used within TasksProvider');
  return ctx;
}
