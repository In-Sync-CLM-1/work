// Work-Sync app driver: login + the mapped task-lifecycle controls.
// Selectors verified against the live app on 2026-06-04.

export const BASE = 'https://work.in-sync.co.in';

export const ACCOUNTS = {
  // filled from .env by the caller; these are the canonical demo identities
  admin: { email: 'priya@in-sync.co.in' },          // password from caller
  assignee: { email: 'insyncclm955@gmail.com' },    // Arjun Mehta — password from .env WS_RECIPIENT_PASSWORD
};

export async function login(page, email, password) {
  await page.goto(`${BASE}/auth`, { waitUntil: 'networkidle' });
  const form = page.locator('form').filter({ has: page.locator('input[type="password"]') });
  await form.locator('input[type="email"]').fill(email);
  await form.locator('input[type="password"]').fill(password);
  await form.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

// ---- mapped controls ----
export const sel = {
  // Tasks list
  newTaskBtn: (p) => p.getByRole('button', { name: /new task/i }),

  // Create New Task dialog
  taskNameInput: (p) => p.getByPlaceholder('Enter task name'),
  taskDescInput: (p) => p.getByPlaceholder(/enter task description/i),
  assigneeSelect: (p) => p.locator('select').filter({ hasText: 'Select team member' }),
  dueDateInput: (p) => p.locator('input[type="date"]'),
  prioritySelect: (p) => p.locator('select').filter({ hasText: /^Low/ }),
  createSubmit: (p) => p.getByRole('button', { name: /^create task$/i }),

  // Task detail — assignee lifecycle
  startBtn: (p) => p.getByRole('button', { name: /start activity/i }),
  completeBtn: (p) => p.getByRole('button', { name: /^complete$/i }),
  // Task detail — admin/creator
  closeBtn: (p) => p.getByRole('button', { name: /close activity/i }),
  restartBtn: (p) => p.getByRole('button', { name: /^restart$/i }),
  editBtn: (p) => p.getByRole('button', { name: /^edit$/i }),

  // Subtasks / milestones / attachments / comments
  addSubtaskBtn: (p) => p.getByRole('button', { name: /add subtask/i }),
  addMilestoneBtn: (p) => p.getByRole('button', { name: /add milestone/i }),
  fileInput: (p) => p.locator('input[type="file"]').first(),      // use setInputFiles
  commentInput: (p) => p.getByPlaceholder('Add a comment...'),
  // send button sits immediately after the comment input
  commentSend: (p) => p.locator('button[type="submit"]').last(),
};

export const taskUrl = (id) => `${BASE}/tasks/${id}`;
