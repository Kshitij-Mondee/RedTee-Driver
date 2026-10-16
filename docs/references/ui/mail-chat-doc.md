# Reference board: mail, inbox, chat and document artefacts (for `Loom.ui.mail|inbox|chat|doc`, D-100)

STATUS: USED 2026-10-03. Built from: `runtime/ui_artefacts.js`. Lab: `scenes_examples/lab/lab_ui_artefacts.js`
(`py -m loom lab lab_ui_artefacts`). Strips: `docs/styles/demos/lab/lab_ui_artefacts__*.jpg`.

Why this exists: the step 7 phishing lesson drew its email as grey bars where the sender, the address and the
body should be. Kshitij: it "looks horrendous" and should have started from a reference image (frame audit
`docs/research/2026-10-03-frame-audit.md`, kind F; L-172).

## What was looked at (look only, nothing downloaded or copied)
1. **The Wikipedia article screenshots of two widely used web mail clients**, seen in the built-in browser on
   2026-10-03:
   - one is a light inbox with a left navigation rail, a rounded search field and pill buttons;
   - the other is a reading pane.
2. **The reading pane, read part by part:**
   - the subject first and largest;
   - a sender row: a round initials avatar, the display name in bold, the address in angle brackets in a muted
     colour, a "to" line under it, and the time on the right;
   - a row of action icons (reply, reply all, forward, delete, flag);
   - body paragraphs at ordinary reading size, with links underlined in the link colour;
   - attachments shown as chips with a paperclip, the file name and the size.
3. **Organisation mail banners:** an "external sender" notice above the message is a common corporate setting.
   It is shown as a tinted strip with a warning icon and one sentence.
4. **Chat clients in general:**
   - a header with the channel or person;
   - incoming bubbles on the left with the sender's name above;
   - outgoing bubbles on the right in the accent colour;
   - a small time under the bubble.

## Take
- The **anatomy and reading order** of each artefact: subject, then sender, then body, then link or button, then
  attachment.
- **Real words in every slot.** A placeholder bar is never a stand-in for text the learner is meant to read. (Text
  that is too small to read is not drawn at all: leave the slot empty or show it as texture, never as fake writing.)
- **Address and display name are separate parts,** because that gap is where most of the teaching happens: an
  address that does not match the name, a look-alike domain.
- **Every part is addressable** (`ui.at(A, key)`), so a tag, a highlight or a cursor lands on the real thing.

## Do not take
- **No vendor logo, colour, icon set or trade dress.** The artefact is product-neutral, and the pack and the
  client's brand supply the colour. A lesson must never look like a screenshot of a real product.
- **No real names, addresses or domains.** Use reserved example names: `.example`, `example.com`.

## Design rules derived (in the code header)
1. **Type size comes from the pack's roles** (lead, body, label), never below the label floor. Set `display` to the
   scale it will be seen at, so the type grows to stay readable. The film check measures the result.
2. **The artefact hugs its content** when no height is given: no empty lower half.
3. **It builds in reading order** (`ui.build`). A tag that points at a part leaves with its lead line
   (`M.exit` takes `E.lead` and `E.followers`).
4. **Colours are tokens.** The foreground on a fill is the token with the best contrast.
