--
-- PostgreSQL database dump
--

\restrict EzYSU9X6Pcw7reLSqdanmlvTKnDLqbHrQgaZXwRGB2NDEn3s5BcTN7TmH4cwVQ3

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	c760f546-1879-44d1-8d8e-76ee6f5efc46	authenticated	authenticated	angel@in-sync.co.in	$2a$10$9vtWY6ZXVm..w6RK3Ul5xu794wDrQ9/SD/FPC2.n3fmnZD9PVUEB6	2026-05-15 10:35:14.002028+00	\N		\N		\N			\N	2026-05-15 10:37:05.729214+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Angel Fernandes", "last_name": "Fernandes", "first_name": "Angel", "email_verified": true}	\N	2026-05-15 10:35:13.959238+00	2026-05-16 08:26:58.811894+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	authenticated	authenticated	fmamit@gmail.com	$2a$10$rTWekRTLDCtyGR9VTrjOwOP/ic.0vOKLYGf8MZCnm2uP.98/y7Fkm	2026-03-26 11:20:30.812061+00	\N		\N		\N			\N	2026-04-10 04:44:31.014134+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Amit Patel", "email_verified": true}	\N	2026-03-26 11:20:30.812061+00	2026-04-11 02:18:19.562347+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	e1d4f232-833e-4b75-8ece-1c5a4a185b9a	authenticated	authenticated	insyncclm955@gmail.com	$2a$10$nbt5Iy4dJ6vYVwoQF.OqW..WzNv.SXjrCFhFV7IMmUMUwU35xnVm6	2026-04-15 04:10:30.279178+00	\N		\N		\N			\N	2026-04-15 04:10:32.811565+00	{"provider": "email", "providers": ["email"]}	{"full_name": "In Sync Test", "last_name": "Sync Test", "first_name": "In", "email_verified": true}	\N	2026-04-15 04:10:30.209914+00	2026-04-15 04:10:32.909073+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	authenticated	authenticated	a@in-sync.co.in	$2a$10$TAxzSeNGxXre9BRHPX9YcuW7Rz30jfQPDKIgIU0iMnyi0xFd1/X9a	2026-04-09 03:07:49.935446+00	\N		\N		\N			\N	2026-05-08 07:33:31.497884+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Amit Sengupta", "last_name": "Sengupta", "first_name": "Amit", "email_verified": true}	\N	2026-03-25 16:23:29.980694+00	2026-05-08 07:33:31.57348+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7ae7c50f-cfab-4132-a5f2-a58a21afde20	authenticated	authenticated	echocommunicator@gmail.com	$2a$10$hXLotNwSuuP6h8PB6AzgZObY4r5XcDzILjdV1oha1M6pi687tOKpO	\N	\N	d5c869c687d3d38f9ec188e4b8fac0d8ac198a2e4dc0d6b02b6c1aa5	2026-03-31 03:46:05.478445+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"sub": "7ae7c50f-cfab-4132-a5f2-a58a21afde20", "email": "echocommunicator@gmail.com", "full_name": "In-Sync Demo", "last_name": "Demo", "first_name": "In-Sync", "email_verified": false, "phone_verified": false}	\N	2026-03-31 03:46:05.426319+00	2026-03-31 03:46:08.458311+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	authenticated	authenticated	rahul@in-sync.co.in	$2a$10$xpwjs/UE5DRxWz/qxtLWXOSClwGoONQF3b8Wpbb7Seo1850ySPBUW	2026-03-26 11:20:30.812061+00	\N		\N		\N			\N	2026-04-09 04:26:28.364227+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Rahul Verma", "email_verified": true}	\N	2026-03-26 11:20:30.812061+00	2026-04-09 04:26:28.412133+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	authenticated	authenticated	priya@in-sync.co.in	$2a$10$g7VDhvK0.Glt0WLay4Oxeedg3pGg.UmNK1Xgahr24bh0tuVGz6K.K	2026-03-26 11:20:30.812061+00	\N		\N		\N			\N	2026-05-16 03:19:41.800486+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Priya Sharma", "email_verified": true}	\N	2026-03-26 11:20:30.812061+00	2026-05-16 09:10:52.423265+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	48b86f3d-3861-4dde-8e41-eacbf4bf6409	authenticated	authenticated	amaan.mansuri1005@gmail.com	$2a$10$b4IuykAY10tCppcdySVwYuv0rWBQzW5v4Z6p2J9TuyWjEPrbExttu	2026-04-15 04:06:57.014804+00	\N		\N		\N			\N	2026-04-15 04:06:58.258558+00	{"provider": "email", "providers": ["email"]}	{"full_name": "ABC", "last_name": "", "first_name": "ABC", "email_verified": true}	\N	2026-04-15 04:06:56.989203+00	2026-04-15 04:06:58.284932+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	a93ebec9-95f2-4d95-b96f-3686b84b2cb3	authenticated	authenticated	insyncclm6@gmail.com	$2a$10$OmAHrtTnYMDkK6g7fFZC2u8LsUhJOrVeqC9q0wOCHekNLP.F0Pyim	2026-04-25 03:39:54.781819+00	\N		\N		\N			\N	2026-04-25 03:39:56.10314+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Twat", "last_name": "", "first_name": "Twat", "email_verified": true}	\N	2026-04-25 03:39:54.719657+00	2026-04-25 03:39:56.135581+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7c2da23b-8eb4-49a3-884d-5f62b2521f63	authenticated	authenticated	pinkymansuri1@gmail.com	$2a$10$MiZMcpOBXUkWiA2OAumxW.zGXY8wpz32HXcmJ7UL1kO41P/ZlmPum	2026-04-23 09:56:03.587129+00	\N		\N		\N			\N	2026-04-23 11:02:26.578909+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Pinky Mansuri", "last_name": "Mansuri", "first_name": "Pinky", "email_verified": true}	\N	2026-04-23 09:56:03.554508+00	2026-04-23 11:02:26.60209+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd	authenticated	authenticated	anita.raiofficial1@gmail.com	$2a$10$mgB2jrmJRz93mzGYAUgSFuSxESvYQsT.mz8tHpcP8tKt0352saVoq	2026-04-23 09:55:10.959169+00	\N		\N		\N			\N	2026-04-24 06:31:55.144326+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Kimayra", "last_name": "", "first_name": "Kimayra", "email_verified": true}	\N	2026-04-23 09:55:10.902819+00	2026-05-04 10:33:34.795358+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d771ef94-e2c2-4a3d-bed4-48298e24f0fe	authenticated	authenticated	insyncclm133@gmail.com	$2a$10$dO9fkdbpy//bfjlO2cTIA.zT4T8KQleIUuWk9ho0BOAavdsG.lvTC	2026-04-23 06:59:56.767204+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"full_name": "Test Test", "last_name": "Test", "first_name": "Test", "email_verified": true}	\N	2026-04-23 06:59:56.73214+00	2026-04-23 06:59:56.770822+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	authenticated	authenticated	neha@in-sync.co.in	$2a$06$HZ5IXX/AjGsy.wqrpH8BDuMKpqVNqh4wTEj2NEihPRyesEAu4ZDFa	2026-03-26 11:20:30.812061+00	\N		\N		\N			\N	2026-05-15 12:33:15.870448+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Neha Gupta", "email_verified": true}	\N	2026-03-26 11:20:30.812061+00	2026-05-16 15:10:16.590338+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
d9c04ebe-8e44-4f08-b91e-2640ed6892c8	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	{"sub": "d9c04ebe-8e44-4f08-b91e-2640ed6892c8", "email": "a@in-sync.co.in", "email_verified": false, "phone_verified": false}	email	2026-03-25 16:23:29.987119+00	2026-03-25 16:23:29.987179+00	2026-03-25 16:23:29.987179+00	99b81bf5-53bb-49f7-ab4d-bf205e9362f8
7ae7c50f-cfab-4132-a5f2-a58a21afde20	7ae7c50f-cfab-4132-a5f2-a58a21afde20	{"sub": "7ae7c50f-cfab-4132-a5f2-a58a21afde20", "email": "echocommunicator@gmail.com", "full_name": "In-Sync Demo", "last_name": "Demo", "first_name": "In-Sync", "email_verified": false, "phone_verified": false}	email	2026-03-31 03:46:05.466562+00	2026-03-31 03:46:05.466624+00	2026-03-31 03:46:05.466624+00	c3817270-9753-4bfa-bbce-8b12d2a641e3
fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	{"sub": "fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a", "email": "priya@in-sync.co.in", "email_verified": true, "phone_verified": false}	email	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	2026-04-09 03:24:33.000446+00	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a
fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	{"sub": "fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b", "email": "rahul@in-sync.co.in", "email_verified": true, "phone_verified": false}	email	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	2026-04-09 03:24:33.000446+00	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b
a93ebec9-95f2-4d95-b96f-3686b84b2cb3	a93ebec9-95f2-4d95-b96f-3686b84b2cb3	{"sub": "a93ebec9-95f2-4d95-b96f-3686b84b2cb3", "email": "insyncclm6@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-25 03:39:54.764841+00	2026-04-25 03:39:54.765837+00	2026-04-25 03:39:54.765837+00	e952f347-7e3e-40b1-a2bf-b4364a901a89
fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	{"sub": "fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d", "email": "fmamit@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	2026-04-09 03:24:33.000446+00	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d
48b86f3d-3861-4dde-8e41-eacbf4bf6409	48b86f3d-3861-4dde-8e41-eacbf4bf6409	{"sub": "48b86f3d-3861-4dde-8e41-eacbf4bf6409", "email": "amaan.mansuri1005@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-15 04:06:57.003875+00	2026-04-15 04:06:57.00393+00	2026-04-15 04:06:57.00393+00	9dae6548-1526-4705-ac5e-11464372eb1b
e1d4f232-833e-4b75-8ece-1c5a4a185b9a	e1d4f232-833e-4b75-8ece-1c5a4a185b9a	{"sub": "e1d4f232-833e-4b75-8ece-1c5a4a185b9a", "email": "insyncclm955@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-15 04:10:30.240473+00	2026-04-15 04:10:30.241159+00	2026-04-15 04:10:30.241159+00	5005297e-58bd-46aa-9047-47c145e6e6a6
d771ef94-e2c2-4a3d-bed4-48298e24f0fe	d771ef94-e2c2-4a3d-bed4-48298e24f0fe	{"sub": "d771ef94-e2c2-4a3d-bed4-48298e24f0fe", "email": "insyncclm133@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-23 06:59:56.760564+00	2026-04-23 06:59:56.761265+00	2026-04-23 06:59:56.761265+00	59306da4-90e8-47b7-8974-3a45c8aaf067
9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd	9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd	{"sub": "9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd", "email": "anita.raiofficial1@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-23 09:55:10.940715+00	2026-04-23 09:55:10.940778+00	2026-04-23 09:55:10.940778+00	1716584e-b834-4b89-83c9-5aa755983db5
7c2da23b-8eb4-49a3-884d-5f62b2521f63	7c2da23b-8eb4-49a3-884d-5f62b2521f63	{"sub": "7c2da23b-8eb4-49a3-884d-5f62b2521f63", "email": "pinkymansuri1@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-23 09:56:03.578819+00	2026-04-23 09:56:03.578876+00	2026-04-23 09:56:03.578876+00	3533ddc1-ce7a-40e1-bf43-c4a49e3b7de6
fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	{"sub": "fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c", "email": "neha@in-sync.co.in", "email_verified": false, "phone_verified": false}	email	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	2026-04-09 03:24:33.000446+00	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c
c760f546-1879-44d1-8d8e-76ee6f5efc46	c760f546-1879-44d1-8d8e-76ee6f5efc46	{"sub": "c760f546-1879-44d1-8d8e-76ee6f5efc46", "email": "angel@in-sync.co.in", "email_verified": false, "phone_verified": false}	email	2026-05-15 10:35:13.998297+00	2026-05-15 10:35:13.998365+00	2026-05-15 10:35:13.998365+00	93a7a719-4daf-4175-a723-ceb086b7aa9d
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
e7cf3597-51d3-452d-8556-af8d893d1d67	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	2026-05-15 07:02:51.359311+00	2026-05-16 13:02:44.258887+00	\N	aal1	\N	2026-05-16 13:02:44.258783	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	202.142.89.140	\N	\N	\N	\N	\N
d200afbb-0b2d-49f6-ae00-254272bd49c1	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	2026-05-15 12:33:15.871238+00	2026-05-16 15:10:16.595063+00	\N	aal1	\N	2026-05-16 15:10:16.594972	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36 EdgA/147.0.0.0	202.142.89.251	\N	\N	\N	\N	\N
66f2b04f-c00f-4312-a69b-a95cda45dc00	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	2026-04-09 04:26:28.365139+00	2026-04-09 04:26:28.365139+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	223.190.85.124	\N	\N	\N	\N	\N
0b071f82-a84e-45cb-b71c-228d7dbb7583	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	2026-05-04 10:33:55.343823+00	2026-05-06 03:44:43.078492+00	\N	aal1	\N	2026-05-06 03:44:43.078395	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	106.221.71.61	\N	\N	\N	\N	\N
cc401f29-c551-4ced-b86a-d91698569ae5	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	2026-05-08 07:33:31.500704+00	2026-05-08 07:33:31.500704+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	223.190.80.155	\N	\N	\N	\N	\N
25f9b61b-f755-46c2-b308-d51020d51b87	c760f546-1879-44d1-8d8e-76ee6f5efc46	2026-05-15 10:37:05.733208+00	2026-05-16 08:26:58.817564+00	\N	aal1	\N	2026-05-16 08:26:58.817473	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	106.221.233.175	\N	\N	\N	\N	\N
472b8e3b-8eaa-4de3-ac8b-b266941c956a	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	2026-05-16 03:19:41.800937+00	2026-05-16 09:10:52.432883+00	\N	aal1	\N	2026-05-16 09:10:52.431026	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	223.190.87.21	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
d200afbb-0b2d-49f6-ae00-254272bd49c1	2026-05-15 12:33:15.921048+00	2026-05-15 12:33:15.921048+00	password	587ceb67-92bd-47b1-b39b-1d06f41eea78
472b8e3b-8eaa-4de3-ac8b-b266941c956a	2026-05-16 03:19:41.860017+00	2026-05-16 03:19:41.860017+00	password	28201213-2720-41ef-9e51-eda6aa395f12
66f2b04f-c00f-4312-a69b-a95cda45dc00	2026-04-09 04:26:28.415226+00	2026-04-09 04:26:28.415226+00	password	2c4c0068-a80b-43f7-a503-4c2d3f61891d
0b071f82-a84e-45cb-b71c-228d7dbb7583	2026-05-04 10:33:55.514738+00	2026-05-04 10:33:55.514738+00	password	633f19ca-05ca-43c6-abec-6bb34884a7b6
cc401f29-c551-4ced-b86a-d91698569ae5	2026-05-08 07:33:31.579159+00	2026-05-08 07:33:31.579159+00	password	ee8ba7dc-3b3b-4a75-b791-4d4968124bb1
e7cf3597-51d3-452d-8556-af8d893d1d67	2026-05-15 07:02:51.41407+00	2026-05-15 07:02:51.41407+00	password	4f1e04e4-dbb5-455f-a069-58ca42f99f13
25f9b61b-f755-46c2-b308-d51020d51b87	2026-05-15 10:37:05.774586+00	2026-05-15 10:37:05.774586+00	password	8a78e980-aa76-47b2-b3a5-1f94c2f38972
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
2b4a72b9-038e-45fb-8655-7a62f5a6f528	7ae7c50f-cfab-4132-a5f2-a58a21afde20	confirmation_token	d5c869c687d3d38f9ec188e4b8fac0d8ac198a2e4dc0d6b02b6c1aa5	echocommunicator@gmail.com	2026-03-31 03:46:08.481584	2026-03-31 03:46:08.481584
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
00000000-0000-0000-0000-000000000000	120	kdy5gwmiuzwp	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 05:56:45.157779+00	2026-05-16 07:03:20.668819+00	zrr7fbvk6iku	e7cf3597-51d3-452d-8556-af8d893d1d67
00000000-0000-0000-0000-000000000000	119	72wkjcbhqrvp	c760f546-1879-44d1-8d8e-76ee6f5efc46	t	2026-05-16 05:43:51.562835+00	2026-05-16 08:26:58.77712+00	koq6yftoelcv	25f9b61b-f755-46c2-b308-d51020d51b87
00000000-0000-0000-0000-000000000000	122	xbzwi3xuisms	c760f546-1879-44d1-8d8e-76ee6f5efc46	f	2026-05-16 08:26:58.801+00	2026-05-16 08:26:58.801+00	72wkjcbhqrvp	25f9b61b-f755-46c2-b308-d51020d51b87
00000000-0000-0000-0000-000000000000	121	eowvhynkenvs	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 07:03:20.688415+00	2026-05-16 08:38:53.629288+00	kdy5gwmiuzwp	e7cf3597-51d3-452d-8556-af8d893d1d67
00000000-0000-0000-0000-000000000000	115	euvnlsow3qex	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	t	2026-05-16 03:19:41.830927+00	2026-05-16 09:10:52.397454+00	\N	472b8e3b-8eaa-4de3-ac8b-b266941c956a
00000000-0000-0000-0000-000000000000	124	neo4phmdxspa	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	f	2026-05-16 09:10:52.41143+00	2026-05-16 09:10:52.41143+00	euvnlsow3qex	472b8e3b-8eaa-4de3-ac8b-b266941c956a
00000000-0000-0000-0000-000000000000	116	jb3jdjuw5sjj	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 03:37:32.342565+00	2026-05-16 09:36:35.866747+00	lztw6athtchz	d200afbb-0b2d-49f6-ae00-254272bd49c1
00000000-0000-0000-0000-000000000000	123	652o4zhzmetw	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 08:38:53.647589+00	2026-05-16 10:38:26.398146+00	eowvhynkenvs	e7cf3597-51d3-452d-8556-af8d893d1d67
00000000-0000-0000-0000-000000000000	125	epzmubawcmz5	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 09:36:35.88234+00	2026-05-16 10:42:43.821106+00	jb3jdjuw5sjj	d200afbb-0b2d-49f6-ae00-254272bd49c1
00000000-0000-0000-0000-000000000000	126	d53hsout5aqk	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 10:38:26.416718+00	2026-05-16 11:39:58.182065+00	652o4zhzmetw	e7cf3597-51d3-452d-8556-af8d893d1d67
00000000-0000-0000-0000-000000000000	127	igsmhp7pyo3n	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 10:42:43.828916+00	2026-05-16 11:49:34.813626+00	epzmubawcmz5	d200afbb-0b2d-49f6-ae00-254272bd49c1
00000000-0000-0000-0000-000000000000	128	hye7msfrjqpi	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 11:39:58.200881+00	2026-05-16 13:02:44.229583+00	d53hsout5aqk	e7cf3597-51d3-452d-8556-af8d893d1d67
00000000-0000-0000-0000-000000000000	17	riafzvr2craw	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	f	2026-04-09 04:26:28.391097+00	2026-04-09 04:26:28.391097+00	\N	66f2b04f-c00f-4312-a69b-a95cda45dc00
00000000-0000-0000-0000-000000000000	130	nm7xjz5xhrbn	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	f	2026-05-16 13:02:44.247176+00	2026-05-16 13:02:44.247176+00	hye7msfrjqpi	e7cf3597-51d3-452d-8556-af8d893d1d67
00000000-0000-0000-0000-000000000000	129	lotu7wfznelo	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 11:49:34.856811+00	2026-05-16 13:56:19.210035+00	igsmhp7pyo3n	d200afbb-0b2d-49f6-ae00-254272bd49c1
00000000-0000-0000-0000-000000000000	92	64avrr2ob3ba	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	t	2026-05-04 10:33:55.475955+00	2026-05-04 11:49:03.107272+00	\N	0b071f82-a84e-45cb-b71c-228d7dbb7583
00000000-0000-0000-0000-000000000000	93	ilzd7ghxa2df	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	t	2026-05-04 11:49:03.135009+00	2026-05-06 03:44:43.043593+00	64avrr2ob3ba	0b071f82-a84e-45cb-b71c-228d7dbb7583
00000000-0000-0000-0000-000000000000	94	fvzqyhfw76pb	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	f	2026-05-06 03:44:43.061724+00	2026-05-06 03:44:43.061724+00	ilzd7ghxa2df	0b071f82-a84e-45cb-b71c-228d7dbb7583
00000000-0000-0000-0000-000000000000	95	4z3msutwn7rv	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	f	2026-05-08 07:33:31.54337+00	2026-05-08 07:33:31.54337+00	\N	cc401f29-c551-4ced-b86a-d91698569ae5
00000000-0000-0000-0000-000000000000	131	yvj6a3jytjdf	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 13:56:19.231748+00	2026-05-16 15:10:16.565553+00	lotu7wfznelo	d200afbb-0b2d-49f6-ae00-254272bd49c1
00000000-0000-0000-0000-000000000000	132	24sixjtptxw4	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	f	2026-05-16 15:10:16.581391+00	2026-05-16 15:10:16.581391+00	yvj6a3jytjdf	d200afbb-0b2d-49f6-ae00-254272bd49c1
00000000-0000-0000-0000-000000000000	101	f7ckylxsxell	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-15 07:02:51.39104+00	2026-05-15 08:04:20.050707+00	\N	e7cf3597-51d3-452d-8556-af8d893d1d67
00000000-0000-0000-0000-000000000000	103	5btin2qc3yat	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-15 08:04:20.074597+00	2026-05-15 09:23:09.344717+00	f7ckylxsxell	e7cf3597-51d3-452d-8556-af8d893d1d67
00000000-0000-0000-0000-000000000000	104	z4yadn6a7tmc	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-15 09:23:09.361341+00	2026-05-15 10:42:05.962317+00	5btin2qc3yat	e7cf3597-51d3-452d-8556-af8d893d1d67
00000000-0000-0000-0000-000000000000	108	xx3lrxzehfef	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-15 10:42:05.973619+00	2026-05-15 12:25:06.220161+00	z4yadn6a7tmc	e7cf3597-51d3-452d-8556-af8d893d1d67
00000000-0000-0000-0000-000000000000	111	3cosscj6ll5v	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-15 12:33:15.895875+00	2026-05-15 14:29:59.110974+00	\N	d200afbb-0b2d-49f6-ae00-254272bd49c1
00000000-0000-0000-0000-000000000000	112	jbshrhsloif2	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-15 14:29:59.131754+00	2026-05-15 15:38:38.175165+00	3cosscj6ll5v	d200afbb-0b2d-49f6-ae00-254272bd49c1
00000000-0000-0000-0000-000000000000	113	nm7jwqtmgipy	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-15 15:38:38.209327+00	2026-05-16 00:56:56.717176+00	jbshrhsloif2	d200afbb-0b2d-49f6-ae00-254272bd49c1
00000000-0000-0000-0000-000000000000	114	lztw6athtchz	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 00:56:56.736481+00	2026-05-16 03:37:32.322112+00	nm7jwqtmgipy	d200afbb-0b2d-49f6-ae00-254272bd49c1
00000000-0000-0000-0000-000000000000	110	s7bgolgs6pv7	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-15 12:25:06.232139+00	2026-05-16 03:46:12.558601+00	xx3lrxzehfef	e7cf3597-51d3-452d-8556-af8d893d1d67
00000000-0000-0000-0000-000000000000	117	joc6c7heac27	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 03:46:12.573371+00	2026-05-16 04:47:54.59495+00	s7bgolgs6pv7	e7cf3597-51d3-452d-8556-af8d893d1d67
00000000-0000-0000-0000-000000000000	107	koq6yftoelcv	c760f546-1879-44d1-8d8e-76ee6f5efc46	t	2026-05-15 10:37:05.756649+00	2026-05-16 05:43:51.547146+00	\N	25f9b61b-f755-46c2-b308-d51020d51b87
00000000-0000-0000-0000-000000000000	118	zrr7fbvk6iku	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	t	2026-05-16 04:47:54.612086+00	2026-05-16 05:56:45.131039+00	joc6c7heac27	e7cf3597-51d3-452d-8556-af8d893d1d67
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: job; Type: TABLE DATA; Schema: cron; Owner: supabase_admin
--

COPY "cron"."job" ("jobid", "schedule", "command", "nodename", "nodeport", "database", "username", "active", "jobname") FROM stdin;
1	30 2 * * 1	\n  SELECT net.http_post(\n    url := 'https://seijjmcncrbekngurxxj.supabase.co/functions/v1/send-summary',\n    headers := jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWpqbWNuY3JiZWtuZ3VyeHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDAxODIsImV4cCI6MjA5MDAxNjE4Mn0.N9CPT713v2OUIiES5DIiL6WlDFh-tD3dGo1wZb0ecX4'\n    ),\n    body := '{"period":"weekly"}'::jsonb\n  );\n  	localhost	5432	postgres	postgres	t	weekly-summary
2	30 2 1 * *	\n  SELECT net.http_post(\n    url := 'https://seijjmcncrbekngurxxj.supabase.co/functions/v1/send-summary',\n    headers := jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWpqbWNuY3JiZWtuZ3VyeHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDAxODIsImV4cCI6MjA5MDAxNjE4Mn0.N9CPT713v2OUIiES5DIiL6WlDFh-tD3dGo1wZb0ecX4'\n    ),\n    body := '{"period":"monthly"}'::jsonb\n  );\n  	localhost	5432	postgres	postgres	t	monthly-summary
\.


--
-- Data for Name: job_run_details; Type: TABLE DATA; Schema: cron; Owner: supabase_admin
--

COPY "cron"."job_run_details" ("jobid", "runid", "job_pid", "database", "username", "command", "status", "return_message", "start_time", "end_time") FROM stdin;
1	3	1133161	postgres	postgres	\n  SELECT net.http_post(\n    url := 'https://seijjmcncrbekngurxxj.supabase.co/functions/v1/send-summary',\n    headers := jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWpqbWNuY3JiZWtuZ3VyeHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDAxODIsImV4cCI6MjA5MDAxNjE4Mn0.N9CPT713v2OUIiES5DIiL6WlDFh-tD3dGo1wZb0ecX4'\n    ),\n    body := '{"period":"weekly"}'::jsonb\n  );\n  	succeeded	1 row	2026-04-27 02:30:00.16149+00	2026-04-27 02:30:00.239787+00
1	1	261088	postgres	postgres	\n  SELECT net.http_post(\n    url := 'https://seijjmcncrbekngurxxj.supabase.co/functions/v1/send-summary',\n    headers := jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWpqbWNuY3JiZWtuZ3VyeHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDAxODIsImV4cCI6MjA5MDAxNjE4Mn0.N9CPT713v2OUIiES5DIiL6WlDFh-tD3dGo1wZb0ecX4'\n    ),\n    body := '{"period":"weekly"}'::jsonb\n  );\n  	succeeded	1 row	2026-04-13 02:30:00.119351+00	2026-04-13 02:30:00.160384+00
1	5	2028609	postgres	postgres	\n  SELECT net.http_post(\n    url := 'https://seijjmcncrbekngurxxj.supabase.co/functions/v1/send-summary',\n    headers := jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWpqbWNuY3JiZWtuZ3VyeHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDAxODIsImV4cCI6MjA5MDAxNjE4Mn0.N9CPT713v2OUIiES5DIiL6WlDFh-tD3dGo1wZb0ecX4'\n    ),\n    body := '{"period":"weekly"}'::jsonb\n  );\n  	succeeded	1 row	2026-05-04 02:30:00.115214+00	2026-05-04 02:30:00.170905+00
1	2	687420	postgres	postgres	\n  SELECT net.http_post(\n    url := 'https://seijjmcncrbekngurxxj.supabase.co/functions/v1/send-summary',\n    headers := jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWpqbWNuY3JiZWtuZ3VyeHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDAxODIsImV4cCI6MjA5MDAxNjE4Mn0.N9CPT713v2OUIiES5DIiL6WlDFh-tD3dGo1wZb0ecX4'\n    ),\n    body := '{"period":"weekly"}'::jsonb\n  );\n  	succeeded	1 row	2026-04-20 02:30:00.129171+00	2026-04-20 02:30:00.186441+00
2	4	1645138	postgres	postgres	\n  SELECT net.http_post(\n    url := 'https://seijjmcncrbekngurxxj.supabase.co/functions/v1/send-summary',\n    headers := jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWpqbWNuY3JiZWtuZ3VyeHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDAxODIsImV4cCI6MjA5MDAxNjE4Mn0.N9CPT713v2OUIiES5DIiL6WlDFh-tD3dGo1wZb0ecX4'\n    ),\n    body := '{"period":"monthly"}'::jsonb\n  );\n  	succeeded	1 row	2026-05-01 02:30:00.175974+00	2026-05-01 02:30:00.248604+00
1	6	2922291	postgres	postgres	\n  SELECT net.http_post(\n    url := 'https://seijjmcncrbekngurxxj.supabase.co/functions/v1/send-summary',\n    headers := jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWpqbWNuY3JiZWtuZ3VyeHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDAxODIsImV4cCI6MjA5MDAxNjE4Mn0.N9CPT713v2OUIiES5DIiL6WlDFh-tD3dGo1wZb0ecX4'\n    ),\n    body := '{"period":"weekly"}'::jsonb\n  );\n  	succeeded	1 row	2026-05-11 02:30:00.111625+00	2026-05-11 02:30:00.17042+00
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."organizations" ("id", "name", "logo_url", "created_at", "updated_at", "plan", "trial_ends_at") FROM stdin;
a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	In-Sync Demo	\N	2026-03-26 11:20:30.812061+00	2026-05-08 07:33:51.021284+00	trial	2027-05-08 07:33:50.586+00
\.


--
-- Data for Name: designations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."designations" ("id", "org_id", "name", "description", "role", "is_active", "created_at", "updated_at") FROM stdin;
de510001-0001-4000-a000-000000000001	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	CEO	Chief Executive Officer	admin	t	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00
de510001-0001-4000-a000-000000000002	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	Sales Head	Head of Sales	sales_manager	t	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00
de510001-0001-4000-a000-000000000003	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	Sales Executive	Sales Team Member	sales_agent	t	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00
de510001-0001-4000-a000-000000000004	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	Support Head	Head of Support	support_manager	t	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00
de510001-0001-4000-a000-000000000005	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	Support Executive	Support Team Member	support_agent	t	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00
\.


--
-- Data for Name: designation_feature_access; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."designation_feature_access" ("id", "designation_id", "org_id", "feature_key", "can_view", "can_create", "can_edit", "can_delete", "custom_permissions", "created_at") FROM stdin;
\.


--
-- Data for Name: feature_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."feature_permissions" ("id", "feature_key", "feature_name", "feature_description", "category", "is_premium", "created_at") FROM stdin;
1315f6d9-de01-4d10-be58-fe5cd557b306	tasks	Tasks	\N	Task Management	f	2026-03-25 15:35:47.899659+00
efb722c8-4d14-4ce8-b2e2-7c39f9bffe19	task_create	Create Tasks	\N	Task Management	f	2026-03-25 15:35:47.899659+00
fdcd2482-d82b-407e-b4a8-39c097832c08	task_assign	Assign Tasks	\N	Task Management	f	2026-03-25 15:35:47.899659+00
b8f84f83-7f2e-4d4e-b22d-68c4e73e9e72	task_close	Close/Verify Tasks	\N	Task Management	f	2026-03-25 15:35:47.899659+00
164f5774-7353-4e5b-8e40-fa420f9c54ab	task_delete	Delete Tasks	\N	Task Management	f	2026-03-25 15:35:47.899659+00
bceb874e-f47d-4484-add8-5f7a04231c15	subtasks	Subtasks	\N	Task Management	f	2026-03-25 15:35:47.899659+00
1e87b7c6-6d91-43ef-8edd-eabaeafed7e8	comments	Comments	\N	Collaboration	f	2026-03-25 15:35:47.899659+00
3307f48d-3dd0-4848-8168-28aee761d590	attachments	Attachments	\N	Collaboration	f	2026-03-25 15:35:47.899659+00
75760400-fc7c-4167-b55b-c20c37d4d893	dashboard	Dashboard	\N	Analytics	f	2026-03-25 15:35:47.899659+00
933be7a2-930d-4ad3-8731-d52a513b55fb	reports	Reports & Analytics	\N	Analytics	f	2026-03-25 15:35:47.899659+00
898652cd-e8af-4f0e-aaa8-d4a45e1d4d9b	users	User Management	\N	Administration	f	2026-03-25 15:35:47.899659+00
a0234332-c340-46eb-8f70-8336b34b2bb0	designations	Designations	\N	Administration	f	2026-03-25 15:35:47.899659+00
cfc4bc13-2b68-4ce5-9be0-f06a3584d336	access_management	Access Management	\N	Administration	f	2026-03-25 15:35:47.899659+00
cf82bd2d-c028-406a-9735-08d91f11066c	teams	Team Management	\N	Administration	f	2026-03-25 15:35:47.899659+00
bedc10d5-ac5d-4c4c-aca4-1332df7b7fff	notifications	Notifications	\N	System	f	2026-03-25 15:35:47.899659+00
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."profiles" ("id", "full_name", "email", "avatar_url", "phone", "created_at", "updated_at", "org_id", "first_name", "last_name", "designation_id", "is_platform_admin", "is_active", "onboarding_completed", "department") FROM stdin;
fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	Priya Sharma	priya@in-sync.co.in	\N	\N	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	Priya	Sharma	de510001-0001-4000-a000-000000000002	f	t	t	\N
fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	Rahul Verma	rahul@in-sync.co.in	\N	\N	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	Rahul	Verma	de510001-0001-4000-a000-000000000003	f	t	t	\N
fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	Amit Patel	fmamit@gmail.com	\N	7738919680	2026-03-26 11:20:30.812061+00	2026-04-10 04:53:46.784333+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	Amit	Patel	de510001-0001-4000-a000-000000000005	f	t	t	\N
7ae7c50f-cfab-4132-a5f2-a58a21afde20	In-Sync Demo	echocommunicator@gmail.com	\N	\N	2026-04-15 04:42:18.57979+00	2026-04-15 04:42:18.57979+00	\N	In-Sync	Demo	\N	f	t	f	\N
a93ebec9-95f2-4d95-b96f-3686b84b2cb3	Twat	insyncclm6@gmail.com	\N	7738919680	2026-04-25 03:39:54.718933+00	2026-05-04 11:54:00.906203+00	\N	Twat		\N	f	t	t	\N
9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd	Kimayra	anita.raiofficial1@gmail.com	\N	9033888423	2026-04-23 09:55:10.901712+00	2026-05-04 11:54:29.818967+00	\N	Kimayra		\N	f	t	t	\N
7c2da23b-8eb4-49a3-884d-5f62b2521f63	Pinky Mansuri	pinkymansuri1@gmail.com	\N	1234567890	2026-04-23 09:56:03.553365+00	2026-05-04 11:54:29.818967+00	\N	Pinky	Mansuri	\N	f	t	f	\N
d771ef94-e2c2-4a3d-bed4-48298e24f0fe	Test Test	insyncclm133@gmail.com	\N	9090909090	2026-04-23 06:59:56.731178+00	2026-05-04 11:54:41.00672+00	\N	Test	Test	\N	f	t	f	Sales
e1d4f232-833e-4b75-8ece-1c5a4a185b9a	In Sync Test	insyncclm955@gmail.com	\N	\N	2026-04-15 04:34:19.631112+00	2026-05-04 11:55:09.752533+00	\N	In	Sync Test	\N	f	t	t	\N
48b86f3d-3861-4dde-8e41-eacbf4bf6409	ABC	amaan.mansuri1005@gmail.com	\N	\N	2026-04-15 04:42:18.57979+00	2026-05-04 11:55:19.804189+00	\N	ABC		\N	f	t	t	\N
d9c04ebe-8e44-4f08-b91e-2640ed6892c8	Amit Sengupta	a@in-sync.co.in	\N	\N	2026-03-25 16:24:09.382676+00	2026-05-15 06:24:10.359549+00	\N	Amit	Sengupta	\N	t	t	t	\N
fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Neha Patway	neha@in-sync.co.in	\N	7370800938	2026-03-26 11:20:30.812061+00	2026-05-15 07:09:21.945986+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	Neha	Patway	de510001-0001-4000-a000-000000000004	f	t	t	Sales
c760f546-1879-44d1-8d8e-76ee6f5efc46	Angel Fernandes	angel@in-sync.co.in	\N	7042540030	2026-05-15 10:35:13.958343+00	2026-05-15 10:35:14.356792+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	Angel	Fernandes	\N	f	t	f	Sales
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."tasks" ("id", "task_number", "task_name", "description", "assigned_to", "assigned_by", "parent_task_id", "due_date", "start_date", "status", "priority", "tags", "estimated_hours", "actual_hours", "completion_notes", "completion_percentage", "closed_at", "closed_by", "closure_reason", "completed_at", "restart_reason", "restarted_at", "restarted_by", "created_at", "updated_at", "org_id", "closure_rating") FROM stdin;
caed810c-2b0f-491e-beec-5014fd9a1528	TASK-0001	Set up CRM integration	Connect Salesforce CRM with internal tools	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-03-21	2026-03-11 00:00:00+00	completed	high	{crm,integration}	16	14	\N	100	\N	\N	\N	2026-03-20 11:20:30.812061+00	\N	\N	\N	2026-03-06 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
9a8bb5a0-4840-4a16-bfe9-5bb3dd987f41	TASK-0002	Design Q1 sales report template	Create reusable report template for quarterly review	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-03-16	2026-03-08 00:00:00+00	completed	medium	{reports,sales}	8	7	\N	100	\N	\N	\N	2026-03-15 11:20:30.812061+00	\N	\N	\N	2026-03-05 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
a1b6ceab-6ede-4953-9a9a-9e96a54f242d	TASK-0003	Client onboarding Tata Motors	Complete onboarding checklist for Tata Motors	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	\N	2026-03-23	2026-03-16 00:00:00+00	completed	high	{onboarding,client}	12	10	\N	100	\N	\N	\N	2026-03-22 11:20:30.812061+00	\N	\N	\N	2026-03-12 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
aab55882-aa08-4bee-84e0-e3aaee974948	TASK-0004	Update knowledge base articles	Refresh support KB with latest product changes	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-03-19	2026-03-12 00:00:00+00	completed	medium	{docs,support}	10	9	\N	100	\N	\N	\N	2026-03-18 11:20:30.812061+00	\N	\N	\N	2026-03-08 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
20be8560-be8d-41c0-b613-b121310880ae	TASK-0005	Fix ticket auto-assignment bug	Auto-assignment not working for priority tickets	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	\N	2026-03-24	2026-03-21 00:00:00+00	completed	urgent	{bug,automation}	4	3	\N	100	\N	\N	\N	2026-03-23 11:20:30.812061+00	\N	\N	\N	2026-03-19 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
03d3b190-5415-4c0a-8bd3-9077a66ed08c	TASK-0006	Prepare investor deck	Updated pitch deck with Q4 numbers	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-03-14	2026-03-06 00:00:00+00	completed	high	{strategy,investors}	20	18	\N	100	\N	\N	\N	2026-03-13 11:20:30.812061+00	\N	\N	\N	2026-03-01 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
3b8cfbfd-f560-465b-8fd1-40e8bf29485b	TASK-0007	Configure email templates	Set up transactional email templates in SendGrid	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	\N	2026-03-18	2026-03-14 00:00:00+00	completed	low	{email,config}	6	5	\N	100	\N	\N	\N	2026-03-17 11:20:30.812061+00	\N	\N	\N	2026-03-11 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
2c468e70-0d30-4c69-873b-3a6601753159	TASK-0008	Sales team training new CRM	Train sales team on new CRM features	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-03-25	2026-03-19 00:00:00+00	completed	medium	{training,sales}	8	8	\N	100	\N	\N	\N	2026-03-24 11:20:30.812061+00	\N	\N	\N	2026-03-16 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
c6d2730e-ac61-44a3-af50-1bd33795c921	TASK-0009	Build partner referral dashboard	Dashboard to track partner referral commissions	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	\N	2026-03-31	2026-03-23 00:00:00+00	in_progress	high	{dashboard,partners}	24	\N	\N	45	\N	\N	\N	\N	\N	\N	\N	2026-03-21 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
031814eb-4122-47d4-a0f7-a3688fa7d056	TASK-0010	Migrate support tickets to new DB	Move 50k+ tickets from legacy MySQL to PostgreSQL	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-04-05	2026-03-21 00:00:00+00	in_progress	high	{migration,database}	40	\N	\N	30	\N	\N	\N	\N	\N	\N	\N	2026-03-18 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
4a531b08-51a0-44b8-95e1-a7ccd575d2ac	TASK-0011	Implement SLA monitoring alerts	Real-time alerts when SLA breach is imminent	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	\N	2026-04-02	2026-03-24 00:00:00+00	in_progress	urgent	{sla,monitoring}	16	\N	\N	20	\N	\N	\N	\N	\N	\N	\N	2026-03-22 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
e963c101-9168-4035-bffc-a385599f9152	TASK-0012	Revamp pricing page	New pricing page with comparison table and FAQ	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-03-29	2026-03-22 00:00:00+00	in_progress	medium	{marketing,website}	12	\N	\N	60	\N	\N	\N	\N	\N	\N	\N	2026-03-20 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
138a67e4-ff42-4042-be61-edd220ff63c1	TASK-0013	Lead scoring model v2	Improve lead scoring with engagement data signals	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-04-09	2026-03-25 00:00:00+00	in_progress	medium	{analytics,sales}	20	\N	\N	15	\N	\N	\N	\N	\N	\N	\N	2026-03-23 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
546f5891-f59c-4531-ae29-d9f370e9ab2a	TASK-0014	Customer satisfaction survey setup	Configure post-resolution CSAT survey flow	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-03-30	2026-03-24 00:00:00+00	in_progress	low	{survey,customer}	8	\N	\N	40	\N	\N	\N	\N	\N	\N	\N	2026-03-23 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
2dc8acbb-5ff7-4016-bd19-e854f6166e7e	TASK-0015	API rate limiting implementation	Implement token-bucket rate limiter for public APIs	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	\N	2026-04-07	\N	pending	high	{api,security}	16	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-03-25 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
af053a6a-f945-45d4-ae78-27ebf2fca31d	TASK-0016	Quarterly business review prep	Prepare QBR deck and data for board meeting	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-04-15	\N	pending	medium	{strategy,review}	12	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-03-24 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
d690583f-40a2-4d29-b8b5-c76e15e65d0c	TASK-0017	Automate invoice generation	Auto-generate invoices from closed deals	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	\N	2026-04-10	\N	pending	medium	{automation,billing}	20	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-03-25 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
d20327c9-6d00-471b-9d58-3415de800b1a	TASK-0037	task	\N	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	\N	2026-05-16	\N	pending	medium	{}	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-05-16 05:27:26.131016+00	2026-05-16 05:27:26.131016+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
a7d390cc-0191-49c0-8a8b-2eec85202ce7	TASK-0019	Set up staging environment	Mirror production env for testing	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-04-01	\N	pending	high	{devops,infra}	8	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-03-24 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
344310a1-5d56-44bb-b42d-023a9de1bfa4	TASK-0020	Onboard new support agents	Training plan and access for 3 new hires	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-04-13	\N	pending	medium	{hr,training}	14	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
70366d05-0336-4b19-8b09-ac2974e47c63	TASK-0021	Draft partnership agreement	Legal review template for channel partnerships	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-04-20	\N	pending	low	{legal,partnerships}	6	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-03-26 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
0678bd92-9adc-499d-be26-69241b663be0	TASK-0022	Fix payment gateway timeout	Razorpay gateway timing out on high-value transactions	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	\N	2026-03-23	2026-03-19 00:00:00+00	in_progress	urgent	{bug,payments}	8	\N	\N	50	\N	\N	\N	\N	\N	\N	\N	2026-03-16 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
8bca4acb-0b2c-42fc-ba41-98f51eaa14cf	TASK-0023	Submit compliance audit report	GDPR compliance audit due for EU clients	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-03-21	2026-03-14 00:00:00+00	in_progress	high	{compliance,legal}	16	\N	\N	70	\N	\N	\N	\N	\N	\N	\N	2026-03-11 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
74f443a2-cdf4-40bc-b783-f6c1edc0328e	TASK-0024	Resolve escalated ticket 4782	Enterprise client data export failing, escalated	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	\N	2026-03-24	\N	pending	urgent	{escalation,support}	4	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-03-22 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
6cb233bc-a6d7-4451-b099-e19b9a0b9656	TASK-0025	Follow up with Infosys lead	Decision maker meeting follow-up overdue	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	\N	2026-03-22	\N	pending	high	{sales,follow-up}	2	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-03-18 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
b498539a-279c-467e-9d18-07296eba7244	TASK-0026	Legacy dashboard deprecation	Remove old dashboard, superseded by new Command Center	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-03-16	\N	cancelled	low	{cleanup,legacy}	8	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-03-06 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
750dbd87-1b2a-41eb-9bcc-775d16f054cd	TASK-0027	Print brochure design	Physical brochures cancelled, going fully digital	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-03-11	\N	cancelled	low	{marketing,print}	12	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-03-01 11:20:30.812061+00	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
37547910-dde8-4215-b4c4-40782b238c3b	TASK-0018	Competitive analysis March	Update competitive landscape for Q1 strategy	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	2026-04-03	2026-04-10 04:28:33.683+00	in_progress	low	{research,strategy}	10	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-03-23 11:20:30.812061+00	2026-04-10 04:28:35.188315+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
6dccff28-242c-42fe-8b3a-7655f96a8d9f	TASK-0028	test	test	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	\N	2026-04-03	2026-04-10 04:00:22.719085+00	closed	medium	{}	\N	\N	It is done	100	2026-04-10 04:34:28.176003+00	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	Done. \n\nSatisfaction: 5/5 stars	2026-04-10 04:34:02.128519+00	\N	\N	\N	2026-04-10 03:48:42.84903+00	2026-04-10 04:34:28.176003+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
ce319407-188a-46e9-8a4f-d89dda0a1545	TASK-0029	Test	test	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	\N	2026-04-17	2026-04-10 04:44:40.269+00	in_progress	medium	{}	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-04-10 04:43:58.385854+00	2026-04-10 04:44:41.723405+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
49f5eb0b-a184-4a13-9f8f-16cc5353af46	TASK-0030	Test	\N	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	\N	2026-04-16	\N	pending	medium	{}	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-04-15 06:56:17.825076+00	2026-04-15 06:56:17.825076+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
b3d025c2-a03d-4e9a-b24f-5bfc36c43851	TASK-0036	crm status update	\N	c760f546-1879-44d1-8d8e-76ee6f5efc46	c760f546-1879-44d1-8d8e-76ee6f5efc46	c4d14920-2382-4d1b-a6b6-f43e0e42bc8b	2026-05-21	2026-05-15 11:00:32.38+00	closed	medium	{}	\N	\N	done	100	2026-05-15 11:03:19.098109+00	c760f546-1879-44d1-8d8e-76ee6f5efc46	all follow ups are completed\n\nSatisfaction: 5/5 stars	2026-05-15 11:01:55.15216+00	\N	\N	\N	2026-05-15 10:58:27.641581+00	2026-05-15 11:03:19.098109+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
c4d14920-2382-4d1b-a6b6-f43e0e42bc8b	TASK-0035	lead calling	call customers and collect required information	c760f546-1879-44d1-8d8e-76ee6f5efc46	c760f546-1879-44d1-8d8e-76ee6f5efc46	\N	2026-05-21	2026-05-15 10:56:38.575+00	closed	medium	{}	\N	\N	completed	100	2026-05-15 11:05:09.822006+00	\N	\N	2026-05-15 11:04:46.264923+00	\N	\N	\N	2026-05-15 10:53:44.173942+00	2026-05-15 11:05:09.822006+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
24d41c5b-70ba-4fb2-bdd2-c6cfd3eb6bef	TASK-0034	Follow up	\N	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	\N	2026-05-15	2026-05-15 10:57:02.751+00	closed	urgent	{}	\N	\N	Done 	100	2026-05-16 00:58:17.007288+00	\N	\N	2026-05-16 00:57:33.241615+00	Miscommunication	2026-05-15 10:54:36.072+00	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	2026-05-15 10:53:33.116419+00	2026-05-16 00:58:17.007288+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
942904ed-c913-4cac-a2fc-4a38ef6c54f7	TASK-0031	Script Complition	\N	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	\N	2026-05-15	2026-05-15 07:08:15.66+00	closed	medium	{}	\N	\N	work done	100	2026-05-15 07:09:30.008969+00	\N	\N	2026-05-15 07:08:42.874661+00	\N	\N	\N	2026-05-15 07:04:46.241892+00	2026-05-15 07:09:30.008969+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
e92e2889-ceeb-4062-b4be-bf8c81f24f8f	TASK-0032	Test	Test	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	\N	2026-05-15	2026-05-15 07:14:45.29+00	completed	urgent	{}	\N	\N	Work Done	100	\N	\N	\N	2026-05-15 10:51:59.372341+00	\N	\N	\N	2026-05-15 07:12:45.232465+00	2026-05-15 10:51:59.372341+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
0f3157d2-5719-4447-a66e-d43ebea55f09	TASK-0033	Client follow up	\N	c760f546-1879-44d1-8d8e-76ee6f5efc46	c760f546-1879-44d1-8d8e-76ee6f5efc46	\N	2026-05-18	2026-05-15 10:49:31.681+00	closed	high	{}	\N	\N	Client follow up completed and crm updated	100	2026-05-15 10:52:22.712429+00	\N	\N	2026-05-15 10:51:12.207215+00	\N	\N	\N	2026-05-15 10:49:02.037705+00	2026-05-15 10:52:22.712429+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."notifications" ("id", "user_id", "notification_type", "title", "message", "task_id", "is_read", "created_at", "org_id") FROM stdin;
e0318f0f-c391-434b-8469-d89694ed8c7a	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	task_assignment	New Task Assigned	You have been assigned task TASK-0001: Set up CRM integration	caed810c-2b0f-491e-beec-5014fd9a1528	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
c7a0e934-aba1-4101-b7a1-e7fd6f073e8d	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	task_assignment	New Task Assigned	You have been assigned task TASK-0002: Design Q1 sales report template	9a8bb5a0-4840-4a16-bfe9-5bb3dd987f41	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
7feecedb-fe09-4322-af30-ebd4ba15c111	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	task_assignment	New Task Assigned	You have been assigned task TASK-0003: Client onboarding Tata Motors	a1b6ceab-6ede-4953-9a9a-9e96a54f242d	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
c0092897-6f6d-45e0-9952-442476a2c274	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	task_assignment	New Task Assigned	You have been assigned task TASK-0004: Update knowledge base articles	aab55882-aa08-4bee-84e0-e3aaee974948	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
8cc11ab0-95ba-45f4-8020-e80702dde118	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	task_assignment	New Task Assigned	You have been assigned task TASK-0005: Fix ticket auto-assignment bug	20be8560-be8d-41c0-b613-b121310880ae	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
9e223185-4029-4564-9406-e1931ae98301	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	task_assignment	New Task Assigned	You have been assigned task TASK-0006: Prepare investor deck	03d3b190-5415-4c0a-8bd3-9077a66ed08c	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
8b270659-93c8-458d-be63-6295db4dbb11	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	task_assignment	New Task Assigned	You have been assigned task TASK-0007: Configure email templates	3b8cfbfd-f560-465b-8fd1-40e8bf29485b	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
4fbc1bd1-c725-44d7-bc1d-b156dc2e47ce	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	task_assignment	New Task Assigned	You have been assigned task TASK-0008: Sales team training new CRM	2c468e70-0d30-4c69-873b-3a6601753159	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
625cec9f-05d6-42a3-be49-85c2941515d7	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	task_assignment	New Task Assigned	You have been assigned task TASK-0009: Build partner referral dashboard	c6d2730e-ac61-44a3-af50-1bd33795c921	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
ea5eb43f-244f-4b62-88db-6bb4fbf94248	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	task_assignment	New Task Assigned	You have been assigned task TASK-0010: Migrate support tickets to new DB	031814eb-4122-47d4-a0f7-a3688fa7d056	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
842b96d7-f24f-4a28-9eb7-644b539924c8	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	task_assignment	New Task Assigned	You have been assigned task TASK-0011: Implement SLA monitoring alerts	4a531b08-51a0-44b8-95e1-a7ccd575d2ac	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
874c500e-ac20-430b-9478-6d957b7976b2	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	task_assignment	New Task Assigned	You have been assigned task TASK-0012: Revamp pricing page	e963c101-9168-4035-bffc-a385599f9152	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
6c0422e6-5235-4105-bed0-e05db4ce4c14	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	task_assignment	New Task Assigned	You have been assigned task TASK-0013: Lead scoring model v2	138a67e4-ff42-4042-be61-edd220ff63c1	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
8116b97f-5db9-44fd-9b43-6aacf6cd13ab	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	task_assignment	New Task Assigned	You have been assigned task TASK-0014: Customer satisfaction survey setup	546f5891-f59c-4531-ae29-d9f370e9ab2a	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
8f72c3b8-9abf-4589-8bd4-d4e96defc733	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	task_assignment	New Task Assigned	You have been assigned task TASK-0015: API rate limiting implementation	2dc8acbb-5ff7-4016-bd19-e854f6166e7e	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
d4d99dd3-5269-4b07-8861-877d05b8f0c7	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	task_assignment	New Task Assigned	You have been assigned task TASK-0016: Quarterly business review prep	af053a6a-f945-45d4-ae78-27ebf2fca31d	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
6620fd2a-879d-4159-8fb5-0e14f033e049	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	task_assignment	New Task Assigned	You have been assigned task TASK-0017: Automate invoice generation	d690583f-40a2-4d29-b8b5-c76e15e65d0c	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
ad99f798-56c1-48e0-9c28-1b756a39b4c1	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	task_assignment	New Task Assigned	You have been assigned task TASK-0018: Competitive analysis March	37547910-dde8-4215-b4c4-40782b238c3b	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
76c32ac5-e909-40b3-8ebd-07724a7fe270	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	task_assignment	New Task Assigned	You have been assigned task TASK-0019: Set up staging environment	a7d390cc-0191-49c0-8a8b-2eec85202ce7	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
20331c2f-6df7-439b-9ef0-7bf5fea4bd5e	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	task_assignment	New Task Assigned	You have been assigned task TASK-0020: Onboard new support agents	344310a1-5d56-44bb-b42d-023a9de1bfa4	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
205374eb-2c20-4aa0-af93-12c21421152b	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	task_assignment	New Task Assigned	You have been assigned task TASK-0021: Draft partnership agreement	70366d05-0336-4b19-8b09-ac2974e47c63	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
e0c08d3a-527c-4a5a-aa56-137dcd184851	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	task_assignment	New Task Assigned	You have been assigned task TASK-0022: Fix payment gateway timeout	0678bd92-9adc-499d-be26-69241b663be0	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
0db3c453-2eef-42fe-a2d8-77a5ca3a5e42	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	task_assignment	New Task Assigned	You have been assigned task TASK-0023: Submit compliance audit report	8bca4acb-0b2c-42fc-ba41-98f51eaa14cf	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
156c7d49-e29d-4c46-bb8c-e13aea99de40	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	task_assignment	New Task Assigned	You have been assigned task TASK-0024: Resolve escalated ticket 4782	74f443a2-cdf4-40bc-b783-f6c1edc0328e	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
366a2631-b2fd-42d8-93f9-cbdd73b0475e	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	task_assignment	New Task Assigned	You have been assigned task TASK-0025: Follow up with Infosys lead	6cb233bc-a6d7-4451-b099-e19b9a0b9656	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
6b5d9748-e6c4-4f0c-8f97-5dc2eb8290b8	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	task_assignment	New Task Assigned	You have been assigned task TASK-0026: Legacy dashboard deprecation	b498539a-279c-467e-9d18-07296eba7244	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
3c50e20a-0c9e-4643-8045-2189ce1687a4	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	task_assignment	New Task Assigned	You have been assigned task TASK-0027: Print brochure design	750dbd87-1b2a-41eb-9bcc-775d16f054cd	f	2026-03-26 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
551af4b9-e6ea-423f-81a5-f783a1784ae3	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	task_assignment	New Task Assigned	You have been assigned task TASK-0028: test	6dccff28-242c-42fe-8b3a-7655f96a8d9f	f	2026-04-10 03:48:42.84903+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
4d636060-9b66-4226-a867-cbf659a77c4e	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	status_change	test — status updated	Status changed from pending to in progress	6dccff28-242c-42fe-8b3a-7655f96a8d9f	f	2026-04-10 04:00:22.719085+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
f3f69f02-7806-413f-a980-a920f8724513	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	status_change	Competitive analysis March — status updated	Status changed from pending to in progress	37547910-dde8-4215-b4c4-40782b238c3b	f	2026-04-10 04:28:35.188315+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
02f34768-0976-449b-a2b4-4a4d67819563	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	status_change	Competitive analysis March — status updated	Priya Sharma changed status from pending to in progress	37547910-dde8-4215-b4c4-40782b238c3b	f	2026-04-10 04:28:35.188315+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
f326b44f-4ba9-41f7-9e10-8a11afdd1de8	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	status_change	test — status updated	Status changed from in progress to completed	6dccff28-242c-42fe-8b3a-7655f96a8d9f	f	2026-04-10 04:34:02.128519+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
304c7878-cd66-4a1d-b447-e0bd5a30368e	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	status_change	test — status updated	Status changed from completed to closed	6dccff28-242c-42fe-8b3a-7655f96a8d9f	f	2026-04-10 04:34:28.176003+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
8e81ff02-609b-498e-89fa-95a75323d9ca	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	task_assignment	New Task Assigned	You have been assigned task TASK-0029: Test	ce319407-188a-46e9-8a4f-d89dda0a1545	f	2026-04-10 04:43:58.385854+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
4d4c5236-060e-4b8f-9ea1-a3413ad807d3	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	status_change	Test — status updated	Amit Patel changed status from pending to in progress	ce319407-188a-46e9-8a4f-d89dda0a1545	f	2026-04-10 04:44:41.723405+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
e0893217-8bc5-492c-a391-783661883e0f	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	task_assignment	New Task Assigned	You have been assigned task TASK-0030: Test	49f5eb0b-a184-4a13-9f8f-16cc5353af46	f	2026-04-15 06:56:17.825076+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
05cf3fdf-4cbe-4823-9c1a-a6be8c396e47	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	task_assignment	New Task Assigned	You have been assigned task TASK-0031: Script Complition	942904ed-c913-4cac-a2fc-4a38ef6c54f7	f	2026-05-15 07:04:46.241892+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
e732ea67-4b4b-453f-824a-e421c9ba726a	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	task_assignment	New Task Assigned	You have been assigned task TASK-0032: Test	e92e2889-ceeb-4062-b4be-bf8c81f24f8f	f	2026-05-15 07:12:45.232465+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
c79c9592-86b8-4b6d-8d8f-e8dd68e17491	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	status_change	Test — status updated	Neha Patway changed status from pending to in progress	e92e2889-ceeb-4062-b4be-bf8c81f24f8f	f	2026-05-15 07:14:46.510488+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
91bc6aba-6ebe-494d-a075-4c3eab112cd1	c760f546-1879-44d1-8d8e-76ee6f5efc46	task_assignment	New Task Assigned	You have been assigned task TASK-0033: Client follow up	0f3157d2-5719-4447-a66e-d43ebea55f09	f	2026-05-15 10:49:02.037705+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
6ab7f21e-a9ac-4153-b2e6-d027d8669d8b	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	status_change	Test — status updated	Neha Patway changed status from in progress to completed	e92e2889-ceeb-4062-b4be-bf8c81f24f8f	f	2026-05-15 10:51:59.372341+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
cd437b61-0e1f-4c37-867f-397ddca6d53c	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	task_assignment	New Task Assigned	You have been assigned task TASK-0034: Follow up	24d41c5b-70ba-4fb2-bdd2-c6cfd3eb6bef	f	2026-05-15 10:53:33.116419+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
b4e5562e-aa91-4a8e-a030-99306fae85bb	c760f546-1879-44d1-8d8e-76ee6f5efc46	task_assignment	New Task Assigned	You have been assigned task TASK-0035: lead calling	c4d14920-2382-4d1b-a6b6-f43e0e42bc8b	f	2026-05-15 10:53:44.173942+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
5ace6385-e212-4dc5-ab62-e09a4ea2640c	c760f546-1879-44d1-8d8e-76ee6f5efc46	task_assignment	New Task Assigned	You have been assigned task TASK-0036: crm status update	b3d025c2-a03d-4e9a-b24f-5bfc36c43851	f	2026-05-15 10:58:27.641581+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
5e8b690a-e617-43ee-8e89-20e635b33e3d	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	task_assignment	New Task Assigned	You have been assigned task TASK-0037: task	d20327c9-6d00-471b-9d58-3415de800b1a	f	2026-05-16 05:27:26.131016+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
\.


--
-- Data for Name: otp_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."otp_verifications" ("id", "email", "phone", "email_otp", "phone_otp", "expires_at", "created_at") FROM stdin;
c450b1f4-7985-4948-9f46-437b82d9ad95	test@gmail.com	9033888423	420928	473714	2026-04-11 07:14:12.467817+00	2026-04-11 07:04:12.467817+00
df524ed8-97aa-4e7c-a59f-ab519e62070c	a@in-sync.co.in	917738919680	544586	798013	2026-05-15 06:32:30.16858+00	2026-05-15 06:22:30.16858+00
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."payments" ("id", "org_id", "amount", "currency", "method", "reference_no", "notes", "plan_target", "recorded_by", "created_at") FROM stdin;
\.


--
-- Data for Name: reporting_hierarchy; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."reporting_hierarchy" ("id", "org_id", "designation_id", "reports_to_designation_id", "created_at") FROM stdin;
6406a431-9fd7-4ea0-bf3f-2d8fe3dd73bd	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	de510001-0001-4000-a000-000000000002	de510001-0001-4000-a000-000000000001	2026-03-26 11:20:30.812061+00
d6ac3500-98d8-40e1-bc83-78eaeb004aa5	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	de510001-0001-4000-a000-000000000003	de510001-0001-4000-a000-000000000002	2026-03-26 11:20:30.812061+00
f1cfc1de-ec54-490d-8eb5-8f293e026744	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	de510001-0001-4000-a000-000000000004	de510001-0001-4000-a000-000000000001	2026-03-26 11:20:30.812061+00
7a23e08d-83ba-42cb-b896-70db6c2d35fd	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	de510001-0001-4000-a000-000000000005	de510001-0001-4000-a000-000000000004	2026-03-26 11:20:30.812061+00
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."support_tickets" ("id", "org_id", "user_id", "user_email", "user_name", "subject", "description", "category", "priority", "status", "page_url", "user_agent", "created_at", "updated_at", "attachments") FROM stdin;
\.


--
-- Data for Name: task_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."task_attachments" ("id", "task_id", "file_path", "file_name", "file_size", "file_type", "attachment_type", "uploaded_by", "uploaded_at", "org_id") FROM stdin;
\.


--
-- Data for Name: task_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."task_comments" ("id", "task_id", "user_id", "comment", "comment_type", "metadata", "created_at", "org_id") FROM stdin;
19ee15fe-bef2-4ee9-b47f-88e69d3b8a95	c6d2730e-ac61-44a3-af50-1bd33795c921	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	Great progress on this. Lets aim to close it by EOD.	comment	\N	2026-03-24 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
d5b02278-1c51-48dc-910d-930562b64de7	031814eb-4122-47d4-a0f7-a3688fa7d056	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Migration script tested on 10k records. Moving to full batch now.	comment	\N	2026-03-25 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
8e6b2555-bc73-472c-a60c-80ce3f98adc0	0678bd92-9adc-499d-be26-69241b663be0	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	Root cause identified: connection pool exhaustion under load. Fix in progress.	comment	\N	2026-03-25 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
2e883f56-03d3-4954-89a3-0045dd44274f	8bca4acb-0b2c-42fc-ba41-98f51eaa14cf	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	This is blocking the EU expansion. Please prioritize.	comment	\N	2026-03-23 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
6aeb7611-5ce9-4534-82b5-1ba0f8de07a9	6cb233bc-a6d7-4451-b099-e19b9a0b9656	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	Rahul, the Infosys VP is expecting a call. Please schedule ASAP.	comment	\N	2026-03-25 11:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
d632702d-a9c9-432b-bb7e-56b3c36745b4	6cb233bc-a6d7-4451-b099-e19b9a0b9656	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	Apologies, was tied up with the Tata onboarding. Will call today.	comment	\N	2026-03-25 23:20:30.812061+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
6098fae6-df60-4e66-9ba3-6b81cac10677	6dccff28-242c-42fe-8b3a-7655f96a8d9f	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	Status changed from pending to in_progress	system	{"new_status": "in_progress", "old_status": "pending"}	2026-04-10 04:00:22.719085+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
1217fe6d-b5e1-4575-836c-a1911cda6a98	37547910-dde8-4215-b4c4-40782b238c3b	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	Status changed from pending to in_progress	system	{"new_status": "in_progress", "old_status": "pending"}	2026-04-10 04:28:35.188315+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
ca54c742-809d-41fe-8265-f2f9046933ba	6dccff28-242c-42fe-8b3a-7655f96a8d9f	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	Status changed from in_progress to completed	system	{"new_status": "completed", "old_status": "in_progress"}	2026-04-10 04:34:02.128519+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
9ede5bf0-3ac9-4579-a025-31daf0bcdd09	6dccff28-242c-42fe-8b3a-7655f96a8d9f	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	Status changed from completed to closed	system	{"new_status": "closed", "old_status": "completed"}	2026-04-10 04:34:28.176003+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
4d131e9b-3662-4e67-8f87-be07e9e777d9	ce319407-188a-46e9-8a4f-d89dda0a1545	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	Status changed from pending to in_progress	system	{"new_status": "in_progress", "old_status": "pending"}	2026-04-10 04:44:41.723405+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
3f591cc1-e6ed-429d-93f1-06d1000dbb40	942904ed-c913-4cac-a2fc-4a38ef6c54f7	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from pending to in_progress	system	{"new_status": "in_progress", "old_status": "pending"}	2026-05-15 07:06:52.691203+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
8f28c738-a153-45b0-9ab1-470b1fcdb6d9	942904ed-c913-4cac-a2fc-4a38ef6c54f7	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from in_progress to cancelled	system	{"new_status": "cancelled", "old_status": "in_progress"}	2026-05-15 07:07:47.915994+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
b086b79b-6a60-4bfe-b4b2-74cdcf3d0adf	942904ed-c913-4cac-a2fc-4a38ef6c54f7	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from cancelled to pending	system	{"new_status": "pending", "old_status": "cancelled"}	2026-05-15 07:08:09.910707+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
f5d34d08-0620-4933-b3b9-3aec552e2e9f	942904ed-c913-4cac-a2fc-4a38ef6c54f7	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from pending to in_progress	system	{"new_status": "in_progress", "old_status": "pending"}	2026-05-15 07:08:16.0743+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
bb412a54-e013-4915-9d22-731cb9fef309	942904ed-c913-4cac-a2fc-4a38ef6c54f7	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from in_progress to completed	system	{"new_status": "completed", "old_status": "in_progress"}	2026-05-15 07:08:42.874661+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
5eb4c524-5bf6-4f2e-96f9-b3b8a069e2b1	942904ed-c913-4cac-a2fc-4a38ef6c54f7	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from completed to closed	system	{"new_status": "closed", "old_status": "completed"}	2026-05-15 07:09:30.008969+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
95509a46-99bf-4f9e-8411-4af4049fbf41	e92e2889-ceeb-4062-b4be-bf8c81f24f8f	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from pending to in_progress	system	{"new_status": "in_progress", "old_status": "pending"}	2026-05-15 07:14:46.510488+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
376cb4a9-f52d-4055-ba50-87bf370e6f8a	0f3157d2-5719-4447-a66e-d43ebea55f09	c760f546-1879-44d1-8d8e-76ee6f5efc46	Status changed from pending to in_progress	system	{"new_status": "in_progress", "old_status": "pending"}	2026-05-15 10:49:40.671987+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
d25fe24a-cab4-4a30-b87a-605bb350a708	0f3157d2-5719-4447-a66e-d43ebea55f09	c760f546-1879-44d1-8d8e-76ee6f5efc46	Status changed from in_progress to completed	system	{"new_status": "completed", "old_status": "in_progress"}	2026-05-15 10:51:12.207215+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
6396c06f-9db6-4faa-a631-0839127c56dd	e92e2889-ceeb-4062-b4be-bf8c81f24f8f	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from in_progress to completed	system	{"new_status": "completed", "old_status": "in_progress"}	2026-05-15 10:51:59.372341+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
79848f8b-e5e3-4030-a4eb-228e7e16854d	0f3157d2-5719-4447-a66e-d43ebea55f09	c760f546-1879-44d1-8d8e-76ee6f5efc46	Status changed from completed to closed	system	{"new_status": "closed", "old_status": "completed"}	2026-05-15 10:52:22.712429+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
cc94708e-a117-4e90-b920-93217881682c	24d41c5b-70ba-4fb2-bdd2-c6cfd3eb6bef	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from pending to in_progress	system	{"new_status": "in_progress", "old_status": "pending"}	2026-05-15 10:53:36.814638+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
b3c4adc9-28d8-497b-b7bf-32b6f02260f6	24d41c5b-70ba-4fb2-bdd2-c6cfd3eb6bef	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from in_progress to completed	system	{"new_status": "completed", "old_status": "in_progress"}	2026-05-15 10:53:45.59834+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
d90b68e2-2ad8-48ea-8205-47798f4e1e93	c4d14920-2382-4d1b-a6b6-f43e0e42bc8b	c760f546-1879-44d1-8d8e-76ee6f5efc46	Status changed from pending to cancelled	system	{"new_status": "cancelled", "old_status": "pending"}	2026-05-15 10:54:10.28184+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
fc972d55-404e-4eba-bfd1-80ae730bc6df	24d41c5b-70ba-4fb2-bdd2-c6cfd3eb6bef	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from completed to pending	system	{"new_status": "pending", "old_status": "completed"}	2026-05-15 10:54:36.642493+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
def160e1-4335-4a27-9b31-266ee694c08e	24d41c5b-70ba-4fb2-bdd2-c6cfd3eb6bef	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from pending to cancelled	system	{"new_status": "cancelled", "old_status": "pending"}	2026-05-15 10:54:40.586492+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
36afb7f5-a7aa-4b07-87be-7f86c7fa5468	24d41c5b-70ba-4fb2-bdd2-c6cfd3eb6bef	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from cancelled to pending	system	{"new_status": "pending", "old_status": "cancelled"}	2026-05-15 10:55:24.609691+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
f637e155-774b-4829-aebe-01783a3863b7	c4d14920-2382-4d1b-a6b6-f43e0e42bc8b	c760f546-1879-44d1-8d8e-76ee6f5efc46	Status changed from cancelled to pending	system	{"new_status": "pending", "old_status": "cancelled"}	2026-05-15 10:55:47.555667+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
793dcbff-fa67-4e86-8c89-4e3aa9fb2072	c4d14920-2382-4d1b-a6b6-f43e0e42bc8b	c760f546-1879-44d1-8d8e-76ee6f5efc46	Status changed from pending to in_progress	system	{"new_status": "in_progress", "old_status": "pending"}	2026-05-15 10:56:47.464587+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
13da7c0c-962f-4b4d-bf0d-218f4a0956c5	24d41c5b-70ba-4fb2-bdd2-c6cfd3eb6bef	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from pending to in_progress	system	{"new_status": "in_progress", "old_status": "pending"}	2026-05-15 10:57:03.044654+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
5b790395-799e-4d30-a894-ce745316fe97	b3d025c2-a03d-4e9a-b24f-5bfc36c43851	c760f546-1879-44d1-8d8e-76ee6f5efc46	Status changed from pending to in_progress	system	{"new_status": "in_progress", "old_status": "pending"}	2026-05-15 11:00:41.034684+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
3a287129-b890-4d29-8d4a-b85c313faa83	b3d025c2-a03d-4e9a-b24f-5bfc36c43851	c760f546-1879-44d1-8d8e-76ee6f5efc46	Status changed from in_progress to completed	system	{"new_status": "completed", "old_status": "in_progress"}	2026-05-15 11:01:55.15216+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
c897c54c-f0fb-4124-a336-96d05d2a0e21	b3d025c2-a03d-4e9a-b24f-5bfc36c43851	c760f546-1879-44d1-8d8e-76ee6f5efc46	Status changed from completed to closed	system	{"new_status": "closed", "old_status": "completed"}	2026-05-15 11:03:19.098109+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
b4dc5583-b51c-4b81-8f21-9fcfb43fab29	c4d14920-2382-4d1b-a6b6-f43e0e42bc8b	c760f546-1879-44d1-8d8e-76ee6f5efc46	Status changed from in_progress to completed	system	{"new_status": "completed", "old_status": "in_progress"}	2026-05-15 11:04:46.264923+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
0da0e45b-9452-4ea1-8fcf-d1a26b6b21ed	c4d14920-2382-4d1b-a6b6-f43e0e42bc8b	c760f546-1879-44d1-8d8e-76ee6f5efc46	Status changed from completed to closed	system	{"new_status": "closed", "old_status": "completed"}	2026-05-15 11:05:09.822006+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
62af4a89-01da-4c32-94e5-8cf88ec0ed26	24d41c5b-70ba-4fb2-bdd2-c6cfd3eb6bef	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from in_progress to completed	system	{"new_status": "completed", "old_status": "in_progress"}	2026-05-16 00:57:33.241615+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
3653e939-732c-4e74-b5b2-90455e89dc7e	24d41c5b-70ba-4fb2-bdd2-c6cfd3eb6bef	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	Status changed from completed to closed	system	{"new_status": "closed", "old_status": "completed"}	2026-05-16 00:58:17.007288+00	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
\.


--
-- Data for Name: task_watchers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."task_watchers" ("id", "task_id", "user_id", "org_id") FROM stdin;
3820da89-9851-43dd-aed4-601cfb55ce35	caed810c-2b0f-491e-beec-5014fd9a1528	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
0c13dd07-b423-4abf-8278-c0992a10416a	9a8bb5a0-4840-4a16-bfe9-5bb3dd987f41	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
d827b38a-c0cb-4337-8b09-6ba22fbc7cba	a1b6ceab-6ede-4953-9a9a-9e96a54f242d	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
37850ec8-b0a9-44d3-afdf-7c8600445872	aab55882-aa08-4bee-84e0-e3aaee974948	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
38ccdabc-d9b1-4ebd-8cc7-ff9fa558b6c6	20be8560-be8d-41c0-b613-b121310880ae	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
e98fbbdd-7c53-4d4e-b570-5c8dd15f7d42	03d3b190-5415-4c0a-8bd3-9077a66ed08c	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
dea55240-b827-4c40-9140-7067d057a616	3b8cfbfd-f560-465b-8fd1-40e8bf29485b	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
cecdbe6f-6d94-4600-8a97-05fe143d1f3b	2c468e70-0d30-4c69-873b-3a6601753159	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
bf4d6f39-93f8-495c-8898-2ca639a756da	c6d2730e-ac61-44a3-af50-1bd33795c921	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
065f38e1-ef47-4428-aa8a-f8793f237547	031814eb-4122-47d4-a0f7-a3688fa7d056	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
e907d581-0ae2-4e53-bc7c-50641b420e9a	4a531b08-51a0-44b8-95e1-a7ccd575d2ac	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
57706bd9-2104-4bac-9716-f63f9edc0aa7	e963c101-9168-4035-bffc-a385599f9152	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
f6835c40-a7e0-43a2-8ffb-371e8d45e24d	138a67e4-ff42-4042-be61-edd220ff63c1	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
99a9cb68-7bc0-41e5-b856-3ccc22297fc4	546f5891-f59c-4531-ae29-d9f370e9ab2a	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
49da7f99-5d3e-4dcc-987e-e41dc11b8b29	2dc8acbb-5ff7-4016-bd19-e854f6166e7e	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
d9bcdf16-9046-4a48-bfe9-193608c57eaf	af053a6a-f945-45d4-ae78-27ebf2fca31d	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
49ec68c2-3ec1-4ad5-9a6e-c09801ea4490	d690583f-40a2-4d29-b8b5-c76e15e65d0c	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
2fbd3096-ebeb-449e-a5db-931cbf3d9038	37547910-dde8-4215-b4c4-40782b238c3b	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
0bf6fae8-e776-4f4f-90a2-6a4f69d4c37f	a7d390cc-0191-49c0-8a8b-2eec85202ce7	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
22c74b51-7f72-4f86-aa72-43111546e792	344310a1-5d56-44bb-b42d-023a9de1bfa4	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
359a8cd8-6b21-4c16-9bf5-da1aeff16760	70366d05-0336-4b19-8b09-ac2974e47c63	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
bd4ad40b-ad52-4374-8ae4-44381716a421	0678bd92-9adc-499d-be26-69241b663be0	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
99568822-6227-40a9-b8ef-4a1269d4d97e	8bca4acb-0b2c-42fc-ba41-98f51eaa14cf	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
a88199c7-e95c-4c36-a193-2b5ea233381b	74f443a2-cdf4-40bc-b783-f6c1edc0328e	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
98ba1c59-7174-447a-88f3-77f03bef4232	6cb233bc-a6d7-4451-b099-e19b9a0b9656	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
d0236345-5fc1-4c6a-a031-00389af00345	b498539a-279c-467e-9d18-07296eba7244	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
44ff6c92-2e08-48c1-9458-c0e9db25afd1	750dbd87-1b2a-41eb-9bcc-775d16f054cd	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
dc0da380-ce76-4162-b619-7f084f6d3e61	6dccff28-242c-42fe-8b3a-7655f96a8d9f	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
4f336ecc-acce-4f3e-b7bb-e5f6ef6df528	ce319407-188a-46e9-8a4f-d89dda0a1545	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
0ee3714a-28f1-41fb-9012-7f41b231fb8b	49f5eb0b-a184-4a13-9f8f-16cc5353af46	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
d0c8e4a3-c9bd-494c-86e3-8d02a810389e	942904ed-c913-4cac-a2fc-4a38ef6c54f7	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
d224e1cb-5619-4dae-908e-2c7143612c62	e92e2889-ceeb-4062-b4be-bf8c81f24f8f	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
22ea46b0-0891-4b7e-bceb-b1cba4014436	0f3157d2-5719-4447-a66e-d43ebea55f09	c760f546-1879-44d1-8d8e-76ee6f5efc46	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
06819bb3-da52-4c72-b155-68e2cc2ff108	24d41c5b-70ba-4fb2-bdd2-c6cfd3eb6bef	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
a976620c-0d12-4936-a0dc-e0ade9b698ca	c4d14920-2382-4d1b-a6b6-f43e0e42bc8b	c760f546-1879-44d1-8d8e-76ee6f5efc46	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
5d7b7561-164c-4823-80e2-972e77547c49	b3d025c2-a03d-4e9a-b24f-5bfc36c43851	c760f546-1879-44d1-8d8e-76ee6f5efc46	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
306c779b-3283-4129-b260-80530d67f6b1	d20327c9-6d00-471b-9d58-3415de800b1a	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."teams" ("id", "name", "description", "created_by", "created_at", "org_id") FROM stdin;
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."team_members" ("id", "team_id", "user_id", "role", "joined_at", "org_id") FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_roles" ("id", "user_id", "org_id", "role", "is_active", "created_at") FROM stdin;
258d92f6-e6da-484f-a0d0-c9f342ca998f	fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	support_agent	t	2026-03-26 11:20:30.812061+00
32f77d33-841e-4ad6-ac63-f14f559f77be	d9c04ebe-8e44-4f08-b91e-2640ed6892c8	\N	platform_admin	t	2026-03-26 13:42:49.600055+00
8cb5cac6-bcc0-4a84-98f4-3b87e5fa2f52	fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	admin	t	2026-03-26 11:20:30.812061+00
6bff32b9-0918-4aef-bd8c-60af9d96580a	fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	sales_agent	f	2026-03-26 11:20:30.812061+00
89648004-b777-423d-9805-81148ee73a90	fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	sales_agent	t	2026-03-26 11:20:30.812061+00
c06ab775-c996-43ec-91aa-a522b44992aa	c760f546-1879-44d1-8d8e-76ee6f5efc46	a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d	sales_agent	t	2026-05-15 10:35:14.614672+00
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
task-attachments	task-attachments	\N	2026-03-25 15:35:51.907876+00	2026-03-25 15:35:51.907876+00	f	f	\N	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_vectors" ("id", "type", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
50d2162b-dacf-4304-acb0-5291f1db3794	task-attachments	tasks/90478365-2baa-4fb3-b1c9-9c33e5d19405/general/1776940187519_Screenshot 2026-04-23 154858.jpg	9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd	2026-04-23 10:29:48.016183+00	2026-04-23 10:29:48.016183+00	2026-04-23 10:29:48.016183+00	{"eTag": "\\"35c87a70fcc39214736f5e297426941e\\"", "size": 64562, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-23T10:29:48.000Z", "contentLength": 64562, "httpStatusCode": 200}	d0f1d9e8-5d14-4ce2-a470-c8512c4f110f	9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd	{}
883d4f36-8fb7-42ec-87ea-21f5999a2996	task-attachments	tasks/90478365-2baa-4fb3-b1c9-9c33e5d19405/general/1776940253810_Screenshot 2026-04-23 154858.jpg	9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd	2026-04-23 10:30:54.842645+00	2026-04-23 10:30:54.842645+00	2026-04-23 10:30:54.842645+00	{"eTag": "\\"35c87a70fcc39214736f5e297426941e\\"", "size": 64562, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-23T10:30:55.000Z", "contentLength": 64562, "httpStatusCode": 200}	51edde9c-2d3c-4da1-8bdd-914170b2e323	9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd	{}
f76fd1e3-8ba3-4fdd-8730-0a166e86c50c	task-attachments	tasks/90478365-2baa-4fb3-b1c9-9c33e5d19405/general/1776940505004_Screenshot 2026-04-23 160110.jpg	9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd	2026-04-23 10:35:05.510941+00	2026-04-23 10:35:05.510941+00	2026-04-23 10:35:05.510941+00	{"eTag": "\\"f13443931631cd274281026779251bf6\\"", "size": 81314, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-23T10:35:06.000Z", "contentLength": 81314, "httpStatusCode": 200}	1c7fe8c7-26d2-4c39-8497-1a0feb44ba59	9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd	{}
1f79af61-23b6-40bb-b162-10d9593587da	task-attachments	tasks/90478365-2baa-4fb3-b1c9-9c33e5d19405/general/1776940946455_Screenshot 2026-04-23 160110.jpg	9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd	2026-04-23 10:42:27.398286+00	2026-04-23 10:42:27.398286+00	2026-04-23 10:42:27.398286+00	{"eTag": "\\"f13443931631cd274281026779251bf6\\"", "size": 81314, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-23T10:42:28.000Z", "contentLength": 81314, "httpStatusCode": 200}	c4b321ab-6fa1-4f02-b800-fc6e4a04b844	9c68ccf4-d44c-4c9b-b3ca-c726f1fef9dd	{}
61d9ed71-ab7d-4a4c-bfd3-2adb8053bd1e	task-attachments	tasks/90478365-2baa-4fb3-b1c9-9c33e5d19405/completion/1776942354596_Screenshot 2026-04-23 161335.png	7c2da23b-8eb4-49a3-884d-5f62b2521f63	2026-04-23 11:05:55.350876+00	2026-04-23 11:05:55.350876+00	2026-04-23 11:05:55.350876+00	{"eTag": "\\"c00054f15d6af28e5b8f84c07005046b\\"", "size": 53735, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-23T11:05:56.000Z", "contentLength": 53735, "httpStatusCode": 200}	bde42d53-7b40-4650-ae12-30a037c2ad90	7c2da23b-8eb4-49a3-884d-5f62b2521f63	{}
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata", "metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."vector_indexes" ("id", "name", "bucket_id", "data_type", "dimension", "distance_metric", "metadata_configuration", "created_at", "updated_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 132, true);


--
-- Name: jobid_seq; Type: SEQUENCE SET; Schema: cron; Owner: supabase_admin
--

SELECT pg_catalog.setval('"cron"."jobid_seq"', 2, true);


--
-- Name: runid_seq; Type: SEQUENCE SET; Schema: cron; Owner: supabase_admin
--

SELECT pg_catalog.setval('"cron"."runid_seq"', 6, true);


--
-- PostgreSQL database dump complete
--

\unrestrict EzYSU9X6Pcw7reLSqdanmlvTKnDLqbHrQgaZXwRGB2NDEn3s5BcTN7TmH4cwVQ3

