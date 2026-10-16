# Run comparison: https-private-shuttle-api, https-private-v2, https-private-relay

Written by `py tools/run_compare.py`.

| phase | https-private-shuttle-api: min / calls / in M (cached) / out k / USD (lead+sub) / looks / checks | https-private-v2: min / calls / in M (cached) / out k / USD (lead+sub) / looks / checks | https-private-relay: min / calls / in M (cached) / out k / USD (lead+sub) / looks / checks |
| --- | --- | --- | --- |
| P1 | 0 / 4 / 0.11 (73%) / 1 / 0.09 (0.09+0.00) / 0 / 0 | 0 / 4 / 0.11 (73%) / 1 / 0.14 (0.14+0.00) / 0 / 0 | 0 / 2 / 0.01 (44%) / 3 / 0.05 (0.00+0.05) / 0 / 0 |
| P2 | 4 / 8 / 0.21 (89%) / 8 / 0.18 (0.14+0.03) / 0 / 0 | 2 / 7 / 0.18 (88%) / 7 / 0.17 (0.13+0.04) / 0 / 0 | 0 / 2 / 0.01 (0%) / 2 / 0.04 (0.00+0.04) / 0 / 0 |
| P3 | 0 / 3 / 0.12 (94%) / 1 / 0.05 (0.05+0.00) / 0 / 0 | 0 / 3 / 0.12 (95%) / 1 / 0.05 (0.05+0.00) / 0 / 0 | 1 / 2 / 0.02 (45%) / 7 / 0.10 (0.00+0.10) / 0 / 0 |
| P4 | 1 / 5 / 0.26 (93%) / 13 / 0.23 (0.23+0.00) / 0 / 0 | 1 / 3 / 0.15 (94%) / 4 / 0.10 (0.10+0.00) / 0 / 0 | 1 / 3 / 0.04 (34%) / 14 / 0.21 (0.00+0.21) / 0 / 0 |
| P5 | 4 / 16 / 1.03 (89%) / 16 / 1.09 (1.09+0.00) / 0 / 0 | 3 / 10 / 0.49 (84%) / 11 / 0.84 (0.84+0.00) / 0 / 0 | 6 / 6 / 0.29 (65%) / 51 / 1.62 (0.00+1.62) / 0 / 0 |
| P6 | 4 / 5 / 0.39 (87%) / 21 / 0.73 (0.73+0.00) / 0 / 0 | 7 / 6 / 0.37 (87%) / 18 / 0.77 (0.77+0.00) / 0 / 0 | 11 / 0 / 0.00 (0%) / 0 / 0.00 (0.00+0.00) / 0 / 0 |
| P7 | 14 / 21 / 1.44 (86%) / 106 / 1.80 (0.44+1.36) / 0 / 0 | 43 / 31 / 2.44 (88%) / 163 / 2.92 (0.80+2.11) / 0 / 0 | 10 / 16 / 1.60 (86%) / 76 / 1.59 (0.00+1.59) / 8 / 0 |
| P8 | 125 / 502 / 20.72 (92%) / 373 / 11.60 (3.86+7.75) / 259 / 1 | 36 / 255 / 13.51 (90%) / 280 / 8.59 (0.74+7.86) / 79 / 2 | 16 / 95 / 5.35 (87%) / 61 / 3.30 (0.00+3.30) / 50 / 0 |
| P9 | 66 / 225 / 12.55 (96%) / 110 / 4.83 (3.84+0.98) / 0 / 20 | 22 / 41 / 2.10 (93%) / 34 / 1.27 (1.08+0.18) / 0 / 5 | 15 / 0 / 0.00 (0%) / 0 / 0.00 (0.00+0.00) / 0 / 3 |
| P10 | 31 / 35 / 2.03 (95%) / 16 / 0.80 (0.69+0.11) / 0 / 0 | 11 / 42 / 1.56 (90%) / 55 / 1.34 (0.79+0.55) / 0 / 0 | 13 / 102 / 4.94 (81%) / 78 / 3.71 (0.00+3.71) / 48 / 0 |
| P11 | 5 / 5 / 0.26 (88%) / 2 / 0.14 (0.14+0.00) / 0 / 0 | 3 / 3 / 0.11 (69%) / 1 / 0.16 (0.16+0.00) / 0 / 0 | 6 / 0 / 0.00 (0%) / 0 / 0.00 (0.00+0.00) / 0 / 0 |
| other (reviewers) | 19 calls, 0.27 | 10 calls, 0.16 | 0 calls, 0.00 |
| **total** | **152 min wall, 848 calls, 39.1 M in, 666 k out, $21.80, 259 looks, 21 checks** | **71 min wall, 415 calls, 21.1 M in, 575 k out, $16.50, 79 looks, 7 checks** | **71 min wall, 228 calls, 12.3 M in, 293 k out, $10.62, 106 looks, 3 checks** |

Engine time per phase (the three longest tools, minutes summed across parallel callers):

- https-private-shuttle-api: P1 submit_brief 0.0; P2 skeptic_review 0.8, submit_knowledge 0.0; P3 submit_teaching_plan 0.0; P4 submit_script 0.0, choose_persona 0.0; P5 submit_storyboard 0.0, submit_outline 0.0; P6 narrate 3.4, animatic 0.1; P7 kit_preview 0.3, submit_kit 0.0; P8 lab_snapshot 44.8, submit_scene 1.7, frames 1.2; P9 check 19.8; P10 critic_review 3.4, submit_review 0.0; P11 render 5.0
- https-private-v2: P1 submit_brief 0.0; P2 skeptic_review 0.6, submit_knowledge 0.0; P3 submit_teaching_plan 0.0; P4 submit_script 0.0, choose_persona 0.0; P5 submit_storyboard 0.0, submit_outline 0.0; P6 narrate 6.2, animatic 0.1; P7 kit_preview 0.5, submit_kit 0.0; P8 lab_snapshot 24.9, submit_scene 0.7, pilot_check 0.7; P9 check 3.9; P10 critic_review 1.4, submit_review 0.0; P11 render 3.0
- https-private-relay: P1 submit_brief 0.0; P2 submit_skeptic_verdict 0.0, submit_knowledge 0.0; P3 submit_teaching_plan 0.0, get_skill_section 0.0; P4 submit_script 0.0, patch_script 0.0, submit_persona_pick 0.0; P5 submit_storyboard 0.0, submit_outline 0.0, get_catalog_entry 0.0; P7 kit_preview 0.8, submit_kit 0.0, get_example_scene 0.0; P8 lab_snapshot 11.7, submit_scene 0.2, read_artifact 0.0; P10 lab_snapshot 11.5, submit_scene 0.6, kit_preview 0.2

Checks (errors, and their kinds):

- https-private-shuttle-api: 16:28 10 {'words_cut': 6, 'lc layout content_overlap': 3, 'foreign_pixels': 1}; 16:39 6 {'words_cut': 3, 'lc layout content_overlap': 2, 'foreign_pixels': 1}; 16:42 3 {'lc layout content_overlap': 2, 'foreign_pixels': 1}; 16:45 1 {'foreign_pixels': 1}; 16:49 1 {'foreign_pixels': 1}; 16:54 1 {'foreign_pixels': 1}; 16:59 1 {'foreign_pixels': 1}; 17:02 1 {'foreign_pixels': 1}; 17:04 0 {}; 17:06 1 {'foreign_pixels': 1}; 17:09 1 {'foreign_pixels': 1}; 17:11 0 {}; 17:15 1 {'foreign_pixels': 1}; 17:17 1 {'foreign_pixels': 1}; 17:19 0 {}; 17:21 1 {'foreign_pixels': 1}; 17:23 0 {}; 17:30 1 {'foreign_pixels': 1}; 17:33 0 {}
- https-private-v2: 21:08 1 {'lc contrast contrast_aa_failure': 1}; 21:11 1 {'lc contrast contrast_aa_failure': 1}; 21:19 0 {}; 21:27 0 {}; 21:28 0 {}
- https-private-relay: 14:47 33 {'other': 24, 'lc layout line_into_object': 4, 'runtime held_missing': 2, 'lc layout content_overlap': 1, 'lc layout text_covered': 1}; 14:54 26 {'other': 21, 'lc layout line_into_object': 4, 'lc layout text_covered': 1}; 15:02 4 {'lc layout line_into_object': 4}
