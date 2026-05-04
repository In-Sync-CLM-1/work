import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, Settings2, Trash2, Calendar, Users, ListTodo, IndianRupee,
  TrendingUp, Mail, Phone, Sparkles, AlertTriangle, Receipt, Activity, CheckCircle,
  Clock, AlertCircle, ShieldCheck, Award,
} from 'lucide-react';
import { OrgManagementModal } from '@/components/platform/OrgManagementModal';
import { useOrgDetail } from '@/hooks/useOrgDetail';
import { useDeleteOrg } from '@/hooks/usePlatformOrgs';
import type { OrgRow } from '@/hooks/usePlatformDashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton,
} from '@/components/ui/dialog';
import { APP_ROLES, getRoleBadgeColor } from '@/types/user';
import { fmtINR } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-violet-100 text-violet-700',
  cancelled: 'bg-zinc-100 text-zinc-600',
};

const PRIORITY_BADGE: Record<string, string> = {
  low: 'text-emerald-600',
  medium: 'text-blue-600',
  high: 'text-amber-600',
  urgent: 'text-red-600',
};

const METHOD_LABELS: Record<string, string> = {
  upi: 'UPI', bank_transfer: 'Bank Transfer', card: 'Card', cash: 'Cash', manual: 'Manual',
};

const PLAN_BADGE: Record<string, string> = {
  trial: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  team: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
  business: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
};

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-green-600',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-teal-600',
];

function avatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(ts: string | null) {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type Tab = 'overview' | 'members' | 'tasks' | 'payments';

interface DeleteDialogProps {
  orgId: string;
  orgName: string;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteOrgDialog({ orgId, orgName, open, onClose, onDeleted }: DeleteDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const deleteOrg = useDeleteOrg();
  const canDelete = confirmText.trim() === orgName;

  const handleDelete = async () => {
    if (!canDelete) return;
    try {
      await deleteOrg.mutateAsync(orgId);
      toast.success(`Organisation "${orgName}" deleted`);
      onDeleted();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Failed to delete organisation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setConfirmText(''); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogCloseButton onClick={() => { setConfirmText(''); onClose(); }} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete organisation?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-sm">
            <p className="font-semibold text-destructive">This action cannot be undone.</p>
            <p className="text-muted-foreground mt-1">
              All members, tasks, comments, attachments, designations, teams and payment history will be permanently deleted.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5">
              Type <span className="font-mono font-bold text-foreground">{orgName}</span> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={orgName}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => { setConfirmText(''); onClose(); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!canDelete || deleteOrg.isPending}>
              {deleteOrg.isPending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PlatformOrgDetail() {
  const { id: orgId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useOrgDetail(orgId ?? null);
  const [tab, setTab] = useState<Tab>('overview');
  const [manageOpen, setManageOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const orgRowForModal: OrgRow | null = useMemo(() => {
    if (!data) return null;
    return {
      id: data.org.id,
      name: data.org.name,
      plan: data.org.plan,
      trialEndsAt: data.org.trialEndsAt,
      trialDaysLeft: data.org.trialDaysLeft,
      members: data.summary.activeMembers,
      totalTasks: data.summary.totalTasks,
      activeTasks: data.summary.activeTasks,
      overdueTasks: data.summary.overdueTasks,
      completedTasks: data.summary.completedTasks,
      completionRate: data.summary.completionRate,
      lastActivity: data.summary.lastActivity,
    };
  }, [data]);

  if (isLoading) {
    return <div className="text-center py-16 text-muted-foreground">Loading organisation…</div>;
  }
  if (error || !data) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-2" />
        <p className="text-sm text-muted-foreground">Could not load organisation.</p>
        <Link to="/platform/organisations" className="text-sm text-primary mt-2 inline-block">← Back to organisations</Link>
      </div>
    );
  }

  const { org, members, tasks, payments, summary } = data;
  const isTrialExpired = org.plan === 'trial' && org.trialDaysLeft <= 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Breadcrumb */}
      <motion.div variants={fadeUp} className="mb-4">
        <button
          onClick={() => navigate('/platform/organisations')}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Organisations
        </button>
      </motion.div>

      {/* Hero card */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 p-6 md:p-8 text-white shadow-xl mb-5">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl md:text-3xl font-extrabold flex-shrink-0 ring-2 ring-white/20">
              {org.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{org.name}</h1>
                <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold', PLAN_BADGE[org.plan] ?? 'bg-muted')}>
                  {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/80 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Joined {formatDate(org.createdAt)}
                </span>
                {org.plan === 'trial' && (
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold',
                    isTrialExpired ? 'bg-red-400/30 text-red-50' : org.trialDaysLeft <= 5 ? 'bg-orange-400/30 text-orange-50' : 'bg-emerald-400/20 text-emerald-50'
                  )}>
                    <Clock className="h-3 w-3" />
                    {isTrialExpired
                      ? `Trial expired ${formatDate(org.trialEndsAt)}`
                      : `${org.trialDaysLeft}d trial left`}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Last activity {timeAgo(summary.lastActivity)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setManageOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-violet-700 font-semibold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <Settings2 className="h-4 w-4" /> Manage
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white font-semibold text-sm shadow-md transition-all hover:-translate-y-0.5"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI strip */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <KpiTile label="Members" value={summary.activeMembers} icon={Users} gradient="from-sky-500 to-blue-600" />
        <KpiTile label="Total Tasks" value={summary.totalTasks} icon={ListTodo} gradient="from-violet-500 to-purple-600" />
        <KpiTile label="Active" value={summary.activeTasks} icon={Clock} gradient="from-amber-500 to-orange-500" />
        <KpiTile label="Overdue" value={summary.overdueTasks} icon={AlertTriangle} gradient="from-rose-500 to-pink-600" />
        <KpiTile label="Done %" value={`${summary.completionRate}%`} icon={CheckCircle} gradient="from-emerald-500 to-green-600" />
        <KpiTile label="Revenue" value={fmtINR(summary.totalRevenue)} icon={IndianRupee} gradient="from-fuchsia-500 to-pink-600" />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex border-b mb-4 gap-1 overflow-x-auto">
        {([
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'members', label: `Members (${members.length})`, icon: Users },
          { id: 'tasks', label: `Tasks (${tasks.length})`, icon: ListTodo },
          { id: 'payments', label: `Payments (${payments.length})`, icon: Receipt },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      {tab === 'overview' && (
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Plan & trial info */}
          <div className="lg:col-span-2 rounded-xl border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" /> Plan & Subscription
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Current Plan" value={org.plan.charAt(0).toUpperCase() + org.plan.slice(1)} />
              <InfoRow label="Trial Ends" value={org.trialEndsAt ? formatDate(org.trialEndsAt) : '—'} />
              <InfoRow label="Total Paid" value={fmtINR(summary.totalRevenue)} />
              <InfoRow label="Active Seats" value={summary.activeMembers} />
              {summary.inactiveMembers > 0 && (
                <InfoRow label="Inactive Members" value={summary.inactiveMembers} />
              )}
              <InfoRow label="Designations Set Up" value={data.designations.length} />
            </div>

            {/* Quick actions */}
            <div className="mt-5 pt-5 border-t flex gap-2 flex-wrap">
              <button
                onClick={() => setManageOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-card hover:bg-muted text-sm font-medium transition-colors"
              >
                <Calendar className="h-3.5 w-3.5" /> Extend Trial
              </button>
              <button
                onClick={() => setManageOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-card hover:bg-muted text-sm font-medium transition-colors"
              >
                <Receipt className="h-3.5 w-3.5" /> Record Payment
              </button>
            </div>
          </div>

          {/* Activity sidebar */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> At a glance
            </h3>
            <div className="space-y-3">
              <GlanceRow label="Tasks completed" value={summary.completedTasks} total={summary.totalTasks} color="bg-emerald-500" />
              <GlanceRow label="In progress" value={summary.activeTasks} total={summary.totalTasks} color="bg-blue-500" />
              <GlanceRow label="Overdue" value={summary.overdueTasks} total={summary.totalTasks} color="bg-rose-500" />
              <GlanceRow label="Active members" value={summary.activeMembers} total={members.length} color="bg-violet-500" />
            </div>
          </div>
        </motion.div>
      )}

      {tab === 'members' && (
        <motion.div variants={fadeUp} className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="py-3 pl-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Member</th>
                  <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                  <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Designation</th>
                  <th className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="py-3 pr-4 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.roleId} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 bg-gradient-to-br',
                          avatarGradient(m.fullName),
                        )}>
                          {getInitials(m.fullName)}
                        </div>
                        <p className="font-semibold truncate">{m.fullName}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="space-y-0.5">
                        {m.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{m.email}</span>
                          </div>
                        )}
                        {m.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 flex-shrink-0" />{m.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-xs">
                      {m.designation ? (
                        <span className="inline-flex items-center gap-1 text-foreground">
                          <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                          {m.designation}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                        getRoleBadgeColor(m.role),
                      )}>
                        {APP_ROLES.find((r) => r.value === m.role)?.label ?? m.role}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
                        m.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600',
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', m.isActive ? 'bg-emerald-500' : 'bg-zinc-400')} />
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right text-xs text-muted-foreground">{formatDate(m.createdAt)}</td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Users className="h-8 w-8 opacity-30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No members yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {tab === 'tasks' && (
        <motion.div variants={fadeUp} className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="py-3 pl-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                  <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                  <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assigned To</th>
                  <th className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                  <th className="py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
                  <th className="py-3 pr-4 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const isOverdue =
                    t.dueDate &&
                    new Date(t.dueDate) < new Date() &&
                    t.status !== 'completed' &&
                    t.status !== 'closed' &&
                    t.status !== 'cancelled';
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-3 pl-4 text-xs font-mono text-muted-foreground">{t.taskNumber ?? '—'}</td>
                      <td className="py-3">
                        <p className="font-medium truncate max-w-[280px]">{t.taskName}</p>
                        {t.completionPercentage > 0 && t.completionPercentage < 100 && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${t.completionPercentage}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{t.completionPercentage}%</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-xs">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-white font-semibold text-[9px] bg-gradient-to-br', avatarGradient(t.assignedToName))}>
                            {getInitials(t.assignedToName)}
                          </div>
                          <span className="truncate max-w-[120px]">{t.assignedToName}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', STATUS_BADGE[t.status] ?? 'bg-muted')}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={cn('py-3 text-center text-xs font-medium capitalize', PRIORITY_BADGE[t.priority] ?? '')}>
                        {t.priority}
                      </td>
                      <td className={cn('py-3 text-right text-xs', isOverdue ? 'text-rose-600 font-semibold' : 'text-muted-foreground')}>
                        {formatDate(t.dueDate)}
                      </td>
                      <td className="py-3 pr-4 text-right text-xs text-muted-foreground">{timeAgo(t.updatedAt)}</td>
                    </tr>
                  );
                })}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <ListTodo className="h-8 w-8 opacity-30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No tasks yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {tasks.length >= 50 && (
            <div className="px-4 py-2 bg-muted/30 text-[11px] text-muted-foreground text-center">
              Showing latest 50 tasks
            </div>
          )}
        </motion.div>
      )}

      {tab === 'payments' && (
        <motion.div variants={fadeUp} className="rounded-xl border bg-card overflow-hidden">
          {payments.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="py-3 pl-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Method</th>
                  <th className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plan</th>
                  <th className="py-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 pl-4 text-xs text-muted-foreground">{formatDate(p.createdAt)}</td>
                    <td className="py-3 text-right">
                      <span className="font-bold text-emerald-700">{fmtINR(p.amount)}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted">
                        {METHOD_LABELS[p.method] ?? p.method}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold', PLAN_BADGE[p.planTarget] ?? 'bg-muted')}>
                        {p.planTarget.charAt(0).toUpperCase() + p.planTarget.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground font-mono">{p.referenceNo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center">
              <Receipt className="h-8 w-8 opacity-30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No payments recorded yet</p>
              <button
                onClick={() => setManageOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Receipt className="h-3.5 w-3.5" /> Record First Payment
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Modals */}
      {manageOpen && orgRowForModal && (
        <OrgManagementModal
          org={orgRowForModal}
          open={manageOpen}
          onClose={() => setManageOpen(false)}
        />
      )}
      <DeleteOrgDialog
        orgId={org.id}
        orgName={org.name}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => navigate('/platform/organisations')}
      />
    </motion.div>
  );
}

interface KpiTileProps { label: string; value: string | number; icon: typeof Users; gradient: string }
function KpiTile({ label, value, icon: Icon, gradient }: KpiTileProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md', gradient)}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/80">{label}</p>
      <Icon className="absolute bottom-2 right-2 h-8 w-8 opacity-[0.08]" strokeWidth={1.5} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function GlanceRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold">{value}{total > 0 && <span className="text-muted-foreground font-normal"> / {total}</span>}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
