import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Building, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { uploadToR2 } from '@/lib/r2Storage';
import { orgLogoSrc } from '@/lib/orgLogo';

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

/**
 * Organisation settings. Admin-only — the route is gated, and the underlying
 * update policy only lets an org's own admins change its row.
 */
export function OrgSettingsPage() {
  const { organization, orgName, orgLogo, refreshAuth } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const currentSrc = orgLogoSrc(orgLogo);

  const save = async (logoKey: string | null) => {
    if (!organization) return;
    const { error } = await supabase
      .from('organizations')
      .update({ logo_url: logoKey })
      .eq('id', organization.id);
    if (error) throw error;
    await refreshAuth();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      toast.error('Use a PNG, JPG, WEBP or SVG image');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Logo must be under 2MB');
      return;
    }

    setBusy(true);
    try {
      // Public, so the sidebar can render it without signing every page load.
      const { key } = await uploadToR2(
        'org-logos',
        `${organization!.id}/${Date.now()}_${file.name}`,
        file,
        { visibility: 'public' },
      );
      await save(key);
      toast.success('Logo updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload the logo');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      // The object is left in place: it is small, public, and an older logo
      // may still be referenced by something already rendered.
      await save(null);
      toast.success('Logo removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove the logo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Organisation</h1>
        <p className="text-sm text-muted-foreground">How {orgName || 'your organisation'} appears across the app</p>
      </div>

      <div className="max-w-xl rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Logo</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Shown beside your organisation name in the sidebar. PNG, JPG, WEBP or SVG, up to 2MB.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-lg border bg-background flex items-center justify-center overflow-hidden">
            {currentSrc ? (
              <img src={currentSrc} alt={`${orgName} logo`} className="h-full w-full object-contain" />
            ) : (
              <Building className="h-7 w-7 text-muted-foreground" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(',')}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {currentSrc ? 'Replace logo' : 'Upload logo'}
            </button>

            {currentSrc && (
              <button
                type="button"
                disabled={busy}
                onClick={remove}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-input hover:bg-muted disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
