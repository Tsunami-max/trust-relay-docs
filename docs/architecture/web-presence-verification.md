---
sidebar_position: 44
title: "Web Presence Verification"
description: "Website validation, WHOIS lookups, and Verification of Payee (VoP) services"
components:
  - app/services/website_validation_service.py
  - app/services/whois_service.py
  - app/services/vop_service.py
  - app/services/vop_providers/mock.py
last_verified: 2026-03-30
status: implemented
---

# Web Presence Verification

Web presence verification services for validating entity digital footprints. Covers website existence and content validation, WHOIS domain registration analysis, and Verification of Payee (VoP) for payment account holder confirmation.

## Components

| Module | Purpose |
|--------|---------|
| `website_validation_service.py` | Website existence, SSL, and content validation |
| `whois_service.py` | WHOIS domain registration lookup and age analysis |
| `vop_service.py` | Verification of Payee orchestration |
| `vop_providers/mock.py` | Mock VoP provider for development and testing |
