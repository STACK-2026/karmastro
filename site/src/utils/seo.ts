import { siteConfig, fullUrl } from "./config";

interface MetaProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
}

/** Generate meta tags array for <head> */
export function generateMeta(props: MetaProps) {
  const image = props.image || siteConfig.ogImage;
  const imageUrl = image.startsWith("http") ? image : fullUrl(image);

  return {
    title: props.title,
    description: props.description,
    canonical: props.url,
    og: {
      title: props.title,
      description: props.description,
      url: props.url,
      image: imageUrl,
      type: props.type || "website",
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      ...(props.publishedTime && {
        "article:published_time": props.publishedTime,
      }),
      ...(props.modifiedTime && {
        "article:modified_time": props.modifiedTime,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: props.title,
      description: props.description,
      image: imageUrl,
      site: siteConfig.twitterHandle,
    },
  };
}

/** JSON-LD @graph for homepage - GEO-optimized connected entity graph */
export function jsonLdHomepage() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        foundingDate: "2026-04-09",
        areaServed: {
          "@type": "Country",
          name: "France",
        },
        knowsAbout: siteConfig.keywords,
        ...(siteConfig.legal.email && {
          contactPoint: {
            "@type": "ContactPoint",
            email: siteConfig.legal.email,
            contactType: "customer service",
            availableLanguage: "French",
          },
        }),
        // Entity resolution signals for LLMs (ChatGPT, Gemini, Claude) and
        // Google's Knowledge Graph. Only include URLs that currently return
        // 200 to avoid poisoning the entity with dead references.
        sameAs: [
          "https://x.com/karmastro",
          "https://github.com/STACK-2026/karmastro",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        url: siteConfig.url,
        publisher: { "@id": `${siteConfig.url}/#organization` },
        inLanguage: siteConfig.locale,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.url}/blog?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      ...(siteConfig.appUrl
        ? [
            {
              "@type": "WebApplication",
              "@id": `${siteConfig.appUrl}/#application`,
              name: siteConfig.name,
              url: siteConfig.appUrl,
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
              },
              publisher: { "@id": `${siteConfig.url}/#organization` },
            },
          ]
        : []),
    ],
  };
}

import { AUTHORS, authorSlugFor } from "../data/authors";

/** Extract external citations from an article body for schema.org citation[].
 *  We walk markdown links of the form [title](https://…) and keep only
 *  external domains (not karmastro.com nor app.karmastro.com), deduplicated,
 *  capped at 12 to stay within a reasonable JSON-LD payload. */
export function extractCitations(body: string | undefined): Array<{ title: string; url: string }> {
  if (!body) return [];
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();
  const linkRe = /\[([^\]]+?)\]\((https?:\/\/[^)\s]+?)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(body)) !== null) {
    const title = m[1].trim();
    const url = m[2].trim().replace(/[),.]+$/, "");
    const host = url.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
    if (host.endsWith("karmastro.com")) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ title: title.slice(0, 140), url });
    if (out.length >= 12) break;
  }
  return out;
}

/** Word count for the article body. Markdown is already human text so we
 *  just split on whitespace after stripping code fences + tables + links. */
export function countWords(body: string | undefined): number {
  if (!body) return 0;
  const stripped = body
    .replace(/```[\s\S]*?```/g, " ")                 // code fences
    .replace(/`[^`]+`/g, " ")                        // inline code
    .replace(/\[([^\]]+)\]\(https?:[^)]+\)/g, "$1")  // markdown links -> label
    .replace(/[#*_>|~\-=]+/g, " ")                   // md punctuation
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return 0;
  return stripped.split(" ").length;
}

/** JSON-LD for Article with E-E-A-T signals (author Person, reviewedBy, dateModified) */
export function jsonLdArticle(article: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  author?: string;
  keywords?: string[];
  reviewedBy?: string;
  inLanguage?: string;
  /** Raw markdown body. When provided we derive wordCount + citation[]
   *  to help AI Overviews qualify this as deep content. */
  body?: string;
  /** Allow callers to pre-compute wordCount/citations if the body is not
   *  available at the call site (e.g. MDX shortcode pages). */
  wordCount?: number;
  citations?: Array<{ title: string; url: string }>;
}) {
  // Prefer the rich Person entity from src/data/authors when the byline
  // matches a known persona. Unknown authors still get a bare Person with
  // the name Google sees in the article (legacy posts without a tagged
  // author fall through to Organization-as-author).
  const slug = authorSlugFor(article.author);
  const authorEntity = slug
    ? (() => {
        const a = AUTHORS[slug];
        return {
          "@type": "Person",
          "@id": `${siteConfig.url}/guides/${a.slug}#person`,
          name: a.name,
          url: `${siteConfig.url}/guides/${a.slug}`,
          jobTitle: a.jobTitle,
          knowsAbout: a.knowsAbout,
          worksFor: { "@id": `${siteConfig.url}/#organization` },
        };
      })()
    : article.author
      ? {
          "@type": "Person",
          name: article.author,
          url: `${siteConfig.url}/guides`,
        }
      : { "@id": `${siteConfig.url}/#organization` };

  const wordCount = article.wordCount ?? countWords(article.body);
  const citations = article.citations ?? extractCitations(article.body);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: article.url,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    image: article.image
      ? article.image.startsWith("http")
        ? article.image
        : fullUrl(article.image)
      : undefined,
    author: authorEntity,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": article.url },
    keywords: article.keywords?.join(", "),
    inLanguage: article.inLanguage || siteConfig.locale,
    ...(wordCount > 0 && { wordCount }),
    ...(citations.length > 0 && {
      citation: citations.map((c) => ({
        "@type": "CreativeWork",
        name: c.title,
        url: c.url,
      })),
    }),
    ...(article.reviewedBy && {
      reviewedBy: {
        "@type": "Person",
        name: article.reviewedBy,
      },
    }),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", "[data-speakable]"],
    },
  };
}

/** JSON-LD for FAQPage */
export function jsonLdFaq(
  faq: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** JSON-LD for BreadcrumbList */
export function jsonLdBreadcrumbs(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
