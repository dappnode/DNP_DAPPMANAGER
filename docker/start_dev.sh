#!/bin/bash

ln -s /app/packages/admin-ui/build/ /app/packages/dappmanager/dist
ln -s /usr/src/app/dnp_repo/ /app/packages/dappmanager
ln -s /usr/src/app/DNCORE/ /app/packages/dappmanager

tmux new-session -d -s dev 'cd /app/packages/dappmanager;yarn dev'
tmux split-window;
tmux send 'cd /app/packages/admin-ui;yarn dev' ENTER;

while true
do
	echo "Press [CTRL+C] to stop.."
	sleep 1000
done