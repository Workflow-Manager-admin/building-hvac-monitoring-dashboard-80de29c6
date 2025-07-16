#!/bin/bash
cd /home/kavia/workspace/code-generation/building-hvac-monitoring-dashboard-80de29c6/hvac_dashboard_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

