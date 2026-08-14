export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'closed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
// A repeating task has no calendar schedule and no end date: the next copy is
// created when the current one is signed off.
export type TaskRecurrence = 'daily' | 'weekly' | 'monthly';
export type CommentType = 'comment' | 'status_change' | 'assignment_change' | 'system';
export type AttachmentType = 'general' | 'completion' | 'reference';

export interface Profile {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  org_id: string | null;
  designation_id: string | null;
  is_platform_admin: boolean;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'member' | 'lead';
  joined_at: string;
}

/** A task bucket, configured per organisation (e.g. General, Digicom, Livecom). */
export interface TaskDepartment {
  id: string;
  org_id: string;
  key: string;
  label: string;
  // 'mine' lists only your own tasks; 'team' lists the whole department's.
  visibility: 'mine' | 'team';
  sort_order: number;
  is_active: boolean;
  subcategories?: TaskSubcategory[];
}

export interface TaskSubcategory {
  id: string;
  org_id: string;
  department_id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

/** Reference-only project record: enough to name and search it. */
export interface ProjectRef {
  id: string;
  org_id: string;
  project_number: string | null;
  project_name: string;
  status: string | null;
}

/** A file handed over with the task at assignment time. */
export interface BriefFile {
  path: string;
  name: string;
  size: number;
  type: string;
}

export interface Task {
  id: string;
  task_number: string;
  task_name: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  parent_task_id: string | null;
  due_date: string;
  start_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  estimated_hours: number | null;
  actual_hours: number | null;
  completion_notes: string | null;
  completion_percentage: number;
  closed_at: string | null;
  closed_by: string | null;
  closure_reason: string | null;
  completed_at: string | null;
  restart_reason: string | null;
  restarted_at: string | null;
  restarted_by: string | null;
  created_at: string;
  updated_at: string;
  department_id: string | null;
  subcategory: string | null;
  project_id: string | null;
  recurrence: TaskRecurrence | null;
  recurrence_parent_id: string | null;
  brief_files: BriefFile[];
  // Joined fields
  assigned_user?: Profile;
  assigned_by_user?: Profile;
  closed_by_user?: Profile;
  department?: Pick<TaskDepartment, 'id' | 'key' | 'label'>;
  project?: Pick<ProjectRef, 'id' | 'project_number' | 'project_name'>;
  subtasks?: Task[];
  attachment_count?: number;
}

export interface TaskFilters {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  assigned_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  created_date_from?: string;
  created_date_to?: string;
  search?: string;
  tags?: string[];
  department_id?: string;
  // 'mine' restricts to tasks you were assigned or assigned to someone else.
  scope?: 'mine' | 'team';
  page: number;
  items_per_page: number;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  attachment_type: AttachmentType;
  uploaded_by: string;
  uploaded_at: string;
  uploader?: Profile;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  comment_type: CommentType;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user?: Profile;
}

export interface TaskWatcher {
  id: string;
  task_id: string;
  user_id: string;
}

export interface TaskMilestone {
  id: string;
  task_id: string;
  title: string;
  target_date: string;
  sort_order: number;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  last_overdue_reminder_on: string | null;
  org_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMilestoneInput {
  title: string;
  target_date: string;
  sort_order?: number;
}

export interface UpdateMilestoneInput {
  title?: string;
  target_date?: string;
  sort_order?: number;
  completed?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  task_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CreateTaskInput {
  task_name: string;
  description?: string;
  assigned_to: string;
  due_date: string;
  start_date?: string;
  priority: TaskPriority;
  parent_task_id?: string;
  tags?: string[];
  estimated_hours?: number;
  department_id?: string | null;
  subcategory?: string | null;
  project_id?: string | null;
  recurrence?: TaskRecurrence | null;
  brief_files?: BriefFile[];
}

export interface UpdateTaskInput {
  task_name?: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  start_date?: string;
  priority?: TaskPriority;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  status?: TaskStatus;
  completion_notes?: string;
  completion_percentage?: number;
  department_id?: string | null;
  subcategory?: string | null;
  project_id?: string | null;
  recurrence?: TaskRecurrence | null;
  brief_files?: BriefFile[];
}

export interface CompleteTaskInput {
  completion_notes: string;
  files: File[];
}

export interface CloseTaskInput {
  closure_reason: string;
}

export interface RestartTaskInput {
  restart_reason: string;
}

export interface AIInsight {
  type: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
}

export interface UserCompletionStat {
  userId: string;
  userName: string;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  onTime: number;
  highPriority: number;
  avgCompletionDays: number | null;
  completionRate: number;
}

export interface TaskStats {
  myOpenTasks: number;
  overdueTasks: number;
  completedThisWeek: number;
  totalTasks: number;
  statusDistribution: { name: string; value: number }[];
  priorityDistribution: { name: string; value: number }[];
  weeklyTrend: { week: string; created: number; completed: number }[];
  teamWorkload: { name: string; tasks: number }[];
  userCompletionStats: UserCompletionStat[];
  aiInsights: AIInsight[];
}
