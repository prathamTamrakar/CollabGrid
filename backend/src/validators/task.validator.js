export function validateCreateTask(req) {
  const { title } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) return 'Task title is required';
  return null;
}

export function validateUpdateTask(req) {
  if (!req.params.task_id) return 'Task ID is required';
  return null;
}
