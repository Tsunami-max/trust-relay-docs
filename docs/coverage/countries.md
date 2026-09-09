---
title: Country coverage and evaluation limits
description: What Trust Relay implements across 32 selectable countries, what has been observed, and what still needs access, evidence or development.
sidebar_label: Country coverage
audience: public
status: in-progress
last_verified: 2026-09-09
---

# Country coverage and evaluation limits

**Assessment date: 9 September 2026.** Trust Relay has 14 dedicated country providers and
32 selectable case countries. These numbers describe implementation and case intake;
they do not mean that 32 countries have equivalent data access or complete automated
due diligence. No country is described here as comprehensively validated.

This register combines a source-code assessment with a fresh Belgian investigation in
a controlled evaluation environment. It is not a statement that every listed connection
is active in every deployment. Access, subscription entitlements, source freshness and
case evidence must be checked in the environment being evaluated.

Start with the [country table](#country-table), the [Belgian validation](#belgium), or the
[Austrian expansion route](#austria).

## What is shared, and what varies

Case intake, document requests and uploads, investigation orchestration, officer review,
ownership/control computation and audit records are shared capabilities. Their usefulness
depends on the evidence collected. An ownership engine cannot establish an ultimate
beneficial owner without sufficient ownership and identity evidence.

Shared investigation paths include sanctions/PEP screening, adverse-media retrieval,
company enrichment, domain checks, GLEIF identity data and VIES VAT validation where
applicable. These are not dedicated national-register connections. A successful name
search, a source being listed, or an API key being configured does not establish a correct
entity match or a completed check.

National differences include company registers, financial documents, licensing, beneficial
ownership, legal sources, document validation and reporting formats. A merchant is not
automatically a licensed payment institution; licensing requirements depend on actual
activities, role and relevant cross-border permissions.

## How to read a coverage status

Implementation, access, freshness and validation are separate dimensions. For example,
a connector can be implemented while access is unavailable, or return a dated snapshot
that still needs manual confirmation.

| Status | What it establishes |
|---|---|
| Implemented; observed for a specific check | A real response and retained evidence were inspected in the stated evaluation environment. It does not validate other fields or companies. |
| Implemented; access unverified | The caller exists, but account validity, entitlement or connectivity has not been established. |
| Implemented; access not configured | A required connection prerequisite is known to be absent in the evaluated environment. |
| Implemented; request denied or failed | A real request failed. Its cause and the effect on downstream evidence remain explicit. |
| Snapshot-based | The result comes from a bundled dataset, with an age and refresh process, rather than a live register query. |
| Degraded | A path returned less evidence than intended, such as filing records without financial figures. |
| Manual verification required | An officer must obtain and retain evidence; a manual-check flag is not proof that the work was completed. |
| Not implemented or not wired | A required adapter, caller or enforcement step is missing. |
| Not collected for this case | The capability may exist, but this case lacks the evidence, input or completed check. |
| Not applicable / outside scope | Applicability is justified for the business model, or the function is explicitly outside the product boundary. Neither means a successful check. |

## Country table

**Dedicated** means a national provider is wired in code, including where that provider
uses a third-party mirror or HTML parsing. It does not establish current connectivity.
**Shared only** means no dedicated national provider. Generic enrichment or submitted
documents may still contribute evidence.

For financials, **figures path** means an implemented structured-figure channel;
**documents only** means attachments or filing markers without extracted figures.
Neither means that usable financial data was obtained for a particular company.
Generic NorthData financial enrichment may contribute source-labelled figures outside
the national paths below, subject to availability, entitlement and entity matching.

| Country | National company-data implementation | National financial channel | Material boundary |
|---|---|---|---|
| AT Austria | Shared only | No dedicated channel | No native company-register or FMA connector; [phased expansion](#austria) is proposed. |
| BE Belgium | Dedicated: KBO/BCE and Gazette | Figures path: NBB CBSO; degraded in the measured run | National licensing is manual; no dedicated beneficial-owner register fetch in the company profile. |
| BG Bulgaria | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| HR Croatia | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| CY Cyprus | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| CZ Czechia | Dedicated: ARES, RZP, ISIR and Justice.cz | Figures path: financial-document extraction; filing-only fallback | CNB, beneficial-owner and professional/debarment checks use limited snapshots. |
| DK Denmark | Dedicated: CVR data through third-party cvrapi.dk | No national figures retrieved | Owner names are mapped into the provider's director list; no dedicated UBO output. |
| EE Estonia | Dedicated: Äriregister | Figures path: RIK open data; aggregator fallback | Directors are retrieved; no UBO output or authoritative gambling-licence connector. |
| FI Finland | Dedicated: PRH/YTJ | No national figures retrieved | The implemented open-data path does not retrieve directors or UBOs. |
| FR France | Dedicated: INPI RNE, INSEE and BODACC | Documents only: INPI attachments/PDFs | INPI/INSEE need credentials; directors are available through INPI, but no RBE/UBO fetch is implemented. |
| DE Germany | Shared only | No dedicated channel | No Handelsregister provider; reasoning/reporting support is a separate dimension. |
| GR Greece | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| HU Hungary | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| IS Iceland | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| IE Ireland | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| IT Italy | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| LV Latvia | Shared only | No dedicated channel | Regional enforcement-query support does not provide a Latvian registry or UBO connector. |
| LI Liechtenstein | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| LT Lithuania | Dedicated: JAR open data | Separate financial dataset not fetched | Director and ownership datasets are not fetched; national adverse-media query support is separate. |
| LU Luxembourg | Shared only | No dedicated channel | The goAML profile references a missing schema; export must not be offered as validated. |
| MT Malta | Shared only | No dedicated channel | A gambling-register discovery entry is not an authoritative licensing integration. |
| NL Netherlands | Dedicated: KvK; API key required | Figures path: separate Jaarrekeningen fetcher; live access unverified here | Optional director fields; no UBO lookup. Missing KvK access stops the native provider before financial retrieval. |
| NO Norway | Dedicated: Brønnøysund company and roles data | Figures path: Regnskapsregisteret | Directors/roles are retrieved; no UBO output. |
| PL Poland | Dedicated: KRS | Documents only: filing-period markers | Board counts are retained; redacted names are omitted. KRS is not a VAT identifier. |
| PT Portugal | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| RO Romania | Dedicated: ANAF company/VAT data | Figures path: ANAF Bilanț | Directors come from ListaFirme through BrightData, not a direct ONRC connection; no UBO output. |
| SK Slovakia | Dedicated: ORSR HTML parsing | Figures path: RÚZ | Directors are retrieved; no UBO output. HTML parsing needs maintenance. |
| SI Slovenia | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| ES Spain | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| SE Sweden | Shared only | No dedicated channel | National registry and licensing adapters are not implemented. |
| CH Switzerland | Dedicated: Zefix company/person data | No national figures retrieved | Directors are retrieved; no UBO output. |
| GB United Kingdom | Dedicated: Companies House profile, officers and PSCs | Accounts/filing-history endpoint not fetched | Registered API key required. PSC/control bands are retrieved; protected or unidentified states remain limitations. |

## Belgium

Belgium is the first reference for fresh validation, not a blanket full-support claim.
On 9 September, an authorized Belgian high-value-goods investigation reached requirements
review. Retained company, publication and withholding evidence was inspected. A persisted
risk assessment, requirements and review-rule outcomes existed.

The same run exposed material gaps:

- Five NBB filings were recorded, but no structured financial figures were extracted.
  Filing count must not be presented as successful financial analysis.
- The direct NorthData API request was denied while public-page enrichment succeeded.
  This describes that evaluation environment, not every deployment or the cause of denial.
- Ownership relationships were not verified. A completeness label therefore overstated
  what the collected evidence demonstrated.
- Some screening summaries and terminal-state labels disagreed with their detailed
  evidence. The detailed compliance view displayed review requirements and a clear-verdict
  block; no approval control was exercised.
- A Belgian shell-company check failed during execution. A capability declaration alone
  did not establish a completed assessment.

These are product and source-path issues to repair and revalidate. They cannot all be
resolved by buying data access. Customer-document review and a guarded decision journey
remain to be exercised, including under the relevant payments template. A completed
high-value-goods investigation does not validate a payments onboarding template.

For implementation detail, see the [Belgian data layer](../architecture/belgian-data-layer.md).
The dated findings above describe the measured evaluation boundary.

## Czechia

Czechia has dedicated company, establishment, insolvency and financial-document paths.
Its national licensing and beneficial-owner coverage is narrower than those company-data
connections suggest. The reviewed CNB snapshots contain 18 entities and 24 banks/branches
in two separate call paths. The beneficial-owner snapshot contains three entities;
debarment and tax-adviser snapshots contain no entries. The nominal quarterly refresh
periods for CNB and professional/debarment data had elapsed at this assessment date.

A missing snapshot entry cannot establish a clean national-register result. Financial
extraction can produce structured figures, but can also leave filing-only evidence.
A fresh Czech reference investigation is the next validation step; no current end-to-end
Czech validation is claimed by this register.

## Estonia

Estonia has company/director retrieval and a financial path using RIK open data, with an
aggregator fallback. An identity lookup alone does not establish that financials were
collected. The native provider does not return UBOs.

Estonian adverse-media language/query support and a curated registered-office signal are
implemented. They do not amount to a complete enforcement or licensing check. An optional
licence-field parser and gambling-register discovery metadata are present, but no
authoritative gambling-licence connector is established by those declarations. A current
reference investigation and source-specific verification remain necessary.

## Austria

Austria currently uses shared investigation and enrichment paths. No dedicated Austrian
company-register, FMA licensing or national Lex corpus integration is implemented in
this assessment. A selectable Austrian case or a regulatory-dashboard deep link does not
establish Austrian national coverage.

A useful first national increment can use free official sources. Free access still has
conditions, and public search does not necessarily mean an automated API:

| Source | Proposed use | Access and implementation boundary |
|---|---|---|
| Firmenbuch High Value Datasets | Company identity/status, representatives and available accounting documents | Free access requires identity-based enrolment and approval. A new adapter, entity matching and document/field validation are needed. |
| FMA company database | Authorisation and permitted-activity verification | Public search; a supported search API has not been established. Retain officer verification. |
| FMA RSS | Published warnings and licence changes | Free documented feeds; ingestion, history and completeness need implementation and validation. |
| RIS | A selected, versioned Austrian legal corpus | Public documented API; source selection, parsing and integrity checks are still required. |
| GISA | Trade-registration corroboration | Free individual-validation API. V1 needs a known GISA number and holder name; V2 broader search needs an annually renewed key. It is not a bulk/change feed. |
| Ediktsdatei | Insolvency evidence | Public human search; the official automated interface is a separate paid-access route. Manual verification is the first-phase option. |

The [Ministry of Justice describes free HVD access](https://www.bmj.gv.at/service/weiterverwendung-von-informationen.html)
separately from ordinary paid extracts. Accounting documents are not a guarantee of
structured figures, complete filings or disclosure by every company. Other primary
references are the [FMA databases](https://www.fma.gv.at/datenbanken-uebersicht/),
[FMA RSS documentation](https://www.fma.gv.at/rss-feed/),
[RIS API information](https://www.ris.bka.gv.at/UI/Ogd.aspx),
[GISA interface and terms](https://www.bmwet.gv.at/Themen/Unternehmen/GISA_Gewerbeinformationssystem/GISA_Schnittstelle.html)
and the [justice interface register](https://kundmachungen.justiz.gv.at/edikte/km/kmhlp05.nsf/all/iwg-justiz!OpenDocument).

Start with selected legal sources, warnings and an explicit manual licensing/insolvency
route while seeking the required free-source access. Then validate bounded company
lookups, matching, provenance and unavailable/ambiguous outcomes. Restricted WiEReG
beneficial-ownership access remains a separate eligibility and entitlement question.
GISA trade registration is not payment-services authorisation. No complete Austrian
delivery date is promised before access and field coverage are verified.

## Other country-dependent boundaries

**Legal knowledge.** The configured Lex corpus is a selection: 28 EU instruments and
20 national instruments across 12 jurisdictions. The September refresh stored 41 of
48 configured instruments; seven failed or remained policy-disabled. Forty stored
instruments remained unverified under the integrity model. Fresh retrieval does not
establish current or exhaustive legal coverage. Radar summaries are a separate curated
layer; their displayed counts do not establish legal applicability. The normal bridge
from investigation reasoning to Radar context also needs repair.

**Identity documents and language.** Deterministic Belgian eID checks are implemented.
The passport expiry-extraction path must not be described as completed passport checksum
validation. National-number algorithms cover Belgian NRN and Dutch BSN, not all national
IDs. The Dutch iDIN flow is incomplete. Portal translation bundles are English, Czech
and Romanian; country selection does not imply a translated dashboard or generated content.

**Reporting.** goAML profiles exist for BE, CZ, DE, FR, NL, RO, SK and LU. The reporting
jurisdiction can differ from the subject company's country. The LU profile references
a missing schema; seven other profiles use the bundled base schema. This does not
establish acceptance by eight national authorities. The SAR lifecycle records an
officer-supplied filing reference; it does not itself transmit a report to an authority.

**Screening and templates.** Shared sanctions/PEP data does not prove completeness for
every national list. Two screening paths apply different country filters, including a
director check that receives the company's country. This needs reconciliation for
cross-border screening; it has not been established as the cause of any particular
evaluation discrepancy. Some workflow/segment country-scope declarations also lack
consistent runtime enforcement. A template title is not proof of jurisdiction suitability.

## What the next evaluation must demonstrate

Use a company and business model relevant to the evaluator. For each material check,
retain the matched identifiers, source, retrieval time, result and any missing evidence.
Inspect the persisted assessment, customer requirements and detailed review outcomes
together. Verify financial figures against the source document, distinguish ownership
evidence from computed relationships, and keep unresolved candidates unresolved until
adjudication.

Validation should include document review, corrections and the guarded officer decision
journey. A completed pipeline, a passing software test suite or an available source
catalogue cannot replace that evidence. This register is an assessment of implemented
scope and observed limits, not a certification of national legal compliance.
