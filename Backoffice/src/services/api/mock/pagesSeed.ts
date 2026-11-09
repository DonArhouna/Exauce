/**
 * Contenu de référence des pages du mock.
 *
 * Reprise fidèle du site public (`https://exauce-one.vercel.app/fr`) : valeurs
 * FR/EN issues de `Backend/app/seed/data/editorial_i18n.json` (doc 15) et de
 * `Backend/app/seed/data/content_data.json`, complétées par les locales
 * `partners.*` du frontend. 11 pages, 27 blocs après migration des en-têtes.
 *
 * Ce fichier ne contient que des données : la mécanique du mock (révisions,
 * workflow, validation) reste dans `pages.ts`.
 */
import type { PageStatus, SectionValues } from '../types';

export interface SeedSection {
  type: string;
  source: string;
  fr: SectionValues;
  en: SectionValues;
  config?: SectionValues;
}

export interface SeedPage {
  key: string;
  template: string;
  nav: number | null;
  system: boolean;
  status: PageStatus;
  banners?: boolean;
  title: [string, string];
  nav_label: [string, string];
  intro: [string, string];
  seo_title: [string, string];
  seo_description: [string, string];
  slug: [string | null, string | null];
  sections: SeedSection[];
}

export const PAGE_SEED: SeedPage[] = [
  {
    "key": "home",
    "template": "home",
    "nav": 0,
    "system": true,
    "status": "published",
    "title": [
      "Accueil",
      "Home"
    ],
    "nav_label": [
      "Accueil",
      "Home"
    ],
    "intro": [
      "",
      ""
    ],
    "seo_title": [
      "EXAUCE Audit & Conseils SAS — Expertise comptable, audit et conseil à Dakar",
      "EXAUCE Audit & Conseils SAS — Accounting, audit and advisory services in Dakar"
    ],
    "seo_description": [
      "Cabinet d’expertise comptable, de conseil, d’audit et de formation à Dakar, Sénégal — membre de l’ONECCA du Sénégal.",
      "Accounting, consulting, audit and training firm in Dakar, Senegal — member of the ONECCA of Senegal."
    ],
    "slug": [
      "",
      ""
    ],
    "sections": [
      {
        "type": "hero",
        "source": "hero",
        "fr": {
          "brand_line1": "EXAUCE",
          "brand_line2": "Audit & Conseils",
          "subtitle": "EXAUCE Audit & Conseils SAS aide ses clients à solutionner leurs problèmes les plus complexes et à améliorer systématiquement leurs performances — tous services basés sur les technologies du numérique."
        },
        "en": {
          "brand_line1": "EXAUCE",
          "brand_line2": "Audit & Conseils",
          "subtitle": "EXAUCE Audit & Conseils SAS helps its clients solve their most complex problems and systematically improve their performance — with every service built on digital technologies."
        },
        "config": {
          "variant": "split"
        }
      },
      {
        "type": "trust_bar",
        "source": "trust_bar",
        "fr": {
          "items": [
            {
              "text": "Inscrite à l'ONECCA du Sénégal"
            },
            {
              "text": "Interventions dans l'espace UEMOA"
            },
            {
              "text": "Conformité aux actes uniformes OHADA"
            },
            {
              "text": "Secteurs public · privé · non-gouvernemental"
            }
          ]
        },
        "en": {
          "items": [
            {
              "text": "Registered with the ONECCA of Senegal"
            },
            {
              "text": "Engagements across the WAEMU area"
            },
            {
              "text": "Compliance with OHADA uniform acts"
            },
            {
              "text": "Public · Private · Non-governmental sectors"
            }
          ]
        }
      },
      {
        "type": "about_preview",
        "source": "about_preview",
        "fr": {
          "kicker": "Qui sommes-nous",
          "title": "Un cabinet créé et dirigé par un expert-comptable",
          "text": "EXAUCE Audit & Conseils SAS est une société d’expertise comptable, de conseil, d’audit et de formation, créée et dirigée par Monsieur Assane KANE, Expert-Comptable et Financier Diplômé, et inscrite à l’Ordre National des Experts Comptables et Comptables Agréés (ONECCA) du Sénégal, au même titre que son fondateur.",
          "cta_label": "Découvrir le cabinet"
        },
        "en": {
          "kicker": "Who we are",
          "title": "A firm founded and led by a chartered accountant",
          "text": "EXAUCE Audit & Conseils SAS is an accounting, consulting, audit and training firm, created and managed by Mr. Assane KANE, Qualified Chartered Accountant and Finance Professional, and registered with the National Order of Chartered Accountants (ONECCA) of Senegal, alongside its founder.",
          "cta_label": "Meet the firm"
        }
      },
      {
        "type": "domains_grid",
        "source": "domains_grid",
        "fr": {
          "kicker": "Accompagnement",
          "title": "Sept domaines, un même niveau d'exigence"
        },
        "en": {
          "kicker": "Support",
          "title": "Seven areas, one standard of excellence"
        }
      },
      {
        "type": "audit_grid",
        "source": "audit_grid",
        "fr": {
          "kicker": "Audit externe",
          "title": "Il faut la certitude, nous la transformons en opinion motivée.",
          "text": "La prise en main des besoins de certitude des clients, aboutissant à l'émission d'une opinion motivée, positive ou négative, sur un aspect de la gestion, selon un périmètre défini par les textes ou par le client lui-même."
        },
        "en": {
          "kicker": "External audit",
          "title": "Our clients need certainty. We deliver a reasoned opinion.",
          "text": "We take charge of our clients' needs for certainty, leading to a reasoned opinion, positive or negative, on an aspect of their management, according to a scope defined by legal texts or by the clients themselves."
        }
      },
      {
        "type": "interventions_grid",
        "source": "interventions_grid",
        "fr": {
          "kicker": "Interventions",
          "title": "Récurrentes ou ponctuelles, toujours innovantes"
        },
        "en": {
          "kicker": "Interventions",
          "title": "Recurring or one-off, always innovative"
        }
      },
      {
        "type": "sectors_grid",
        "source": "sectors_grid",
        "fr": {
          "kicker": "Secteurs",
          "title": "Chaque univers de clientèle a ses règles. Nous les connaissons."
        },
        "en": {
          "kicker": "Sectors",
          "title": "Every client universe has its own rules. We know them all."
        }
      },
      {
        "type": "stats",
        "source": "stats",
        "fr": {
          "kicker": "Le cabinet en un coup d'œil",
          "items": [
            {
              "label": "Domaines d'accompagnement",
              "value": "7"
            },
            {
              "label": "Types d'audit",
              "value": "3"
            },
            {
              "label": "Secteurs couverts",
              "value": "3"
            },
            {
              "label": "Modes d'intervention",
              "value": "2"
            }
          ]
        },
        "en": {
          "kicker": "The firm at a glance",
          "items": [
            {
              "label": "Support areas",
              "value": "7"
            },
            {
              "label": "Audit types",
              "value": "3"
            },
            {
              "label": "Sectors covered",
              "value": "3"
            },
            {
              "label": "Intervention modes",
              "value": "2"
            }
          ]
        }
      },
      {
        "type": "publications_grid",
        "source": "publications_grid",
        "fr": {
          "kicker": "Publications",
          "title": "Le cabinet mis à jour avec ses clients",
          "cta_label": "Voir toutes les publications",
          "empty_text": "Article à venir — première publication en préparation."
        },
        "en": {
          "kicker": "Publications",
          "title": "Keeping pace with our clients",
          "cta_label": "View all publications",
          "empty_text": "Upcoming article — first publication in preparation."
        }
      },
      {
        "type": "cta",
        "source": "cta",
        "fr": {
          "title": "Parlons de votre projet",
          "text": "Récurrente ou ponctuelle, une intervention commence toujours par une conversation. Écrivez-nous ou appelez-nous : nous analysons votre besoin et vous orientons immédiatement.",
          "secondary_label": "Vous pouvez aussi directement nous joindre :"
        },
        "en": {
          "title": "Let’s talk about your project",
          "text": "Recurring or one-off, every engagement begins with a conversation. Write or call us: we analyse your needs and point you in the right direction immediately.",
          "secondary_label": "You can also reach us directly:"
        }
      }
    ]
  },
  {
    "key": "services",
    "template": "standard",
    "nav": 1,
    "system": false,
    "status": "published",
    "title": [
      "Deux grandes familles, une même exigence",
      "Two great families, one standard of excellence"
    ],
    "nav_label": [
      "Services",
      "Services"
    ],
    "intro": [
      "EXAUCE Audit & Conseils SAS aide ses clients à solutionner leurs problèmes les plus complexes et à améliorer systématiquement leurs performances acquises. Tous basés sur les technologies du numérique, nos services d'accompagnement et d'audit externes assurent aux clients une focalisation totale sur leurs compétences et savoir-faire, tout en leur ouvrant la voie vers la nouvelle sphère d'évolution des entreprises.",
      "EXAUCE Audit & Conseils SAS helps its clients solve their most complex problems and systematically improve their acquired performance. All based on digital technologies, our external support and audit services ensure clients a total focus on their skills and know-how, while opening the way to the new sphere of business development."
    ],
    "seo_title": [
      "Services — EXAUCE Audit & Conseils",
      "Services — EXAUCE Audit & Conseils"
    ],
    "seo_description": [
      "",
      ""
    ],
    "slug": [
      "services",
      "services"
    ],
    "sections": [
      {
        "type": "modes",
        "source": "modes",
        "fr": {
          "title": "Trois modes d'accompagnement",
          "items": [
            {
              "title": "Assistance",
              "text": "Nous prenons en compte, de façon intégrale ou partielle, la satisfaction du besoin du client, à tous les niveaux du processus, y compris la mise en œuvre des actions et l'atteinte des objectifs et résultats escomptés."
            },
            {
              "title": "Conseil",
              "text": "Nous apportons au client nos positions, avis et éclairages sur une problématique spécifique, afin de lui permettre d'être dans les conditions les plus favorables à la prise des meilleures décisions."
            },
            {
              "title": "Formation",
              "text": "Nous transférons au client le maximum de compétences et savoir-faire, dans tous les aspects liés à la gestion de son entité, afin de lui permettre d'être suffisamment outillé dans la perspective de son développement durable."
            }
          ]
        },
        "en": {
          "title": "Three modes of support",
          "items": [
            {
              "title": "Assistance",
              "text": "We take into account, in full or in part, the satisfaction of the customer's needs, at all levels of the process, including the implementation of actions and the achievement of objectives and expected results."
            },
            {
              "title": "Advice",
              "text": "We provide the client with our positions, opinions and insights on a specific issue, in order to enable them to be in the most favorable conditions for making the best decisions."
            },
            {
              "title": "Training",
              "text": "We transfer to the client the maximum of skills and know-how, in all aspects related to the management of their entity, in order to allow them to be sufficiently equipped with a view to their sustainable development."
            }
          ]
        }
      },
      {
        "type": "domains_grid",
        "source": "domains_grid",
        "fr": {
          "kicker": "",
          "title": "Nos sept domaines"
        },
        "en": {
          "kicker": "",
          "title": "Our seven areas"
        }
      },
      {
        "type": "audit_grid",
        "source": "audit_grid",
        "fr": {
          "kicker": "",
          "title": "Trois formes d'intervention"
        },
        "en": {
          "kicker": "",
          "title": "Three forms of intervention"
        }
      },
      {
        "type": "cta",
        "source": "cta",
        "fr": {
          "title": "Discutons de votre besoin en {{domain}}",
          "text": "Chaque projet a son contexte. Décrivez-nous votre situation : nous vous répondons avec un éclairage concret et une proposition d'intervention adaptée."
        },
        "en": {
          "title": "Let's discuss your {{domain}} needs",
          "text": "Every project has its own context. Tell us about your situation: we will answer with concrete insight and a suitable engagement proposal."
        }
      }
    ]
  },
  {
    "key": "interventions",
    "template": "standard",
    "nav": 2,
    "system": false,
    "status": "published",
    "title": [
      "Interventions",
      "Interventions"
    ],
    "nav_label": [
      "Interventions",
      "Interventions"
    ],
    "intro": [
      "EXAUCE Audit & Conseils SAS aide ses clients de manière innovante, par le biais d'interventions récurrentes et ponctuelles.",
      "EXAUCE Audit & Conseils SAS helps its clients in an innovative way, through recurring and one-off interventions."
    ],
    "seo_title": [
      "Interventions — EXAUCE Audit & Conseils",
      "Interventions — EXAUCE Audit & Conseils"
    ],
    "seo_description": [
      "",
      ""
    ],
    "slug": [
      "interventions",
      "interventions"
    ],
    "sections": [
      {
        "type": "interventions_compare",
        "source": "compare",
        "fr": {
          "title": "Récurrentes ou ponctuelles : la différence en un coup d'œil",
          "head_label": "Caractéristique",
          "caption": "Reformulation fidèle des deux volets tels qu'ils figurent dans le document de référence. Aucune promesse ajoutée.",
          "rows": [
            {
              "label": "Finalité pour le client",
              "recurring": "Se focaliser au maximum sur ce qu'il sait faire",
              "oneoff": "Être dans les meilleures conditions pour une décision ou la résolution d'un problème spécifique et immédiat"
            },
            {
              "label": "Ressort de l'intervention",
              "recurring": "Externalisation d'activités et de tâches, de façon intégrale ou partielle, relevant de toutes les fonctions clés d'une entité",
              "oneoff": "Intervention outillée dans tous les aspects, pour une réactivité rapide et satisfaisante"
            },
            {
              "label": "Ce que nous adorons",
              "recurring": "Grandir avec nos clients",
              "oneoff": "Apporter notre contribution à l'atteinte des objectifs de nos clients"
            }
          ]
        },
        "en": {
          "title": "Recurring or one-off: the difference at a glance",
          "head_label": "Characteristic",
          "caption": "Faithful reformulation of the two strands as set out in the reference document. No added promises.",
          "rows": [
            {
              "label": "Purpose for the client",
              "recurring": "Focus as much as possible on what they know how to do",
              "oneoff": "Be in the best conditions for a specific and immediate decision or problem solving"
            },
            {
              "label": "Lever of the intervention",
              "recurring": "Full or partial outsourcing of activities and tasks relating to all the key functions of an entity",
              "oneoff": "An intervention equipped in all aspects, for rapid and satisfactory responsiveness"
            },
            {
              "label": "What we love",
              "recurring": "Growing with our clients",
              "oneoff": "Bringing our contribution to the achievement of our clients’ objectives"
            }
          ]
        }
      }
    ]
  },
  {
    "key": "sectors",
    "template": "standard",
    "nav": 3,
    "system": false,
    "status": "published",
    "title": [
      "Secteurs",
      "Sectors"
    ],
    "nav_label": [
      "Secteurs",
      "Sectors"
    ],
    "intro": [
      "",
      ""
    ],
    "seo_title": [
      "Secteurs — EXAUCE Audit & Conseils",
      "Sectors — EXAUCE Audit & Conseils"
    ],
    "seo_description": [
      "",
      ""
    ],
    "slug": [
      "secteurs",
      "sectors"
    ],
    "sections": []
  },
  {
    "key": "publications",
    "template": "standard",
    "nav": 4,
    "system": false,
    "status": "published",
    "title": [
      "Publications",
      "Publications"
    ],
    "nav_label": [
      "Publications",
      "Publications"
    ],
    "intro": [
      "EXAUCE Audit & Conseils SAS aide ses clients dans la mise à jour et à niveau de leurs informations et connaissances, par le biais de publications régulières dans les différents domaines de gestion d'une organisation. Nos services impliquent également la mise à disposition de publications pertinentes dans divers sujets.",
      "EXAUCE Audit & Conseils SAS helps its clients update and upgrade their information and knowledge, through regular publications in the different management areas of an organization. Our services also involve the provision of relevant publications in various subjects."
    ],
    "seo_title": [
      "Publications — EXAUCE Audit & Conseils",
      "Publications — EXAUCE Audit & Conseils"
    ],
    "seo_description": [
      "",
      ""
    ],
    "slug": [
      "publications",
      "publications"
    ],
    "sections": []
  },
  {
    "key": "partners",
    "template": "standard",
    "nav": 5,
    "system": false,
    "status": "published",
    "title": [
      "Nos partenaires",
      "Our partners"
    ],
    "nav_label": [
      "Partenaires",
      "Partners"
    ],
    "intro": [
      "EXAUCE Audit & Conseils SAS développe des partenariats avec des organisations qui partagent ses valeurs d’exigence, d’innovation et de service aux entreprises.",
      "EXAUCE Audit & Conseils SAS develops partnerships with organisations that share its values of excellence, innovation and service to businesses."
    ],
    "seo_title": [
      "",
      ""
    ],
    "seo_description": [
      "",
      ""
    ],
    "slug": [
      "partenaires",
      "partners"
    ],
    "sections": [
      {
        "type": "partners_marquee",
        "source": "marquee",
        "fr": {
          "title": "Ceux qui nous font confiance",
          "intro": "Ils sont à nos côtés dans notre mission de conseil et d’accompagnement."
        },
        "en": {
          "title": "Those who trust us",
          "intro": "They stand by our side in our consulting and support mission."
        }
      },
      {
        "type": "partners_grid",
        "source": "grid",
        "fr": {
          "title": "Nos partenaires",
          "intro": "Découvrez les organisations avec lesquelles nous collaborons pour apporter des solutions complètes à nos clients.",
          "notice": "Les noms et logos présentés sont des exemples de démonstration. Ils ne représentent aucun partenariat réel."
        },
        "en": {
          "title": "Our partners",
          "intro": "Discover the organisations we collaborate with to provide comprehensive solutions to our clients.",
          "notice": "The names and logos shown are demonstration examples. They do not represent any real partnership."
        }
      },
      {
        "type": "cta",
        "source": "cta",
        "fr": {
          "title": "Vous souhaitez devenir partenaire ?",
          "text": "Parlons de votre projet de collaboration.",
          "secondary_label": "Contactez-nous"
        },
        "en": {
          "title": "Would you like to become a partner?",
          "text": "Let’s talk about your collaboration project.",
          "secondary_label": "Contact us"
        }
      }
    ]
  },
  {
    "key": "about",
    "template": "standard",
    "nav": 6,
    "system": false,
    "status": "published",
    "title": [
      "À propos de nous",
      "About us"
    ],
    "nav_label": [
      "À propos de nous",
      "About us"
    ],
    "intro": [
      "EXAUCE Audit & Conseils SAS est une société d’expertise comptable, de conseil, d’audit et de formation, créée et dirigée par Monsieur Assane KANE, Expert-Comptable et Financier Diplômé, et inscrite à l’Ordre National des Experts Comptables et Comptables Agréés (ONECCA) du Sénégal, au même titre que son fondateur.",
      "EXAUCE Audit & Conseils SAS is an accounting, consulting, audit and training firm, created and managed by Mr. Assane KANE, Qualified Chartered Accountant and Finance Professional, and registered with the National Order of Chartered Accountants (ONECCA) of Senegal, alongside its founder."
    ],
    "seo_title": [
      "À propos de nous — EXAUCE Audit & Conseils",
      "About us — EXAUCE Audit & Conseils"
    ],
    "seo_description": [
      "",
      ""
    ],
    "slug": [
      "a-propos",
      "about-us"
    ],
    "sections": [
      {
        "type": "what_we_do",
        "source": "what_we_do",
        "fr": {
          "kicker": "Ce que nous faisons",
          "text": "Tous basés sur les technologies du numérique, nos services d'accompagnement et d'audit externes assurent aux clients une focalisation totale sur leurs compétences et savoir-faire, tout en leur ouvrant la voie vers la nouvelle sphère d'évolution des entreprises."
        },
        "en": {
          "kicker": "What we do",
          "text": "All based on digital technologies, our external support and audit services ensure clients a total focus on their skills and know-how, while opening the way to the new sphere of business evolution."
        }
      },
      {
        "type": "steps",
        "source": "how_we_work",
        "fr": {
          "kicker": "Notre manière de travailler",
          "items": [
            {
              "title": "Un cheminement pas à pas",
              "text": "Nos services d'accompagnement consistent en un cheminement pas à pas, sous forme d'assistance, de conseil et de formation, dans tous les aspects liés à la vie d'une entité, à but lucratif ou non."
            },
            {
              "title": "Pilotes par vos savoir-faire",
              "text": "Nos interventions incluent des engagements récurrents et ponctuels afin de permettre à nos clients de se focaliser au maximum sur ce qu'ils savent faire."
            },
            {
              "title": "Toutes les formes d'organisation",
              "text": "Nous aidons nos clients, quels que soient leurs secteurs d'appartenance, dès lors que les buts poursuivis et les activités menées sont conformes aux lois et règlements nationaux et internationaux. Nos services couvrent les secteurs publics, privés et hybrides."
            }
          ]
        },
        "en": {
          "kicker": "How we work",
          "items": [
            {
              "title": "A step-by-step path",
              "text": "Our support services consist of a step-by-step path, in the form of assistance, advice and training, in all aspects linked to the life of an entity, for-profit or not."
            },
            {
              "title": "Driven by your know-how",
              "text": "Our interventions include recurring and one-off engagements so that our clients can focus as much as possible on what they know how to do."
            },
            {
              "title": "Every kind of organization",
              "text": "We help our clients, whatever their sector, as long as the goals pursued and the activities carried out comply with national and international laws and regulations. Our services span the public, private and mixed sectors."
            }
          ]
        }
      },
      {
        "type": "values_grid",
        "source": "values",
        "fr": {
          "title": "Valeurs du cabinet",
          "empty_text": "Les valeurs du cabinet seront précisées ici — contenu à venir, à valider par le cabinet."
        },
        "en": {
          "title": "Our values",
          "empty_text": "The firm's values will be specified here — content to come, to be validated by the firm."
        }
      },
      {
        "type": "founder_card",
        "source": "founder_card",
        "fr": {
          "kicker": "",
          "empty_text": "Biographie détaillée du fondateur — contenu à venir."
        },
        "en": {
          "kicker": "",
          "empty_text": "Detailed founder biography — content to come."
        }
      }
    ]
  },
  {
    "key": "contact",
    "template": "contact",
    "nav": 7,
    "system": false,
    "status": "published",
    "title": [
      "Contact",
      "Contact"
    ],
    "nav_label": [
      "Contact",
      "Contact"
    ],
    "intro": [
      "",
      ""
    ],
    "seo_title": [
      "Contact — EXAUCE Audit & Conseils",
      "Contact — EXAUCE Audit & Conseils"
    ],
    "seo_description": [
      "Nos implantations et coordonnées directes.",
      "Our locations and direct contact details."
    ],
    "slug": [
      "contact",
      "contact"
    ],
    "sections": [
      {
        "type": "contact_form",
        "source": "contact_form",
        "fr": {
          "intro": "Nos implantations et coordonnées directes.",
          "success_text": "Votre message a bien été envoyé. Nous vous répondrons dans les meilleurs délais."
        },
        "en": {
          "intro": "Our locations and direct contact details.",
          "success_text": "Your message has been sent successfully. We will get back to you as soon as possible."
        }
      },
      {
        "type": "offices_grid",
        "source": "offices_grid",
        "fr": {
          "title": "Nos implantations",
          "intro": "Le cabinet EXAUCE intervient auprès des entreprises et institutions avec son siège à Dakar et un rayonnement sous-régional.",
          "empty_text": "Adresses physiques du cabinet — contenu à venir, à valider par le cabinet.",
          "map_empty_text": "Carte statique — la carte interactive sera activée dès validation des adresses."
        },
        "en": {
          "title": "Our locations",
          "intro": "EXAUCE works alongside companies and institutions, with its head office in Dakar and a sub-regional reach.",
          "empty_text": "Firm physical addresses — content to come, to be validated by the firm.",
          "map_empty_text": "Static map — the interactive map will be enabled once addresses are confirmed."
        }
      }
    ]
  },
  {
    "key": "legal_notice",
    "template": "legal",
    "nav": null,
    "system": true,
    "status": "draft",
    "banners": true,
    "title": [
      "Mentions légales",
      "Legal notice"
    ],
    "nav_label": [
      "Mentions légales",
      "Legal notice"
    ],
    "intro": [
      "",
      ""
    ],
    "seo_title": [
      "Mentions légales — EXAUCE Audit & Conseils",
      "Legal notice — EXAUCE Audit & Conseils"
    ],
    "seo_description": [
      "",
      ""
    ],
    "slug": [
      "mentions-legales",
      "legal-notice"
    ],
    "sections": [
      {
        "type": "legal_document",
        "source": "mentions",
        "fr": {
          "body": "Template provisoire — les informations juridiques exactes (raison sociale complète, forme, RCCM, NINEA, capital social, siège social, N° d'inscription ONECCA, directeur de publication, hébergeur, contacts téléphoniques vérifiés) sont à insérer par le cabinet. Aucune valeur n'a été inventée à ce stade.",
          "banner_text": "À compléter par le cabinet"
        },
        "en": {
          "body": "Provisional template — the exact legal information (full registered name, legal form, RCCM, NINEA, share capital, registered office, registration number at ONECCA, publication director, host, verified contact numbers) is to be inserted by the firm. Nothing has been made up at this stage.",
          "banner_text": "To be completed by the firm"
        }
      },
      {
        "type": "legal_document",
        "source": "privacy",
        "fr": {
          "body": "Template provisoire — documents les données traitées par le site, la base légale de chaque traitement, les durées de conservations, les destinataires, les droits RGPD et le contact du délégué à la protection des données : tout est à préciser par le cabinet.",
          "banner_text": "À compléter par le cabinet"
        },
        "en": {
          "body": "Provisional template — describe the data processed by the website, the legal basis of each processing, retention periods, recipients, GDPR rights and the data protection officer contact: all to be specified by the firm.",
          "banner_text": "To be completed by the firm"
        }
      },
      {
        "type": "legal_document",
        "source": "cookies",
        "fr": {
          "body": "Template provisoire — préciser les traceurs éventuels, leur finalité, le consentement et le refus. Aucune mesure d'audience n'est active sur le site tant que le consentement n'est pas mis en œuvre.",
          "banner_text": "À compléter par le cabinet"
        },
        "en": {
          "body": "Provisional template — specify any trackers, their purpose, consent and refusal. No audience measurement is active on the site until consent is implemented.",
          "banner_text": "To be completed by the firm"
        }
      }
    ]
  },
  {
    "key": "client_area",
    "template": "coming_soon",
    "nav": null,
    "system": false,
    "status": "published",
    "title": [
      "Espace Client",
      "Customer area"
    ],
    "nav_label": [
      "Espace Client",
      "Customer Area"
    ],
    "intro": [
      "",
      ""
    ],
    "seo_title": [
      "Espace Client — EXAUCE",
      "Customer Area — EXAUCE"
    ],
    "seo_description": [
      "",
      ""
    ],
    "slug": [
      "espace-client",
      "customer-area"
    ],
    "sections": []
  },
  {
    "key": "not_found",
    "template": "coming_soon",
    "nav": null,
    "system": true,
    "status": "published",
    "title": [
      "Page introuvable",
      "Page not found"
    ],
    "nav_label": [
      "Page introuvable",
      "Page not found"
    ],
    "intro": [
      "",
      ""
    ],
    "seo_title": [
      "404 — Page introuvable",
      "404 — Page not found"
    ],
    "seo_description": [
      "",
      ""
    ],
    "slug": [
      null,
      null
    ],
    "sections": []
  }
];
