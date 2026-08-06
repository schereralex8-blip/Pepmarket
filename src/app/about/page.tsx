import type { Metadata } from "next";
import Link from "next/link";
import { COMMISSION_PCT } from "@/lib/config";

export const metadata: Metadata = {
  title: "About & how we test",
  description:
    "What peptides are, how Pepmarket sources and tests them, how to store them, and the rules we sell under.",
};

const faqs = [
  {
    q: "What actually is a peptide?",
    a: "A short chain of amino acids — the same building blocks as proteins, just far fewer of them. Under roughly 50 amino acids the convention is to call it a peptide; above that, a protein. Because they are the body's own signalling vocabulary, they are heavily studied as research tools for probing specific receptors and pathways.",
  },
  {
    q: "What does 'research use only' mean here?",
    a: "It means exactly what it says. Everything in the catalog is sold as a research chemical for in-vitro and laboratory study by qualified researchers. None of it is a drug, a supplement, or a medical device, none of it has been evaluated by the FDA, and we do not sell it for human or veterinary use. We will not give dosing guidance, and we will not process an order from anyone who tells us they intend to consume it.",
  },
  {
    q: "How do you test what you sell?",
    a: "Every lot is sampled and sent to an independent analytical lab. HPLC establishes purity, mass spectrometry confirms the molecular identity is the compound we ordered and not a cheaper near-match. Both reports are tied to the lot number printed on your vial and emailed to you with the shipping confirmation. If a lot comes back under spec, it does not get listed — we eat it.",
  },
  {
    q: "Why do certificates of analysis matter so much?",
    a: "This is an under-regulated market and a COA is the only thing standing between you and a vial of mannitol. The specific trap to watch for is a supplier who shows one impressive COA on the product page and then ships you lots for years against it. A COA is only meaningful if the lot number on the paper matches the lot number on the glass.",
  },
  {
    q: "How should these be stored?",
    a: "Lyophilised powder is stable for long periods at -20°C and should be protected from light and moisture. Once reconstituted, peptides are far more fragile — refrigerated and used within a short window is the usual research practice. Heat and repeated freeze-thaw cycles are what destroy them. A handling and storage card ships in every box.",
  },
  {
    q: "How fast do orders ship?",
    a: "Orders placed before 2pm ET on a business day go out the same day, cold-packed in an insulated mailer, from our US facility. You get tracking plus the batch COA at the same time.",
  },
  {
    q: "What if something is wrong with my order?",
    a: "Email us within 30 days. If a vial arrives damaged, warm, or does not match its COA, we replace it or refund it — you do not need to argue with us about it.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-grid border-b border-ink-800">
        <div className="mx-auto max-w-4xl px-5 py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-400">About us</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            We started Pepmarket because we got tired of guessing.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-mist-400">
            Anyone who has ordered research peptides knows the routine: a slick product page, a
            certificate of analysis with no lot number, a vial that arrives warm after four days in
            transit, and no way to tell whether the results you just recorded are real. We built the
            supplier we wanted to buy from — one where the paperwork is specific, the cold chain is
            actually a chain, and the person answering the email has read the assay.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-white">How an order works</h2>
        <ol className="mt-8 space-y-6">
          {[
            {
              title: "We source from vetted synthesis partners",
              body: "We buy from a short list of manufacturers we have audited, and we requalify every one of them annually. New suppliers get test lots before they get purchase orders.",
            },
            {
              title: "Every lot is independently assayed",
              body: "Purity by HPLC, identity by mass spectrometry, run by a lab we do not own. Under-spec lots are rejected outright rather than quietly discounted.",
            },
            {
              title: "Stored cold, packed cold",
              body: "Lyophilised under vacuum and held at -20°C until the moment it is packed into an insulated mailer with a cold pack.",
            },
            {
              title: "COA travels with the vial",
              body: "Your shipping email includes the certificate for the exact lot number printed on your vial. Not a representative sample. Yours.",
            },
          ].map((step, index) => (
            <li key={step.title} className="card flex gap-5 p-6">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-500 font-mono font-bold text-ink-950">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold text-white">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-mist-400">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-16">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Questions we get a lot</h2>
        <div className="mt-8 space-y-4">
          {faqs.map((faq) => (
            <details key={faq.q} className="card group p-6">
              <summary className="cursor-pointer list-none font-semibold text-white marker:hidden">
                <span className="flex items-start justify-between gap-4">
                  {faq.q}
                  <span className="mt-0.5 shrink-0 text-accent-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-mist-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-24">
        <div className="card border-accent-600/30 bg-accent-600/5 p-8">
          <h2 className="text-xl font-semibold text-white">
            Know people who buy peptides? Get paid {COMMISSION_PCT}%.
          </h2>
          <p className="mt-3 leading-relaxed text-mist-400">
            Our affiliate program is how this store grows. No ad budget, no middlemen — just a
            revenue share with the people who send us researchers.
          </p>
          <Link href="/affiliates" className="btn btn-primary mt-6 px-6 py-3">
            See the program
          </Link>
        </div>
      </section>
    </>
  );
}
