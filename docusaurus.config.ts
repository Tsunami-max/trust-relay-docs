import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Trust Relay',
  tagline: 'Enterprise KYB/KYC Compliance Workflow Platform',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://your-docusaurus-site.example.com',
  baseUrl: '/',

  organizationName: 'trust-relay',
  projectName: 'trust-relay-workflow',

  onBrokenLinks: 'throw',

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/Tsunami-max/trust-relay-workflow/tree/master/docusaurus/trust-relay/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/trustrelay-social.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Trust Relay',
      logo: {
        alt: 'Trust Relay Logo',
        src: 'img/trustrelay-logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'architectureSidebar',
          position: 'left',
          label: 'Architecture',
        },
        {
          type: 'docSidebar',
          sidebarId: 'adrSidebar',
          position: 'left',
          label: 'ADRs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API Reference',
        },
        {
          href: 'https://github.com/Tsunami-max/trust-relay-workflow',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Architecture',
              to: '/docs/architecture/overview',
            },
            {
              label: 'ADR Index',
              to: '/docs/adr/',
            },
            {
              label: 'API Reference',
              to: '/docs/api/overview',
            },
          ],
        },
        {
          title: 'Platform',
          items: [
            {
              label: 'Trust Relay',
              href: 'https://trustrelay.io',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/Tsunami-max/trust-relay-workflow',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Temporal Workflows',
              to: '/docs/architecture/temporal-workflows',
            },
            {
              label: 'OSINT Pipeline',
              to: '/docs/architecture/osint-pipeline',
            },
          ],
        },
      ],
      copyright: `Copyright \u00a9 ${new Date().getFullYear()} Trust Relay. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'bash', 'json', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
