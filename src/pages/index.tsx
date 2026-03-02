import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: string;
  link: string;
};

const features: FeatureItem[] = [
  {
    title: 'Iterative Compliance Loop',
    icon: '\u{1F504}',
    description:
      'Multi-round investigation workflows orchestrated by Temporal. Customer portal collects documents, AI agents investigate, officers decide, and the loop repeats until resolution — up to 5 iterations within a 60-day timeline.',
    link: '/docs/why-trust-relay',
  },
  {
    title: 'AI-Powered OSINT',
    icon: '\u{1F50D}',
    description:
      '13 specialized PydanticAI agents cross-reference uploaded documents against commercial registries, adverse media, financial databases, and government publications. Discrepancies are flagged with severity classification.',
    link: '/docs/architecture/osint-pipeline',
  },
  {
    title: 'Compliance Memory',
    icon: '\u{1F9E0}',
    description:
      'AI that learns from every officer decision. Per-officer persistent memory captures institutional knowledge with a safety invariant: the system can add scrutiny but never suppress risk signals.',
    link: '/docs/architecture/compliance-memory',
  },
  {
    title: 'Knowledge Graph',
    icon: '\u{1F578}\u{FE0F}',
    description:
      'Neo4j-powered entity network analysis reveals hidden connections: shared directors across shell companies, mail-drop addresses, phoenix patterns, and nominee structures — with full provenance.',
    link: '/docs/architecture/knowledge-graph',
  },
  {
    title: 'EU-Native Architecture',
    icon: '\u{1F1EA}\u{1F1FA}',
    description:
      'Self-hosted deployment with full data sovereignty. SHA-256 evidence chains, tamper-evident audit logs, and deterministic AI safety constraints — built for EU AI Act, AMLA, and GDPR from the ground up.',
    link: '/docs/architecture/security',
  },
  {
    title: '4-Tier Cost Optimization',
    icon: '\u{1F4B0}',
    description:
      'Portfolio scanning at scale: clean entities cost $0.01, flagged entities get full investigation at $0.50. Projected 92-96% savings versus flat-rate screening for a typical 10,000-merchant portfolio.',
    link: '/docs/architecture/tiered-scanning',
  },
];

function FeatureCard({title, icon, description, link}: FeatureItem): ReactNode {
  return (
    <article className={clsx('col col--4', styles.featureCard)}>
      <div className={styles.featureCardInner}>
        <div className={styles.featureIcon} aria-hidden="true">
          {icon}
        </div>
        <Heading as="h3" className={styles.featureTitle}>
          {title}
        </Heading>
        <p className={styles.featureDescription}>{description}</p>
        <Link className={styles.featureLink} to={link}>
          Learn more
        </Link>
      </div>
    </article>
  );
}

function HeroSection(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroContent}>
          <img
            src="/img/trustrelay-logo-full.png"
            alt="Trust Relay"
            className={styles.heroLogo}
            width={180}
            height={180}
          />
          <span className={styles.heroBadge}>Investigation Orchestrator</span>
          <Heading as="h1" className={styles.heroTitle}>
            {siteConfig.title}
          </Heading>
          <p className={styles.heroSubtitle}>
            The compliance investigation platform that closes the loop.
            Automated document collection, AI-powered OSINT cross-referencing,
            iterative review workflows, and a system that learns from every
            officer decision — all self-hosted in your infrastructure.
          </p>
          <nav className={styles.heroActions} aria-label="Quick navigation">
            <Link
              className="button button--primary button--lg"
              to="/docs/why-trust-relay">
              Why Trust Relay
            </Link>
            <Link
              className="button button--outline button--lg"
              to="/docs/architecture/overview">
              Architecture
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

function StatsSection(): ReactNode {
  return (
    <section className={styles.stats} aria-label="Platform statistics">
      <div className="container">
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>88</span>
            <span className={styles.statLabel}>API Endpoints</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>13</span>
            <span className={styles.statLabel}>AI Agents</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>29</span>
            <span className={styles.statLabel}>Services</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>2,236+</span>
            <span className={styles.statLabel}>Tests Passing</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Compliance Investigation Platform"
      description="Trust Relay — the compliance investigation platform that closes the loop. Iterative KYB workflows, AI-powered OSINT, compliance memory, and self-hosted EU data sovereignty.">
      <HeroSection />
      <main>
        <StatsSection />
        <section className={styles.features} aria-label="Key capabilities">
          <div className="container">
            <div className="row">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
