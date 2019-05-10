#!/bin/bash

serve -s build -l 3000 &
chromium-browser http://localhost:3000 --start-fullscreen