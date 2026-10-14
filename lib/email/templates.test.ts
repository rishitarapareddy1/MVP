import { describe, expect, it } from "vitest";
import { escapeHtml, feedbackRequestEmail, newOfferEmail, offerAcceptedEmail } from "./templates";

describe("escapeHtml", () => {
  it("neutralizes markup", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;",
    );
  });
});

describe("newOfferEmail", () => {
  const base = {
    firstName: "Maya",
    projectTitle: "Competitor pricing <snapshot>",
    pay: "$110.00",
    deadline: "Oct 30, 2026",
    respondBy: "Oct 16, 2026, 5:00 PM",
    note: "You'd be great at this",
    url: "https://example.com/student/offers/abc",
  };

  it("includes the essentials in both versions", () => {
    const e = newOfferEmail(base);
    expect(e.subject).toBe("New project offer: Competitor pricing <snapshot>");
    for (const part of [
      "Hi Maya,",
      "$110.00",
      "Oct 30, 2026",
      "Respond by",
      "great at this",
      base.url,
    ]) {
      expect(e.text).toContain(part);
    }
    expect(e.html).toContain('href="https://example.com/student/offers/abc"');
  });

  it("escapes user-entered text in the HTML", () => {
    const e = newOfferEmail({ ...base, note: "<img src=x onerror=alert(1)>" });
    expect(e.html).not.toContain("<img");
    expect(e.html).toContain("&lt;snapshot&gt;");
  });

  it("omits optional parts when missing", () => {
    const e = newOfferEmail({ ...base, firstName: null, pay: null, deadline: null, note: null });
    expect(e.text.startsWith("Hi,")).toBe(true);
    expect(e.text).not.toContain("You'd earn");
    expect(e.html).not.toContain("A note for you");
  });
});

describe("offerAcceptedEmail / feedbackRequestEmail", () => {
  it("names who accepted which project", () => {
    const e = offerAcceptedEmail({
      studentName: "Maya Patel",
      projectTitle: "Data cleanup",
      url: "https://x/admin/projects/1",
    });
    expect(e.subject).toBe("Offer accepted: Data cleanup");
    expect(e.text).toContain("Maya Patel accepted");
  });

  it("asks the business about the student by first name", () => {
    const e = feedbackRequestEmail({
      contactName: "Dana",
      projectTitle: "Email list cleanup",
      studentFirstName: "Aisha",
      url: "https://x/feedback/token",
    });
    expect(e.subject).toBe("How did Aisha do on Email list cleanup?");
    expect(e.text).toContain("Hi Dana,");
    expect(e.html).toContain('href="https://x/feedback/token"');
  });
});
