import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Building2, Calendar, CreditCard, IndianRupee, Receipt, Sparkles } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { OrgRow } from '@/hooks/usePlatformDashboard';
import {
  useExtendTrial, useRecordPayment, useOrgPayments,
} from '@/hooks/useOrgManagement';
import {
  PLANS, PLAN_BY_ID, CYCLE_LABELS, CYCLE_MONTHS, CYCLE_DISCOUNT,
  calculatePlanTotal, fmtINR,
} from '@/lib/pricing';
import type { PaidPlan, BillingCycle } from '@/lib/pricing';

interface Props {
  org: OrgRow;
  open: boolean;
  onClose: () => void;
}

type Tab = 'trial' | 'payment';

const PLAN_LABELS: Record<string, string> = { trial: 'Trial', team: 'Team', business: 'Business' };

const planBadgeClass = (plan: string) => {
  if (plan === 'team') return 'bg-violet-100 text-violet-700';
  if (plan === 'business') return 'bg-emerald-100 text-emerald-700';
  return 'bg-amber-100 text-amber-700';
};

function formatDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function OrgManagementModal({ org, open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('trial');

  // Trial extension state
  const [trialDays, setTrialDays] = useState('7');
  const extendTrial = useExtendTrial();

  // Payment state
  const [method, setMethod] = useState('upi');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [planTarget, setPlanTarget] = useState<PaidPlan>('team');
  const [cycle, setCycle] = useState<BillingCycle>('quarterly');
  const [seats, setSeats] = useState<string>(String(Math.max(org.members, 1)));
  const [amountOverride, setAmountOverride] = useState<string>('');
  const recordPayment = useRecordPayment();

  // Keep cycle valid when plan changes
  useEffect(() => {
    const allowed = PLAN_BY_ID[planTarget].allowedCycles;
    if (!allowed.includes(cycle)) setCycle(PLAN_BY_ID[planTarget].defaultCycle);
  }, [planTarget, cycle]);

  // Auto-fill seats when modal opens for a different org
  useEffect(() => {
    setSeats(String(Math.max(org.members, 1)));
  }, [org.id, org.members]);

  const seatsNum = Math.max(parseInt(seats || '0', 10) || 0, 0);
  const computedAmount = calculatePlanTotal(planTarget, seatsNum, cycle);
  const finalAmount = useMemo(() => {
    const override = parseFloat(amountOverride);
    return !isNaN(override) && override > 0 ? override : computedAmount;
  }, [amountOverride, computedAmount]);

  const { data: payments } = useOrgPayments(open ? org.id : null);

  const handleExtendTrial = async () => {
    const days = parseInt(trialDays, 10);
    if (isNaN(days) || days < 1) { toast.error('Enter a valid number of days'); return; }
    const base = org.trialEndsAt && org.trialDaysLeft > 0
      ? new Date(org.trialEndsAt)
      : new Date();
    base.setDate(base.getDate() + days);
    try {
      await extendTrial.mutateAsync({ orgId: org.id, newDate: base.toISOString() });
      toast.success(`Trial extended by ${days} day${days === 1 ? '' : 's'}`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Failed to extend trial');
    }
  };

  const handleRecordPayment = async () => {
    if (finalAmount <= 0) { toast.error('Enter a valid amount'); return; }
    const cycleNote = `${PLAN_LABELS[planTarget]} · ${CYCLE_LABELS[cycle]} · ${seatsNum} seat${seatsNum === 1 ? '' : 's'}`;
    const composedNotes = notes ? `${notes} (${cycleNote})` : cycleNote;
    try {
      await recordPayment.mutateAsync({
        orgId: org.id,
        amount: finalAmount,
        method,
        referenceNo,
        notes: composedNotes,
        planTarget,
      });
      toast.success(`Payment recorded — plan upgraded to ${PLAN_LABELS[planTarget]}`);
      setReferenceNo(''); setNotes(''); setAmountOverride('');
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Failed to record payment');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogCloseButton onClick={onClose} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {org.name}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${planBadgeClass(org.plan)}`}>
              {PLAN_LABELS[org.plan] ?? org.plan}
            </span>
            {org.plan === 'trial' && (
              <span className="text-xs text-muted-foreground">
                {org.trialDaysLeft > 0
                  ? `Trial ends ${formatDate(org.trialEndsAt)} (${org.trialDaysLeft}d left)`
                  : `Trial expired ${formatDate(org.trialEndsAt)}`}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => setTab('trial')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'trial' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Extend Trial</span>
          </button>
          <button
            onClick={() => setTab('payment')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'payment' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Record Payment</span>
          </button>
        </div>

        {tab === 'trial' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Extend this organization's trial period. Days are added from the current expiry date (or from today if already expired).
            </p>
            <div>
              <label className="text-xs font-medium mb-1 block">Days to extend</label>
              <div className="flex gap-2">
                {['3', '7', '14', '30'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setTrialDays(d)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      trialDays === d ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
                <Input
                  type="number"
                  min={1}
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  className="w-20 h-8 text-xs"
                  placeholder="days"
                />
              </div>
            </div>
            <Button
              onClick={handleExtendTrial}
              disabled={extendTrial.isPending}
              className="w-full"
            >
              {extendTrial.isPending ? 'Extending…' : `Extend trial by ${trialDays} day${trialDays === '1' ? '' : 's'}`}
            </Button>
          </div>
        )}

        {tab === 'payment' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pricing auto-calculates from the landing page rate. Override the amount if a discount or special arrangement applies.
            </p>

            {/* Plan picker */}
            <div>
              <label className="text-xs font-medium mb-1.5 block">Upgrade plan to</label>
              <div className="grid grid-cols-2 gap-2">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlanTarget(p.id)}
                    className={`relative py-3 px-3 rounded-lg border-2 text-left transition-all ${
                      planTarget === p.id
                        ? p.id === 'team' ? 'border-violet-400 bg-violet-50' : 'border-emerald-400 bg-emerald-50'
                        : 'border-border hover:bg-muted/40'
                    }`}
                  >
                    <p className="text-sm font-bold">{PLAN_LABELS[p.id]}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {fmtINR(p.pricePerUserMonth)}/user/mo
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Cycle picker */}
            <div>
              <label className="text-xs font-medium mb-1.5 block">Billing cycle</label>
              <div className="inline-flex items-center rounded-lg border bg-muted/30 p-0.5 text-xs w-full">
                {(['monthly', 'quarterly', 'yearly'] as BillingCycle[]).map((c) => {
                  const allowed = PLAN_BY_ID[planTarget].allowedCycles.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => allowed && setCycle(c)}
                      disabled={!allowed}
                      className={`flex-1 px-2 py-1.5 rounded-md font-medium transition-colors ${
                        cycle === c && allowed
                          ? 'bg-background shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      } ${!allowed && 'opacity-40 cursor-not-allowed'}`}
                    >
                      {CYCLE_LABELS[c]}
                      {CYCLE_DISCOUNT[c] > 0 && (
                        <span className="ml-1 text-emerald-600 font-semibold">−{Math.round(CYCLE_DISCOUNT[c] * 100)}%</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seats + method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Seats (paid users)</label>
                <Input
                  type="number"
                  min={1}
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  placeholder="1"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Org has {org.members} active member{org.members === 1 ? '' : 's'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Payment method</label>
                <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="manual">Manual / Other</option>
                </Select>
              </div>
            </div>

            {/* Calculated total */}
            <div className="rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fuchsia-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Calculated total
                </span>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  {fmtINR(computedAmount)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {seatsNum} × {fmtINR(PLAN_BY_ID[planTarget].pricePerUserMonth)} × {CYCLE_MONTHS[cycle]} mo
                {CYCLE_DISCOUNT[cycle] > 0 && ` − ${Math.round(CYCLE_DISCOUNT[cycle] * 100)}%`}
              </p>
            </div>

            {/* Optional override */}
            <div>
              <label className="text-xs font-medium mb-1 block">
                Override amount <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min={1}
                  value={amountOverride}
                  onChange={(e) => setAmountOverride(e.target.value)}
                  placeholder={`Default: ${fmtINR(computedAmount)}`}
                  className="pl-7"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Reference / transaction ID</label>
              <Input
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="UTR, transaction ID, etc."
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Notes (optional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes"
              />
            </div>

            <Button
              onClick={handleRecordPayment}
              disabled={recordPayment.isPending || finalAmount <= 0}
              className="w-full"
            >
              {recordPayment.isPending
                ? 'Recording…'
                : `Record ${fmtINR(finalAmount)} & upgrade to ${PLAN_LABELS[planTarget]}`}
            </Button>

            {/* Payment history */}
            {payments && payments.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" /> Payment history
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                      <div>
                        <span className="font-medium">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                        <span className="text-muted-foreground ml-1.5">· {p.method} · {PLAN_LABELS[p.plan_target] ?? p.plan_target}</span>
                        {p.reference_no && <span className="text-muted-foreground ml-1.5">· {p.reference_no}</span>}
                      </div>
                      <span className="text-muted-foreground">{formatDate(p.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
