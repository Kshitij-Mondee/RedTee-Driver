#!/usr/bin/env bash
# D-166 round 2 (2026-10-13): the three serious candidates on a second lesson, https-private-shuttle-api b01-b12
# (corporate-clean, 12 beats, 76 s, slices https-slice-<arm>). Kshitij rated round 1 blind: Sonnet best ("gives me the
# claude sonnet vibes"), Terra and Sol good, Luna worst; "Try again". Sonnet leads every arm; one arm at a time.
set -u
cd "$(dirname "$0")/.."
WHO="agent, unattended per Kshitij (scene-writer comparison round 2, D-166)"
run_arm() {   # slice preset cap
  echo "== $1 ($2, cap \$$3) started $(date +%H:%M:%S)"
  py -m loom shuttle run "$1" --runner loom --mode api --preset "$2" --budget "$3" --until P9 --approve-as "$WHO"
  echo "== $1 exit $? at $(date +%H:%M:%S)"
}
run_arm https-slice-terra  scenes-gpt-5.6-terra  5
run_arm https-slice-sol    scenes-gpt-6.1-sol    5
run_arm https-slice-sonnet scenes-sonnet         8
echo "== all arms done $(date +%H:%M:%S)"
