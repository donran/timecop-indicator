#!/bin/sh -e

#export G_MESSAGES_DEBUG=all
export MUTTER_DEBUG_DUMMY_MODE_SPECS=1920x1080
export GNOME_SHELL_SLOWDOWN_FACTOR=2
#export SHELL_DEBUG=all

dbus-run-session -- \
    gnome-shell --nested \
                --wayland 2>&1 #| grep -Po '(?<=\[TIMECOP_INDICATOR_LOG_START\]).*?(?=\[TIMECOP_INDICATOR_LOG_END\])' 
