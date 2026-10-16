# Template skins: proof on two composed lessons (2026-10-16, D-198)

## Method

Each lesson was copied twice into the session scratchpad; the originals were not touched:
- with skins on: the `template_skins` stamp in the copy's project.json;
- classic: without the stamp.

Both copies were composed and checked (`py -m loom run <copy> compose --force`, then `check --force`) on the same plan,
audio and scenes. The two error lists were compared with the times normalised.

## Results

| Lesson | Style | Template beats | Errors, classic | Errors, skinned | Errors the skin adds |
|---|---|---|---|---|---|
| blameless-postmortem | whiteboard | 15 of 29 | 4 | 2 | none |
| st-holo-ai | hologram | 5 of 22 | 7 | 7 | none |

### blameless-postmortem (whiteboard)

The first skinned run had 39 errors, and the lesson proof found three faults:
- 34 were `wb_face` on bespoke beats: the skin's boards had armed the face audit for the whole lesson;
- `join_blank` at b09 and b10: a hand needs about a second to put a title on an empty board;
- a pale block where a card's cover sat on the board's texture.

After the three fixes (L-488) the skinned copy has 2 errors, both also in classic:
- `design_element_missing` at b01;
- `join_blank` at b02.

The skin also clears classic's `join_blank` at b04 and b08.

Where the skinned copy stands now:
- skin record: 51 parts drawn, 26 carried (restated at a cut), 3 classic (images and people, as designed);
- warnings: `skin_squeezed` 5 and `skin_late` 5 (a part started up to 1.4 s after its word, in title cards);
- contact sheets: every template beat is drawn by the hand in reading order on its words.

### st-holo-ai (hologram)

The skinned copy has exactly the classic copy's 7 errors (`join_blank` x6 and `holo_ui_heavy`). Its template beats are
built as light planes with brackets and typed words, and the lock closes on a spoken term.

## Not done

- No MP4 was rendered and rated, in either style.
- Blueprint, screencast and isometric were proven on the template sheet only.
