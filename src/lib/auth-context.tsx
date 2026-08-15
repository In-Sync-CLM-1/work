import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/task';
import { supabase } from '@/lib/supabase';

export type AppRole = 'platform_admin' | 'admin' | 'sales_manager' | 'sales_agent' | 'support_manager' | 'support_agent' | 'analyst';

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  plan: string;
  trial_ends_at: string;
}

interface AuthContextType {
  // Auth state
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;

  // Profile
  profile: Profile | null;
  orgId: string | null;
  userName: string;

  // Organization
  organization: Organization | null;
  orgName: string;
  orgLogo: string;
  orgPlan: string;
  trialDaysLeft: number | null;
  isTrialExpired: boolean;

  // Roles & permissions
  userRole: AppRole | null;
  isPlatformAdmin: boolean;
  /** Has the platform_admin role, whether or not they are inside an org now. */
  canUsePlatformConsole: boolean;
  /** Every organisation this person belongs to. */
  memberships: Organization[];
  switchOrg: (orgId: string) => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;

  // Loading
  isLoading: boolean;
  isInitialized: boolean;
  profileError: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [memberships, setMemberships] = useState<Organization[]>([]);
  const [canUsePlatformConsole, setCanUsePlatformConsole] = useState(false);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [pendingSignInUser, setPendingSignInUser] = useState<User | null>(null);

  const isInitializingRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  const fetchUserData = useCallback(async (currentUser: User) => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;

    try {
      setProfileError(null);

      // Fetch profile first
      const profileRes = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileRes.error || !profileRes.data) {
        setProfileError('Failed to load your profile.');
        return;
      }

      setProfile(profileRes.data);

      // Every membership, not just the first row. Someone can belong to more
      // than one organisation — and a platform admin who also works inside an
      // organisation should be treated as a member of the one they are in,
      // otherwise they get the platform console when they wanted a workspace.
      const rolesRes = await supabase
        .from('user_roles')
        .select('role, org_id')
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      const roleRows = (rolesRes.data ?? []) as { role: AppRole; org_id: string | null }[];
      const orgId = profileRes.data.org_id as string | null;

      // The role that applies is the one for the organisation being worked in.
      // Platform admin is the fallback for having no organisation at all.
      const activeRole =
        roleRows.find((r) => orgId && r.org_id === orgId)?.role ??
        roleRows.find((r) => r.role === 'platform_admin')?.role ??
        roleRows[0]?.role ??
        null;

      setUserRole(activeRole);
      setCanUsePlatformConsole(roleRows.some((r) => r.role === 'platform_admin'));

      const orgIds = roleRows.map((r) => r.org_id).filter((id): id is string => !!id);
      if (orgIds.length > 0) {
        const orgsRes = await supabase
          .from('organizations')
          .select('id, name, logo_url, plan, trial_ends_at')
          .in('id', orgIds)
          .order('name');
        setMemberships(orgsRes.data ?? []);
      } else {
        setMemberships([]);
      }

      if (!orgId) {
        setOrganization(null);
        return;
      }

      const orgRes = await supabase
        .from('organizations')
        .select('id, name, logo_url, plan, trial_ends_at')
        .eq('id', orgId)
        .single();

      if (orgRes.data) {
        setOrganization(orgRes.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setProfileError('An error occurred while loading your account.');
    } finally {
      fetchInProgressRef.current = false;
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchUserData(currentSession.user);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserData]);

  useEffect(() => {
    let mounted = true;
    isInitializingRef.current = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchUserData(currentSession.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          isInitializingRef.current = false;
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        if (isInitializingRef.current) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (event === 'TOKEN_REFRESHED' && currentSession?.user) return;

        if (event === 'SIGNED_IN' && currentSession?.user) {
          setPendingSignInUser(currentSession.user);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setOrganization(null);
          setUserRole(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // Process pending sign-in outside onAuthStateChange
  useEffect(() => {
    if (!pendingSignInUser) return;

    const processPendingSignIn = async () => {
      if (!fetchInProgressRef.current) {
        await fetchUserData(pendingSignInUser);
      }
      setPendingSignInUser(null);
    };

    processPendingSignIn();
  }, [pendingSignInUser, fetchUserData]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: fullName.split(' ')[0],
          last_name: fullName.split(' ').slice(1).join(' '),
        },
      },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setOrganization(null);
    setMemberships([]);
    setCanUsePlatformConsole(false);
    setUserRole(null);
  };

  /**
   * Move to another organisation you belong to. The database function refuses
   * any organisation you are not a member of — the app never writes org_id
   * directly, because that column is what every access check reads.
   */
  const switchOrg = async (orgId: string) => {
    const { error } = await supabase.rpc('set_active_org', { p_org_id: orgId });
    if (error) throw error;
    await refreshAuth();
  };

  const isPlatformAdmin = userRole === 'platform_admin';
  const isAdmin = userRole === 'admin';
  const isManager = isAdmin || userRole === 'sales_manager' || userRole === 'support_manager';

  // null = unknown (org not loaded yet) — prevents a false "expires in 0 days" flash right after registration
  const trialDaysLeft = organization
    ? Math.ceil((new Date(organization.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isTrialExpired = !isPlatformAdmin && !!organization && organization.plan === 'trial' && trialDaysLeft !== null && trialDaysLeft <= 0;

  const value: AuthContextType = {
    session,
    user,
    isAuthenticated: !!session?.user,
    profile,
    orgId: profile?.org_id ?? null,
    userName: profile ? profile.full_name : '',
    organization,
    orgName: organization?.name ?? '',
    orgLogo: organization?.logo_url ?? '',
    orgPlan: organization?.plan ?? 'trial',
    trialDaysLeft,
    isTrialExpired,
    userRole,
    isPlatformAdmin,
    canUsePlatformConsole,
    memberships,
    switchOrg,
    isAdmin,
    isManager,
    isLoading,
    isInitialized,
    profileError,
    signIn,
    signUp,
    signOut,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks
export function useOrgId() {
  const { orgId, isLoading } = useAuth();
  return { orgId, isLoading };
}

export function useUserRole() {
  const { userRole, isPlatformAdmin, isAdmin, isManager, isLoading } = useAuth();
  return { userRole, isPlatformAdmin, isAdmin, isManager, isLoading };
}
