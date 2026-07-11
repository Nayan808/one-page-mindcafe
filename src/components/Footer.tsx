import { AtSign, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="mx-3 mb-3 rounded-2xl border border-ink/10 px-6 py-8 sm:mx-6 sm:mb-6 sm:px-10">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.9fr_1.1fr]">
        <div>
          <p className="font-display text-2xl font-bold lowercase">feelz</p>
          <p className="mt-2 max-w-xs text-sm text-ink/60">
            sublingual mood strips, made by mindcafé, incubated at zo world, distributed by zostel.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">moods</p>
          <ul className="mt-2 space-y-1 text-sm text-ink/70">
            <li>focus</li>
            <li>extrovert</li>
            <li>joy</li>
            <li>rest</li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">fine print</p>
          <ul className="mt-2 space-y-1 text-sm text-ink/70">
            <li>not for medicinal use</li>
            <li>not for children, pregnant women, or those under 18</li>
            <li>fssai compliant · made in india</li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">contact</p>
          <ul className="mt-2 space-y-3 text-sm">
            <li>
              <a href="mailto:team@mindcafe.app" className="flex items-center gap-1.5 text-ink hover:underline">
                <Mail className="h-3.5 w-3.5 text-ink/40" aria-hidden />
                team@mindcafe.app
              </a>
              <span className="mt-0.5 block text-xs text-ink/50">response within 1 business day</span>
            </li>
            <li>
              <a href="tel:+917566007770" className="flex items-center gap-1.5 text-ink hover:underline">
                <Phone className="h-3.5 w-3.5 text-ink/40" aria-hidden />
                +91 75660 07770
              </a>
              <span className="mt-0.5 block text-xs text-ink/50">mon–fri, 9am – 6pm ist</span>
            </li>
            <li>
              <a
                href="https://instagram.com/mindcafeindia"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-ink hover:underline"
              >
                <AtSign className="h-3.5 w-3.5 text-ink/40" aria-hidden />
                @mindcafeindia
              </a>
              <span className="mt-0.5 block text-xs text-ink/50">dm us anytime</span>
            </li>
          </ul>
        </div>
      </div>
      <p className="mt-8 text-xs text-ink/40">
        © 2026 Mindcafe — A Venture of Sneh Care Club Pvt. Ltd. All rights reserved.
      </p>
    </footer>
  );
}
