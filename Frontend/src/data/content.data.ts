import type { InterventionType, Location, Publication, PublicationCategory, Sector, ServiceFamily } from '@/types/content';

/**
 * ORGANISATION — informations stables du cabinet (docx, niveau 1).
 * Ne jamais inventer : les valeurs ci-dessous sont celles du document source.
 */
export const ORGANIZATION = {
  name: 'EXAUCE Audit & Conseils SAS',
  email: 'contact@exauceac.com',
  phoneFixed: '+221 33 814 51 24',
  phoneMobile: '+221 77 099 31 83',
  city: 'Dakar',
} as const;

/**
 * BUREAUX & IMPLANTATIONS — prêt pour plusieurs implantations (siège Dakar en premier).
 */
export const OFFICES: Location[] = [
  {
    id: 'siege-dakar',
    isHeadquarters: true,
    name: { fr: 'Siège — Dakar (Sénégal)', en: 'Head Office — Dakar (Senegal)' },
    city: { fr: 'Dakar', en: 'Dakar' },
    phoneFixed: '+221 33 814 51 24',
    phoneMobile: '+221 77 099 31 83',
    email: 'contact@exauceac.com',
  },
];

/**
 * SERVICES — familles (niveau 2), domaines (niveau 3), groupes de prestations (niveau 4).
 * Contenus repris fidèlement du docx, coquilles corrigées (les tirets « - » du
 * docx sont remplacés par des espaces insécables typographiques là où utile).
 */
export const SERVICES: [ServiceFamily, ServiceFamily] = [
  {
    id: 'accompagnement',
    slug: { fr: 'accompagnement', en: 'support' },
    title: { fr: 'Accompagnement', en: 'Support' },
    tagline: { fr: '(Assistance, Conseil, Formation)', en: '(Assistance, Advice, Training)' },
    intro: {
      fr: "Nos services d'accompagnement consistent en un cheminement pas à pas, sous forme d'assistance, de conseil et de formation, dans tous les aspects liés à la vie d'une entité, à but lucratif ou non.",
      en: 'Our support services consist of a step-by-step path, in the form of assistance, advice and training, in all aspects linked to the life of an entity, for-profit or not.',
    },
    domains: [
      {
        id: 'gouvernance',
        slug: { fr: 'gouvernance', en: 'governance' },
        title: { fr: 'Gouvernance', en: 'Governance' },
        intro: {
          fr: "EXAUCE accompagne aussi bien les associés que les administrateurs à jouer pleinement leurs rôles dans la gouvernance de leurs organisations.",
          en: 'EXAUCE supports both shareholders and administrators in fully playing their roles in the governance of their organizations.',
        },
        groups: [
          {
            id: 'niveau-associes',
            slug: { fr: 'niveau-associes', en: 'shareholders-level' },
            title: { fr: 'Niveau Associés', en: 'Shareholders Level' },
            intro: {
              fr: "EXAUCE accompagne les propriétaires dans la mise en œuvre de l'intégralité des actions de gouvernance de leurs entités, par le biais de la structuration, l'organisation et le fonctionnement des diverses instances qui leur sont dévolues.",
              en: 'EXAUCE supports owners in the implementation of all the governance actions of their entities, through the structuring, organization and operation of the various bodies assigned to them.',
            },
            items: [
              { fr: 'Structuration des assemblées des associés', en: "Structuring of shareholders' meetings" },
              { fr: 'Organisation des assemblées des associés', en: "Organization of shareholders' meetings" },
              { fr: 'Fonctionnement des assemblées des associés', en: "Operation of shareholders' meetings" },
              { fr: 'Formation des associés', en: 'Shareholder training' },
            ],
          },
          {
            id: 'niveau-administrateurs',
            slug: { fr: 'niveau-administrateurs', en: 'administrators-level' },
            title: { fr: 'Niveau Administrateurs', en: 'Administrators Level' },
            intro: {
              fr: "EXAUCE accompagne également les administrateurs dans l'exercice de leur rôle délégué par les propriétaires, par le biais de la structuration, l'organisation et le fonctionnement des diverses instances qui leur sont dévolues.",
              en: 'EXAUCE also supports administrators in exercising their role delegated by the owners, through the structuring, organization and operation of the various bodies assigned to them.',
            },
            items: [
              { fr: "Structuration des organes d'administration", en: 'Structuring of administrative bodies' },
              { fr: "Organisation des organes d'administration", en: 'Organization of administrative bodies' },
              { fr: "Fonctionnement des organes d'administration", en: 'Operation of administrative bodies' },
              { fr: 'Formation des administrateurs', en: 'Board members training' },
            ],
          },
        ],
      },
      {
        id: 'organisation-strategie',
        slug: { fr: 'organisation-strategie', en: 'organization-strategy' },
        title: { fr: 'Organisation & Stratégie', en: 'Organization & Strategy' },
        intro: {
          fr: "EXAUCE accompagne toutes les organisations dans la réflexion, la planification et la mise en œuvre en matière d'organisation et de stratégie.",
          en: 'EXAUCE supports all organizations in reflection, planning and implementation in terms of organization and strategy.',
        },
        groups: [
          {
            id: 'strategie-inter-entreprise',
            slug: { fr: 'strategie-inter-entreprise', en: 'inter-company-strategy' },
            title: { fr: 'Stratégie inter-entreprise', en: 'Inter-company Strategy' },
            intro: {
              fr: 'EXAUCE accompagne les organisations dans tous leurs processus de stratégie concurrentielle.',
              en: 'EXAUCE supports organizations in all their competitive strategy processes.',
            },
            items: [
              { fr: 'Réflexion et analyse stratégiques', en: 'Strategic thinking and analysis' },
              { fr: 'Planification et organisation stratégiques', en: 'Strategic planning and organization' },
              { fr: 'Identification et mise en œuvre des actions stratégiques', en: 'Identification and implementation of strategic actions' },
              { fr: 'Formation des dirigeants', en: 'Training of managers' },
            ],
          },
          {
            id: 'strategie-intra-entreprise',
            slug: { fr: 'strategie-intra-entreprise', en: 'intra-company-strategy' },
            title: { fr: 'Stratégie intra-entreprise', en: 'Intra-company Strategy' },
            intro: {
              fr: 'EXAUCE accompagne également les organisations dans tous leurs processus de stratégie de croissance et développement ou de dégagement.',
              en: 'EXAUCE also supports organizations in all their growth, development or divestment strategy processes.',
            },
            items: [
              { fr: "Acquisition d'entité", en: 'Entity acquisition' },
              { fr: 'Fusion avec d’autres entités', en: 'Merger with other entities' },
              { fr: "Apport partiel d'actif", en: 'Partial asset contribution' },
              { fr: 'Scission en plusieurs entités', en: 'Split into several entities' },
              { fr: "Cession d'entité ou d'activité", en: 'Transfer of entity or activity' },
              { fr: 'Augmentation et réduction de capital', en: 'Capital increase and reduction' },
              { fr: "Plan d'affaires et recherche de financement", en: 'Business plan and search for financing' },
              { fr: 'Formation des administrateurs et dirigeants', en: 'Training of board members and managers' },
            ],
          },
          {
            id: 'organisation-structurelle-fonctionnelle',
            slug: { fr: 'organisation-structurelle-fonctionnelle', en: 'structural-functional-organization' },
            title: { fr: 'Organisation structurelle et fonctionnelle', en: 'Structural and Functional Organization' },
            intro: {
              fr: "EXAUCE accompagne les organisations dans la mise en place de leurs organisations structurelle et fonctionnelle, en adéquation avec leurs objectifs visés et leurs ressources mobilisables.",
              en: 'EXAUCE supports organizations in setting up their structural and functional organizations, in line with their targeted objectives and their available resources.',
            },
            items: [
              { fr: "Structuration et organisation de groupes d'entités", en: 'Structuring and organization of groups of entities' },
              { fr: "Structuration et formalisation d'organigramme", en: 'Structuring and formalizing an organization chart' },
              { fr: 'Répartition des tâches et activités', en: 'Distribution of tasks and activities' },
              { fr: "Calibrage d'effectifs et plans sociaux", en: 'Workforce calibration and social plans' },
              { fr: 'Fiche de poste du personnel', en: 'Staff job descriptions' },
              { fr: 'Formalisation de workflows structurels et fonctionnels', en: 'Formalization of structural and functional workflows' },
              { fr: 'Formation des administrateurs et dirigeants', en: 'Training of board members and managers' },
            ],
          },
        ],
      },
      {
        id: 'audit-controle-interne',
        slug: { fr: 'audit-controle-interne', en: 'audit-internal-control' },
        title: { fr: 'Audit & Contrôle Interne', en: 'Audit & Internal Control' },
        intro: {
          fr: "EXAUCE accompagne tout type d'organisation dans la maîtrise de sa fonction d'audit interne et de son dispositif de contrôle interne.",
          en: 'EXAUCE supports all kinds of organizations in mastering their internal audit function and their internal control system.',
        },
        groups: [
          {
            id: 'fonction-audit-interne',
            slug: { fr: 'fonction-audit-interne', en: 'internal-audit-function' },
            title: { fr: "Fonction d'Audit Interne", en: 'Internal Audit Function' },
            intro: {
              fr: "EXAUCE accompagne les organisations dans la maîtrise de leurs fonctions d'audit interne, dans l'optique de leur assurer une gestion optimale de l'intégralité de leurs risques.",
              en: 'EXAUCE supports organizations in mastering their internal audit functions, with a view to ensuring optimal management of all their risks.',
            },
            items: [
              { fr: "Constitution et mise en place de comités d'audit au sein des organes d'administration", en: 'Establishment of audit committees within administrative bodies' },
              { fr: "Constitution et mise en place de la fonction d'audit interne", en: 'Establishment and implementation of the internal audit function' },
              { fr: "Externalisation intégrale de la fonction d'audit interne", en: 'Full outsourcing of the internal audit function' },
              { fr: "Externalisation de tâches relevant de la fonction d'audit interne", en: 'Outsourcing of tasks relating to the internal audit function' },
              { fr: 'Élaboration, refonte ou mise à jour de cartographies des risques', en: 'Development, redesign or update of risk mappings' },
              { fr: "Élaboration, refonte ou mise à jour du manuel d'audit interne", en: 'Development, redesign or updating of internal audit guidelines' },
              { fr: 'Formation des administrateurs, dirigeants et employés', en: 'Training of board members, managers and employees' },
            ],
          },
          {
            id: 'systeme-controle-interne',
            slug: { fr: 'systeme-controle-interne', en: 'internal-control-system' },
            title: { fr: 'Système de Contrôle Interne', en: 'Internal Control System' },
            intro: {
              fr: "EXAUCE accompagne également les organisations dans la mise sur pied d'un dispositif performant de contrôle interne, dans la perspective de leur assurer une maîtrise permanente de l'intégralité de leurs risques et à tous les niveaux.",
              en: 'EXAUCE also supports organizations in setting up an efficient internal control system, with a view to ensuring permanent control of all their risks and at all levels.',
            },
            items: [
              { fr: 'Élaboration, refonte ou mise à jour de manuels des normes et procédures', en: 'Development, redesign or updating of standards and procedures manuals' },
              { fr: 'Formalisation de workflows de contrôle', en: 'Formalization of control workflows' },
              { fr: 'Élaboration d’un document de formalisation des incompatibilités de tâches', en: 'Development of a document formalizing task incompatibilities' },
              { fr: 'Formation des administrateurs, dirigeants et employés', en: 'Training of board members, managers and employees' },
            ],
          },
        ],
      },
      {
        id: 'systeme-information',
        slug: { fr: 'systeme-information', en: 'information-system' },
        title: { fr: "Système d'Information", en: 'Information System' },
        intro: {
          fr: "EXAUCE accompagne les organisations de toute sorte dans la possession d'un système d'information le plus performant possible.",
          en: 'EXAUCE supports all kinds of organizations in having the most efficient information system possible.',
        },
        groups: [
          {
            id: 'application-logicielle',
            slug: { fr: 'application-logicielle', en: 'software-application' },
            title: { fr: 'Application Logicielle', en: 'Software Application' },
            intro: {
              fr: "EXAUCE accompagne les organisations dans la satisfaction de leurs besoins de disponibilité d'applications logicielles leur facilitant les traitements afférents à une fonction donnée.",
              en: 'EXAUCE supports organizations in meeting their software application availability needs to facilitate processing relating to a given function.',
            },
            items: [
              { fr: 'Implémentation de logiciels comptables et financiers', en: 'Implementation of accounting and financial software' },
              { fr: 'Implémentation de logiciels de gestion de trésorerie', en: 'Implementation of cash management software' },
              { fr: 'Implémentation de logiciels de gestion commerciale (achats, ventes, stocks, production)', en: 'Implementation of commercial management software (purchasing, sales, inventory, production)' },
              { fr: "Implémentation de logiciels de compilation d'information financière", en: 'Implementation of financial information compilation software' },
              { fr: 'Implémentation de logiciels de gestion des ressources humaines et de traitement de la paye', en: 'Implementation of human resources management and payroll processing software' },
              { fr: 'Mise à disposition de logiciels comptables et financiers', en: 'Provision of accounting and financial software' },
              { fr: 'Mise à disposition de logiciels de gestion de trésorerie', en: 'Provision of cash management software' },
              { fr: 'Mise à disposition de logiciels de gestion commerciale (achats, ventes, stocks, production)', en: 'Provision of commercial management software (purchasing, sales, inventory, production)' },
              { fr: "Mise à disposition de logiciels de compilation d'information financière", en: 'Provision of financial information compilation software' },
              { fr: 'Mise à disposition de logiciels de gestion des ressources humaines et de traitement de la paye', en: 'Provision of human resources management and payroll processing software' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
          {
            id: 'progiciel-gestion-integre',
            slug: { fr: 'progiciel-gestion-integre', en: 'enterprise-resource-planning' },
            title: { fr: 'Progiciel de Gestion Intégré (ERP)', en: 'Enterprise Resource Planning' },
            intro: {
              fr: 'EXAUCE accompagne aussi les organisations dans la satisfaction de leurs besoins de disponibilité de progiciels intégrés de gestion.',
              en: 'EXAUCE also supports organizations in meeting their needs for availability of Enterprise Resource Planning (ERP).',
            },
            items: [
              { fr: 'Implémentation de progiciels intégrés de gestion', en: 'Implementation of Enterprise Resource Planning' },
              { fr: 'Mise à disposition de progiciels intégrés de gestion', en: 'Provision of Enterprise Resource Planning' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
          {
            id: 'dematerialisation-numerisation',
            slug: { fr: 'dematerialisation-numerisation', en: 'dematerialization-digitization' },
            title: { fr: 'Dématérialisation et numérisation', en: 'Dematerialization and Digitization' },
            intro: {
              fr: "EXAUCE accompagne également les organisations dans leur projet de numérisation et de dématérialisation intégrale de leurs activités, impliquant la gestion électronique de documents.",
              en: 'EXAUCE also supports organizations in their digitization and complete dematerialization projects, involving electronic document management.',
            },
            items: [
              { fr: "Implémentation d'applications de dématérialisation", en: 'Implementation of dematerialization applications' },
              { fr: "Mise à disposition d'applications de dématérialisation", en: 'Provision of dematerialization applications' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
        ],
      },
      {
        id: 'gestion-financiere',
        slug: { fr: 'gestion-financiere', en: 'financial-management' },
        title: { fr: 'Gestion Financière', en: 'Financial Management' },
        intro: {
          fr: "EXAUCE accompagne les organisations dans la maîtrise de tous les aspects liés à leur gestion financière.",
          en: 'EXAUCE supports organizations in mastering all aspects related to their financial management.',
        },
        groups: [
          {
            id: 'comptabilite',
            slug: { fr: 'comptabilite', en: 'accounting' },
            title: { fr: 'Comptabilité (générale, analytique, budgétaire)', en: 'Accounting (General, Analytical, Budgetary)' },
            intro: {
              fr: "EXAUCE accompagne les organisations dans la satisfaction de leurs besoins de disponibilité d'un dispositif performant de gestion comptable et financière.",
              en: 'EXAUCE supports organizations in meeting their needs for the availability of an efficient accounting and financial management system.',
            },
            items: [
              { fr: 'Mise en place de systèmes comptables et financiers', en: 'Implementation of accounting and financial systems' },
              { fr: 'Révision de systèmes comptables et financiers', en: 'Review of accounting and financial systems' },
              { fr: 'Externalisation intégrale de la fonction comptable et financière', en: 'Full outsourcing of the accounting and financial function' },
              { fr: 'Externalisation de tâches relevant de la fonction comptable et financière', en: 'Outsourcing of tasks relating to the accounting and financial function' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
          {
            id: 'gestion-operationnelle',
            slug: { fr: 'gestion-operationnelle', en: 'operational-management' },
            title: { fr: 'Opérationnelle (achat, vente, stock, production, trésorerie)', en: 'Operational (Purchase, Sale, Inventory, Production, Treasury)' },
            intro: {
              fr: "EXAUCE accompagne également les organisations dans la satisfaction de leurs besoins de disponibilité d'un dispositif performant de gestion opérationnelle.",
              en: 'EXAUCE also supports organizations in meeting their availability needs for an efficient operational management system.',
            },
            items: [
              { fr: 'Mise en place de systèmes de gestion opérationnelle', en: 'Implementation of operational management systems' },
              { fr: 'Révision de systèmes de gestion opérationnelle', en: 'Review of operational management systems' },
              { fr: 'Externalisation de tâches relevant des fonctions opérationnelles', en: 'Outsourcing of tasks relating to operational functions' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
          {
            id: 'compilation-information-financiere',
            slug: { fr: 'compilation-information-financiere', en: 'financial-information-compilation' },
            title: { fr: "Compilation d'Information Financière", en: 'Compilation of Financial Information' },
            intro: {
              fr: "EXAUCE accompagne les organisations dans la satisfaction de leurs besoins de disponibilité d'informations financières.",
              en: 'EXAUCE supports organizations in meeting their needs for availability of financial information.',
            },
            items: [
              { fr: "Compilation d'informations financières décisionnelles", en: 'Compilation of decision-making financial information' },
              { fr: "Élaboration d'états financiers sociaux", en: 'Preparation of stand-alone financial statements' },
              { fr: "Élaboration d'états financiers combinés ou consolidés", en: 'Preparation of combined or consolidated financial statements' },
              { fr: "Compilation d'informations financières prévisionnelles", en: 'Compilation of forecast financial information' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
          {
            id: 'reporting-financier',
            slug: { fr: 'reporting-financier', en: 'financial-reporting' },
            title: { fr: 'Reporting Financier', en: 'Financial Reporting' },
            intro: {
              fr: "EXAUCE accompagne également les organisations dans la satisfaction de leurs besoins de reporting financier.",
              en: 'EXAUCE also supports organizations in meeting their financial reporting needs.',
            },
            items: [
              { fr: 'Mise en place de systèmes de reporting financier', en: 'Implementation of financial reporting systems' },
              { fr: 'Révision de systèmes de reporting financier', en: 'Review of financial reporting systems' },
              { fr: 'Externalisation intégrale de la fonction de reporting financier', en: 'Full outsourcing of the financial reporting function' },
              { fr: 'Externalisation de tâches relevant de la fonction de reporting financier', en: 'Outsourcing of tasks relating to the financial reporting function' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
        ],
      },
      {
        id: 'juridique-fiscale',
        slug: { fr: 'juridique-fiscale', en: 'legal-tax' },
        title: { fr: 'Juridique et Fiscale', en: 'Legal and Tax' },
        intro: {
          fr: "EXAUCE accompagne toute organisation opérant dans l'espace UEMOA dans sa quête de conformité et d'optimisation en matière légale et réglementaire.",
          en: 'EXAUCE supports any organization operating in the WAEMU area in its quest for compliance and optimization in legal and regulatory matters.',
        },
        groups: [
          {
            id: 'secretariat-juridique',
            slug: { fr: 'secretariat-juridique', en: 'legal-secretariat' },
            title: { fr: 'Secrétariat Juridique', en: 'Legal Secretariat' },
            intro: {
              fr: "EXAUCE accompagne les organisations dans la satisfaction de leurs besoins de conformité légale et réglementaire.",
              en: 'EXAUCE supports organizations in meeting their legal and regulatory compliance needs.',
            },
            items: [
              { fr: 'Externalisation intégrale de la fonction juridique', en: 'Full outsourcing of the legal function' },
              { fr: 'Externalisation de tâches relevant de la fonction juridique', en: 'Outsourcing of tasks relating to the legal function' },
              { fr: "Examen de l'état de conformité aux actes uniformes de l'OHADA", en: 'Examination of the compliance level with OHADA uniform acts' },
              { fr: "Mise en conformité avec les dispositions de l'OHADA", en: 'Bringing into compliance with OHADA provisions' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
          {
            id: 'conformite-fiscale',
            slug: { fr: 'conformite-fiscale', en: 'tax-compliance' },
            title: { fr: 'Conformité Fiscale', en: 'Tax Compliance' },
            intro: {
              fr: 'EXAUCE accompagne aussi les organisations dans la satisfaction de leurs besoins de conformité fiscale.',
              en: 'EXAUCE also supports organizations in meeting their tax compliance needs.',
            },
            items: [
              { fr: 'Externalisation intégrale de la fonction fiscale', en: 'Full outsourcing of the tax function' },
              { fr: 'Externalisation de tâches relevant de la fonction fiscale', en: 'Outsourcing of tasks relating to the tax function' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
          {
            id: 'optimisation-fiscale',
            slug: { fr: 'optimisation-fiscale', en: 'tax-optimization' },
            title: { fr: 'Optimisation Fiscale', en: 'Tax Optimization' },
            intro: {
              fr: "EXAUCE accompagne également les organisations dans la satisfaction de leurs objectifs d'optimisation fiscale.",
              en: 'EXAUCE also supports organizations in meeting their tax optimization objectives.',
            },
            items: [
              { fr: "Examen de l'état d'optimisation fiscale", en: 'Examination of the tax optimization level' },
              { fr: "Identification et exploitation des niches d'optimisation fiscale", en: 'Identification and exploitation of tax optimization niches' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
        ],
      },
      {
        id: 'gestion-rh',
        slug: { fr: 'gestion-ressources-humaines', en: 'human-resources-management' },
        title: { fr: 'Gestion des Ressources Humaines', en: 'Human Resources Management' },
        intro: {
          fr: "EXAUCE accompagne tout type d'organisation implantée dans l'espace UEMOA à la maîtrise de sa fonction clé de gestion des ressources humaines.",
          en: 'EXAUCE supports all kinds of organizations established in the UEMOA area in mastering their key function of human resources management.',
        },
        groups: [
          {
            id: 'secretariat-social',
            slug: { fr: 'secretariat-social', en: 'social-secretariat' },
            title: { fr: 'Secrétariat Social', en: 'Social Secretariat' },
            intro: {
              fr: 'EXAUCE accompagne les organisations dans la satisfaction de leurs besoins de conformité aux réglementations sociales en vigueur.',
              en: 'EXAUCE supports organizations in meeting their compliance needs with current social regulations.',
            },
            items: [
              { fr: 'Interface avec les organismes sociaux', en: 'Interface with social organizations' },
              { fr: "Examen de l'état de conformité à la réglementation sociale", en: 'Examination of the compliance level with social regulations' },
              { fr: 'Mise en conformité avec la réglementation sociale', en: 'Bringing into compliance with social regulations' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
          {
            id: 'grh',
            slug: { fr: 'grh', en: 'hr-management' },
            title: { fr: 'Gestion des Ressources Humaines', en: 'Human Resources Management' },
            intro: {
              fr: 'EXAUCE accompagne aussi les organisations dans la maîtrise de leur fonction de gestion des ressources humaines.',
              en: 'EXAUCE also supports organizations in mastering their human resources management function.',
            },
            items: [
              { fr: 'Externalisation de tâches relevant de la fonction de gestion des ressources humaines', en: 'Outsourcing of tasks relating to the human resources management function' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
          {
            id: 'traitement-paye',
            slug: { fr: 'traitement-de-la-paye', en: 'payroll-processing' },
            title: { fr: 'Traitement de la Paye', en: 'Payroll Processing' },
            intro: {
              fr: 'EXAUCE accompagne également les organisations dans leur obligation de traitement de la paye, en conformité avec la réglementation en la matière.',
              en: 'EXAUCE also supports organizations in their obligation to process payroll, in compliance with the regulations in this area.',
            },
            items: [
              { fr: 'Externalisation intégrale de la fonction de gestionnaire de paye', en: 'Full outsourcing of the payroll manager function' },
              { fr: 'Externalisation de tâches relevant de la fonction de traitement de la paye', en: 'Outsourcing of tasks relating to the payroll processing function' },
              { fr: 'Formation des dirigeants et employés', en: 'Training of managers and employees' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'audit-externe',
    slug: { fr: 'audit-externe', en: 'external-audit' },
    title: { fr: 'Audit externe', en: 'External Audit' },
    tagline: { fr: '', en: '' },
    intro: {
      fr: "Nos services d'audit externe consistent en la prise en main des besoins de certitude des clients, aboutissant à l'émission d'une opinion motivée, positive ou négative, sur un aspect de sa gestion, selon un périmètre défini par les textes législatifs ou réglementaires ou par le client lui-même.",
      en: "Our external audit services consist of handling clients' needs for certainty, leading to the issuance of a reasoned opinion, positive or negative, on an aspect of their management, according to a scope defined by legal or regulatory standards or by the clients themselves.",
    },
    domains: [
      {
        id: 'audit-legal',
        slug: { fr: 'audit-legal', en: 'legal-audit' },
        title: { fr: 'Audit Légal', en: 'Legal Audit' },
        intro: {
          fr: "EXAUCE réalise, au sein de tout type d'organisation, des interventions d'audit requises par les textes législatifs ou réglementaires.",
          en: 'EXAUCE carries out, within all kinds of organizations, audit interventions required by legal or regulatory texts.',
        },
        groups: [],
      },
      {
        id: 'audit-contractuel',
        slug: { fr: 'audit-contractuel', en: 'contractual-audit' },
        title: { fr: 'Audit Contractuel', en: 'Contractual Audit' },
        intro: {
          fr: "EXAUCE réalise, au sein de tout type d'organisation, des interventions d'audit requises par les propriétaires ou dirigeants.",
          en: 'EXAUCE carries out, within all kinds of organizations, audit interventions required by owners or managers.',
        },
        groups: [],
      },
      {
        id: 'examen-limite',
        slug: { fr: 'examen-limite', en: 'limited-review' },
        title: { fr: 'Examen Limité', en: 'Limited Review' },
        intro: {
          fr: "EXAUCE réalise, au sein de tout type d'organisation, des revues ou examens portant sur des aspects spécifiques de la gestion, requis par les propriétaires ou dirigeants.",
          en: 'EXAUCE carries out, within any kind of organization, reviews or examinations relating to specific aspects of management, required by owners or managers.',
        },
        groups: [],
      },
    ],
  },
];

/** INTERVENTIONS — récurrentes / ponctuelles (docx, niveau 2). */
export const INTERVENTIONS: [InterventionType, InterventionType] = [
  {
    id: 'recurrentes',
    slug: { fr: 'recurrentes', en: 'recurring' },
    title: { fr: 'Récurrentes', en: 'Recurring' },
    intro: {
      fr: "Nos interventions incluent des engagements récurrents auprès de nos clients afin de leur permettre de se focaliser au maximum sur ce qu'ils savent faire. Dans cette perspective, nous disposons de tout le nécessaire pour les besoins d'externalisation d'activités et de tâches, de façon intégrale ou partielle, relevant de toutes les fonctions clés d'une entité. A EXAUCE, nous adorons grandir avec nos clients.",
      en: "Our interventions include recurring engagements with our clients to allow them to focus as much as possible on what they know how to do. From this perspective, we have everything necessary to meet the needs of full or partial outsourcing of activities and tasks relating to all the key functions of an entity. At EXAUCE, we love growing with our clients.",
    },
  },
  {
    id: 'ponctuelles',
    slug: { fr: 'ponctuelles', en: 'one-off' },
    title: { fr: 'Ponctuelles', en: 'One-off' },
    intro: {
      fr: "Nos interventions impliquent également des engagements ponctuels auprès de nos clients afin de leur permettre d'être dans les meilleures conditions pour une décision ou la résolution d'un problème spécifique et immédiat. Dans cette perspective, nous sommes suffisamment outillés, dans tous les aspects, pour une réactivité rapide et satisfaisante. A EXAUCE, nous adorons apporter notre contribution à l'atteinte des objectifs de nos clients.",
      en: 'Our interventions also involve one-off engagements with our clients to enable them to be in the best conditions for a specific and immediate decision or problem solving. From this perspective, we are sufficiently equipped, in all aspects, for rapid and satisfactory responsiveness. At EXAUCE, we love bringing our contribution to the achievement of our clients’ objectives.',
    },
  },
];

/** SECTEURS — Public / Privé / Non-gouvernemental (docx, niveau 2 + sous-catégories). */
export const SECTORS: [Sector, Sector, Sector] = [
  {
    id: 'public',
    slug: { fr: 'public', en: 'public' },
    title: { fr: 'Public', en: 'Public' },
    intro: {
      fr: 'Nous intervenons auprès des États et de leurs démembrements, ainsi que de toutes les entités à participation publique intégrale ou majoritaire. A EXAUCE, nous sommes toujours dans les dispositions de contribuer à la réalisation des politiques publiques.',
      en: 'We work with states and their branches, as well as all entities with full or majority public participation. At EXAUCE, we are always ready to contribute to the realization of public policies.',
    },
    categories: [
      { id: 'organisme-inter-gouvernemental', slug: { fr: 'organisme-inter-gouvernemental', en: 'inter-governmental-organization' }, title: { fr: 'Organisme inter-gouvernemental', en: 'Inter-Governmental Organization' } },
      { id: 'demembrement-etat', slug: { fr: 'demembrement-de-letat', en: 'branches-of-the-state' }, title: { fr: "Démembrement de l'État", en: 'Branches of the State' } },
      { id: 'entreprise-publique', slug: { fr: 'entreprise-publique', en: 'public-company' }, title: { fr: 'Entreprise publique', en: 'Public Company' } },
    ],
  },
  {
    id: 'prive',
    slug: { fr: 'prive', en: 'private' },
    title: { fr: 'Privé', en: 'Private' },
    intro: {
      fr: "Nous intervenons aux côtés de tous les agents économiques privés, à toutes les étapes, depuis la formalisation de l'idée de projet jusqu'à leur liquidation effective. A EXAUCE, nous nous tiendrons systématiquement aux côtés des acteurs du secteur privé dans la concrétisation de toutes leurs initiatives et œuvres.",
      en: 'We work alongside all private economic agents, at all stages, from the formalization of the project idea to their effective liquidation. At EXAUCE, we will systematically stand alongside private sector actors in the realization of all their initiatives and actions.',
    },
    categories: [
      { id: 'personne-physique', slug: { fr: 'personne-physique', en: 'physical-person' }, title: { fr: 'Personne physique', en: 'Physical Person' } },
      { id: 'personne-morale', slug: { fr: 'personne-morale', en: 'corporation' }, title: { fr: 'Personne morale', en: 'Corporation' } },
    ],
  },
  {
    id: 'non-gouvernemental',
    slug: { fr: 'non-gouvernemental', en: 'non-governmental' },
    title: { fr: 'Non-gouvernemental', en: 'Non-Governmental' },
    intro: {
      fr: 'Nous rendons également service dans le cadre de toutes les initiatives et actions non-gouvernementales au profit des populations. EXAUCE est plus que jamais engagée à apporter sa contribution à toute initiative non-gouvernementale destinée au bien-être des populations.',
      en: 'We also provide services within the framework of all non-governmental initiatives and actions for the benefit of populations. EXAUCE is more than ever committed to bringing its contribution to any non-governmental initiative intended for the well-being of populations.',
    },
    categories: [
      { id: 'association', slug: { fr: 'association', en: 'association' }, title: { fr: 'Association', en: 'Association' } },
      { id: 'ong', slug: { fr: 'organisation-non-gouvernementale', en: 'non-governmental-organization' }, title: { fr: 'Organisation non-gouvernementale', en: 'Non-Governmental Organization' } },
      { id: 'organisation-societe-civile', slug: { fr: 'organisation-de-la-societe-civile', en: 'civil-society-organization' }, title: { fr: 'Organisation de la société civile', en: 'Civil-Society Organization' } },
      { id: 'fondation', slug: { fr: 'fondation', en: 'foundation' }, title: { fr: 'Fondation', en: 'Foundation' } },
    ],
  },
];

/** Catégories éditoriales des publications du cabinet. */
export const PUBLICATION_CATEGORIES: readonly PublicationCategory[] = [
  'governance',
  'audit',
  'finance',
  'hr',
  'it',
  'legal',
] as const;

/** PUBLICATIONS — placeholders mockés clairement marqués « Exemple » (branchement backend FastAPI prévu). */
export const PUBLICATIONS_MOCK: Publication[] = [
  {
    id: 'pub-1',
    slug: { fr: 'exemple-gouvernance-structure-des-assemblees', en: 'sample-governance-shareholders-meetings' },
    title: { fr: 'Exemple — Gouvernance : la structuration des assemblées', en: 'Sample — Governance: structuring shareholders’ meetings' },
    category: 'governance',
    date: '2025-01-15',
    author: 'Assane KANE', // nom réel du cabinet ; le restant de l'article est un placeholder
    status: 'draft',
    excerpt: {
      fr: 'Exemple de publication (contenu à venir). La structuration, l’organisation et le fonctionnement des assemblées des associés.',
      en: 'Sample publication (content to come). Structuring, organizing and operating shareholders’ meetings.',
    },
  },
  {
    id: 'pub-2',
    slug: { fr: 'exemple-cartographie-des-risques', en: 'sample-risk-mapping' },
    title: { fr: 'Exemple — Cartographie des risques', en: 'Sample — Risk mapping' },
    category: 'audit',
    date: '2025-02-15',
    status: 'draft',
    excerpt: {
      fr: 'Exemple de publication (contenu à venir). Élaboration, refonte ou mise à jour de cartographies des risques.',
      en: 'Sample publication (content to come). Development, redesign or update of risk mappings.',
    },
  },
  {
    id: 'pub-3',
    slug: { fr: 'exemple-reporting-financier', en: 'sample-financial-reporting' },
    title: { fr: 'Exemple — Reporting financier', en: 'Sample — Financial reporting' },
    category: 'finance',
    date: '2025-03-15',
    status: 'draft',
    excerpt: {
      fr: 'Exemple de publication (contenu à venir). Mise en place, révision ou externalisation de la fonction de reporting financier.',
      en: 'Sample publication (content to come). Setting up, reviewing or outsourcing the financial reporting function.',
    },
  },
];

