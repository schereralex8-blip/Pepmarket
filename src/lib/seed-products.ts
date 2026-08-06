/**
 * Starter catalog. Edit freely — it is only inserted when the products table
 * is empty, so changing it and deleting data/pepmarket.db reseeds the store.
 *
 * Copy deliberately stays at the level of "what this compound is studied for"
 * in the published literature. No dosing, no protocols, no human-use claims —
 * that framing is what keeps a research-chemical catalog on the right side of
 * FDA/FTC marketing rules.
 */

export type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  blurb: string;
  description: string;
  price_cents: number;
  size: string;
  purity: string;
  cas: string | null;
  stock: number;
  featured: number;
};

export const CATEGORIES = [
  "Metabolic Research",
  "Repair & Recovery",
  "Growth Hormone Secretagogues",
  "Neuro & Cognitive",
  "Longevity",
  "Cosmetic Research",
  "Lab Supplies",
] as const;

export const seedProducts: SeedProduct[] = [
  {
    slug: "bpc-157",
    name: "BPC-157",
    category: "Repair & Recovery",
    blurb: "Pentadecapeptide studied for its role in connective and gastrointestinal tissue models.",
    description:
      "BPC-157 is a synthetic 15-amino-acid sequence derived from a protein found in gastric juice. It is one of the most widely cited peptides in preclinical tissue-repair literature, where it appears in studies of tendon, ligament and gastrointestinal mucosa models, frequently in the context of angiogenesis and growth-factor signalling. Supplied lyophilised under vacuum with a batch-matched HPLC and mass-spec certificate of analysis.",
    price_cents: 5900,
    size: "5 mg / vial",
    purity: "≥99%",
    cas: "137525-51-0",
    stock: 140,
    featured: 1,
  },
  {
    slug: "tb-500",
    name: "TB-500 (Thymosin β4 Fragment)",
    category: "Repair & Recovery",
    blurb: "Actin-binding fragment used in cell migration and angiogenesis research.",
    description:
      "TB-500 is the synthetic active fragment of Thymosin Beta-4, a naturally occurring actin-sequestering protein. Research interest centres on its influence over cell migration, actin polymerisation and new blood-vessel formation in wound-healing models. Frequently paired with BPC-157 in comparative preclinical study designs.",
    price_cents: 6900,
    size: "5 mg / vial",
    purity: "≥99%",
    cas: "885340-08-9",
    stock: 96,
    featured: 1,
  },
  {
    slug: "semaglutide",
    name: "Semaglutide",
    category: "Metabolic Research",
    blurb: "Long-acting GLP-1 receptor agonist for metabolic pathway studies.",
    description:
      "Semaglutide is a GLP-1 receptor agonist with a fatty-acid side chain that extends its half-life considerably over native GLP-1. It is a reference compound in incretin-signalling research, appearing in studies of insulin secretion, gastric emptying and energy-balance models. Reconstitution and handling notes ship with every vial.",
    price_cents: 15900,
    size: "5 mg / vial",
    purity: "≥99%",
    cas: "910463-68-2",
    stock: 62,
    featured: 1,
  },
  {
    slug: "tirzepatide",
    name: "Tirzepatide",
    category: "Metabolic Research",
    blurb: "Dual GIP/GLP-1 receptor agonist for comparative incretin work.",
    description:
      "Tirzepatide is a single-molecule dual agonist at both the GIP and GLP-1 receptors, which makes it the standard comparator when researchers want to separate the contributions of the two incretin pathways. Widely referenced in metabolic and adipose-tissue signalling literature.",
    price_cents: 18900,
    size: "10 mg / vial",
    purity: "≥99%",
    cas: "2023788-19-2",
    stock: 48,
    featured: 1,
  },
  {
    slug: "retatrutide",
    name: "Retatrutide",
    category: "Metabolic Research",
    blurb: "Triple GIP/GLP-1/glucagon receptor agonist — current frontier of incretin research.",
    description:
      "Retatrutide adds glucagon-receptor agonism to the dual-incretin profile, and is the compound most cited in recent energy-expenditure research. Newer and less characterised than semaglutide or tirzepatide, which is precisely why it shows up in so many current comparative study designs.",
    price_cents: 22900,
    size: "10 mg / vial",
    purity: "≥98%",
    cas: "2381089-83-2",
    stock: 30,
    featured: 0,
  },
  {
    slug: "ipamorelin",
    name: "Ipamorelin",
    category: "Growth Hormone Secretagogues",
    blurb: "Selective ghrelin receptor agonist with minimal cortisol cross-reactivity in models.",
    description:
      "Ipamorelin is a pentapeptide growth-hormone secretagogue known for its selectivity — in published models it stimulates GH release with little effect on cortisol or prolactin, which makes it a clean tool compound for isolating GH-axis effects.",
    price_cents: 4900,
    size: "5 mg / vial",
    purity: "≥99%",
    cas: "170851-70-4",
    stock: 155,
    featured: 0,
  },
  {
    slug: "cjc-1295-dac",
    name: "CJC-1295 with DAC",
    category: "Growth Hormone Secretagogues",
    blurb: "GHRH analogue with drug affinity complex for extended half-life studies.",
    description:
      "CJC-1295 is a growth-hormone-releasing hormone analogue. The Drug Affinity Complex binds albumin in circulation, extending the half-life from minutes to days in published pharmacokinetic work — the reason it is chosen for studies that need sustained rather than pulsatile GHRH signalling.",
    price_cents: 6500,
    size: "5 mg / vial",
    purity: "≥99%",
    cas: "863288-34-0",
    stock: 88,
    featured: 0,
  },
  {
    slug: "tesamorelin",
    name: "Tesamorelin",
    category: "Growth Hormone Secretagogues",
    blurb: "Stabilised GHRH analogue studied in visceral adipose tissue models.",
    description:
      "Tesamorelin is a synthetic GHRH analogue stabilised against enzymatic degradation. Most of its research footprint sits in visceral adipose tissue and lipid-metabolism studies, where it is used to probe the GH/IGF-1 axis.",
    price_cents: 12900,
    size: "5 mg / vial",
    purity: "≥98%",
    cas: "218949-48-5",
    stock: 40,
    featured: 0,
  },
  {
    slug: "semax",
    name: "Semax",
    category: "Neuro & Cognitive",
    blurb: "ACTH(4-10) analogue used in BDNF and neuroprotection research.",
    description:
      "Semax is a synthetic analogue of a fragment of adrenocorticotropic hormone that does not carry the parent hormone's corticotropic activity. It appears throughout Russian and Eastern European neuroprotection literature, typically in studies measuring BDNF expression and cognitive-task performance in animal models.",
    price_cents: 5500,
    size: "10 mg / vial",
    purity: "≥99%",
    cas: "80714-61-0",
    stock: 74,
    featured: 0,
  },
  {
    slug: "selank",
    name: "Selank",
    category: "Neuro & Cognitive",
    blurb: "Tuftsin analogue studied for anxiolytic and immunomodulatory signalling.",
    description:
      "Selank is a synthetic heptapeptide based on the endogenous immunomodulator tuftsin. Research attention focuses on GABAergic and serotonergic signalling and on its effect on interleukin expression in stress models.",
    price_cents: 5500,
    size: "10 mg / vial",
    purity: "≥99%",
    cas: "129954-34-3",
    stock: 70,
    featured: 0,
  },
  {
    slug: "epitalon",
    name: "Epitalon",
    category: "Longevity",
    blurb: "Tetrapeptide investigated for telomerase activity in cell models.",
    description:
      "Epitalon (Epithalon) is a synthetic tetrapeptide modelled on the pineal peptide epithalamin. It is best known in the longevity literature for studies reporting telomerase activation and circadian-regulation effects in cell and rodent models.",
    price_cents: 4500,
    size: "10 mg / vial",
    purity: "≥99%",
    cas: "307297-39-8",
    stock: 110,
    featured: 0,
  },
  {
    slug: "mots-c",
    name: "MOTS-c",
    category: "Longevity",
    blurb: "Mitochondrial-derived peptide studied in metabolic homeostasis models.",
    description:
      "MOTS-c is encoded in mitochondrial DNA rather than the nuclear genome, which makes it unusual among signalling peptides. Research centres on AMPK activation, insulin sensitivity and exercise-response pathways.",
    price_cents: 7900,
    size: "10 mg / vial",
    purity: "≥98%",
    cas: "1627580-64-6",
    stock: 55,
    featured: 0,
  },
  {
    slug: "ghk-cu",
    name: "GHK-Cu",
    category: "Cosmetic Research",
    blurb: "Copper tripeptide complex used in collagen and skin-model research.",
    description:
      "GHK-Cu is a naturally occurring copper-binding tripeptide whose plasma concentration declines markedly with age. It is a mainstay of dermal research, appearing in studies of collagen synthesis, wound remodelling and antioxidant response in skin models.",
    price_cents: 5200,
    size: "50 mg / vial",
    purity: "≥99%",
    cas: "89030-95-5",
    stock: 90,
    featured: 0,
  },
  {
    slug: "glow-blend",
    name: "GLOW Blend (GHK-Cu / BPC-157 / TB-500)",
    category: "Cosmetic Research",
    blurb: "Pre-measured three-peptide blend for combined dermal study designs.",
    description:
      "A single vial containing GHK-Cu, BPC-157 and TB-500 in fixed ratio, prepared for research groups running combination protocols who would rather not weigh three compounds separately. Certificate of analysis reports each component individually.",
    price_cents: 11900,
    size: "70 mg / vial",
    purity: "≥98%",
    cas: null,
    stock: 45,
    featured: 0,
  },
  {
    slug: "bacteriostatic-water",
    name: "Bacteriostatic Water",
    category: "Lab Supplies",
    blurb: "Sterile diluent with 0.9% benzyl alcohol for reconstituting lyophilised powder.",
    description:
      "Sterile water containing 0.9% benzyl alcohol as a preservative, allowing a reconstituted vial to be drawn from repeatedly over a study period without immediate microbial spoilage. The standard diluent for lyophilised peptide research.",
    price_cents: 1200,
    size: "30 mL vial",
    purity: "USP grade",
    cas: null,
    stock: 300,
    featured: 0,
  },
  {
    slug: "lab-starter-kit",
    name: "Lab Starter Kit",
    category: "Lab Supplies",
    blurb: "Bacteriostatic water, alcohol prep pads, luer-lock syringes and a vial rack.",
    description:
      "Everything a new bench needs alongside a first order: 30 mL bacteriostatic water, 100 alcohol prep pads, 30 luer-lock syringes with removable needles, a 12-position vial rack and a printed handling and storage reference card.",
    price_cents: 3900,
    size: "Kit",
    purity: "—",
    cas: null,
    stock: 120,
    featured: 0,
  },
];
