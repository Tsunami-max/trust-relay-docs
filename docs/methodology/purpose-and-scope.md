---
sidebar_position: 1
title: "Purpose & Scope"
description: "This document specifies the S4U Development Methodology — a systematic approach to AI-assisted software engineering that treats the AI collaborator as a"
---


This document specifies the S4U Development Methodology — a systematic approach to AI-assisted software engineering that treats the AI collaborator as a senior engineer operating under architectural supervision, not as an autocomplete tool or a replacement for engineering judgment.

The methodology was developed through 1,264 commits across 29 calendar days (25 active development days) of AI-assisted development on the Trust Relay compliance platform — a KYB/KYC system targeting EU AI Act, GDPR, and 6AMLD regulatory compliance. The resulting system spans 144,821 lines of production code (69,985 Python, 74,836 TypeScript), 233 API endpoints, 3,769 test functions, 17 Architecture Decision Records, and 31 database migrations. All metrics are independently verifiable; the exact commands to reproduce each number are documented in [appendix-f-evidence.md](appendix-f-evidence).

The audience is a technically advanced engineer evaluating whether this methodology produces results that justify its overhead. The document is structured so that every claim links to verifiable evidence and every practice includes a rationale.

This specification was itself designed using the development lifecycle it describes: brainstormed, specified, planned, implemented, verified, and reviewed — a practical validation of the process.

---
