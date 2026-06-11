---
sidebar_position: 3
title: "Infrastructure"
description: "The documentation infrastructure is deliberately simple."
---


The documentation infrastructure is deliberately simple. Complexity in documentation tooling is a false economy — the effort spent maintaining custom documentation pipelines is effort not spent writing documentation.

**Docusaurus 3.x** — React-based documentation framework. Chosen for three reasons: Mermaid diagram support (via `@docusaurus/theme-mermaid`), MDX support for interactive components when needed, and a mature ecosystem with versioning, search, and internationalization built in.

**Cloudflare Pages** — Deployment target. Chosen for simplicity: push to the repository triggers a build and deploy. No CI/CD pipeline to maintain, no server to manage, no CDN to configure.

**Same-repo deployment** — The Docusaurus source lives in a `docusaurus/` directory within the application repository. This ensures documentation and code are always at the same commit. When a feature branch is merged, the documentation update lands with the code change. This eliminates the drift that occurs when documentation lives in a separate repository with a separate deployment cycle and a separate set of contributors.

**Mermaid diagrams** — Architecture diagrams, data flow diagrams, and lifecycle diagrams are authored as Mermaid code blocks within Markdown files. This keeps diagrams in version control (unlike image files that are opaque to diff tools), makes them editable by AI (Claude can read and modify Mermaid syntax), and renders them automatically in Docusaurus.

---
