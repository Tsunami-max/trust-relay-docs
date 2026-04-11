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

  url: 'https://trust-relay.pages.dev',
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

  plugins: [
    './plugins/architecture-index',
  ],

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
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    mermaid: {
      theme: {light: 'default', dark: 'dark'},
    },
    image: 'img/trustrelay-social.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '',
      logo: {
        alt: 'Trust Relay',
        src: 'img/trustrelay-logo-white.png',
        srcDark: 'img/trustrelay-logo-white.png',
        style: {height: '28px'},
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
          type: 'docSidebar',
          sidebarId: 'methodologySidebar',
          position: 'left',
          label: 'Methodology',
        },
        {
          type: 'docSidebar',
          sidebarId: 'strategySidebar',
          position: 'left',
          label: 'Strategy',
        },
        {
          type: 'docSidebar',
          sidebarId: 'atlasSidebar',
          position: 'left',
          label: 'Atlas Reference',
        },
        {
          type: 'docSidebar',
          sidebarId: 'releasesSidebar',
          position: 'left',
          label: 'Releases',
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
            {
              label: 'Methodology',
              to: '/docs/methodology/overview',
            },
          ],
        },
        {
          title: 'Platform',
          items: [
            {
              label: 'Trust Relay',
              href: 'https://trustrelay.eu',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/Tsunami-max/trust-relay-workflow',
            },
          ],
        },
        {
          title: 'Strategy',
          items: [
            {
              label: 'Why Trust Relay',
              to: '/docs/why-trust-relay',
            },
            {
              label: 'Product Overview',
              to: '/docs/product-overview',
            },
            {
              label: 'Portfolio Audit Mode',
              to: '/docs/portfolio-audit-mode',
            },
            {
              label: 'Competitive Landscape',
              to: '/docs/competitive-landscape',
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
