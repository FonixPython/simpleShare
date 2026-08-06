#!/bin/sh
set -e

check_db() {
    mariadb -h "$DATABASE_HOST" -P "$DATABASE_PORT" -u "$DATABASE_USER" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" -e "show tables;" | wc -l
}

migrate() {
    npx prisma migrate deploy
}

seed() {
    npx prisma db seed
}

start() {
    exec node dist/server.js
}

DB_EXISTS=$(check_db)
migrate
[ "$DB_EXISTS" -eq "0" ] && seed
start
