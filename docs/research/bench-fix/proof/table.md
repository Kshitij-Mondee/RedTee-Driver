| bench | measure | before (original build) | after (fork, today's engine) |
|---|---|---|---|
| openai-balanced | self-blurred beats | 15 of 52: b03, b06, b08, b10, b18, b20, b22, b24 | 0 of 52 |
| openai-balanced | foreign-pixel beats (>300 px) | 2 of 52: b16, b52 | 0 of 52 |
| openai-balanced | off-frame errors | 50 | 1 |
| openai-balanced | template beats first reveal > 1 s (worst) | 14 of 48: b05, b07, b10, b13, b15, b16, b20, b24 (4.73 s) | 1 of 48: b16 (1.07 s) |
| openai-balanced | dim moments off screen | none in this lesson (nothing to measure) | none in this lesson (nothing to measure) |
| openai-balanced | empty or blank errors | 2 | 1 |
| openai-balanced | check errors (kinds) | 359 {'runtime held_missing': 268, 'words_cut': 27, 'off_frame': 23, 'blurred_beat': 15, 'runtime text_spill': 7, 'runtime icon_missing': 6, 'runtime text_outside_element': 3, 'runtime text_overflow': 2, 'hf layout content_overlap': 2, 'foreign_pixels': 2, 'runtime scene_threw': 1, 'runtime tight_inset': 1, 'nothing developing': 1, 'empty_frame': 1} | 286 {'runtime held_missing': 264, 'runtime text_spill': 7, 'runtime icon_missing': 6, 'runtime text_outside_element': 3, 'runtime text_overflow': 2, 'hf layout content_overlap': 2, 'nothing developing': 1, 'off_frame': 1} |
| claude-balanced | self-blurred beats | 2 of 54: b19, b23 | 0 of 54 |
| claude-balanced | foreign-pixel beats (>300 px) | 38 of 54: b01, b02, b03, b04, b05, b06, b07, b08 | 0 of 54 |
| claude-balanced | off-frame errors | 18 | 12 |
| claude-balanced | template beats first reveal > 1 s (worst) | 1 of 28: b41 (3.19 s) | 1 of 28: b41 (1.23 s) |
| claude-balanced | dim moments off screen | 5 of 5: b23 light 197.06s on frame 0, b27 spotlight 227.21s on frame 0, b34 light 293.94s on frame 0, b37 spotlight 336.84s on frame 0, b42 spotlight 371.46s on frame 0 | 0 of 5 |
| claude-balanced | empty or blank errors | 0 | 0 |
| claude-balanced | check errors (kinds) | 97 {'foreign_pixels': 37, 'off_frame': 12, 'runtime held_missing': 9, 'hf contrast contrast_aa_failure': 9, 'hf layout content_overlap': 7, 'words_cut': 6, 'runtime scene_threw': 3, 'runtime unknown_motion_setting': 3, 'runtime held_needs_same_station': 3, 'runtime unknown_token': 2, 'blurred_beat': 2, 'runtime tween_threw': 1, 'runtime text_spill': 1, 'runtime tight_inset': 1, 'runtime text_overflow': 1} | 30 {'off_frame': 12, 'runtime held_missing': 5, 'runtime unknown_motion_setting': 3, 'runtime held_needs_same_station': 3, 'runtime motion_target': 2, 'runtime unknown_token': 2, 'runtime text_spill': 1, 'runtime text_overflow': 1, 'hf layout content_overlap': 1} |
| gemini-balanced | self-blurred beats | 1 of 35: b31 | 0 of 35 |
| gemini-balanced | foreign-pixel beats (>300 px) | 1 of 35: b28 | 0 of 35 |
| gemini-balanced | off-frame errors | 11 | 0 |
| gemini-balanced | template beats first reveal > 1 s (worst) | 12 of 32: b05, b07, b08, b16, b19, b20, b21, b23 (7.73 s) | 2 of 32: b16, b31 (1.23 s) |
| gemini-balanced | dim moments off screen | none in this lesson (nothing to measure) | none in this lesson (nothing to measure) |
| gemini-balanced | empty or blank errors | 0 | 0 |
| gemini-balanced | check errors (kinds) | 36 {'runtime text_overflow': 6, 'off_frame': 6, 'words_cut': 5, 'hf layout content_overlap': 4, 'hf contrast contrast_aa_failure': 4, 'runtime held_missing': 3, 'runtime icon_missing': 3, 'runtime text_outside_element': 2, 'runtime tight_inset': 1, 'foreign_pixels': 1, 'blurred_beat': 1} | 16 {'runtime text_overflow': 6, 'hf contrast contrast_aa_failure': 4, 'runtime held_missing': 3, 'runtime icon_missing': 3} |
| mixed-value | self-blurred beats | 2 of 44: b10, b12 | 0 of 44 |
| mixed-value | foreign-pixel beats (>300 px) | 17 of 44: b08, b09, b10, b11, b12, b13, b15, b16 | 0 of 44 |
| mixed-value | off-frame errors | 1 | 0 |
| mixed-value | template beats first reveal > 1 s (worst) | 2 of 37: b30, b34 (6.89 s) | 1 of 37: b30 (1.07 s) |
| mixed-value | dim moments off screen | 12 of 13: b06 spotlight 61.79s on frame 0, b15 spotlight 154.88s on frame 0, b17 spotlight 175.76s on frame 0, b20 light 205.07s on frame 0, b24 light 245.73s on frame 0, b28 light 296.35s on frame 0, b31 light 329.95s on frame 0, b33 spotlight 348.06s on frame 0 | 0 of 13 |
| mixed-value | empty or blank errors | 1 | 0 |
| mixed-value | check errors (kinds) | 151 {'hf layout content_overlap': 80, 'foreign_pixels': 17, 'runtime text_overflow': 14, 'runtime held_missing': 12, 'runtime icon_missing': 11, 'other': 4, 'runtime text_outside_element': 3, 'nothing developing': 2, 'blurred_beat': 2, 'runtime unknown_token': 1, 'runtime scene_threw': 1, 'runtime tight_inset': 1, 'text_too_small': 1, 'words_cut': 1, 'empty_frame': 1} | 50 {'runtime text_overflow': 14, 'runtime held_missing': 12, 'runtime icon_missing': 11, 'hf layout content_overlap': 5, 'other': 4, 'nothing developing': 2, 'runtime unknown_token': 1, 'runtime scene_threw': 1} |
| budget | self-blurred beats | 1 of 26: b22 | 0 of 26 |
| budget | foreign-pixel beats (>300 px) | 5 of 26: b01, b02, b03, b12, b13 | 0 of 26 |
| budget | off-frame errors | 5 | 2 |
| budget | template beats first reveal > 1 s (worst) | 2 of 14: b12, b15 (2.77 s) | 0 of 14 (0.88 s) |
| budget | dim moments off screen | none in this lesson (nothing to measure) | none in this lesson (nothing to measure) |
| budget | empty or blank errors | 0 | 0 |
| budget | check errors (kinds) | 80 {'runtime held_missing': 34, 'runtime text_overflow': 16, 'runtime icon_missing': 5, 'hf layout content_overlap': 5, 'foreign_pixels': 5, 'runtime text_outside_element': 3, 'words_cut': 3, 'runtime unknown_token': 2, 'off_frame': 2, 'runtime tight_inset': 1, 'nothing developing': 1, 'hf layout text_box_overflow': 1, 'other': 1, 'blurred_beat': 1} | 69 {'runtime held_missing': 34, 'runtime text_overflow': 16, 'runtime icon_missing': 5, 'hf layout content_overlap': 3, 'runtime avatar_props_unknown': 2, 'runtime cast_not_drawable': 2, 'runtime unknown_token': 2, 'runtime text_outside_element': 1, 'nothing developing': 1, 'other': 1, 'words_cut': 1, 'off_frame': 1} |
