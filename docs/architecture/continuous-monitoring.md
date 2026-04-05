---
sidebar_position: 39
title: "Continuous Monitoring"
description: "Ongoing entity monitoring, scheduled checks, and portfolio-level risk management"
components:
  - app/services/monitoring_check_service.py
  - app/services/monitoring_schedule_service.py
  - app/services/portfolio_service.py
last_verified: 2026-03-30
status: implemented
---

# Continuous Monitoring

Post-onboarding continuous monitoring infrastructure for ongoing entity surveillance. Scheduled checks run at configurable intervals, detecting changes in entity status, sanctions list updates, adverse media, and registry modifications. Portfolio service provides aggregate risk views across monitored entities.

## Components

| Module | Purpose |
|--------|---------|
| `monitoring_check_service.py` | Individual monitoring check execution and result evaluation |
| `monitoring_schedule_service.py` | Scheduling and orchestration of periodic monitoring checks |
| `portfolio_service.py` | Portfolio-level risk aggregation and entity monitoring management |
