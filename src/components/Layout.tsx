import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListTodo, LogOut, User, Users, Menu, X, Wallet, Clock, AlertTriangle,
  MessageCircle, Mail, MapPin, ShieldCheck, Calendar, Headphones, UserCheck, Receipt, ExternalLink,
  Building, Sun, Moon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useNotifications } from '@/hooks/useNotifications';
import { useTaskDepartments } from '@/hooks/useTaskDepartments';
import { useOpenTaskCounts } from '@/hooks/useOpenTaskCounts';
import { OrgSwitcher } from '@/components/OrgSwitcher';
import { NotificationBell } from '@/components/tasks/NotificationBell';
import { CreateTaskFAB } from '@/components/tasks/CreateTaskFAB';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const platformLinks = [
  { label: 'WhatsApp Broadcast', href: 'https://wa.in-sync.co.in/', icon: MessageCircle, color: 'text-emerald-400' },
  { label: 'Email Broadcast', href: 'https://email.in-sync.co.in/', icon: Mail, color: 'text-sky-400' },
  { label: 'Field Team Tracking', href: 'https://field.in-sync.co.in/', icon: MapPin, color: 'text-orange-400' },
  { label: 'Vendor Verification', href: 'https://vendorverification.in-sync.co.in/', icon: ShieldCheck, color: 'text-violet-400' },
  { label: 'Event Management', href: 'https://event.in-sync.co.in/', icon: Calendar, color: 'text-pink-400' },
  { label: 'Global CRM', href: 'https://globalcrm.in-sync.co.in/', icon: Headphones, color: 'text-cyan-400' },
  { label: 'Applicant Tracking', href: 'https://ats.in-sync.co.in/', icon: UserCheck, color: 'text-amber-400' },
  { label: 'Expense Management', href: 'https://expense.in-sync.co.in/', icon: Receipt, color: 'text-rose-400' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, userRole, signOut, isPlatformAdmin, trialDaysLeft, isTrialExpired, orgPlan } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { departments, hasDepartments } = useTaskDepartments();
  const openCounts = useOpenTaskCounts();

  // '/tasks/d/digicom' -> 'digicom'; the combined '/tasks' list has no key.
  const deptKeyFor = (to: string) =>
    to.startsWith('/tasks/d/') ? to.slice('/tasks/d/'.length) : null;
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar on navigate
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const showTrialBanner = !isPlatformAdmin && orgPlan === 'trial' && trialDaysLeft !== null && (isTrialExpired || trialDaysLeft <= 5);

  const taskSubItems = [
    { label: 'All', status: 'all', color: 'bg-gray-400' },
    { label: 'Pending', status: 'pending', color: 'bg-yellow-400' },
    { label: 'In Progress', status: 'in_progress', color: 'bg-blue-400' },
    { label: 'Completed', status: 'completed', color: 'bg-green-400' },
    { label: 'Closed', status: 'closed', color: 'bg-purple-400' },
    { label: 'Cancelled', status: 'cancelled', color: 'bg-orange-400' },
  ];

  const currentStatus = new URLSearchParams(location.search).get('status') || 'all';

  // Orgs with departments configured get one entry per department instead of a
  // single combined Tasks link — the way Redefine Marcom's team navigates today.
  const taskNavItems = hasDepartments
    ? departments.map((d) => ({ to: `/tasks/d/${d.key}`, icon: ListTodo, label: d.label }))
    : [{ to: '/tasks', icon: ListTodo, label: 'Tasks' }];

  const navItems = isPlatformAdmin
    ? [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }]
    : [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }, ...taskNavItems];

  const platformAdminNavItems = isPlatformAdmin
    ? [
        { to: '/platform/organisations', icon: Building, label: 'Organisations' },
        { to: '/platform/users', icon: Users, label: 'Users' },
        { to: '/platform/billing', icon: Wallet, label: 'Billing' },
      ]
    : [];

  const adminNavItems = isPlatformAdmin
    ? []
    : isAdmin
      ? [
          { to: '/users', icon: Users, label: 'Users' },
          { to: '/settings', icon: Building, label: 'Organisation' },
          { to: '/billing', icon: Wallet, label: 'Billing' },
        ]
      : [];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <OrgSwitcher />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          if (item.to === '/tasks' || item.to.startsWith('/tasks/d/')) {
            // Status sub-items belong to whichever list this is, so they keep
            // you inside the same department instead of jumping to all tasks.
            const isCurrentList = location.pathname === item.to;
            return (
              <div key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    isCurrentList
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-strong'
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                  {item.label}
                </Link>
                <div className="mt-1 ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
                  {taskSubItems.map((sub) => {
                    const isActive = isCurrentList && currentStatus === sub.status;
                    const href = sub.status === 'all' ? item.to : `${item.to}?status=${sub.status}`;
                    // Only the unfinished states carry a count — those are the
                    // ones worth glancing at. A zero is left blank rather than
                    // shown, so a badge always means there is something to do.
                    const counts = deptKeyFor(item.to)
                      ? openCounts.byDepartmentKey[deptKeyFor(item.to)!]
                      : openCounts.total;
                    const n =
                      sub.status === 'pending'
                        ? counts?.pending
                        : sub.status === 'in_progress'
                          ? counts?.in_progress
                          : undefined;
                    return (
                      <Link
                        key={sub.status}
                        to={href}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors',
                          isActive
                            ? 'bg-sidebar-accent/60 text-sidebar-strong'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-strong'
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', sub.color)} />
                        <span className="truncate">{sub.label}</span>
                        {!!n && (
                          <span className="ml-auto shrink-0 tabular-nums rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-strong">
                            {n}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                location.pathname === item.to
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-strong'
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}

        {platformAdminNavItems.length > 0 && (
          <>
            <div className="pt-4 pb-2 px-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                Platform Admin
              </span>
            </div>
            {platformAdminNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  location.pathname === item.to
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-strong'
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            ))}
          </>
        )}

        {adminNavItems.length > 0 && (
          <>
            <div className="pt-4 pb-2 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                Admin
              </span>
            </div>
            {adminNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  location.pathname === item.to
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-strong'
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            ))}
          </>
        )}

        {!isPlatformAdmin && (
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                Explore Platforms
              </span>
              <span className="rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[9px] font-semibold text-sidebar-foreground/70">
                {platformLinks.length}
              </span>
            </div>
            <div className="space-y-0.5">
              {platformLinks.map((p) => (
                <a
                  key={p.href}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-strong transition-colors"
                >
                  <p.icon className={cn('h-3.5 w-3.5 flex-shrink-0', p.color)} />
                  <span className="flex-1 truncate">{p.label}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-40 group-hover:opacity-100" />
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-3">
        {/* User info — clickable to profile */}
        <Link to="/profile" className="flex items-center gap-3 rounded-lg p-1 -m-1 hover:bg-sidebar-accent transition-colors">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-sidebar-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-sidebar-strong truncate">{profile?.full_name || user?.email}</p>
            {userRole && (
              <p className="text-[10px] text-sidebar-foreground capitalize">{userRole.replace('_', ' ')}</p>
            )}
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 p-2 rounded-lg bg-sidebar-background text-sidebar-strong shadow-lg border border-sidebar-border"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar-background text-sidebar-foreground transition-transform duration-300',
          isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0',
          !isMobile && 'translate-x-0'
        )}
      >
        {isMobile && sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-4 p-1 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="min-h-screen p-6 pt-16 lg:ml-64 lg:pt-8">
        {/* Trial banner */}
        {showTrialBanner && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 text-sm ${
            isTrialExpired
              ? 'bg-destructive/10 border border-destructive/30 text-destructive'
              : (trialDaysLeft ?? 0) <= 2
              ? 'bg-orange-50 border border-orange-200 text-orange-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}>
            {isTrialExpired
              ? <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              : <Clock className="h-4 w-4 flex-shrink-0" />
            }
            <span className="flex-1">
              {isTrialExpired
                ? 'Your 14-day free trial has expired.'
                : `Your free trial expires in ${trialDaysLeft ?? 0} day${trialDaysLeft === 1 ? '' : 's'}.`
              }
            </span>
            <Link
              to="/billing"
              className="flex-shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
            >
              Upgrade now
            </Link>
          </div>
        )}

        {/* Top bar with notification */}
        <div className="flex justify-end items-center gap-2 mb-4">
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={(id) => markAsRead.mutate(id)}
            onMarkAllAsRead={() => markAllAsRead.mutate()}
            onNotificationClick={(n) => {
              if (n.task_id) navigate(`/tasks/${n.task_id}`);
            }}
          />
        </div>
        {children}
      </main>

      {/* Create a task from anywhere in the app */}
      <CreateTaskFAB />
    </div>
  );
}
