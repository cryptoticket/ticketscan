#!/bin/bash

task=$1
ENVIRONMENT=${ENVIRONMENT:-production}
DATA='{"text": "Scanner is starting on '${ENVIRONMENT}'", "username": "bot", "icon_emoji": "robot_face", "channel": "#crypto"}'

shift

case $task in

    *)
        if [ ! -z "$SLACK_WEBHOOK" ]; then
            echo "Notify about the application is starting."
            curl -X POST -H 'Content-type: application/json' --data "${DATA}" ${SLACK_WEBHOOK}
        fi

        echo "Start application"
        /usr/local/bin/node /app/scanner/app.js

    ;;

esac

