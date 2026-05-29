SET session_replication_role = replica;
\i 'C:/Users/Admin/work/migration/dumps/data_clean.sql'
RESET session_replication_role;
