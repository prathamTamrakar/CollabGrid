export function validateCreateProject(req) {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) return 'Project name is required';
  return null;
}

export function validateProjectInvite(req) {
  const projectId = req.params.project_id || req.body.project_id;
  const toUserId = req.body.user_id || req.body.to_user_id || req.query.to_user_id;
  if (!projectId || !toUserId) return 'Project ID and user ID are required';
  return null;
}
