type LegalSubsection = { heading: string; paragraphs?: string[]; list?: string[] };
type LegalSection = { heading: string; paragraphs?: string[]; list?: string[]; subsections?: LegalSubsection[] };

type LegalPageContent =
  | { draft: true; title: string; body: string[] }
  | { draft: false; title: string; lastUpdated: string; reviewNote?: string; sections: LegalSection[] };

const CONTENT: Record<"privacy" | "terms" | "refund", LegalPageContent> = {
  // Drafted from Mindcafe's actual platform operations (data collected,
  // third-party processors, prepaid-only checkout, etc. — verified
  // against the live product/checkout/booking code, not generic
  // boilerplate). Unlike refund (sourced from a counsel-drafted document),
  // this hasn't had a lawyer's sign-off yet — reviewNote says so on the
  // page itself rather than silently presenting it as final.
  privacy: {
    draft: false,
    title: "Privacy policy",
    lastUpdated: "5 August 2026",
    reviewNote: "Drafted in-house from how the Platform actually operates — recommended for a formal legal review before treating it as final.",
    sections: [
      {
        heading: "1. Introduction",
        paragraphs: [
          "This Privacy Policy explains what personal data Mindcafe collects when you use our website and Platform — including Feelz (our mood-strip products), our counselling booking service, and Scan & Order (QR-linked ordering at partner Zostel properties) — and how we use, share, and protect it.",
          "Sneh Care Club Private Limited, a company registered under the Companies Act, 2013, having its registered office at Shop No 5, City Centre, Press Complex, MP Nagar Zone-I, Bhopal, 462001, operates this Platform and is referred to as “we,” “us,” or “Mindcafe.”",
          "By using the Platform, you agree to the collection and use of information as described here.",
        ],
      },
      {
        heading: "2. Information We Collect",
        subsections: [
          {
            heading: "2.1 Information You Provide Directly",
            list: [
              "Account details: name, email, phone number, and gender (optional)",
              "Delivery addresses: full name, phone, address lines, city, state, pincode, and landmark",
              "Guest checkout details: name and phone (email optional), if you order without creating an account",
              "Order information: items purchased, order notes, and coupon codes used",
              "Counselling booking information: therapy category, expert preference, scheduled time, and any notes you add",
              "Intake form responses, if you complete one before a session: age, pronouns, occupation, presenting concern, a description of what brought you in, and your answers to any assessment questions — used only to support the expert preparing for your session",
              "Reviews you choose to submit",
              "Your email address, if you subscribe to our newsletter",
              "Anything you send us directly when contacting support",
            ],
          },
          {
            heading: "2.2 Information Collected Automatically",
            paragraphs: [
              "If you check out as a guest, we store a random session identifier in a browser cookie so your cart persists across visits before you sign in or complete an order — this cookie does not identify you personally on its own.",
              "Our hosting and infrastructure provider may log standard technical information such as IP address and browser/device details, in line with their own security practices.",
            ],
          },
          {
            heading: "2.3 What We Don't Collect",
            paragraphs: [
              "We never see or store your card, UPI, or net banking details. All payments are processed directly by Razorpay, our payment gateway partner — we only receive a payment reference and status back from them.",
            ],
          },
        ],
      },
      {
        heading: "3. How We Use Your Information",
        list: [
          "To process and fulfil your Feelz orders, including delivery or Zostel pickup",
          "To process payments securely through Razorpay",
          "To schedule your counselling session and connect you with the expert you booked",
          "To send order, appointment, and account-related notifications (including by email)",
          "To respond to support requests, grievances, and other communications from you",
          "To maintain and improve the Platform",
          "To comply with applicable legal, tax, and regulatory obligations",
        ],
      },
      {
        heading: "4. Sharing Your Information",
        paragraphs: [
          "We do not sell your personal data. We share it only with the service providers needed to run the Platform, and only to the extent necessary for the purpose in question:",
        ],
        list: [
          "Razorpay — to process your payment",
          "Shiprocket — to deliver Feelz orders, using your delivery address and order details",
          "Our database, authentication, and hosting infrastructure provider",
          "Our transactional email provider — to deliver order, appointment, and account emails",
          "The counselling expert you book a session with, limited to what's needed for that session",
        ],
      },
      {
        heading: "5. Counselling & Sensitive Information",
        paragraphs: [
          "If you book a counselling session, information you share during booking or in an intake form — including anything about your mental health or personal circumstances — is used only to support the counselling relationship between you and the expert you're booked with. It is accessible only to you, that expert, and authorised Mindcafe administrators, never shared for marketing or with any other user.",
        ],
      },
      {
        heading: "6. Cookies",
        paragraphs: [
          "We use strictly necessary cookies to keep your guest cart working and to keep you signed in once you log in. We do not currently use third-party advertising or tracking cookies.",
        ],
      },
      {
        heading: "7. Data Retention",
        paragraphs: [
          "We retain your account, order, and appointment information for as long as your account is active, and afterwards for as long as needed to meet our tax, accounting, and other legal obligations. You can request deletion of your account and associated data by contacting us (see Section 13).",
        ],
      },
      {
        heading: "8. Your Rights",
        paragraphs: [
          "Depending on applicable law, including India's Digital Personal Data Protection Act, 2023, you may have the right to access, correct, or request deletion of your personal data, and to withdraw consent for optional communications like our newsletter at any time. To exercise any of these rights, contact us using the details in Section 13.",
        ],
      },
      {
        heading: "9. Data Security",
        paragraphs: [
          "We use reasonable technical and organisational measures to protect your information, and our platform is built around ISO/IEC 27001-aligned information security practices. That said, no method of transmission or storage over the internet is completely secure, and we cannot guarantee absolute security.",
        ],
      },
      {
        heading: "10. Children's Privacy",
        paragraphs: [
          "Our products and services are intended for users who are 18 years of age or older. We do not knowingly collect personal data from children.",
        ],
      },
      {
        heading: "11. Grievance Officer",
        paragraphs: [
          "In accordance with the Information Technology Act, 2000 and applicable data protection rules, the details of our Grievance Officer are:",
          "Name: Rajat Lalwani",
          "Designation: Grievance Officer",
          "Email: feelz@mindcafe.app",
          "We will acknowledge your grievance within 48 hours and aim to resolve it within 30 days of receipt.",
        ],
      },
      {
        heading: "12. Changes to This Policy",
        paragraphs: [
          "We may update this Privacy Policy from time to time. The “Last Updated” date at the top of this page indicates when it was last revised. Continued use of the Platform after changes are posted constitutes acceptance of the updated Policy.",
        ],
      },
      {
        heading: "13. Contact Us",
        paragraphs: [
          "For any privacy-related question or request, contact us at:",
          "Email: feelz@mindcafe.app",
          "Phone / WhatsApp: +91 7566007770",
          "Support Hours: Mon–Sat, 10:00 AM – 6:00 PM IST",
        ],
      },
      {
        heading: "14. Governing Law",
        paragraphs: [
          "This Policy is governed by the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the courts at Bhopal, Madhya Pradesh.",
        ],
      },
    ],
  },
  terms: {
    draft: false,
    title: "Terms of service",
    lastUpdated: "5 August 2026",
    reviewNote: "Drafted in-house from how the Platform actually operates — recommended for a formal legal review before treating it as final.",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        paragraphs: [
          "These Terms of Service (“Terms”) govern your use of the Mindcafe website and Platform, including Feelz (our mood-strip products), our counselling booking service, and Scan & Order. By accessing or using the Platform, you agree to be bound by these Terms. If you don't agree, please don't use the Platform.",
        ],
      },
      {
        heading: "2. About Us",
        paragraphs: [
          "Sneh Care Club Private Limited, a company registered under the Companies Act, 2013, having its registered office at Shop No 5, City Centre, Press Complex, MP Nagar Zone-I, Bhopal, 462001, operates this Platform and is referred to as “we,” “us,” or “Mindcafe.”",
        ],
      },
      {
        heading: "3. Eligibility",
        paragraphs: [
          "You must be at least 18 years old and capable of entering into a binding contract under Indian law to use the Platform, place an order, or book a counselling session.",
        ],
      },
      {
        heading: "4. Your Account",
        paragraphs: [
          "You're responsible for keeping your account credentials confidential and for all activity under your account. Please provide accurate information when creating an account, and let us know right away if you suspect unauthorised use. We may suspend or terminate accounts that violate these Terms.",
        ],
      },
      {
        heading: "5. Our Products & Services",
        subsections: [
          {
            heading: "5.1 Feelz",
            paragraphs: [
              "Feelz strips are consumable wellness products, not medicines. They are not intended to diagnose, treat, cure, or prevent any disease, and are not a substitute for professional medical advice. If you're pregnant, nursing, have a medical condition, or are taking other medication, consult a doctor before use.",
            ],
          },
          {
            heading: "5.2 Counselling Services",
            paragraphs: [
              "Our counselling service connects you with independent counselling experts for booked sessions. It is not an emergency, crisis, or psychiatric service. If you are in crisis or experiencing a medical or mental health emergency, please contact a local emergency service or crisis helpline immediately rather than booking a session.",
            ],
          },
          {
            heading: "5.3 Scan & Order",
            paragraphs: [
              "Scan & Order lets guests at partner Zostel properties order Feelz products via a QR code, for pickup at that property.",
            ],
          },
        ],
      },
      {
        heading: "6. Orders, Pricing & Payment",
        paragraphs: [
          "All prices are listed in Indian Rupees (INR). We reserve the right to correct pricing errors and to cancel any order affected by one (see our Refund & Cancellation Policy).",
          "Full payment is required upfront, via Razorpay, before any order or counselling session is confirmed — we do not currently offer cash on delivery or pay-later options.",
        ],
      },
      {
        heading: "7. Delivery & Pickup",
        paragraphs: [
          "Feelz orders are delivered via our courier partner to serviceable pincodes, or made available for pickup at a partner Zostel property you select at checkout or through Scan & Order. Delivery timelines shown at checkout are estimates, not guarantees.",
        ],
      },
      {
        heading: "8. Cancellations & Refunds",
        paragraphs: [
          "Order cancellations, returns, and refunds are governed by our separate Refund & Cancellation Policy, which forms part of these Terms.",
        ],
      },
      {
        heading: "9. Counselling Session Terms",
        paragraphs: [
          "Sessions are booked for a specific date, time, and expert. Rescheduling or cancelling a session is subject to the availability shown on the Platform at the time. We do not guarantee any particular outcome from a counselling session, and our counselling service is not a substitute for emergency psychiatric or medical care.",
        ],
      },
      {
        heading: "10. Acceptable Use",
        paragraphs: ["When using the Platform, you agree not to:"],
        list: [
          "Provide false information when creating an account, placing an order, or booking a session",
          "Attempt to access another user's account or data without authorisation",
          "Behave abusively toward our experts, staff, or other users",
          "Use the Platform for any fraudulent, unlawful, or unauthorised commercial purpose, including reselling Feelz products without our consent",
        ],
      },
      {
        heading: "11. Reviews & User Content",
        paragraphs: [
          "By submitting a review or other content to the Platform, you confirm it reflects your own genuine experience, and you grant Mindcafe a non-exclusive licence to display it on the Platform.",
        ],
      },
      {
        heading: "12. Intellectual Property",
        paragraphs: [
          "The Mindcafe and Feelz names, logos, and all content on the Platform are the property of Sneh Care Club Private Limited or its licensors, and may not be used without our prior written permission.",
        ],
      },
      {
        heading: "13. Third-Party Services",
        paragraphs: [
          "Payments, delivery, and hosting on the Platform are handled by third-party providers (including Razorpay, our delivery courier partner, and our infrastructure provider), each of whom has their own terms and policies governing their part of the service.",
        ],
      },
      {
        heading: "14. Disclaimers",
        paragraphs: [
          "The Platform is provided “as is,” without warranties of any kind beyond what applicable law requires. Feelz products are not intended to diagnose, treat, cure, or prevent any disease, and our counselling service does not replace professional psychiatric or medical treatment.",
        ],
      },
      {
        heading: "15. Limitation of Liability",
        paragraphs: [
          "To the maximum extent permitted by law, Mindcafe's total liability arising from your use of the Platform, an order, or a counselling session is limited to the amount you paid for that specific order or session.",
        ],
      },
      {
        heading: "16. Grievance Officer",
        paragraphs: [
          "In accordance with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000, the details of our Grievance Officer are:",
          "Name: Rajat Lalwani",
          "Designation: Grievance Officer",
          "Email: feelz@mindcafe.app",
          "We will acknowledge your grievance within 48 hours and aim to resolve it within 30 days of receipt.",
        ],
      },
      {
        heading: "17. Changes to These Terms",
        paragraphs: [
          "We may update these Terms from time to time. The “Last Updated” date at the top of this page indicates when they were last revised. Continued use of the Platform after changes are posted constitutes acceptance of the updated Terms.",
        ],
      },
      {
        heading: "18. Governing Law & Dispute Resolution",
        paragraphs: [
          "These Terms are governed by the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the courts at Bhopal, Madhya Pradesh.",
        ],
      },
      {
        heading: "19. Contact Us",
        paragraphs: [
          "Questions about these Terms can be sent to:",
          "Email: feelz@mindcafe.app",
          "Phone / WhatsApp: +91 7566007770",
          "Support Hours: Mon–Sat, 10:00 AM – 6:00 PM IST",
        ],
      },
    ],
  },
  // Reviewed copy — sourced verbatim from "Feelz Refund & Cancellation
  // Policy.docx" (drafted/reviewed by counsel; docProps/core.xml lists
  // "Adv. Tushar Choubey" as last editor), not placeholder text.
  refund: {
    draft: false,
    title: "Refund & cancellation policy",
    lastUpdated: "5 August 2026",
    sections: [
      {
        heading: "1. Overview",
        paragraphs: [
          "This Refund & Cancellation Policy (“Policy”) applies to all orders placed for Feelz by Mindcafe products — Focus, Joy, Extrovert, and Rest — purchased through our website, mobile site, or any authorised online channel (“Platform”). Feelz products are consumable wellness items. Please read this Policy carefully before placing an order, as it explains when a cancellation, replacement, or refund is and is not available.",
          "Sneh Care Club Private Limited, a company registered under the Companies Act, 2013, having its registered office at Shop No 5, City Centre, Press Complex, MP Nagar Zone-I, Bhopal, 462001, operates this Platform and is referred to as “we,” “us,” or “Mindcafe.”",
        ],
      },
      {
        heading: "2. Order Cancellation",
        subsections: [
          {
            heading: "2.1 Cancellation by You",
            paragraphs: [
              "You may cancel an order free of charge only before it has been dispatched from our warehouse.",
              "Once an order status changes to “Dispatched” or “Shipped,” it can no longer be cancelled, as the product has left our facility.",
              "To request a cancellation, contact us immediately at feelz@mindcafe.app or +91 7566007770, with your Order ID.",
            ],
          },
          {
            heading: "2.2 Cancellation by Us",
            paragraphs: [
              "We reserve the right to cancel an order in cases of stock unavailability, pricing errors, suspected fraud, or an undeliverable address.",
              "If we cancel your order after payment has been captured, the full amount will be refunded to your original payment method within the timeline in Section 5, at no cost to you.",
            ],
          },
        ],
      },
      {
        heading: "3. Returns Policy",
        paragraphs: [
          "Feelz products are consumable nutraceutical melt-in-mouth wellness strips. For hygiene and food-safety reasons, we do not accept returns once an order has been delivered, except where the product is damaged, defective, expired on arrival, or you received the wrong item (see Section 4). We are unable to accept returns on the following grounds:",
        ],
        list: [
          "Change of mind after the order has been placed or delivered",
          "Product opened, used, or partially consumed",
          "Dislike of taste, flavour, or personal preference",
          "Order delayed due to circumstances beyond our reasonable control (e.g., courier delays, force majeure)",
        ],
      },
      {
        heading: "4. Damaged, Defective, or Wrong Item Received",
        paragraphs: ["We inspect every order before dispatch, but if something goes wrong in transit or fulfilment, we will make it right."],
        subsections: [
          {
            heading: "4.1 Eligibility",
            list: [
              "The outer packaging or product is visibly damaged, tampered, leaking, or crushed on arrival",
              "The product received is expired, or has less than 30 days of shelf life remaining at the time of delivery",
              "You received the wrong Feelz variant, wrong quantity, or an item you did not order",
            ],
          },
          {
            heading: "4.2 Reporting Window",
            paragraphs: [
              "You must report the issue within 48 hours of delivery. Claims raised after this window may not be honoured, as we cannot verify the condition of the product beyond this period.",
            ],
          },
          {
            heading: "4.3 What We Need From You",
            list: [
              "Your Order ID",
              "Clear photos (and, where possible, an unboxing video) of the damaged/incorrect product and the outer packaging/shipping label",
              "A brief description of the issue, sent to feelz@mindcafe.app",
            ],
          },
          {
            heading: "4.4 Resolution",
            paragraphs: [
              "Once verified, we will offer, at our discretion, a free replacement of the affected item(s) or a full refund of the amount paid for the affected item(s).",
            ],
          },
        ],
      },
      {
        heading: "5. Refund Process & Timelines",
        paragraphs: [
          "Approved refunds are processed to the original payment method (card, UPI, net banking, wallet) used at checkout.",
          "Refunds are initiated within 3–5 business days of approval and may take an additional 5–10 business days to reflect in your account, depending on your bank or payment provider.",
          "For orders paid via Cash on Delivery (if offered), refunds will be processed via bank transfer / UPI and may require you to share your bank details.",
          "No cancellation or processing fee is charged for refunds arising from our error (damaged, defective, wrong, or cancelled-by-us orders).",
        ],
      },
      {
        heading: "6. Non-Refundable Items",
        list: [
          "Products that have been opened, consumed, or used, other than for the damaged/defective/wrong-item scenario above",
          "Promotional or free items included with an order",
          "Gift cards or store credit, once issued, unless required by law",
        ],
      },
      {
        heading: "7. How to Reach Us",
        paragraphs: [
          "For any cancellation, refund, or return-related query, please contact our support team:",
          "Email: feelz@mindcafe.app",
          "Phone / WhatsApp: +91 7566007770",
          "Support Hours: Mon–Sat, 10:00 AM – 6:00 PM IST",
          "For unresolved grievances, you may escalate to our Grievance Officer (see Section 8).",
        ],
      },
      {
        heading: "8. Grievance Officer",
        paragraphs: [
          "In accordance with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000, the details of our Grievance Officer are:",
          "Name: Rajat Lalwani",
          "Designation: Grievance Officer",
          "Email: feelz@mindcafe.app",
          "We will acknowledge your grievance within 48 hours and aim to resolve it within 30 days of receipt.",
        ],
      },
      {
        heading: "9. Changes to This Policy",
        paragraphs: [
          "We may update this Policy from time to time to reflect changes in our processes or applicable law. The “Last Updated” date at the top of this page indicates when this Policy was last revised. Continued use of the Platform after changes are posted constitutes acceptance of the updated Policy.",
        ],
      },
      {
        heading: "10. Governing Law",
        paragraphs: [
          "This Policy is governed by the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the courts at Bhopal, Madhya Pradesh.",
        ],
      },
    ],
  },
};

function SectionBlock({ section }: { section: LegalSection }) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">{section.heading}</h2>
      {section.paragraphs?.map((p) => (
        <p key={p} className="mt-2 text-sm leading-relaxed text-ink/70">
          {p}
        </p>
      ))}
      {section.list && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink/70">
          {section.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {section.subsections?.map((sub) => (
        <div key={sub.heading} className="mt-4">
          <h3 className="text-sm font-semibold text-ink">{sub.heading}</h3>
          {sub.paragraphs?.map((p) => (
            <p key={p} className="mt-1.5 text-sm leading-relaxed text-ink/70">
              {p}
            </p>
          ))}
          {sub.list && (
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink/70">
              {sub.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// Shared shell for the three legal routes (spec 4.17). refund is reviewed
// copy sourced from a counsel-drafted document (see the comment on its
// CONTENT entry above). privacy/terms are drafted in-house from how the
// Platform actually operates, not fabricated boilerplate, but haven't had
// a lawyer's sign-off — reviewNote surfaces that distinction on the page
// itself rather than presenting either as more final than it is.
export function LegalPage({ type }: { type: "privacy" | "terms" | "refund" }) {
  const content = CONTENT[type];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {content.draft && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
            DRAFT: pending legal review, not final copy.
          </div>
        )}
        <h1 className="font-display text-4xl font-bold text-ink">{content.title}</h1>
        {!content.draft && <p className="mt-2 text-xs font-medium text-ink/50">Last updated: {content.lastUpdated}</p>}
        {!content.draft && content.reviewNote && (
          <p className="mt-3 rounded-xl border border-ink/10 bg-cream/60 px-4 py-2.5 text-xs text-ink/60">{content.reviewNote}</p>
        )}

        {content.draft ? (
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/70">
            {content.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {content.sections.map((section) => (
              <SectionBlock key={section.heading} section={section} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
