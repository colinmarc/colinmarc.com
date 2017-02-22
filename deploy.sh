#!/bin/sh

ssh nessus "sudo rm -rvf /var/www/*"
tar cz $(find . -name "*.js" -or -name "*.html" -or -name "*.jpg") | ssh nessus "sudo tar xvz --no-same-owner -C /var/www"
