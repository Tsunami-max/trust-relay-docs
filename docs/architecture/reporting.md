---
sidebar_position: 38
title: "Reporting"
description: "Investigation report generation and data assembly for compliance documentation"
components:
  - app/services/report_service.py
  - app/services/report_data_builder.py
last_verified: 2026-03-30
status: implemented
---

# Reporting

Report generation pipeline that assembles investigation data into structured compliance reports. The report data builder collects findings, evidence, risk scores, and officer decisions into a unified data structure that the report service renders into formatted output.

## Components

| Module | Purpose |
|--------|---------|
| `report_service.py` | Report rendering and output generation |
| `report_data_builder.py` | Data assembly from investigation results, evidence, and decisions |
