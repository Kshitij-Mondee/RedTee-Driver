// @lab {"title": "UI artefacts: a mail reading pane, an inbox and a chat thread drawn from the reference board, every word real and readable", "styles": ["corporate-clean", "cinematic-noir"], "dur": 10.0, "times": [0.6, 1.6, 3.0, 4.4, 6.0, 7.4, 8.6, 9.6]}
// A lab scene for Loom.ui artefacts (D-100; docs/references/ui/mail-chat-doc.md). The step 7 email was grey bars
// where the sender, the address and the body should be (L-172). Here every part is real text at a readable size,
// the parts are addressable (ui.at) so a tag lands on the real address, and the artefact builds in reading order.
// Original content: the names, the addresses and the message are made up; the domains are reserved example names.
Loom.scene("lab_ui_artefacts", {
  build(ctx) {
    const T = Loom.treat, M = Loom.motion, U = Loom.ui;
    // the inbox first, then the message opens over it
    const L = U.inbox(ctx, "inbox", {
      x: 90, y: 110, w: 1100, rows: [
        { from: "Payroll Team", subject: "Action needed: confirm your details", preview: "Your October payment is on hold until", time: "09:14", unread: true },
        { from: "Dana Okafor", subject: "Notes from Tuesday", preview: "Thanks all, the actions are below", time: "08:52" },
        { from: "Facilities", subject: "Lift maintenance on Friday", preview: "The east lift is closed from 7", time: "Yesterday", attachment: true },
      ],
    });
    U.build(ctx, L, 0.3, { gap: 0.18 });
    M.exit(L.E, 2.2, "recede");   // gone before the message opens in its place (no double exposure)
    const A = U.mail(ctx, "msg", {
      x: 90, y: 80, w: 1100, report: true,
      subject: "Action needed: confirm your details",
      from: { name: "Payroll Team", address: "payroll@pay-roll-update.example" },
      to: "you", time: "09:14",
      banner: { text: "This message came from outside your organisation." },
      paragraphs: [
        "Your October payment is on hold until you confirm your bank details.",
        "Please confirm within 2 hours to avoid a delay.",
      ],
      link: { text: "Confirm my details", href: "http://pay-roll-update.example/login" },
      attachment: { name: "Payment_form.html", size: "14 KB" },
    });
    U.build(ctx, A, 2.9, { gap: 0.16 });
    // tags land on the real parts
    const ad = U.at(A, "address"), bn = U.at(A, "banner"), at = U.at(A, "attachment");
    const tA = T.label(ctx, "t_addr", { x: 1300, y: ad.cy + 120, text: "Not our domain", to: [ad.x + ad.w, ad.cy + ad.h * 0.4], tone: "neg", t: 5.4 });
    const tO = T.label(ctx, "t_out", { x: 1260, y: 170, text: "Outside sender", to: [bn.x + bn.w, bn.cy], tone: "accent4", t: 6.2 });
    T.label(ctx, "t_att", { x: at.x + at.w + 260, y: at.y + at.h + 110, text: "A web page, not a form", to: [at.x + at.w, at.cy], tone: "neg", t: 7.0 });
    // the tags have made their point; they leave before the next thing arrives in their place
    [tA, tO].forEach((E) => M.exit(E, 7.6, "recede"));
    // a chat thread: what to do next, asked of a colleague
    const C = U.chat(ctx, "chat", {
      x: 1250, y: 300, w: 600, title: "Security desk",
      messages: [
        { side: "me", text: "Got a payroll email asking for bank details. Reported it.", time: "09:16" },
        { side: "them", name: "Sam", text: "Thanks, it is a known lure. Do not open the file." },
      ],
    });
    U.build(ctx, C, 8.0, { gap: 0.4 });
  },
});
