import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Building2, Briefcase, Shield,
  Copy, Check, Gift, Share2, ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { APP_ROLES, getRoleBadgeColor } from '@/types/user';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function generateReferralCode(userId: string, orgId: string | null) {
  const userPart = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  const orgPart = orgId ? orgId.replace(/-/g, '').slice(0, 4).toUpperCase() : 'OPEN';
  return `TM-${orgPart}-${userPart}`;
}

export function ProfilePage() {
  const { user, profile, orgName, userRole, refreshAuth } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
  });

  const referralCode = generateReferralCode(user?.id ?? '', profile?.org_id ?? null);
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const fullName = `${form.first_name} ${form.last_name}`.trim();
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          full_name: fullName,
          phone: form.phone || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated');
      setIsEditing(false);
      refreshAuth();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = () => {
    setForm({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
    });
    setIsEditing(true);
  };

  const roleLabel = APP_ROLES.find((r) => r.value === userRole)?.label || userRole || 'Member';

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="h-24 brand-gradient relative">
              <div className="absolute -bottom-10 left-6">
                <div className="h-20 w-20 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                  <span className="text-2xl font-bold text-primary">
                    {getInitials(profile?.full_name || 'U')}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-14 pb-5 px-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{profile?.full_name || 'User'}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(userRole || '')}`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Details / Edit */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Personal Information</h3>
              {!isEditing ? (
                <button
                  onClick={handleStartEdit}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-xs rounded-md border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">First Name</label>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phone (WhatsApp)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="919876543210"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-24">Name</span>
                  <span className="font-medium">{profile?.full_name || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-24">Email</span>
                  <span className="font-medium">{user?.email || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-24">Phone</span>
                  <span className="font-medium">{profile?.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-24">Organization</span>
                  <span className="font-medium">{orgName || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-24">Designation</span>
                  <span className="font-medium">{(profile as unknown as { designation?: { name: string } })?.designation?.name || '-'}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Referral Card */}
        <motion.div variants={fadeUp} className="space-y-5">
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 overflow-hidden relative">
            <div className="absolute -top-8 -right-8 h-24 w-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Gift className="h-4 w-4 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-sm">Refer & Earn</h3>
              </div>

              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Invite other organizations to Work-Sync. When they sign up and subscribe, you earn credits towards your billing.
              </p>

              {/* Referral Code */}
              <div className="mb-3">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your Referral Code</label>
                <div className="mt-1 flex items-center gap-2 bg-white rounded-lg border px-3 py-2">
                  <code className="text-sm font-bold text-primary flex-1 tracking-wide">{referralCode}</code>
                  <button
                    onClick={handleCopyLink}
                    className="p-1 rounded hover:bg-primary/10 transition-colors"
                    title="Copy referral link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-primary" />
                    )}
                  </button>
                </div>
              </div>

              {/* Referral Link */}
              <div className="mb-4">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Referral Link</label>
                <div className="mt-1 bg-white rounded-lg border px-3 py-2">
                  <p className="text-[11px] text-muted-foreground truncate font-mono">{referralLink}</p>
                </div>
              </div>

              {/* Share buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Copy Link
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Try Work-Sync for your team! Use my referral code ${referralCode} to get bonus credits.\n\n${referralLink}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Rewards summary */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-sm mb-3">Referral Rewards</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Referrals sent</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Signed up</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Credits earned</span>
                <span className="font-bold text-emerald-600">₹0.00</span>
              </div>
              <div className="border-t pt-3">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Earn <span className="font-semibold text-primary">₹500</span> for every organization that subscribes using your referral code.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
