#!/bin/bash

npx serve -s build -l 3000 &
DISPLAY=:0 chromium-browser http://localhost:3000 --start-fullscreen --kiosk
