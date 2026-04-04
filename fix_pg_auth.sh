#!/bin/bash
sed -i 's/scram-sha-256/md5/g' /var/lib/postgresql/data/pg_hba.conf
psql -U postgres -c "ALTER SYSTEM SET password_encryption = 'md5';"
psql -U postgres -c "SELECT pg_reload_conf();"
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'mmdriver_dev_pass';"
echo "DONE"
