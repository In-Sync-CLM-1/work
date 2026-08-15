# Multi-tenant architecture (fleet standard)

Every In-Sync app that serves more than one customer answers the same question —
*which organisation am I working in?* — the same way. This is the contract.
It is written down because three of the four apps had a live cross-tenant data
leak that came from getting it subtly wrong, in the same way, independently.

## The invariant

> A signed-in user can only ever reach organisations they are a **member** of,
> and cannot grant themselves membership.

Everything below exists to guarantee that one sentence. If a change would
weaken it, the change is wrong regardless of how convenient it is.

## The four layers

| Layer | What it is | Rule |
|---|---|---|
| 1. Membership | where you **may** go | A table of `(user_id, org_id, role)`. Only admins write it. |
| 2. Active organisation | where you **are** | One value per user. |
| 3. Locked | — | The user must not be able to write layer 2 by hand. |
| 4. `set_active_org(uuid)` | the only way to move | `SECURITY DEFINER`; refuses any organisation the caller is not a member of. |

## Two sound mechanisms — both satisfy the invariant

**Pointer-resolved** — used by Work-Sync, GlobalCRM, Vendor-Sync.
RLS reads an ambient pointer (`profiles.org_id`, `profiles.tenant_id`) through a
helper like `auth_user_org_id()`. Queries stay simple because the organisation
is implicit.

*Because the pointer decides access, it must be locked.* This is exactly where
all three leaked: the pointer was writable by its owner, so a user could move
themselves into another customer and read their data.

**Membership-checked** — used by Expense.
RLS calls `is_org_member(auth.uid(), row.org_id)` on every row. There is no
ambient state to hijack, so this is the stronger of the two. Its
`profiles.active_org_id` is a **preference** — it decides which organisation the
UI opens on and nothing more — and is still written only through
`set_active_org()`.

Do not "unify" Expense onto the pointer mechanism. It would add an authority
where none is needed and create a second source of truth. The *contract* is
uniform; the mechanism is the strongest one each app's policies already support.

## Why a policy cannot do layer 3

An RLS policy gates **rows**, never **columns**. `WITH CHECK` only sees the new
row, so it cannot tell that `org_id` changed from its previous value. Use column
privileges:

```sql
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, …) ON public.profiles TO authenticated;
```

**Revoking single columns does nothing on its own.** Supabase grants
`ALL ON <table>` to `authenticated` by default, and a table-level UPDATE grant
covers every column regardless of any column-level revoke. The table grant has
to go first. (This was tried the wrong way round first, and the attack still
worked.)

## Platform admins

`platform_admin` is a role, not a place. It does **not** mean "has no
organisation".

- Platform role **and no** active organisation → console-only. Pin to the
  platform console.
- Platform role **and** an active organisation → the normal app, with the
  console reachable from the organisation switcher.

Getting this wrong is why arriving from another tool used to land on a platform
dashboard instead of the workspace the person came for.

## Scoping queries

Row-level security is a boundary, not a scope. A platform admin can legitimately
read every organisation, so any query that does not name one will merge all of
them into a single view. **Every organisation-scoped query filters explicitly:**

```ts
if (orgId) query = query.eq('org_id', orgId);
```

Work-Sync showed all 2,121 tasks from both organisations at once before this was
added.

## Testing it

Static reading of policies is unreliable in both directions — it produced dozens
of false positives and one false "all clear" during the fleet sweep. Prove it
behaviourally instead, inside `BEGIN … ROLLBACK`:

1. Pick a real, ordinary (non platform-admin) user who **demonstrably already
   reads rows in their own organisation**. A zero afterwards means nothing if
   they saw zero before.
2. Try to move them into every other organisation and count what they can see.
3. Check `ROW_COUNT`, not just the absence of an error — an UPDATE filtered out
   by a `USING` clause changes zero rows and raises nothing.

```sql
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  json_build_object('sub', '<user-uuid>', 'role', 'authenticated')::text, true);
```
