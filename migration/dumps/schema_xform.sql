--
-- PostgreSQL database dump
--

-- \restrict eqgehIEwa02Br2tVIkq1ojYUmgc1rracrs9V3Q9zh3ggCXCruoTmyUIMp96Ofep

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_cron; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";


--
-- Name: EXTENSION "pg_cron"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pg_cron" IS 'Job scheduler for PostgreSQL';


--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_net"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pg_net" IS 'Async HTTP';


--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_stat_statements"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pg_stat_statements" IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: EXTENSION "supabase_vault"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "supabase_vault" IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."app_role" AS ENUM (
    'super_admin',
    'admin',
    'sales_manager',
    'sales_agent',
    'support_manager',
    'support_agent',
    'analyst',
    'platform_admin'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";

--
-- Name: task_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."task_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."task_priority" OWNER TO "postgres";

--
-- Name: task_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."task_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled',
    'closed'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";

--
-- Name: auth_user_org_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."auth_user_org_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT org_id FROM profiles WHERE id = auth.uid()
$$;


ALTER FUNCTION "public"."auth_user_org_id"() OWNER TO "postgres";

--
-- Name: auto_generate_task_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."auto_generate_task_number"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    next_num INT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(task_number FROM 6) AS INT)), 0) + 1
      INTO next_num
      FROM public.tasks
      WHERE org_id = NEW.org_id;

    NEW.task_number := 'TASK-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_generate_task_number"() OWNER TO "postgres";

--
-- Name: auto_set_closed_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."auto_set_closed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed' THEN
        NEW.closed_at = now();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_set_closed_at"() OWNER TO "postgres";

--
-- Name: auto_set_completed_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."auto_set_completed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
        NEW.completed_at = now();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_set_completed_at"() OWNER TO "postgres";

--
-- Name: check_admin_limit(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."check_admin_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.role = 'admin' THEN
        IF (SELECT COUNT(*) FROM user_roles WHERE org_id = NEW.org_id AND role = 'admin' AND is_active = true AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')) >= 5 THEN
            RAISE EXCEPTION 'Maximum of 5 admins per organization';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_admin_limit"() OWNER TO "postgres";

--
-- Name: dispatch_external_notification(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."dispatch_external_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://seijjmcncrbekngurxxj.supabase.co/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWpqbWNuY3JiZWtuZ3VyeHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDAxODIsImV4cCI6MjA5MDAxNjE4Mn0.N9CPT713v2OUIiES5DIiL6WlDFh-tD3dGo1wZb0ecX4'
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id::text,
        'user_id', NEW.user_id::text,
        'notification_type', NEW.notification_type,
        'title', NEW.title,
        'message', NEW.message,
        'task_id', NEW.task_id::text
      )
    )
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."dispatch_external_notification"() OWNER TO "postgres";

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_full_name TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
BEGIN
    v_first_name := NEW.raw_user_meta_data ->> 'first_name';
    v_last_name  := NEW.raw_user_meta_data ->> 'last_name';
    v_full_name  := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(TRIM(COALESCE(v_first_name, '') || ' ' || COALESCE(v_last_name, '')), ''),
        ''
    );

    INSERT INTO public.profiles (id, full_name, email, avatar_url, first_name, last_name)
    VALUES (
        NEW.id,
        v_full_name,
        COALESCE(NEW.email, ''),
        NEW.raw_user_meta_data ->> 'avatar_url',
        v_first_name,
        v_last_name
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

--
-- Name: is_platform_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_platform_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT is_platform_admin(auth.uid());
$$;


ALTER FUNCTION "public"."is_platform_admin"() OWNER TO "postgres";

--
-- Name: is_platform_admin("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_platform_admin"("_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
      AND role = 'platform_admin'
      AND is_active = true
  );
$$;


ALTER FUNCTION "public"."is_platform_admin"("_user_id" "uuid") OWNER TO "postgres";

--
-- Name: log_status_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."log_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO task_comments (task_id, user_id, comment, comment_type, metadata, org_id)
        VALUES (
            NEW.id,
            NEW.assigned_to,
            'Status changed from ' || OLD.status || ' to ' || NEW.status,
            'system',
            jsonb_build_object('old_status', OLD.status::TEXT, 'new_status', NEW.status::TEXT),
            NEW.org_id
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_status_change"() OWNER TO "postgres";

--
-- Name: notify_on_new_comment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."notify_on_new_comment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_task RECORD;
  v_commenter_name TEXT;
BEGIN
  -- Only for user comments, not system-generated
  IF NEW.comment_type = 'comment' THEN
    SELECT task_name, assigned_to, assigned_by, org_id
      INTO v_task
      FROM tasks WHERE id = NEW.task_id;

    SELECT full_name INTO v_commenter_name
      FROM profiles WHERE id = NEW.user_id;

    -- Notify assignee (if not the commenter)
    IF v_task.assigned_to IS DISTINCT FROM NEW.user_id THEN
      INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
      VALUES (
        v_task.assigned_to,
        'comment',
        COALESCE(v_commenter_name, 'Someone') || ' commented on ' || v_task.task_name,
        LEFT(NEW.comment, 200),
        NEW.task_id,
        NEW.org_id
      );
    END IF;

    -- Notify assigner (if different from both commenter and assignee)
    IF v_task.assigned_by IS DISTINCT FROM NEW.user_id
       AND v_task.assigned_by IS DISTINCT FROM v_task.assigned_to
    THEN
      INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
      VALUES (
        v_task.assigned_by,
        'comment',
        COALESCE(v_commenter_name, 'Someone') || ' commented on ' || v_task.task_name,
        LEFT(NEW.comment, 200),
        NEW.task_id,
        NEW.org_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_on_new_comment"() OWNER TO "postgres";

--
-- Name: notify_on_task_assignment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."notify_on_task_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
        INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
        VALUES (
            NEW.assigned_to,
            'task_assignment',
            'New Task Assigned',
            'You have been assigned task ' || NEW.task_number || ': ' || NEW.task_name,
            NEW.id,
            NEW.org_id
        );

        INSERT INTO task_watchers (task_id, user_id, org_id)
        VALUES (NEW.id, NEW.assigned_to, NEW.org_id)
        ON CONFLICT (task_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_on_task_assignment"() OWNER TO "postgres";

--
-- Name: notify_on_task_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."notify_on_task_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify the assignee (skip if they triggered the change)
    IF NEW.assigned_to IS DISTINCT FROM auth.uid() THEN
      INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
      VALUES (
        NEW.assigned_to,
        'status_change',
        NEW.task_name || ' — status updated',
        'Status changed from ' || REPLACE(OLD.status::TEXT, '_', ' ') || ' to ' || REPLACE(NEW.status::TEXT, '_', ' '),
        NEW.id,
        NEW.org_id
      );
    END IF;

    -- Notify the assigner if different from assignee and didn't trigger the change
    IF NEW.assigned_by IS DISTINCT FROM NEW.assigned_to
       AND NEW.assigned_by IS DISTINCT FROM auth.uid() THEN
      INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
      VALUES (
        NEW.assigned_by,
        'status_change',
        NEW.task_name || ' — status updated',
        COALESCE((SELECT full_name FROM profiles WHERE id = NEW.assigned_to), 'A team member')
          || ' changed status from ' || REPLACE(OLD.status::TEXT, '_', ' ') || ' to ' || REPLACE(NEW.status::TEXT, '_', ' '),
        NEW.id,
        NEW.org_id
      );
    END IF;
  END IF;

  -- Priority escalated to urgent or high
  IF OLD.priority IS DISTINCT FROM NEW.priority
     AND NEW.priority IN ('urgent', 'high')
     AND (OLD.priority IS NULL OR OLD.priority NOT IN ('urgent', 'high'))
  THEN
    IF NEW.assigned_to IS DISTINCT FROM auth.uid() THEN
      INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
      VALUES (
        NEW.assigned_to,
        'priority_change',
        NEW.task_name || ' — priority escalated',
        'Priority changed from ' || COALESCE(OLD.priority::TEXT, 'none') || ' to ' || NEW.priority::TEXT || '. Immediate attention required.',
        NEW.id,
        NEW.org_id
      );
    END IF;
  END IF;

  -- NOTE: Reassignment notifications are handled exclusively by
  -- trg_tasks_notify_assignment → notify_on_task_assignment().
  -- Do NOT add a reassignment block here to avoid duplicate notifications.

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_on_task_update"() OWNER TO "postgres";

--
-- Name: setup_new_organization("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."setup_new_organization"("p_org_name" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_existing_org_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT org_id INTO v_existing_org_id FROM profiles WHERE id = v_user_id;
  IF v_existing_org_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  INSERT INTO organizations (name)
  VALUES (p_org_name)
  RETURNING id INTO v_org_id;

  INSERT INTO user_roles (user_id, org_id, role, is_active)
  VALUES (v_user_id, v_org_id, 'admin', true);

  UPDATE profiles
  SET org_id = v_org_id, onboarding_completed = true
  WHERE id = v_user_id;

  RETURN json_build_object('org_id', v_org_id, 'org_name', p_org_name);
END;
$$;


ALTER FUNCTION "public"."setup_new_organization"("p_org_name" "text") OWNER TO "postgres";

--
-- Name: touch_support_ticket_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."touch_support_ticket_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_support_ticket_updated_at"() OWNER TO "postgres";

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: designation_feature_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."designation_feature_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "designation_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "feature_key" "text" NOT NULL,
    "can_view" boolean DEFAULT true,
    "can_create" boolean DEFAULT true,
    "can_edit" boolean DEFAULT true,
    "can_delete" boolean DEFAULT true,
    "custom_permissions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."designation_feature_access" OWNER TO "postgres";

--
-- Name: designations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."designations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "role" "public"."app_role" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."designations" OWNER TO "postgres";

--
-- Name: feature_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."feature_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_key" "text" NOT NULL,
    "feature_name" "text" NOT NULL,
    "feature_description" "text",
    "category" "text" NOT NULL,
    "is_premium" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."feature_permissions" OWNER TO "postgres";

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "task_id" "uuid",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "plan" "text" DEFAULT 'trial'::"text" NOT NULL,
    "trial_ends_at" timestamp with time zone DEFAULT ("now"() + '14 days'::interval) NOT NULL,
    CONSTRAINT "organizations_plan_check" CHECK (("plan" = ANY (ARRAY['trial'::"text", 'team'::"text", 'business'::"text"])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";

--
-- Name: otp_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."otp_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email_otp" "text" NOT NULL,
    "phone_otp" "text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:10:00'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."otp_verifications" OWNER TO "postgres";

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'INR'::"text" NOT NULL,
    "method" "text" DEFAULT 'manual'::"text" NOT NULL,
    "reference_no" "text",
    "notes" "text",
    "plan_target" "text" NOT NULL,
    "recorded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payments_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "payments_method_check" CHECK (("method" = ANY (ARRAY['upi'::"text", 'bank_transfer'::"text", 'card'::"text", 'cash'::"text", 'manual'::"text"]))),
    CONSTRAINT "payments_plan_target_check" CHECK (("plan_target" = ANY (ARRAY['team'::"text", 'business'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "avatar_url" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "designation_id" "uuid",
    "is_platform_admin" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "onboarding_completed" boolean DEFAULT false,
    "department" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";

--
-- Name: reporting_hierarchy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."reporting_hierarchy" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "designation_id" "uuid" NOT NULL,
    "reports_to_designation_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reporting_hierarchy" OWNER TO "postgres";

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "user_id" "uuid",
    "user_email" "text" NOT NULL,
    "user_name" "text",
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'other'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "page_url" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "support_tickets_category_check" CHECK (("category" = ANY (ARRAY['bug'::"text", 'feature'::"text", 'question'::"text", 'billing'::"text", 'other'::"text"]))),
    CONSTRAINT "support_tickets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";

--
-- Name: task_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."task_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "file_type" "text" NOT NULL,
    "attachment_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."task_attachments" OWNER TO "postgres";

--
-- Name: task_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "comment" "text" NOT NULL,
    "comment_type" "text" DEFAULT 'comment'::"text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."task_comments" OWNER TO "postgres";

--
-- Name: task_watchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."task_watchers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."task_watchers" OWNER TO "postgres";

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_number" "text",
    "task_name" "text" NOT NULL,
    "description" "text",
    "assigned_to" "uuid" NOT NULL,
    "assigned_by" "uuid" NOT NULL,
    "parent_task_id" "uuid",
    "due_date" "date" NOT NULL,
    "start_date" timestamp with time zone,
    "status" "public"."task_status" DEFAULT 'pending'::"public"."task_status" NOT NULL,
    "priority" "public"."task_priority" DEFAULT 'medium'::"public"."task_priority" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "estimated_hours" numeric,
    "actual_hours" numeric,
    "completion_notes" "text",
    "completion_percentage" integer DEFAULT 0 NOT NULL,
    "closed_at" timestamp with time zone,
    "closed_by" "uuid",
    "closure_reason" "text",
    "completed_at" timestamp with time zone,
    "restart_reason" "text",
    "restarted_at" timestamp with time zone,
    "restarted_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    "closure_rating" integer,
    CONSTRAINT "tasks_closure_rating_check" CHECK ((("closure_rating" >= 1) AND ("closure_rating" <= 5))),
    CONSTRAINT "tasks_completion_percentage_check" CHECK ((("completion_percentage" >= 0) AND ("completion_percentage" <= 100)))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";

--
-- Name: team_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";

--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."teams" OWNER TO "postgres";

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "role" "public"."app_role" DEFAULT 'sales_agent'::"public"."app_role" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";

--
-- Name: designation_feature_access designation_feature_access_designation_id_feature_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."designation_feature_access"
    ADD CONSTRAINT "designation_feature_access_designation_id_feature_key_key" UNIQUE ("designation_id", "feature_key");


--
-- Name: designation_feature_access designation_feature_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."designation_feature_access"
    ADD CONSTRAINT "designation_feature_access_pkey" PRIMARY KEY ("id");


--
-- Name: designations designations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."designations"
    ADD CONSTRAINT "designations_pkey" PRIMARY KEY ("id");


--
-- Name: feature_permissions feature_permissions_feature_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."feature_permissions"
    ADD CONSTRAINT "feature_permissions_feature_key_key" UNIQUE ("feature_key");


--
-- Name: feature_permissions feature_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."feature_permissions"
    ADD CONSTRAINT "feature_permissions_pkey" PRIMARY KEY ("id");


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");


--
-- Name: otp_verifications otp_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."otp_verifications"
    ADD CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id");


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");


--
-- Name: reporting_hierarchy reporting_hierarchy_org_id_designation_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reporting_hierarchy"
    ADD CONSTRAINT "reporting_hierarchy_org_id_designation_id_key" UNIQUE ("org_id", "designation_id");


--
-- Name: reporting_hierarchy reporting_hierarchy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reporting_hierarchy"
    ADD CONSTRAINT "reporting_hierarchy_pkey" PRIMARY KEY ("id");


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");


--
-- Name: task_attachments task_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id");


--
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");


--
-- Name: task_watchers task_watchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_watchers"
    ADD CONSTRAINT "task_watchers_pkey" PRIMARY KEY ("id");


--
-- Name: task_watchers task_watchers_task_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_watchers"
    ADD CONSTRAINT "task_watchers_task_id_user_id_key" UNIQUE ("task_id", "user_id");


--
-- Name: tasks tasks_org_task_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_org_task_number_key" UNIQUE ("org_id", "task_number");


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");


--
-- Name: team_members team_members_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_user_id_key" UNIQUE ("team_id", "user_id");


--
-- Name: teams teams_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_name_key" UNIQUE ("name");


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");


--
-- Name: user_roles user_roles_user_id_org_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_org_id_key" UNIQUE ("user_id", "org_id");


--
-- Name: idx_designation_feature_access_designation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_designation_feature_access_designation_id" ON "public"."designation_feature_access" USING "btree" ("designation_id");


--
-- Name: idx_designations_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_designations_org_id" ON "public"."designations" USING "btree" ("org_id");


--
-- Name: idx_notifications_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_notifications_org_id" ON "public"."notifications" USING "btree" ("org_id");


--
-- Name: idx_notifications_user_id_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_notifications_user_id_read" ON "public"."notifications" USING "btree" ("user_id", "is_read");


--
-- Name: idx_profiles_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_profiles_org_id" ON "public"."profiles" USING "btree" ("org_id");


--
-- Name: idx_reporting_hierarchy_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reporting_hierarchy_org_id" ON "public"."reporting_hierarchy" USING "btree" ("org_id");


--
-- Name: idx_task_attachments_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_task_attachments_org_id" ON "public"."task_attachments" USING "btree" ("org_id");


--
-- Name: idx_task_attachments_task_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_task_attachments_task_id" ON "public"."task_attachments" USING "btree" ("task_id");


--
-- Name: idx_task_comments_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_task_comments_org_id" ON "public"."task_comments" USING "btree" ("org_id");


--
-- Name: idx_task_comments_task_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_task_comments_task_id" ON "public"."task_comments" USING "btree" ("task_id");


--
-- Name: idx_tasks_assigned_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tasks_assigned_by" ON "public"."tasks" USING "btree" ("assigned_by");


--
-- Name: idx_tasks_assigned_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tasks_assigned_to" ON "public"."tasks" USING "btree" ("assigned_to");


--
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tasks_due_date" ON "public"."tasks" USING "btree" ("due_date");


--
-- Name: idx_tasks_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tasks_org_id" ON "public"."tasks" USING "btree" ("org_id");


--
-- Name: idx_tasks_parent_task_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tasks_parent_task_id" ON "public"."tasks" USING "btree" ("parent_task_id");


--
-- Name: idx_tasks_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tasks_priority" ON "public"."tasks" USING "btree" ("priority");


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");


--
-- Name: idx_teams_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_teams_org_id" ON "public"."teams" USING "btree" ("org_id");


--
-- Name: idx_user_roles_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_roles_org_id" ON "public"."user_roles" USING "btree" ("org_id");


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");


--
-- Name: otp_verifications_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "otp_verifications_email_idx" ON "public"."otp_verifications" USING "btree" ("email");


--
-- Name: support_tickets_created_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "support_tickets_created_idx" ON "public"."support_tickets" USING "btree" ("created_at" DESC);


--
-- Name: support_tickets_org_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "support_tickets_org_id_idx" ON "public"."support_tickets" USING "btree" ("org_id");


--
-- Name: support_tickets_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "support_tickets_status_idx" ON "public"."support_tickets" USING "btree" ("status");


--
-- Name: support_tickets_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "support_tickets_user_id_idx" ON "public"."support_tickets" USING "btree" ("user_id");


--
-- Name: user_roles_platform_admin_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "user_roles_platform_admin_unique" ON "public"."user_roles" USING "btree" ("user_id") WHERE (("org_id" IS NULL) AND ("role" = 'platform_admin'::"public"."app_role"));


--
-- Name: user_roles trg_check_admin_limit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_check_admin_limit" BEFORE INSERT OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."check_admin_limit"();


--
-- Name: designations trg_designations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_designations_updated_at" BEFORE UPDATE ON "public"."designations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: notifications trg_dispatch_external_notification; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_dispatch_external_notification" AFTER INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."dispatch_external_notification"();


--
-- Name: task_comments trg_notify_on_new_comment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_notify_on_new_comment" AFTER INSERT ON "public"."task_comments" FOR EACH ROW EXECUTE FUNCTION "public"."notify_on_new_comment"();


--
-- Name: tasks trg_notify_on_task_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_notify_on_task_update" AFTER UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."notify_on_task_update"();


--
-- Name: organizations trg_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: profiles trg_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: support_tickets trg_support_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_support_tickets_updated_at" BEFORE UPDATE ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."touch_support_ticket_updated_at"();


--
-- Name: tasks trg_tasks_auto_closed_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_tasks_auto_closed_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."auto_set_closed_at"();


--
-- Name: tasks trg_tasks_auto_completed_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_tasks_auto_completed_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."auto_set_completed_at"();


--
-- Name: tasks trg_tasks_auto_number; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_tasks_auto_number" BEFORE INSERT ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."auto_generate_task_number"();


--
-- Name: tasks trg_tasks_log_status_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_tasks_log_status_change" AFTER UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."log_status_change"();


--
-- Name: tasks trg_tasks_notify_assignment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_tasks_notify_assignment" AFTER INSERT OR UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."notify_on_task_assignment"();


--
-- Name: tasks trg_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "trg_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: designation_feature_access designation_feature_access_designation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."designation_feature_access"
    ADD CONSTRAINT "designation_feature_access_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE CASCADE;


--
-- Name: designation_feature_access designation_feature_access_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."designation_feature_access"
    ADD CONSTRAINT "designation_feature_access_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: designations designations_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."designations"
    ADD CONSTRAINT "designations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: profiles fk_profiles_designation; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "fk_profiles_designation" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE SET NULL;


--
-- Name: notifications notifications_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: notifications notifications_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");


--
-- Name: payments payments_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: payments payments_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "auth"."users"("id");


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: profiles profiles_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;


--
-- Name: reporting_hierarchy reporting_hierarchy_designation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reporting_hierarchy"
    ADD CONSTRAINT "reporting_hierarchy_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE CASCADE;


--
-- Name: reporting_hierarchy reporting_hierarchy_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reporting_hierarchy"
    ADD CONSTRAINT "reporting_hierarchy_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: reporting_hierarchy reporting_hierarchy_reports_to_designation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."reporting_hierarchy"
    ADD CONSTRAINT "reporting_hierarchy_reports_to_designation_id_fkey" FOREIGN KEY ("reports_to_designation_id") REFERENCES "public"."designations"("id") ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: task_attachments task_attachments_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: task_attachments task_attachments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;


--
-- Name: task_attachments task_attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_attachments"
    ADD CONSTRAINT "task_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id");


--
-- Name: task_comments task_comments_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: task_comments task_comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;


--
-- Name: task_comments task_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");


--
-- Name: task_watchers task_watchers_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_watchers"
    ADD CONSTRAINT "task_watchers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: task_watchers task_watchers_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_watchers"
    ADD CONSTRAINT "task_watchers_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;


--
-- Name: task_watchers task_watchers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."task_watchers"
    ADD CONSTRAINT "task_watchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: tasks tasks_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id");


--
-- Name: tasks tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id");


--
-- Name: tasks tasks_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."profiles"("id");


--
-- Name: tasks tasks_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: tasks tasks_parent_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;


--
-- Name: tasks tasks_restarted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_restarted_by_fkey" FOREIGN KEY ("restarted_by") REFERENCES "public"."profiles"("id");


--
-- Name: team_members team_members_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: teams teams_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");


--
-- Name: teams teams_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: user_roles user_roles_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: user_roles Admins and super admins can delete user roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins and super admins can delete user roles" ON "public"."user_roles" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."org_id" = "user_roles"."org_id") AND ("ur"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("ur"."is_active" = true)))));


--
-- Name: user_roles Admins and super admins can insert user roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins and super admins can insert user roles" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."org_id" = "user_roles"."org_id") AND ("ur"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("ur"."is_active" = true)))));


--
-- Name: user_roles Admins and super admins can update user roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins and super admins can update user roles" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."org_id" = "user_roles"."org_id") AND ("ur"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("ur"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."org_id" = "user_roles"."org_id") AND ("ur"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("ur"."is_active" = true)))));


--
-- Name: designation_feature_access Admins can delete designation feature access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete designation feature access" ON "public"."designation_feature_access" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "designation_feature_access"."org_id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true)))));


--
-- Name: designations Admins can delete designations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete designations" ON "public"."designations" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "designations"."org_id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true)))));


--
-- Name: reporting_hierarchy Admins can delete reporting hierarchy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete reporting hierarchy" ON "public"."reporting_hierarchy" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "reporting_hierarchy"."org_id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true)))));


--
-- Name: designation_feature_access Admins can insert designation feature access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert designation feature access" ON "public"."designation_feature_access" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "designation_feature_access"."org_id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true)))));


--
-- Name: designations Admins can insert designations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert designations" ON "public"."designations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "designations"."org_id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true)))));


--
-- Name: reporting_hierarchy Admins can insert reporting hierarchy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert reporting hierarchy" ON "public"."reporting_hierarchy" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "reporting_hierarchy"."org_id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true)))));


--
-- Name: designation_feature_access Admins can update designation feature access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update designation feature access" ON "public"."designation_feature_access" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "designation_feature_access"."org_id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "designation_feature_access"."org_id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true)))));


--
-- Name: designations Admins can update designations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update designations" ON "public"."designations" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "designations"."org_id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "designations"."org_id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true)))));


--
-- Name: profiles Admins can update profiles in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update profiles in their org" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("org_id" = "public"."auth_user_org_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "public"."auth_user_org_id"()) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true)))))) WITH CHECK (("org_id" = "public"."auth_user_org_id"()));


--
-- Name: reporting_hierarchy Admins can update reporting hierarchy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update reporting hierarchy" ON "public"."reporting_hierarchy" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "reporting_hierarchy"."org_id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "reporting_hierarchy"."org_id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true)))));


--
-- Name: feature_permissions Authenticated users can read all feature permissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read all feature permissions" ON "public"."feature_permissions" FOR SELECT TO "authenticated" USING (true);


--
-- Name: organizations Authenticated users can read all organizations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read all organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING (true);


--
-- Name: designation_feature_access Authenticated users can read designation feature access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read designation feature access" ON "public"."designation_feature_access" FOR SELECT TO "authenticated" USING (true);


--
-- Name: reporting_hierarchy Authenticated users can read reporting hierarchy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read reporting hierarchy" ON "public"."reporting_hierarchy" FOR SELECT TO "authenticated" USING (true);


--
-- Name: user_roles Authenticated users can read user roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read user roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (true);


--
-- Name: designations Authenticated users in org can read designations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users in org can read designations" ON "public"."designations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "designations"."org_id") AND ("user_roles"."is_active" = true)))));


--
-- Name: organizations Platform admin can delete organizations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Platform admin can delete organizations" ON "public"."organizations" FOR DELETE TO "authenticated" USING ("public"."is_platform_admin"());


--
-- Name: organizations Platform admin can update organizations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Platform admin can update organizations" ON "public"."organizations" FOR UPDATE TO "authenticated" USING ((("id" = "public"."auth_user_org_id"()) OR "public"."is_platform_admin"())) WITH CHECK ((("id" = "public"."auth_user_org_id"()) OR "public"."is_platform_admin"()));


--
-- Name: user_roles Platform admin can update user_roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Platform admin can update user_roles" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING ("public"."is_platform_admin"()) WITH CHECK ("public"."is_platform_admin"());


--
-- Name: organizations Super admins and admins can update organizations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Super admins and admins can update organizations" ON "public"."organizations" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "organizations"."id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."org_id" = "organizations"."id") AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("user_roles"."is_active" = true)))));


--
-- Name: notifications System can insert notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can insert notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: tasks Task creators can delete tasks in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Task creators can delete tasks in their org" ON "public"."tasks" FOR DELETE TO "authenticated" USING ((("org_id" = "public"."auth_user_org_id"()) AND ("assigned_by" = "auth"."uid"())));


--
-- Name: team_members Team creators can manage members in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Team creators can manage members in their org" ON "public"."team_members" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" = "public"."auth_user_org_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "team_members"."team_id") AND ("teams"."created_by" = "auth"."uid"()))))));


--
-- Name: task_comments Users can add comments in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can add comments in their org" ON "public"."task_comments" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" = "public"."auth_user_org_id"()) AND ("user_id" = "auth"."uid"())));


--
-- Name: tasks Users can create tasks in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create tasks in their org" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" = "public"."auth_user_org_id"()) AND ("assigned_by" = "auth"."uid"())));


--
-- Name: teams Users can create teams in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create teams in their org" ON "public"."teams" FOR INSERT TO "authenticated" WITH CHECK ((("org_id" = "public"."auth_user_org_id"()) AND ("created_by" = "auth"."uid"())));


--
-- Name: task_attachments Users can delete their attachments in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their attachments in their org" ON "public"."task_attachments" FOR DELETE TO "authenticated" USING ((("org_id" = "public"."auth_user_org_id"()) AND ("uploaded_by" = "auth"."uid"())));


--
-- Name: task_watchers Users can manage watchers in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage watchers in their org" ON "public"."task_watchers" FOR INSERT TO "authenticated" WITH CHECK (("org_id" = "public"."auth_user_org_id"()));


--
-- Name: task_watchers Users can remove watchers in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can remove watchers in their org" ON "public"."task_watchers" FOR DELETE TO "authenticated" USING (("org_id" = "public"."auth_user_org_id"()));


--
-- Name: tasks Users can update tasks in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update tasks in their org" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (((("assigned_to" = "auth"."uid"()) OR ("assigned_by" = "auth"."uid"())) AND (("org_id" = "public"."auth_user_org_id"()) OR ("org_id" IS NULL)))) WITH CHECK ((("org_id" = "public"."auth_user_org_id"()) OR ("org_id" IS NULL)));


--
-- Name: notifications Users can update their notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));


--
-- Name: task_attachments Users can upload attachments in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can upload attachments in their org" ON "public"."task_attachments" FOR INSERT TO "authenticated" WITH CHECK (("org_id" = "public"."auth_user_org_id"()));


--
-- Name: task_attachments Users can view attachments in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view attachments in their org" ON "public"."task_attachments" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."auth_user_org_id"()) OR "public"."is_platform_admin"()));


--
-- Name: task_comments Users can view comments in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view comments in their org" ON "public"."task_comments" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."auth_user_org_id"()) OR "public"."is_platform_admin"()));


--
-- Name: designation_feature_access Users can view designation access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view designation access" ON "public"."designation_feature_access" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."designations" "d"
  WHERE (("d"."id" = "designation_feature_access"."designation_id") AND (("d"."org_id" = "public"."auth_user_org_id"()) OR "public"."is_platform_admin"())))));


--
-- Name: designations Users can view designations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view designations" ON "public"."designations" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."auth_user_org_id"()) OR "public"."is_platform_admin"()));


--
-- Name: organizations Users can view organizations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING ((("id" = "public"."auth_user_org_id"()) OR "public"."is_platform_admin"()));


--
-- Name: profiles Users can view profiles in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view profiles in their org" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND ("org_id" = "public"."auth_user_org_id"())) OR "public"."is_platform_admin"()));


--
-- Name: reporting_hierarchy Users can view reporting hierarchy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view reporting hierarchy" ON "public"."reporting_hierarchy" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."auth_user_org_id"()) OR "public"."is_platform_admin"()));


--
-- Name: user_roles Users can view roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."auth_user_org_id"()) OR ("user_id" = "auth"."uid"()) OR "public"."is_platform_admin"()));


--
-- Name: tasks Users can view tasks in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view tasks in their org" ON "public"."tasks" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."auth_user_org_id"()) OR "public"."is_platform_admin"()));


--
-- Name: team_members Users can view team members in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view team members in their org" ON "public"."team_members" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."auth_user_org_id"()) OR "public"."is_platform_admin"()));


--
-- Name: teams Users can view teams in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view teams in their org" ON "public"."teams" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."auth_user_org_id"()) OR "public"."is_platform_admin"()));


--
-- Name: notifications Users can view their notifications in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their notifications in their org" ON "public"."notifications" FOR SELECT TO "authenticated" USING (((("user_id" = "auth"."uid"()) AND (("org_id" = "public"."auth_user_org_id"()) OR ("org_id" IS NULL))) OR "public"."is_platform_admin"()));


--
-- Name: task_watchers Users can view watchers in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view watchers in their org" ON "public"."task_watchers" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."auth_user_org_id"()) OR "public"."is_platform_admin"()));


--
-- Name: support_tickets admins_read_org_tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins_read_org_tickets" ON "public"."support_tickets" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"public"."app_role") AND ("ur"."is_active" = true) AND ("ur"."org_id" = "support_tickets"."org_id")))));


--
-- Name: designation_feature_access; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."designation_feature_access" ENABLE ROW LEVEL SECURITY;

--
-- Name: designations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."designations" ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_permissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."feature_permissions" ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;

--
-- Name: payments payments_platform_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "payments_platform_admin" ON "public"."payments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'platform_admin'::"public"."app_role") AND ("ur"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'platform_admin'::"public"."app_role") AND ("ur"."is_active" = true)))));


--
-- Name: support_tickets platform_admins_manage_tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "platform_admins_manage_tickets" ON "public"."support_tickets" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."is_platform_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."is_platform_admin" = true)))));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: reporting_hierarchy; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."reporting_hierarchy" ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;

--
-- Name: task_attachments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."task_attachments" ENABLE ROW LEVEL SECURITY;

--
-- Name: task_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;

--
-- Name: task_watchers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."task_watchers" ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;

--
-- Name: team_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;

--
-- Name: teams; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets users_insert_own_tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users_insert_own_tickets" ON "public"."support_tickets" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: support_tickets users_read_own_tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users_read_own_tickets" ON "public"."support_tickets" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

-- CREATE PUBLICATION "supabase_realtime" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

-- CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


-- ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";

--
-- Name: supabase_realtime notifications; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";


--
-- Name: supabase_realtime task_comments; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."task_comments";


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: supabase_admin
--

-- ALTER PUBLICATION "supabase_realtime_messages_publication" ADD TABLE ONLY "realtime"."messages";


--
-- Name: SCHEMA "cron"; Type: ACL; Schema: -; Owner: supabase_admin
--

-- GRANT USAGE ON SCHEMA "cron" TO "postgres" WITH GRANT OPTION;


--
-- Name: SCHEMA "net"; Type: ACL; Schema: -; Owner: supabase_admin
--

-- GRANT USAGE ON SCHEMA "net" TO "supabase_functions_admin";
-- GRANT USAGE ON SCHEMA "net" TO "postgres";
-- GRANT USAGE ON SCHEMA "net" TO "anon";
-- GRANT USAGE ON SCHEMA "net" TO "authenticated";
-- GRANT USAGE ON SCHEMA "net" TO "service_role";


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "alter_job"("job_id" bigint, "schedule" "text", "command" "text", "database" "text", "username" "text", "active" boolean); Type: ACL; Schema: cron; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "cron"."alter_job"("job_id" bigint, "schedule" "text", "command" "text", "database" "text", "username" "text", "active" boolean) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "job_cache_invalidate"(); Type: ACL; Schema: cron; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "cron"."job_cache_invalidate"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "schedule"("schedule" "text", "command" "text"); Type: ACL; Schema: cron; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "cron"."schedule"("schedule" "text", "command" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "schedule"("job_name" "text", "schedule" "text", "command" "text"); Type: ACL; Schema: cron; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "cron"."schedule"("job_name" "text", "schedule" "text", "command" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "schedule_in_database"("job_name" "text", "schedule" "text", "command" "text", "database" "text", "username" "text", "active" boolean); Type: ACL; Schema: cron; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "cron"."schedule_in_database"("job_name" "text", "schedule" "text", "command" "text", "database" "text", "username" "text", "active" boolean) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "unschedule"("job_id" bigint); Type: ACL; Schema: cron; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "cron"."unschedule"("job_id" bigint) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "unschedule"("job_name" "text"); Type: ACL; Schema: cron; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "cron"."unschedule"("job_name" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "armor"("bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."armor"("bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "armor"("bytea", "text"[], "text"[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "dashboard_user";


--
-- Name: FUNCTION "crypt"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."crypt"("text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "dearmor"("text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."dearmor"("text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."digest"("bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."digest"("text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_bytes"(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_uuid"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."gen_random_uuid"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."gen_salt"("text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text", integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."gen_salt"("text", integer) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) TO "dashboard_user";


--
-- Name: FUNCTION "pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_key_id"("bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v1"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1mc"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v3"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v4"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v4"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v5"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_nil"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_nil"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_dns"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_ns_dns"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_oid"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_ns_oid"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_url"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_ns_url"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_x500"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."uuid_ns_x500"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "dashboard_user";


--
-- Name: FUNCTION "auth_user_org_id"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."auth_user_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_user_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_user_org_id"() TO "service_role";


--
-- Name: FUNCTION "auto_generate_task_number"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."auto_generate_task_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_generate_task_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_generate_task_number"() TO "service_role";


--
-- Name: FUNCTION "auto_set_closed_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."auto_set_closed_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_set_closed_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_set_closed_at"() TO "service_role";


--
-- Name: FUNCTION "auto_set_completed_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."auto_set_completed_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_set_completed_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_set_completed_at"() TO "service_role";


--
-- Name: FUNCTION "check_admin_limit"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."check_admin_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_admin_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_admin_limit"() TO "service_role";


--
-- Name: FUNCTION "dispatch_external_notification"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."dispatch_external_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."dispatch_external_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."dispatch_external_notification"() TO "service_role";


--
-- Name: FUNCTION "handle_new_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


--
-- Name: FUNCTION "is_platform_admin"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "service_role";


--
-- Name: FUNCTION "is_platform_admin"("_user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_platform_admin"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_platform_admin"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_platform_admin"("_user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "log_status_change"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."log_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_status_change"() TO "service_role";


--
-- Name: FUNCTION "notify_on_new_comment"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."notify_on_new_comment"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_new_comment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_new_comment"() TO "service_role";


--
-- Name: FUNCTION "notify_on_task_assignment"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."notify_on_task_assignment"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_task_assignment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_task_assignment"() TO "service_role";


--
-- Name: FUNCTION "notify_on_task_update"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."notify_on_task_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_task_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_task_update"() TO "service_role";


--
-- Name: FUNCTION "setup_new_organization"("p_org_name" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."setup_new_organization"("p_org_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."setup_new_organization"("p_org_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_new_organization"("p_org_name" "text") TO "service_role";


--
-- Name: FUNCTION "touch_support_ticket_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."touch_support_ticket_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_support_ticket_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_support_ticket_updated_at"() TO "service_role";


--
-- Name: FUNCTION "update_updated_at_column"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


--
-- Name: FUNCTION "_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea"); Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "service_role";


--
-- Name: FUNCTION "create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: TABLE "job"; Type: ACL; Schema: cron; Owner: supabase_admin
--

-- GRANT SELECT ON TABLE "cron"."job" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "job_run_details"; Type: ACL; Schema: cron; Owner: supabase_admin
--

-- GRANT ALL ON TABLE "cron"."job_run_details" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "pg_stat_statements"; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE "extensions"."pg_stat_statements" FROM "postgres";
-- GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "dashboard_user";


--
-- Name: TABLE "pg_stat_statements_info"; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE "extensions"."pg_stat_statements_info" FROM "postgres";
-- GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "dashboard_user";


--
-- Name: TABLE "designation_feature_access"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."designation_feature_access" TO "anon";
GRANT ALL ON TABLE "public"."designation_feature_access" TO "authenticated";
GRANT ALL ON TABLE "public"."designation_feature_access" TO "service_role";


--
-- Name: TABLE "designations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."designations" TO "anon";
GRANT ALL ON TABLE "public"."designations" TO "authenticated";
GRANT ALL ON TABLE "public"."designations" TO "service_role";


--
-- Name: TABLE "feature_permissions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."feature_permissions" TO "anon";
GRANT ALL ON TABLE "public"."feature_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_permissions" TO "service_role";


--
-- Name: TABLE "notifications"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";


--
-- Name: TABLE "organizations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";


--
-- Name: TABLE "otp_verifications"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."otp_verifications" TO "anon";
GRANT ALL ON TABLE "public"."otp_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."otp_verifications" TO "service_role";


--
-- Name: TABLE "payments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";


--
-- Name: TABLE "profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";


--
-- Name: TABLE "reporting_hierarchy"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."reporting_hierarchy" TO "anon";
GRANT ALL ON TABLE "public"."reporting_hierarchy" TO "authenticated";
GRANT ALL ON TABLE "public"."reporting_hierarchy" TO "service_role";


--
-- Name: TABLE "support_tickets"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";


--
-- Name: TABLE "task_attachments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."task_attachments" TO "anon";
GRANT ALL ON TABLE "public"."task_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_attachments" TO "service_role";


--
-- Name: TABLE "task_comments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";


--
-- Name: TABLE "task_watchers"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."task_watchers" TO "anon";
GRANT ALL ON TABLE "public"."task_watchers" TO "authenticated";
GRANT ALL ON TABLE "public"."task_watchers" TO "service_role";


--
-- Name: TABLE "tasks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";


--
-- Name: TABLE "team_members"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";


--
-- Name: TABLE "teams"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";


--
-- Name: TABLE "user_roles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";


--
-- Name: TABLE "secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."secrets" TO "postgres" WITH GRANT OPTION;
-- GRANT SELECT,DELETE ON TABLE "vault"."secrets" TO "service_role";


--
-- Name: TABLE "decrypted_secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."decrypted_secrets" TO "postgres" WITH GRANT OPTION;
-- GRANT SELECT,DELETE ON TABLE "vault"."decrypted_secrets" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_graphql_placeholder" ON "sql_drop"
--          WHEN TAG IN ('DROP EXTENSION')
--    EXECUTE FUNCTION "extensions"."set_graphql_placeholder"();


-- ALTER EVENT TRIGGER "issue_graphql_placeholder" OWNER TO "supabase_admin";

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_pg_cron_access" ON "ddl_command_end"
--          WHEN TAG IN ('CREATE EXTENSION')
--    EXECUTE FUNCTION "extensions"."grant_pg_cron_access"();


-- ALTER EVENT TRIGGER "issue_pg_cron_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_pg_graphql_access" ON "ddl_command_end"
--          WHEN TAG IN ('CREATE FUNCTION')
--    EXECUTE FUNCTION "extensions"."grant_pg_graphql_access"();


-- ALTER EVENT TRIGGER "issue_pg_graphql_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_pg_net_access" ON "ddl_command_end"
--          WHEN TAG IN ('CREATE EXTENSION')
--    EXECUTE FUNCTION "extensions"."grant_pg_net_access"();


-- ALTER EVENT TRIGGER "issue_pg_net_access" OWNER TO "supabase_admin";

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "pgrst_ddl_watch" ON "ddl_command_end"
--    EXECUTE FUNCTION "extensions"."pgrst_ddl_watch"();


-- ALTER EVENT TRIGGER "pgrst_ddl_watch" OWNER TO "supabase_admin";

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "pgrst_drop_watch" ON "sql_drop"
--    EXECUTE FUNCTION "extensions"."pgrst_drop_watch"();


-- ALTER EVENT TRIGGER "pgrst_drop_watch" OWNER TO "supabase_admin";

--
-- PostgreSQL database dump complete
--

-- \unrestrict eqgehIEwa02Br2tVIkq1ojYUmgc1rracrs9V3Q9zh3ggCXCruoTmyUIMp96Ofep

