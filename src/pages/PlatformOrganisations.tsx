import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Building2, Search, Filter, Trash2, Settings2, AlertTriangle, Users,
  TrendingUp, IndianRupee, Sparkles, Calendar, ChevronUp, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton,
} from '@/components/ui/dialog';
import { OrgManagementModal } from '@/components/platform/OrgManagementModal';
import { usePlatformOrgs, useDeleteOrg } from '@/hooks/usePlatformOrgs';
import type { PlatformOrgRow } from '@/hooks/usePlatformOrgs';
import type { OrgRow } from '@/hooks/usePlatformDashboard';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

type SortKey = 'name' | 'plan' | 'members' | 'totalTasks' | 'totalRevenue' | 'createdAt';
type SortDir = 'asc' | 'desc';

interface SortHeaderProps {
  label: string;
  k: SortKey;
  align?: 'left' | 'right' | 'center';
  sortKey: SortKey;
  sortDir: SortDir;
  onToggle: (key: SortKey) => void;
}

function SortHeader({ label, k, align = 'left', sortKey, sortDir, onToggle }: SortHeaderProps) {
  const active = sortKey === k;
  return (
    <th className={`pb-2.5 pt-2.5 font-semibold text-[11px] uppercase tracking-wider ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}>
      <button
        onClick={() => onToggle(k)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {label}
        {active && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    </th>
  );
}

const PLAN_BADGE: Record<string, string> = {
  trial: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  team: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
  business: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
};

function fmtINR(amount: number) {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)}Cr`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(2)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${Math.round(amount)}`;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(ts: string | null) {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function toOrgRow(p: PlatformOrgRow): OrgRow {
  return {
    id: p.id,
    name: p.name,
    plan: p.plan,
    trialEndsAt: p.trialEndsAt,
    trialDaysLeft: p.trialDaysLeft,
    members: p.members,
    totalTasks: p.totalTasks,
    activeTasks: p.activeTasks,
    overdueTasks: p.overdueTasks,
    completedTasks: p.completedTasks,
    completionRate: p.completionRate,
    lastActivity: p.lastActivity,
  };
}

interface DeleteDialogProps {
  org: PlatformOrgRow;
  open: boolean;
  onClose: () => void;
}

function DeleteOrgDialog({ org, open, onClose }: DeleteDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const deleteOrg = useDeleteOrg();
  const canDelete = confirmText.trim() === org.name;

  const handleDelete = async () => {
    if (!canDelete) return;
    try {
      await deleteOrg.mutateAsync(org.id);
      toast.success(`Organisation "${org.name}" deleted`);
      setConfirmText('');
      onClose();
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
              All data will be permanently deleted, including:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-0.5 list-disc list-inside">
              <li>{org.members} member{org.members === 1 ? '' : 's'} (their access only)</li>
              <li>{org.totalTasks} task{org.totalTasks === 1 ? '' : 's'} & all comments / attachments</li>
              <li>Designations, teams & payment history</li>
            </ul>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5">
              Type <span className="font-mono font-bold text-foreground">{org.name}</span> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={org.name}
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => { setConfirmText(''); onClose(); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete || deleteOrg.isPending}
            >
              {deleteOrg.isPending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PlatformOrganisations() {
  const navigate = useNavigate();
  const { data: orgs = [], isLoading } = usePlatformOrgs();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [managingOrg, setManagingOrg] = useState<PlatformOrgRow | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<PlatformOrgRow | null>(null);

  const filtered = useMemo(() => {
    let rows = orgs;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((o) => o.name.toLowerCase().includes(q));
    }
    if (planFilter !== 'all') rows = rows.filter((o) => o.plan === planFilter);
    if (statusFilter === 'expired') {
      rows = rows.filter((o) => o.plan === 'trial' && o.trialDaysLeft <= 0);
    } else if (statusFilter === 'active') {
      rows = rows.filter((o) => o.plan !== 'trial' || o.trialDaysLeft > 0);
    } else if (statusFilter === 'expiring') {
      rows = rows.filter((o) => o.plan === 'trial' && o.trialDaysLeft > 0 && o.trialDaysLeft <= 5);
    }
    rows = rows.slice().sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'plan': cmp = a.plan.localeCompare(b.plan); break;
        case 'members': cmp = a.members - b.members; break;
        case 'totalTasks': cmp = a.totalTasks - b.totalTasks; break;
        case 'totalRevenue': cmp = a.totalRevenue - b.totalRevenue; break;
        case 'createdAt': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [orgs, search, planFilter, statusFilter, sortKey, sortDir]);

  const stats = useMemo(() => {
    const total = orgs.length;
    const trial = orgs.filter((o) => o.plan === 'trial').length;
    const team = orgs.filter((o) => o.plan === 'team').length;
    const business = orgs.filter((o) => o.plan === 'business').length;
    const totalRevenue = orgs.reduce((s, o) => s + o.totalRevenue, 0);
    return { total, trial, team, business, totalRevenue };
  }, [orgs]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading organisations…</div>;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                Registered Organisations
              </span>
              <Sparkles className="h-5 w-5 text-fuchsia-500" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Master data for every organisation on the platform · {stats.total} total
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats strip — click to filter */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <StatCard
          label="Total Orgs"
          value={stats.total}
          icon={Building2}
          gradient="from-violet-500 to-purple-600"
          active={planFilter === 'all' && statusFilter === 'all' && sortKey === 'createdAt'}
          onClick={() => { setPlanFilter('all'); setStatusFilter('all'); setSortKey('createdAt'); setSortDir('desc'); }}
        />
        <StatCard
          label="On Trial"
          value={stats.trial}
          icon={Calendar}
          gradient="from-amber-500 to-orange-500"
          active={planFilter === 'trial'}
          onClick={() => { setPlanFilter('trial'); setStatusFilter('all'); }}
        />
        <StatCard
          label="Team Plan"
          value={stats.team}
          icon={Users}
          gradient="from-sky-500 to-blue-600"
          active={planFilter === 'team'}
          onClick={() => { setPlanFilter('team'); setStatusFilter('all'); }}
        />
        <StatCard
          label="Business"
          value={stats.business}
          icon={TrendingUp}
          gradient="from-emerald-500 to-green-600"
          active={planFilter === 'business'}
          onClick={() => { setPlanFilter('business'); setStatusFilter('all'); }}
        />
        <StatCard
          label="Total Revenue"
          value={fmtINR(stats.totalRevenue)}
          icon={IndianRupee}
          gradient="from-pink-500 to-rose-600"
          active={sortKey === 'totalRevenue'}
          onClick={() => { setSortKey('totalRevenue'); setSortDir('desc'); }}
        />
      </motion.div>

      {/* Filters bar */}
      <motion.div variants={fadeUp} className="rounded-xl border bg-card p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organisations…"
            className="pl-8 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="h-9 w-[120px]">
            <option value="all">All plans</option>
            <option value="trial">Trial</option>
            <option value="team">Team</option>
            <option value="business">Business</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-[140px]">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring soon</option>
            <option value="expired">Expired trial</option>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {stats.total}
        </div>
      </motion.div>

      {/* Table card */}
      <motion.div variants={fadeUp} className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="border-b">
                <SortHeader label="Organisation" k="name" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                <SortHeader label="Plan" k="plan" align="center" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                <th className="pb-2.5 pt-2.5 font-semibold text-[11px] uppercase tracking-wider text-center text-muted-foreground">Trial</th>
                <SortHeader label="Members" k="members" align="center" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                <SortHeader label="Tasks" k="totalTasks" align="center" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                <th className="pb-2.5 pt-2.5 font-semibold text-[11px] uppercase tracking-wider text-center text-muted-foreground">Done %</th>
                <SortHeader label="Revenue" k="totalRevenue" align="right" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                <SortHeader label="Created" k="createdAt" align="right" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                <th className="pb-2.5 pt-2.5 font-semibold text-[11px] uppercase tracking-wider text-right text-muted-foreground pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((org, idx) => (
                <motion.tr
                  key={org.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => navigate(`/platform/organisations/${org.id}`)}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="py-3 pl-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0
                        ${org.plan === 'business' ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                          org.plan === 'team' ? 'bg-gradient-to-br from-violet-500 to-purple-600' :
                          'bg-gradient-to-br from-amber-500 to-orange-500'}`}>
                        {org.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate group-hover:text-primary transition-colors">
                          {org.name}
                          <ChevronRight className="inline-block h-3 w-3 ml-1 opacity-0 group-hover:opacity-60 -ml-0.5 group-hover:ml-1 transition-all" />
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Last activity {timeAgo(org.lastActivity)} ago
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${PLAN_BADGE[org.plan] ?? 'bg-muted text-muted-foreground'}`}>
                      {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 text-center text-xs">
                    {org.plan === 'trial' ? (
                      org.trialDaysLeft > 0 ? (
                        <span className={org.trialDaysLeft <= 3 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                          {org.trialDaysLeft}d left
                        </span>
                      ) : (
                        <span className="text-destructive font-medium">Expired</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-medium bg-sky-50 text-sky-700">
                      {org.members}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="inline-flex items-center gap-1.5 text-xs">
                      <span className="font-medium">{org.totalTasks}</span>
                      {org.overdueTasks > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-semibold">
                          {org.overdueTasks} overdue
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full ${org.completionRate >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${org.completionRate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${org.completionRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {org.completionRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-sm font-semibold">
                    {org.totalRevenue > 0 ? (
                      <span className="text-emerald-700">{fmtINR(org.totalRevenue)}</span>
                    ) : (
                      <span className="text-muted-foreground font-normal">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right text-xs text-muted-foreground">
                    {formatDate(org.createdAt)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div
                      className="inline-flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setManagingOrg(org); }}
                        className="p-1.5 rounded-md hover:bg-violet-100 text-muted-foreground hover:text-violet-700 transition-colors"
                        title="Manage org"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingOrg(org); }}
                        className="p-1.5 rounded-md hover:bg-red-100 text-muted-foreground hover:text-red-700 transition-colors"
                        title="Delete org"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Building2 className="h-8 w-8 opacity-30" />
                      <p className="text-sm">
                        {search || planFilter !== 'all' || statusFilter !== 'all'
                          ? 'No organisations match your filters'
                          : 'No organisations yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modals */}
      {managingOrg && (
        <OrgManagementModal
          org={toOrgRow(managingOrg)}
          open={!!managingOrg}
          onClose={() => setManagingOrg(null)}
        />
      )}
      {deletingOrg && (
        <DeleteOrgDialog
          org={deletingOrg}
          open={!!deletingOrg}
          onClose={() => setDeletingOrg(null)}
        />
      )}
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: typeof Building2;
  gradient: string;
  active?: boolean;
  onClick?: () => void;
}

function StatCard({ label, value, icon: Icon, gradient, active, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-4 text-white text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40 ${
        active ? 'ring-2 ring-white shadow-lg -translate-y-0.5' : ''
      }`}
    >
      {active && (
        <span className="absolute top-2 right-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-white/95 text-[9px] font-bold text-foreground shadow">
          ✓
        </span>
      )}
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/80">{label}</p>
      <Icon className="absolute bottom-2 right-2 h-8 w-8 opacity-[0.08] group-hover:opacity-[0.18] transition-opacity" strokeWidth={1.5} />
    </button>
  );
}
