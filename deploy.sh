#!/bin/sh
rm -rf /var/www/blackleg-isolates-map/*
cp -r * /var/www/blackleg-isolates-map
systemctl reload nginx
echo "deploy complete"
