#!/bin/bash

task=$1

ENVIRONMENT=${ENVIRONMENT:-production}
NAME=${NAME:-scanner}
DATA='{"text": "Scanner '${NAME}' is starting on '${ENVIRONMENT}'", "username": "bot", "icon_emoji": "robot_face", "channel": "#crypto"}'

shift

case $task in

    blocks)
        if [ ! -z "$SLACK_WEBHOOK" ]; then
            echo "Notify about the application is starting."
            curl -X POST -H 'Content-type: application/json' --data "${DATA}" ${SLACK_WEBHOOK}
        fi

        echo "Start Worker Blocks"
        /usr/local/bin/node /app/scanner/worker-blocks.js

    ;;

    contracts)
        if [ ! -z "$SLACK_WEBHOOK" ]; then
            echo "Notify about the application is starting."
            curl -X POST -H 'Content-type: application/json' --data "${DATA}" ${SLACK_WEBHOOK}
        fi

        echo "Start Worker Contracts"
        /usr/local/bin/node /app/scanner/worker-contracts.js

    ;;

    *)
        if [ ! -z "$SLACK_WEBHOOK" ]; then
            echo "Notify about the application is starting."
            curl -X POST -H 'Content-type: application/json' --data "${DATA}" ${SLACK_WEBHOOK}
        fi

        echo "Start application"
        /usr/local/bin/node /app/scanner/app.js

    ;;

esac
