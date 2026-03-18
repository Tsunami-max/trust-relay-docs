---
title: Belgian eID Card Validation
sidebar_label: Belgian eID Validation
---

# Belgian eID Card Validation

Trust Relay includes deterministic validation of Belgian electronic identity cards (eID), going beyond visual inspection to verify cryptographic checksums and cross-reference card data against official registries.

## What Gets Validated

When a Belgian identity card is uploaded as part of KYB director verification, Trust Relay automatically runs 10 deterministic checks:

### Checksum Validations (Forgery Detection)

| Check | Algorithm | What It Proves |
|-------|-----------|----------------|
| **Card Number** | Modulo 97 | The 12-digit card number has a valid checksum -- invalid numbers indicate forgery or data entry error |
| **National Register Number** | Modulo 97 (pre/post 2000) | The Rijksregisternummer has a valid checksum -- the strongest single anti-forgery indicator |
| **MRZ Check Digits** (x4) | ICAO 9303, 7-3-1 weighting | The Machine Readable Zone on the back of the card passes all four international check digits |

### Cross-Reference Validations (Consistency)

| Check | What It Proves |
|-------|----------------|
| **NRN ↔ Date of Birth** | The birth date encoded in the national register number matches the date printed on the card |
| **NRN ↔ Gender** | The gender encoded in the NRN sequential number (odd=male, even=female) matches the card |
| **Name ↔ KBO Director** | The name on the identity card matches the director listing in the Crossroads Bank for Enterprises |
| **Card Expiry** | The card has not expired at the time of verification |
| **Date of Birth Range** | The birth date is within a valid range (not future, not > 120 years ago) |

## How It Works

```
Upload PDF/Image -> Docling OCR -> Field Extraction -> Deterministic Validation -> Findings
```

1. **Document Upload**: The customer uploads a scan or photo of their Belgian eID through the portal
2. **OCR Conversion**: IBM Docling converts the document to structured markdown with full-page OCR
3. **Field Extraction**: Regex patterns extract key fields: name, date of birth, national register number, card number, gender, nationality, and MRZ lines
4. **Deterministic Validation**: Pure mathematical checks -- no LLM involved in validation. Every check is reproducible and auditable.
5. **Cross-Referencing**: Card data is matched against KBO registry data (director name) using Jaro-Winkler similarity matching
6. **Finding Generation**: Each check produces a PASS, FAIL, or INCONCLUSIVE result that feeds into the investigation findings

## Pipeline Integration

The Belgian eID validator is automatically triggered during the `validate_documents` Temporal activity when:

- The case country is **BE** (Belgium)
- A document with requirement ID `director_id` is present
- The document has been converted to markdown by Docling

After the LLM-based document validation runs, the deterministic eID checks execute as a post-validation step. If any check returns a **critical** or **high** severity failure, the LLM's `is_valid` flag is overridden to `false`, ensuring that forged documents cannot pass validation regardless of how convincing they appear visually.

```python
# Simplified flow in validate_documents activity
result = await run_document_validation(...)  # LLM validation

if country.upper() == "BE":
    result = _run_belgian_eid_checks(result, documents, company_name)
```

## EU AI Act Compliance

The Belgian eID validator is **fully deterministic** -- no AI model is involved in the validation mathematics. This satisfies EU AI Act Article 14 (Human Oversight) because:

- Every validation step is mathematically verifiable
- Results are reproducible (same input produces same output, always)
- Each check includes a detailed explanation of what was validated and why it passed or failed
- Failed checks are never suppressed -- they are always reported to the compliance officer

The LLM is used only for **field extraction** from OCR output (interpreting messy OCR text), never for validation decisions.

## Technical Details

### National Register Number (Rijksregisternummer)

Format: `YY.MM.DD-XXX.CC`

- `YYMMDD`: Date of birth
- `XXX`: Sequential counter (odd = male, even = female)
- `CC`: Checksum = `97 - (YYMMDDXXX mod 97)`
- For births in 2000+: `CC = 97 - ((2000000000 + YYMMDDXXX) mod 97)`

### Card Number

Format: `xxx-xxxxxxx-yy` (12 digits)

- Check: `yy = first_10_digits mod 97` (or 97 if remainder is 0)

### MRZ (Machine Readable Zone)

Belgian eID uses TD1 format (3 lines x 30 characters, ICAO 9303 Part 5):

- **Line 1**: `IDBEL` + document number + check digit
- **Line 2**: DOB + check digit + sex + expiry + check digit + nationality + NRN + composite check digit
- **Line 3**: Surname + given names

Check digit algorithm: weighted sum (7, 3, 1 repeating) modulo 10.

### Field Extraction

The `extract_fields_from_markdown()` function handles multilingual Belgian eID labels (Dutch, French, English) using regex patterns:

```python
# Handles "Naam / Name: VALUE", "Nom / Name: VALUE", etc.
name_match = re.search(
    r"(?:Naam|Nom|Name)"
    r"(?:\s*/\s*(?:Name|Nom|Family\s*name|Naam))*"
    r"\s*:\s*"
    r"([A-Za-z\u00c0-\u024f\-' ]+)",
    markdown,
)
```

Extracted fields include: family name, given names, national register number, card number, date of birth, gender, nationality, expiry date, and MRZ lines.

## Severity Levels

| Result | Severity | Action |
|--------|----------|--------|
| Invalid NRN or card number checksum | **CRITICAL** | Strong forgery indicator -- escalate to supervisor |
| MRZ check digit failure | **HIGH** | Possible forgery or poor OCR -- manual verification required |
| NRN/DOB or NRN/gender mismatch | **CRITICAL** | Data inconsistency -- request new document |
| Expired card | **HIGH** | Request current identity document |
| Name mismatch with KBO | **HIGH** | Verify identity -- possible wrong person or name change |
| OCR extraction uncertain | **INCONCLUSIVE** | Manual officer review recommended |

## Test Coverage

The Belgian eID validator has 48 tests covering:

- Card number checksum validation (valid, invalid, edge cases)
- National register number validation (pre-2000, post-2000, invalid)
- MRZ check digit computation (ICAO 9303 algorithm)
- Cross-reference validations (NRN vs DOB, NRN vs gender)
- Expiry and date-of-birth range checks
- Field extraction from multilingual OCR markdown
- End-to-end pipeline integration (extraction + validation)
- Integration with the `validate_documents` Temporal activity
- Forgery detection overriding LLM validation results

All tests are deterministic and run without external dependencies.
