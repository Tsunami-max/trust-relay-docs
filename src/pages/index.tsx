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
    title: 'Temporal Workflows',
    icon: '\u{1F504}',
    description:
      'Durable, fault-tolerant compliance workflows powered by Temporal. Signal-driven state machine with iterative review loops, automatic retries, and full audit trail.',
    link: '/docs/architecture/temporal-workflows',
  },
  {
    title: 'AI-Powered OSINT',
    icon: '\u{1F50D}',
    description:
      '13 specialized PydanticAI agents orchestrate open-source intelligence gathering. Registry validation, adverse media screening, person verification, and financial health analysis across 4 Belgian official sources.',
    link: '/docs/architecture/osint-pipeline',
  },
  {
    title: 'Knowledge Graph',
    icon: '\u{1F578}\u{FE0F}',
    description:
      'Neo4j-powered entity network analysis detects co-directorship patterns, fraud rings, risk contagion paths, and establishment concentration across all investigated cases.',
    link: '/docs/architecture/knowledge-graph',
  },
  {
    title: 'Evidence Chain',
    icon: '\u{1F512}',
    description:
      'Cryptographic SHA-256 hashing of every data source. Property-level provenance via the ontology layer traces each data point to its exact source, timestamp, and content hash — zero hallucination at the atomic level.',
    link: '/docs/architecture/ontology-layer',
  },
];

function FeatureCard({title, icon, description, link}: FeatureItem): ReactNode {
  return (
    <article className={clsx('col col--6', styles.featureCard)}>
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
          <span className={styles.heroBadge}>Technical Documentation</span>
          <Heading as="h1" className={styles.heroTitle}>
            {siteConfig.title} Architecture
          </Heading>
          <p className={styles.heroSubtitle}>
            Complete technical reference for the enterprise KYB/KYC compliance
            workflow platform. System architecture, decision records, and API
            documentation for engineering teams and technical due diligence.
          </p>
          <nav className={styles.heroActions} aria-label="Quick navigation">
            <Link
              className="button button--primary button--lg"
              to="/docs/architecture/overview">
              Architecture Overview
            </Link>
            <Link
              className="button button--outline button--lg"
              to="/docs/adr/">
              Decision Records
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
            <span className={styles.statValue}>26</span>
            <span className={styles.statLabel}>API Endpoints</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>13</span>
            <span className={styles.statLabel}>AI Agents</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>9</span>
            <span className={styles.statLabel}>Services</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>1,170+</span>
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
      title="Architecture Documentation"
      description="Technical documentation for the Trust Relay enterprise KYB/KYC compliance workflow platform.">
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
