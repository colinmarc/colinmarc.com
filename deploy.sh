#!/bin/sh

ssh nessus "sudo rm -rvf /var/www/*"
files=$(find . -name "*.js" -or -name "*.html" -or -name "*.css" -or -name "*.woff*" -or -name "*.jpg")
tar cz $files | ssh nessus "sudo tar xvz --no-same-owner -C /var/www"
