# Run comparison: gps-position, https-private-v2

Written by `py tools/run_compare.py`.

| phase | gps-position: min / calls / in M (cached) / out k / USD (lead+sub) / looks / checks | https-private-v2: min / calls / in M (cached) / out k / USD (lead+sub) / looks / checks |
| --- | --- | --- |
| P1 | 9 / 8 / 0.20 (84%) / 8 / 0.38 (0.29+0.08) / 0 / 0 | 0 / 4 / 0.11 (73%) / 1 / 0.14 (0.14+0.00) / 0 / 0 |
| P2 | 3 / 7 / 0.16 (90%) / 3 / 0.19 (0.16+0.03) / 0 / 0 | 2 / 7 / 0.18 (88%) / 7 / 0.17 (0.13+0.04) / 0 / 0 |
| P3 | 2 / 8 / 0.34 (93%) / 12 / 0.56 (0.56+0.00) / 0 / 0 | 0 / 3 / 0.12 (95%) / 1 / 0.05 (0.05+0.00) / 0 / 0 |
| P4 | 3 / 5 / 0.30 (97%) / 16 / 0.50 (0.50+0.00) / 0 / 0 | 1 / 3 / 0.15 (94%) / 4 / 0.10 (0.10+0.00) / 0 / 0 |
| P5 | 98 / 26 / 1.59 (89%) / 72 / 3.29 (3.29+0.00) / 0 / 0 | 3 / 10 / 0.49 (84%) / 11 / 0.84 (0.84+0.00) / 0 / 0 |
| P6 | 88 / 13 / 0.99 (86%) / 37 / 1.93 (1.93+0.00) / 0 / 0 | 7 / 6 / 0.37 (87%) / 18 / 0.77 (0.77+0.00) / 0 / 0 |
| P7 | 91 / 46 / 2.92 (86%) / 128 / 3.00 (0.96+2.04) / 0 / 0 | 43 / 31 / 2.44 (88%) / 163 / 2.92 (0.80+2.11) / 0 / 0 |
| P8 | 100 / 749 / 37.60 (92%) / 853 / 23.48 (2.96+20.52) / 339 / 3 | 36 / 255 / 13.51 (90%) / 280 / 8.59 (0.74+7.86) / 79 / 2 |
| P9 | 60 / 98 / 4.37 (92%) / 26 / 2.20 (1.52+0.68) / 0 / 7 | 22 / 41 / 2.10 (93%) / 34 / 1.27 (1.08+0.18) / 0 / 5 |
| P10 | 20 / 21 / 0.91 (89%) / 4 / 0.55 (0.44+0.10) / 0 / 0 | 11 / 42 / 1.56 (90%) / 55 / 1.34 (0.79+0.55) / 0 / 0 |
| P11 | 14 / 4 / 0.31 (90%) / 2 / 0.20 (0.20+0.00) / 0 / 0 | 3 / 3 / 0.11 (69%) / 1 / 0.16 (0.16+0.00) / 0 / 0 |
| other (reviewers) | 15 calls, 0.24 | 10 calls, 0.16 |
| **total** | **159 min wall, 1000 calls, 49.7 M in, 1162 k out, $36.52, 339 looks, 10 checks** | **71 min wall, 415 calls, 21.1 M in, 575 k out, $16.50, 79 looks, 7 checks** |

Engine time per phase (the three longest tools, minutes summed across parallel callers):

- gps-position: P1 submit_brief 0.0; P2 skeptic_review 1.5, submit_knowledge 0.0; P3 submit_teaching_plan 0.0; P4 submit_script 0.0, choose_persona 0.0; P5 patch_storyboard 0.0, submit_storyboard 0.0, submit_outline 0.0; P6 narrate 9.9, animatic 0.3; P7 kit_preview 0.7, submit_kit 0.1; P8 lab_snapshot 137.3, pilot_check 3.5, submit_scene 3.3; P9 check 21.2; P10 critic_review 1.6, submit_review 0.0; P11 render 13.8
- https-private-v2: P1 submit_brief 0.0; P2 skeptic_review 0.6, submit_knowledge 0.0; P3 submit_teaching_plan 0.0; P4 submit_script 0.0, choose_persona 0.0; P5 submit_storyboard 0.0, submit_outline 0.0; P6 narrate 6.2, animatic 0.1; P7 kit_preview 0.5, submit_kit 0.0; P8 lab_snapshot 24.9, submit_scene 0.7, pilot_check 0.7; P9 check 3.9; P10 critic_review 1.4, submit_review 0.0; P11 render 3.0

Checks (errors, and their kinds):

- gps-position: 23:26 26 {'runtime held_missing': 22, 'runtime tight_inset': 4}; 23:49 4 {'runtime tight_inset': 4}; 23:59 4 {'runtime tight_inset': 4}; 00:04 0 {}; 00:16 5 {'runtime held_missing': 5}; 00:23 0 {}
- https-private-v2: 21:08 1 {'lc contrast contrast_aa_failure': 1}; 21:11 1 {'lc contrast contrast_aa_failure': 1}; 21:19 0 {}; 21:27 0 {}; 21:28 0 {}
