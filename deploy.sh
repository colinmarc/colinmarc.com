#!/bin/sh

ssh nessus "sudo rm -rvf /var/www/*"
tar cz *.html *.jpg | ssh nessus "sudo tar xvz --no-same-owner -C /var/www"
