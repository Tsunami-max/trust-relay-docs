---
id: 0028-white-label-branding
sidebar_position: 29
title: "ADR-0028: White-Label Branding"
---

# ADR-0028: White-Label Branding with Logo Palette Extraction and WCAG AA Enforcement

**Date:** 2026-03-08 (date decision was originally made)
**Status:** Accepted
**Deciders:** Adrian Birlogeanu (Soft4U BV), Claude Code
**Documented retroactively:** 2026-04-03

## Context

Trust Relay is a multi-tenant SaaS platform where each financial institution needs their customer-facing portal to reflect their own brand identity. When a compliance officer sends a portal link to an end customer for document upload, that portal must display the institution's logo, colors, and visual identity -- not Trust Relay's. Without branding, the portal appears as a generic third-party tool, reducing customer trust and completion rates.

Manual color configuration is error-prone. Compliance officers are not designers, and when given a color picker, they frequently produce combinations that fail accessibility standards. In testing, officers chose brand colors for buttons and backgrounds that resulted in text contrast ratios below 2:1 -- well below the WCAG AA minimum of 4.5:1 for normal text. Inaccessible portals are both a usability problem (customers cannot read instructions) and a legal liability under EU accessibility directives.

The branding system must handle the full lifecycle: logo upload, automatic color derivation, accessibility validation, persistence, and runtime loading in the customer portal.

## Decision

We implement automatic palette extraction from uploaded logos with WCAG AA enforcement:

### Palette Extraction Algorithm
1. Load the uploaded logo image and iterate over all pixels
2. Filter out transparent pixels (alpha < 128), grayscale pixels (saturation < 0.1 in HSL), and near-white pixels (lightness > 0.95) -- these are backgrounds and borders, not brand colors
3. Cluster remaining pixels into 30-degree hue buckets in HSL color space (12 buckets total)
4. Select the most vibrant color (highest saturation * count product) from the dominant hue bucket as the primary brand color
5. Derive secondary color by reducing saturation by 20% and increasing lightness by 15%
6. Derive accent color by shifting hue by 30 degrees and adjusting saturation

### WCAG AA Enforcement
Every branding update triggers a contrast validation pass. For each color pair (text on background, button text on button background, link text on page background):
1. Compute the WCAG 2.1 relative luminance contrast ratio
2. If the ratio is below 4.5:1 (normal text) or 3.0:1 (large text / decorative elements), run the contrast adjustment algorithm
3. The adjustment algorithm walks the RGB color space in +/-10 steps along the lightness axis, testing each candidate against the target ratio, and selects the adjusted color closest to the original that meets the 4.5:1 threshold

Manual color overrides are accepted but must also pass WCAG AA validation. The API rejects branding updates that would produce inaccessible color combinations, returning specific contrast ratio violations in the error response.

### Storage
- Logo files are stored in MinIO at `{tenant_id}/branding/logo.{ext}`
- Branding configuration (primary, secondary, accent colors, font preference, corner radius) is persisted in the `tenants.branding` JSONB column
- The customer portal loads branding via `GET /api/portal/{token}` which includes the tenant's branding configuration and a presigned URL for the logo

## Consequences

### Positive
- Automatic palette extraction eliminates the need for compliance officers to manually select colors, reducing configuration time from minutes to seconds
- WCAG AA enforcement guarantees accessible portals regardless of brand colors, eliminating accessibility violations as a class of bugs
- Logo-derived colors ensure visual coherence between the logo and the portal color scheme without design expertise
- The rejection of non-compliant manual overrides prevents officers from accidentally creating inaccessible portals

### Negative
- The palette extraction algorithm can produce unexpected results for logos with multiple equally dominant hue clusters -- the "most vibrant" heuristic may not match the institution's primary brand color
- The 30-degree hue bucket granularity means similar but distinct brand colors (e.g., navy blue at 220 degrees and royal blue at 235 degrees) are merged into the same bucket
- WCAG AA contrast adjustment can shift colors noticeably from the original brand guidelines, which may not satisfy institutions with strict brand compliance requirements

### Neutral
- Branding is tenant-scoped; each tenant has independent branding configuration
- Logo files share the MinIO bucket with case documents, requiring care during bucket cleanup operations to avoid deleting branding assets (see memory/feedback_minio_cleanup.md)
- The branding API is accessible to tenant administrators; compliance officers inherit their tenant's branding without per-user configuration

## Alternatives Considered

### Alternative 1: Manual Color Picker Only
- Why rejected: Testing demonstrated that compliance officers consistently produce inaccessible color combinations when given free-form color selection. A manual-only approach would require either accepting WCAG violations (unacceptable for a compliance platform) or adding a separate validation step that rejects their choices after the fact (frustrating UX). Automatic extraction with optional manual override provides a better default while preserving flexibility.

### Alternative 2: Client-Side Palette Extraction
- Why rejected: Browser-based color extraction using Canvas API produces inconsistent results across browsers and operating systems due to differences in color space handling and image decoding. More critically, client-side extraction cannot enforce WCAG AA validation before the branding is saved -- the server would receive already-computed colors with no guarantee of accessibility compliance.

### Alternative 3: Fixed Brand Templates (Choose from 5 Themes)
- Why rejected: Financial institutions have distinct brand identities that cannot be reduced to 5 generic themes. A template-based approach would fail the first time an institution's brand colors do not match any available template. The whole point of white-label branding is that the portal looks like the institution's own tool, not a generic themed page.
