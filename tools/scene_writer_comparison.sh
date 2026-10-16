#!/usr/bin/env bash
# D-166: the scene-writer comparison on gps-position b08-b18 (the slices gps-slice-<arm>, made by `py -m loom slice`).
# Sonnet leads every arm; only the scene authors, clip authors and fixers change (presets scenes-<model>). One arm at a
# time, so each arm's wall time is its own; each stops once P9 is accepted (--until P9) or at its budget cap.
# Kshitij approved about $25 in all (2026-10-12): the caps below sum to $25.
set -u
cd "$(dirname "$0")/.."
WHO="agent, unattended per Kshitij (scene-writer comparison, D-166)"
run_arm() {   # slice preset cap
  echo "== $1 ($2, cap \$$3) started $(date +%H:%M:%S)"
  py -m loom shuttle run "$1" --runner loom --mode api --preset "$2" --budget "$3" --until P9 --approve-as "$WHO"
  echo "== $1 exit $? at $(date +%H:%M:%S)"
}
run_arm gps-slice-luna   scenes-gpt-6-luna        2.5
run_arm gps-slice-flash  scenes-gemini-3.8-flash  3.5
run_arm gps-slice-sonnet scenes-sonnet            7
run_arm gps-slice-sol    scenes-gpt-6.1-sol       6
run_arm gps-slice-terra  scenes-gpt-5.6-terra     6
echo "== all arms done $(date +%H:%M:%S)"
