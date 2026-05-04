import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users, Search, Filter, UserCheck, UserX, Mail, Phone, Building2, ShieldCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { usePlatformUsers, useToggleUserActive } from '@/hooks/usePlatformUsers';
import { APP_ROLES, getRoleBadgeColor } from '@/types/user';
import { cn } from '@/lib/utils';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const ROLE_OPTIONS = APP_ROLES.filter((r) => r.value !== 'platform_admin');

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

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

export function PlatformUsers() {
  const { data: users = [], isLoading } = usePlatformUsers();
  const toggleActive = useToggleUserActive();
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const orgs = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => { if (u.orgId) map.set(u.orgId, u.orgName); });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [users]);

  const filtered = useMemo(() => {
    let rows = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q) ||
          u.orgName.toLowerCase().includes(q),
      );
    }
    if (orgFilter !== 'all') rows = rows.filter((u) => u.orgId === orgFilter);
    if (roleFilter !== 'all') rows = rows.filter((u) => u.role === roleFilter);
    if (statusFilter === 'active') rows = rows.filter((u) => u.isActive);
    if (statusFilter === 'inactive') rows = rows.filter((u) => !u.isActive);
    return rows;
  }, [users, search, orgFilter, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = total - active;
    const admins = users.filter((u) => u.role === 'admin').length;
    const orgsCount = new Set(users.filter((u) => u.orgId).map((u) => u.orgId)).size;
    return { total, active, inactive, admins, orgsCount };
  }, [users]);

  const handleToggle = async (roleId: string, currentActive: boolean, name: string) => {
    try {
      await toggleActive.mutateAsync({ roleId, isActive: !currentActive });
      toast.success(`${name} ${currentActive ? 'deactivated' : 'reactivated'}`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Failed to update user');
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading users…</div>;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500 bg-clip-text text-transparent">
            Platform Users
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every user across {stats.orgsCount} organisation{stats.orgsCount === 1 ? '' : 's'}
        </p>
      </motion.div>

      {/* KPI strip */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total Users" value={stats.total} icon={Users} gradient="from-sky-500 to-blue-600" />
        <KpiCard label="Active" value={stats.active} icon={UserCheck} gradient="from-emerald-500 to-green-600" />
        <KpiCard label="Inactive" value={stats.inactive} icon={UserX} gradient="from-zinc-500 to-slate-600" />
        <KpiCard label="Org Admins" value={stats.admins} icon={ShieldCheck} gradient="from-violet-500 to-fuchsia-600" />
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="rounded-xl border bg-card p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, org…"
            className="pl-8 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)} className="h-9 w-[160px]">
            <option value="all">All organisations</option>
            {orgs.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </Select>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-9 w-[150px]">
            <option value="all">All roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-[120px]">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {stats.total}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp} className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="border-b">
                <th className="py-3 pl-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Organisation</th>
                <th className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Joined</th>
                <th className="py-3 pr-4 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => (
                <motion.tr
                  key={u.roleId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.015 }}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors group"
                >
                  <td className="py-3 pl-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 bg-gradient-to-br',
                        avatarGradient(u.fullName)
                      )}>
                        {getInitials(u.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{u.fullName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="space-y-0.5">
                      {u.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{u.email}</span>
                        </div>
                      )}
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {u.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.orgName}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{u.orgPlan} plan</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                      getRoleBadgeColor(u.role)
                    )}>
                      {APP_ROLES.find((r) => r.value === u.role)?.label ?? u.role}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
                      u.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-zinc-100 text-zinc-600'
                    )}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', u.isActive ? 'bg-emerald-500' : 'bg-zinc-400')} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 text-right text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="py-3 pr-4 text-right">
                    <button
                      onClick={() => handleToggle(u.roleId, u.isActive, u.fullName)}
                      disabled={toggleActive.isPending}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors opacity-70 group-hover:opacity-100',
                        u.isActive
                          ? 'hover:bg-red-100 text-muted-foreground hover:text-red-700'
                          : 'hover:bg-emerald-100 text-muted-foreground hover:text-emerald-700'
                      )}
                      title={u.isActive ? 'Deactivate user' : 'Reactivate user'}
                    >
                      {u.isActive ? (
                        <><UserX className="h-3.5 w-3.5" /> Deactivate</>
                      ) : (
                        <><UserCheck className="h-3.5 w-3.5" /> Reactivate</>
                      )}
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No users match your filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface KpiProps { label: string; value: string | number; icon: typeof Users; gradient: string }

function KpiCard({ label, value, icon: Icon, gradient }: KpiProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md', gradient)}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/80">{label}</p>
      <Icon className="absolute bottom-2 right-2 h-8 w-8 opacity-[0.08]" strokeWidth={1.5} />
    </div>
  );
}
