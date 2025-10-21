# redis
do this once
`sudo service redis-server status`
do this so that it runs in background, you can close the terminal:
`redis-server --daemonize yes`
# celery
`celery -A config worker --loglevel=info`
