---
id: 0027-goaml-export
sidebar_position: 28
title: "ADR-0027: GoAML Export"
---

# ADR-0027: GoAML Export with Three-Layer Pipeline and Country Profiles

**Date:** 2026-03-21 (date decision was originally made)
**Status:** Accepted
**Deciders:** Adrian Birlogeanu (Soft4U BV), Claude Code
**Documented retroactively:** 2026-04-03

## Context

Financial Intelligence Units (FIUs) across EU member states require Suspicious Activity Reports (SARs) in goAML XML format, as defined by UNODC's goAML system. When a compliance officer approves a case for escalation, the system must generate a standards-compliant XML file that can be submitted to the relevant national FIU.

Each FIU has jurisdiction-specific requirements layered on top of the base goAML XSD schema. Belgium's CTIF-CFI uses different transaction type enumerations than the Netherlands' FIU-NL. Germany's FIU-DE disables certain optional XML nodes. France's TRACFIN requires a `report_date` variant format. These per-country differences are not captured in the XSD itself -- they are documented in FIU-specific implementation guides.

Trust Relay's internal data model uses Atlas canonical entities (companies, persons, accounts, transactions) with rich metadata from OSINT investigation. These entities have a fundamentally different structure than goAML's XML schema, which uses flat element hierarchies with enumerated type codes. A direct mapping from database rows to XML elements would tightly couple the export to both the database schema and the goAML XSD, making either change expensive.

## Decision

We implement a three-layer export pipeline that separates concerns cleanly:

### Layer 1: Intermediate Representation (IR)
Pydantic models (`GoAMLPerson`, `GoAMLEntity`, `GoAMLAccount`, `GoAMLTransaction`, `GoAMLReport`) that mirror the goAML XSD schema structure. These models serve as the contract between the data mapping layer and the XML serialization layer. Pydantic validation enforces XSD constraints (required fields, enumerated values, string length limits) at the Python level before XML generation.

### Layer 2: Data Mapper
Stateless functions that convert Atlas canonical entities to IR models. Centralized enum translation tables map internal codes to goAML enumerated values (`funds_type`, `conduction_type`, `gender`, `id_type`). The mapper handles data enrichment (e.g., computing `transaction_amount_local` from foreign currency amounts using ECB exchange rates) and data reduction (e.g., flattening nested UBO chains into the flat goAML person structure).

### Layer 3: XML Builder
lxml-based serialization that converts IR models to goAML-compliant XML. Country profiles (TOML configuration files) control per-FIU variations:
- `disabled_nodes`: list of XML elements to omit for a specific FIU
- `use_report_date`: boolean controlling date format variant
- `fiu_id`: the FIU's goAML system identifier
- `currency_code`: default currency for the jurisdiction
- Custom element ordering when FIU implementation guides specify non-standard sequences

25+ validation rules run against the generated XML before export, checking XSD compliance, referential integrity (e.g., every `transaction.from_account` references a declared account), and FIU-specific constraints from the country profile.

## Consequences

### Positive
- The three-layer separation means database schema changes only affect Layer 2 (mapper), goAML XSD changes only affect Layer 1 (IR) and Layer 3 (builder), and FIU-specific changes only affect country profile TOML files
- Pydantic IR models catch data validation errors before XML generation, producing clear Python exceptions rather than malformed XML
- Country profiles are declarative TOML files that non-developers can review and modify, lowering the barrier to adding new FIU jurisdictions
- The same IR models can be reused for future export formats (e.g., if an FIU migrates away from goAML to a REST API)

### Negative
- Three layers add indirection -- tracing a field from database to XML requires following the path through mapper, IR model, and builder
- Country profile TOML files must be kept in sync with FIU implementation guide updates, which are published irregularly and without versioning
- The IR models duplicate some structure from both the Atlas canonical entities and the goAML XSD, creating maintenance overhead when either changes

### Neutral
- The goAML XSD is versioned by UNODC; currently targeting goAML 4.x schema
- Export is triggered by officer action (not automated), ensuring human review before SAR submission
- Generated XML files are stored in MinIO alongside case documents for audit trail purposes

## Alternatives Considered

### Alternative 1: Direct Database to XML Mapping
- Why rejected: Tight coupling between the database schema and goAML XSD means any schema migration (on either side) breaks the export. Adding a new database column or changing a goAML element requires modifying the same code. With 36 ORM models and a complex XSD, this coupling would make both database evolution and XSD version upgrades prohibitively expensive.

### Alternative 2: Single Monolithic XML Builder
- Why rejected: Per-country logic (disabled nodes, date format variants, enum translations) would be scattered throughout the builder as conditional branches. With 27 EU member states as potential targets, this creates an unmaintainable web of `if country == "BE"` checks. Testing a single country's output requires executing the entire builder and filtering mentally for relevant branches.

### Alternative 3: No Country Profiles (Hardcoded per-FIU Logic)
- Why rejected: Each new FIU jurisdiction would require code changes to the XML builder, a test cycle, and a deployment. Declarative TOML profiles allow adding a new country by creating a configuration file, validated against a schema, without touching Python code. This is critical for scaling to multiple EU jurisdictions without proportional engineering effort.
