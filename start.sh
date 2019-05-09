#!/bin/bash

serve -s build &
chromium-browser http://localhost:5000 --start-fullscreen