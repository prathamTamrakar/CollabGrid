import { countTasks } from '../repositories/task.repository.js';
import { countProjects } from '../repositories/project.repository.js';
import { countInvitations } from '../repositories/invitation.repository.js';

export async function getStatsForUser(userId) {
  const [totalTasks, completedTasks, inProgressTasks, pendingInvites, projectCount] = await Promise.all([
    countTasks({ user_id: userId }),
    countTasks({ user_id: userId, status: 'done' }),
    countTasks({ user_id: userId, status: 'in_progress' }),
    countInvitations({ to_user_id: userId, status: 'pending' }),
    countProjects({ $or: [{ user_id: userId }, { collaborators: userId }] })
  ]);

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    in_progress_tasks: inProgressTasks,
    pending_invites: pendingInvites,
    project_count: projectCount,
    completion_rate: completionRate
  };
}

export default {
  getStatsForUser
};
