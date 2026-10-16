# Run comparison: https-private, https-private-v2, feedback-shuttle-v3

Written by `py tools/run_compare.py`.

| phase | https-private: min / calls / in M (cached) / out k / USD (lead+sub) / looks / checks | https-private-v2: min / calls / in M (cached) / out k / USD (lead+sub) / looks / checks | feedback-shuttle-v3: min / calls / in M (cached) / out k / USD (lead+sub) / looks / checks |
| --- | --- | --- | --- |
| P1 | 1 / 5 / 0.14 (77%) / 4 / 0.18 (0.18+0.00) / 0 / 0 | 0 / 4 / 0.11 (73%) / 1 / 0.14 (0.14+0.00) / 0 / 0 | 1 / 11 / 0.27 (88%) / 4 / 0.43 (0.43+0.00) / 0 / 0 |
| P2 | 4 / 7 / 0.19 (88%) / 8 / 0.18 (0.14+0.03) / 0 / 0 | 2 / 7 / 0.18 (88%) / 7 / 0.17 (0.13+0.04) / 0 / 0 | 2 / 11 / 0.26 (83%) / 10 / 0.49 (0.39+0.10) / 0 / 0 |
| P3 | 1 / 5 / 0.24 (94%) / 2 / 0.12 (0.12+0.00) / 0 / 0 | 0 / 3 / 0.12 (95%) / 1 / 0.05 (0.05+0.00) / 0 / 0 | 2 / 12 / 0.33 (86%) / 8 / 0.65 (0.65+0.00) / 0 / 0 |
| P4 | 2 / 4 / 0.25 (96%) / 4 / 0.13 (0.13+0.00) / 0 / 0 | 1 / 3 / 0.15 (94%) / 4 / 0.10 (0.10+0.00) / 0 / 0 | 3 / 14 / 0.49 (90%) / 6 / 0.69 (0.69+0.00) / 0 / 0 |
| P5 | 6 / 23 / 1.32 (92%) / 25 / 1.47 (1.47+0.00) / 0 / 0 | 3 / 10 / 0.49 (84%) / 11 / 0.84 (0.84+0.00) / 0 / 0 | 149 / 44 / 2.50 (93%) / 63 / 3.67 (3.67+0.00) / 0 / 0 |
| P6 | 7 / 5 / 0.35 (84%) / 23 / 0.93 (0.93+0.00) / 0 / 0 | 7 / 6 / 0.37 (87%) / 18 / 0.77 (0.77+0.00) / 0 / 0 | 142 / 31 / 1.42 (89%) / 27 / 2.34 (2.34+0.00) / 0 / 0 |
| P7 | 12 / 20 / 1.33 (87%) / 86 / 1.59 (0.36+1.23) / 0 / 0 | 43 / 31 / 2.44 (88%) / 163 / 2.92 (0.80+2.11) / 0 / 0 | 29 / 27 / 2.15 (81%) / 267 / 4.19 (1.04+3.15) / 0 / 0 |
| P8 | 231 / 420 / 22.86 (91%) / 715 / 16.51 (2.59+13.92) / 215 / 1 | 36 / 255 / 13.51 (90%) / 280 / 8.59 (0.74+7.86) / 79 / 2 | 186 / 436 / 24.38 (91%) / 684 / 18.18 (3.73+14.45) / 206 / 1 |
| P9 | 188 / 154 / 5.40 (89%) / 29 / 2.86 (1.29+1.58) / 0 / 12 | 22 / 41 / 2.10 (93%) / 34 / 1.27 (1.08+0.18) / 0 / 5 | 114 / 115 / 7.20 (94%) / 114 / 5.29 (3.69+1.60) / 0 / 11 |
| P10 | 50 / 33 / 1.73 (94%) / 13 / 0.84 (0.75+0.09) / 0 / 0 | 11 / 42 / 1.56 (90%) / 55 / 1.34 (0.79+0.55) / 0 / 0 | 105 / 116 / 5.93 (92%) / 39 / 4.91 (4.27+0.64) / 0 / 0 |
| P11 | 14 / 4 / 0.18 (83%) / 1 / 0.16 (0.16+0.00) / 0 / 0 | 3 / 3 / 0.11 (69%) / 1 / 0.16 (0.16+0.00) / 0 / 0 | 45 / 6 / 0.25 (84%) / 2 / 0.44 (0.44+0.00) / 0 / 0 |
| other (reviewers) | 15 calls, 0.19 | 10 calls, 0.16 | 15 calls, 0.30 |
| **total** | **273 min wall, 695 calls, 34.0 M in, 909 k out, $25.16, 215 looks, 13 checks** | **71 min wall, 415 calls, 21.1 M in, 575 k out, $16.50, 79 looks, 7 checks** | **235 min wall, 838 calls, 45.2 M in, 1225 k out, $41.58, 206 looks, 12 checks** |

Engine time per phase (the three longest tools, minutes summed across parallel callers):

- https-private: P1 submit_brief 0.0; P2 skeptic_review 0.5, submit_knowledge 0.0; P3 submit_teaching_plan 0.0; P4 submit_script 0.0, patch_script 0.0, choose_persona 0.0; P5 submit_storyboard 0.0, submit_outline 0.0; P6 narrate 6.0, animatic 0.1; P7 kit_preview 0.4, submit_kit 0.0; P8 lab_snapshot 145.9, pilot_check 11.1, submit_scene 3.2; P9 check 132.9; P10 critic_review 2.2, submit_review 0.0; P11 render 13.5
- https-private-v2: P1 submit_brief 0.0; P2 skeptic_review 0.6, submit_knowledge 0.0; P3 submit_teaching_plan 0.0; P4 submit_script 0.0, choose_persona 0.0; P5 submit_storyboard 0.0, submit_outline 0.0; P6 narrate 6.2, animatic 0.1; P7 kit_preview 0.5, submit_kit 0.0; P8 lab_snapshot 24.9, submit_scene 0.7, pilot_check 0.7; P9 check 3.9; P10 critic_review 1.4, submit_review 0.0; P11 render 3.0
- feedback-shuttle-v3: P1 submit_brief 0.0; P2 skeptic_review 0.5, submit_knowledge 0.0; P3 submit_teaching_plan 0.0; P4 submit_script 0.0, choose_persona 0.0; P5 patch_storyboard 0.0, submit_storyboard 0.0, submit_outline 0.0; P6 narrate 3.9, animatic 0.3; P7 kit_preview 0.5, submit_kit 0.0; P8 lab_snapshot 94.4, submit_scene 1.2, strips 0.9; P9 check 19.4; P10 critic_review 3.2, submit_review 0.0; P11 render 44.6

Checks (errors, and their kinds):

- https-private: 06:37 27 {'hf layout content_overlap': 21, 'text_too_small': 6}; 07:11 15 {'hf layout content_overlap': 14, 'text_too_small': 1}; 07:32 8 {'hf layout content_overlap': 6, 'runtime scene_threw': 1, 'text_too_small': 1}; 07:52 7 {'hf layout content_overlap': 5, 'text_too_small': 1, 'words_cut': 1}; 08:09 3 {'hf layout content_overlap': 3}; 08:26 3 {'hf layout content_overlap': 3}; 08:42 0 {}; 09:02 0 {}; 09:17 2 {'blank_beat': 1, 'foreign_pixels': 1}; 09:31 0 {}
- https-private-v2: 21:08 1 {'lc contrast contrast_aa_failure': 1}; 21:11 1 {'lc contrast contrast_aa_failure': 1}; 21:19 0 {}; 21:27 0 {}; 21:28 0 {}
- feedback-shuttle-v3: 18:23 5 {'runtime tight_inset': 3, 'runtime held_missing': 1, 'blank_beat': 1}; 18:31 0 {}; 18:45 3 {'runtime held_missing': 3}; 19:09 1 {'runtime held_missing': 1}; 19:13 0 {}; 19:23 10 {'runtime held_missing': 10}; 19:30 0 {}; 19:48 0 {}; 20:06 2 {'foreign_pixels': 2}; 20:10 0 {}; 20:15 0 {}
