SELECT 'CREATE DATABASE inventory'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'inventory')\gexec

SELECT 'CREATE DATABASE fulfillment'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fulfillment')\gexec
