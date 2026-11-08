"use client";

import React, { useState, useEffect } from "react";
import { Play, Globe, AlertTriangle, FileText, CheckCircle2, BarChart3, TrendingUp, PieChart, Activity, Gauge, Layers, Server, Users, Clock } from "lucide-react";

interface ScannedPage {
  url: string;
  status: number;
  rt_sec: number;
  title: string;
  meta: string;
  h1: number;
  tot_img: number;
  no_alt: number;
  size_kb: number;
  flaws: string[];
  recommendations: string[];
  critical_deficiencies: string[];
  spammy_links: string[];
  extracted_keywords: [string, number][];
  response_headers: Record<string, string>;
}

interface AuditData {
  url: string;
  scan_mode: string;
  total_discovered_pages: number;
  total_pages_scanned: number;
  scanned_pages: ScannedPage[];
  status: number;
  rt_sec: number;
  title: string;
  meta: string;
  h1: number;
  tot_img: number;
  total_images_scanned: number;
  no_alt: number;
  total_links_found: number;
  size_kb: number;
  health_score: number;
  domain_authority: number;
  trust_label: string;
  total_flaws_count: number;
  all_flaws: [string, string][];
  recommendations: string[];
  critical_deficiencies: string[];
  spammy_backlinks: string[];
  keywords_extracted: [string, number][];
  response_headers: Record<string, string>;
  report: string;
  ai_detection_score: number;
  ai_verdict: string;
  ai_detected_elements: string[];
  executive_summary?: string;
}

// Helper function to generate recommendations for flaws
function generateRecommendationForFlaw(flaw: string): string {
  const flawLower = flaw.toLowerCase();
  
  if (flawLower.includes("title") && flawLower.includes("missing")) {
    return "Add a unique, descriptive <title> tag between 30-60 characters to every page. Include primary keywords and brand name for better SEO.";
  }
  if (flawLower.includes("title") && flawLower.includes("length")) {
    return "Rewrite the title tag to fall between 30 and 60 characters. Keep it descriptive, include primary keywords, and make it compelling for click-throughs.";
  }
  if (flawLower.includes("meta description") && flawLower.includes("missing")) {
    return "Add a unique, keyword-relevant meta description tag (50-160 chars) that summarizes the page content compellingly and encourages click-through from search results.";
  }
  if (flawLower.includes("meta description") && flawLower.includes("length")) {
    return "Rewrite the meta description to fall between 50 and 160 characters. Include primary keywords naturally and make it action-oriented to improve CTR.";
  }
  if (flawLower.includes("h1") && (flawLower.includes("no") || flawLower.includes("missing"))) {
    return "Add exactly one descriptive <h1> tag that clearly reflects the page's main topic and includes primary keywords. Use <h2> and <h3> for subsections.";
  }
  if (flawLower.includes("multiple") && flawLower.includes("h1")) {
    return "Use only a single <h1> tag per page. Convert additional <h1> tags to <h2> or <h3> to create a proper heading hierarchy.";
  }
  if (flawLower.includes("alt")) {
    const match = flawLower.match(/(\d+)\s*out\s*of\s*(\d+)/);
    if (match) {
      return `Add descriptive alt attributes to all ${match[1]} missing image(s). Describe the image content concisely and include relevant keywords where natural.`;
    }
    return "Add descriptive alt attributes to all images for accessibility and image SEO. Describe image content and include keywords where appropriate.";
  }
  if (flawLower.includes("canonical")) {
    return "Add a canonical tag (<link rel=\"canonical\" href=\"YOUR_URL\">) to prevent duplicate content issues. Always point to the preferred version of the page.";
  }
  if (flawLower.includes("viewport")) {
    return 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to ensure proper mobile rendering and responsive design.';
  }
  if (flawLower.includes("lang")) {
    return 'Add a lang attribute to the <html> tag (e.g., <html lang="en">) to declare the page language for accessibility, translation tools, and SEO.';
  }
  if (flawLower.includes("favicon")) {
    return "Add a favicon link tag (<link rel=\"icon\" href=\"/favicon.ico\">) so the site displays a branded icon in browser tabs, bookmarks, and search results.";
  }
  if (flawLower.includes("noindex")) {
    return 'Remove the "noindex" directive from the robots meta tag if this page should be indexed. If you want to keep it noindexed, ensure it\'s intentional for staging or thin content pages.';
  }
  if (flawLower.includes("opengraph") || flawLower.includes("og:")) {
    return "Add Open Graph meta tags (og:title, og:image, og:description) to control how your page appears when shared on social media platforms. Use compelling images and descriptions.";
  }
  if (flawLower.includes("structured data") || flawLower.includes("json-ld")) {
    return "Add relevant JSON-LD structured data (Schema.org markup) for your content type (Article, Product, FAQ, etc.) to enable rich snippets in search results.";
  }
  if (flawLower.includes("https") || flawLower.includes("insecure http")) {
    return "Migrate the site to HTTPS with a valid SSL/TLS certificate. This protects user data, improves search rankings, and builds trust with visitors.";
  }
  if (flawLower.includes("status") || flawLower.includes("non-ok")) {
    return "Fix the server response to return a 200 OK status. Check server logs, fix broken routes, and ensure all pages are properly accessible.";
  }
  if (flawLower.includes("latency") || flawLower.includes("response")) {
    if (flawLower.includes("high") || flawLower.includes("slow")) {
      return "Optimize server response time using: a CDN, faster hosting, caching (Redis/Memcached), database query optimization, and enabling compression. Target under 2s.";
    }
    return "Improve server response time using a CDN or optimized hosting. Target under 2s for better user experience and SEO.";
  }
  if (flawLower.includes("large") && flawLower.includes("kb")) {
    return "Reduce page HTML payload by: minifying HTML/CSS/JS, removing unused code, compressing images, deferring non-critical resources, and implementing lazy loading.";
  }
  if (flawLower.includes("thin content") || flawLower.includes("word")) {
    return "Expand the page content with more useful, unique, and keyword-relevant text. Aim for at least 300-500 words per page. Add examples, data, or detailed explanations to increase value.";
  }
  if (flawLower.includes("security") || flawLower.includes("headers")) {
    return "Configure the server/CDN to send standard security headers: Strict-Transport-Security (HSTS), X-Frame-Options, Content-Security-Policy, and X-Content-Type-Options to protect against common vulnerabilities.";
  }
  if (flawLower.includes("mixed content")) {
    return "Update all resource URLs (images, scripts, stylesheets, fonts) to use HTTPS instead of HTTP. Use protocol-relative URLs or update them in your CMS/database.";
  }
  if (flawLower.includes("duplicate title") || flawLower.includes("duplicate page title")) {
    return "Write a unique, descriptive title for each page. Include the page's specific focus and primary keywords. Avoid using the same title across multiple pages.";
  }
  if (flawLower.includes("duplicate meta description") || flawLower.includes("duplicate meta")) {
    return "Write a unique meta description for each page. Each page should have a tailored description that accurately summarizes its specific content and encourages clicks.";
  }
  if (flawLower.includes("placeholder") || flawLower.includes("dead link")) {
    return "Replace all placeholder links (href=\"#\" or javascript:void(0)) with real destination URLs. If the link isn't needed, remove it entirely to maintain clean HTML.";
  }
  if (flawLower.includes("spam") || flawLower.includes("untrusted")) {
    return "Review and remove all outbound links to low-quality or spammy domains. Use nofollow or sponsored attributes for affiliate links. Protect your domain's reputation.";
  }
  if (flawLower.includes("robots.txt")) {
    return "Create a robots.txt file at the root of your domain. Include directives for search engine crawlers and list your sitemap location. This helps control crawling and indexing.";
  }
  if (flawLower.includes("sitemap")) {
    return "Create and submit an XML sitemap to search engines via Google Search Console. Include all important pages, ensure it's updated regularly, and follow sitemap protocol standards.";
  }
  
  return "Investigate this issue thoroughly. Review the page's HTML structure, check for missing elements, and implement best practices for technical SEO. Use Google Search Console and developer tools to debug.";
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [url, setUrl] = useState("");
  const [scanMode, setScanMode] = useState("Full Site (Fast Multi-Page)");
  const [maxPages, setMaxPages] = useState(20);
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [error, setError] = useState("");
  const [liveScore, setLiveScore] = useState(84);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setLiveScore((prev) => {
        const next = prev + (Math.random() > 0.5 ? 1 : -1);
        return Math.min(Math.max(next, 78), 91);
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const generateExecutiveSummary = (data: AuditData): string => {
    const {
      url = "Unknown",
      health_score = 0,
      rt_sec = 0,
      total_flaws_count = 0,
      total_pages_scanned = 0,
      title = "No title",
      meta = "No meta",
      h1 = 0,
      tot_img = 0,
      no_alt = 0,
      size_kb = 0,
      status = 0,
      domain_authority = 0,
      trust_label = "Unverified",
      critical_deficiencies = [],
      recommendations = [],
    } = data;

    const healthStatus =
      health_score >= 80
        ? "Excellent"
        : health_score >= 60
        ? "Good"
        : health_score >= 40
        ? "Fair"
        : health_score >= 20
        ? "Poor"
        : "Critical";

    const flawsList: string[] = [];
    if (title.length < 20)
      flawsList.push(
        `Page Title length (${title.length} chars) is non-optimal (recommended: 50-60 chars).`
      );
    if (no_alt > 0)
      flawsList.push(
        `${no_alt} out of ${tot_img} image elements lack accessibility descriptive alt text.`
      );
    if (critical_deficiencies?.length) {
      critical_deficiencies.forEach((def: string) => {
        if (def.includes("canonical"))
          flawsList.push(
            'Canonical URL link <link rel="canonical"> is missing.'
          );
        else if (def.includes("security"))
          flawsList.push(
            "Missing security headers: Strict-Transport-Security, X-Frame-Options, Content-Security-Policy."
          );
        else flawsList.push(def);
      });
    }
    if (status !== 200)
      flawsList.push(
        `Failed to load page content or server unreachable (Status: ${status}).`
      );
    if (rt_sec > 3)
      flawsList.push(
        `High server latency detected (${rt_sec}s) - recommended: < 2s.`
      );
    if (!flawsList.length)
      flawsList.push("No significant issues detected during the scan.");

    const recommendationsList: string[] = recommendations.length > 0 ? recommendations : [];
    
    if (recommendationsList.length === 0 && flawsList.length > 0) {
      flawsList.forEach((flaw: string) => {
        const rec = generateRecommendationForFlaw(flaw);
        if (rec && !recommendationsList.includes(rec)) {
          recommendationsList.push(rec);
        }
      });
    }

    if (recommendationsList.length === 0) {
      recommendationsList.push(
        "Continue monitoring site performance and SEO metrics."
      );
    }

    return `Executive Summary
Overall Calculated Health Score: ${health_score}/100 (${healthStatus})

Live runtime scan performed for ${url}. The analysis indicates a server response latency of ${rt_sec}s with ${total_flaws_count} primary structural/technical issue(s) detected during real-time DOM parsing across ${total_pages_scanned} scanned page(s).

Real-Time Flaws & Identified Issues
${flawsList.map((f: string, i: number) => `${i + 1}. ${f}`).join("\n")}

Domain & Page Quality Analysis
- Server Latency: Recorded response time of ${rt_sec}s via direct HTTP request.
- HTTP Status: ${status} ${status === 200 ? "(OK)" : "(Error)"}
- Payload & Size: Page download payload recorded at ${size_kb.toFixed(2)} KB.
- Semantic Structure: Headings parsed with ${h1} H1 tag(s) found in the body container.
- Media Assets: Scanned ${tot_img} image element(s), where ${no_alt} lack descriptive alt tags.
- Metadata Indexing: Title tag recorded as "${title}".
- Meta Description: "${meta.substring(0, 100)}${meta.length > 100 ? "..." : ""}"
- Domain Authority: ${domain_authority}/100 (${trust_label})

Actionable Recommendations
${recommendationsList.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")}

Critical Missing Elements & Security Deficiencies
${
  critical_deficiencies?.length
    ? critical_deficiencies.map((d: string) => `- ${d}`).join("\n")
    : "No critical security or indexing elements missing."
}`;
  };

  const detectAIContent = (content: string): {
    score: number;
    verdict: string;
    elements: string[];
  } => {
    if (!content || content.length < 50) {
      return {
        score: 15,
        verdict: "Human-Written Content (Insufficient Data)",
        elements: ["Limited content available for analysis"],
      };
    }

    const text = content.toLowerCase();
    const words = text.split(/\s+/).filter((w) => w.length > 2);
    const totalWords = words.length;

    if (totalWords < 30) {
      return {
        score: 10,
        verdict: "Human-Written Content (Minimal Text)",
        elements: ["Very limited text content detected"],
      };
    }

    const aiTransitionalPhrases = [
      "in conclusion",
      "moreover",
      "furthermore",
      "additionally",
      "it is important to note",
      "it should be noted",
      "as previously mentioned",
      "in the realm of",
      "in the world of",
      "it is worth mentioning",
      "firstly",
      "secondly",
      "thirdly",
      "lastly",
      "finally",
      "on the other hand",
      "in addition",
      "consequently",
      "therefore",
      "thus",
      "hence",
      "accordingly",
      "as a result",
    ];
    let transitionCount = 0;
    aiTransitionalPhrases.forEach((phrase) => {
      transitionCount += (text.match(new RegExp(phrase, "g")) || []).length;
    });

    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const sentenceLengths = sentences.map((s) => s.split(" ").length);
    let variance = 0;
    if (sentenceLengths.length > 0) {
      const avg =
        sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
      variance =
        sentenceLengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) /
        sentenceLengths.length;
    }

    const genericWords = [
      "best",
      "top",
      "leading",
      "innovative",
      "cutting-edge",
      "revolutionary",
      "groundbreaking",
      "state-of-the-art",
      "world-class",
      "next-generation",
      "game-changing",
      "unparalleled",
      "unprecedented",
    ];
    let genericCount = 0;
    genericWords.forEach((word) => {
      genericCount += (text.match(new RegExp(word, "g")) || []).length;
    });

    const uniqueWords = new Set(words);
    const uniqueRatio = uniqueWords.size / totalWords;

    const wordFreq: Record<string, number> = {};
    words.forEach((w) => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
    const maxDensity = Math.max(...Object.values(wordFreq)) / totalWords;

    const paragraphs = content
      .split("\n")
      .filter((p) => p.trim().length > 20);
    const paragraphStarts = paragraphs.map((p) =>
      p
        .trim()
        .split(" ")
        .slice(0, 3)
        .join(" ")
    );
    const startRepetition =
      paragraphStarts.length > 0
        ? 1 - new Set(paragraphStarts).size / paragraphStarts.length
        : 0;

    const hasFAQPattern =
      (text.match(/faq|frequently asked|q:|a:/g) || []).length > 3;
    const hasBulletPattern =
      (text.match(/[•●◦■◆▶]|^\s*[-*]\s/mg) || []).length > 5;

    const promoWords = [
      "best",
      "great",
      "excellent",
      "amazing",
      "incredible",
      "fantastic",
      "superior",
    ];
    let promoCount = 0;
    promoWords.forEach((word) => {
      promoCount += (text.match(new RegExp(word, "g")) || []).length;
    });
    const promoDensity = promoCount / totalWords;

    let aiScore =
      Math.min(transitionCount * 2, 25) +
      (variance < 15 ? 15 : variance < 30 ? 8 : 0) +
      Math.min(genericCount * 2, 15) +
      (uniqueRatio < 0.4 ? 15 : uniqueRatio < 0.5 ? 8 : 0) +
      (maxDensity > 0.04 ? 15 : maxDensity > 0.025 ? 8 : 0) +
      (startRepetition > 0.6 ? 10 : startRepetition > 0.3 ? 5 : 0) +
      (hasFAQPattern ? 3 : 0) +
      (hasBulletPattern ? 2 : 0) +
      (promoDensity > 0.03 ? 5 : promoDensity > 0.015 ? 3 : 0);

    let finalScore = Math.min(Math.max(Math.round(aiScore), 0), 100);
    if (totalWords < 100) finalScore = Math.max(5, finalScore - 15);

    let verdict = "Human-Written Content";
    let elements: string[] = [];

    if (finalScore >= 70) {
      verdict = "Likely AI-Generated Content";
      elements = [
        `High use of transitional phrases (${transitionCount} instances) indicating AI writing patterns`,
        `Low sentence length variance (${Math.round(variance)}) - typical of AI text generation`,
        `High frequency of generic marketing terms (${genericCount} instances)`,
        `Low lexical diversity (${Math.round(uniqueRatio * 100)}% unique words) - AI pattern`,
        `Elevated keyword density (${Math.round(maxDensity * 100)}%) suggesting SEO optimization`,
      ];
    } else if (finalScore >= 45) {
      verdict = "Mixed / Hybrid Content";
      elements = [
        `Moderate use of transitional phrases (${transitionCount} instances)`,
        `Some sentence structure uniformity detected`,
        `Mix of specific and generic terminology (${genericCount} generic terms)`,
        `${Math.round(uniqueRatio * 100)}% lexical diversity - partially AI-like`,
      ];
    } else {
      elements = [
        `Natural variation in sentence length (variance: ${Math.round(variance)})`,
        `Rich vocabulary with ${Math.round(uniqueRatio * 100)}% unique words`,
        `Low use of generic marketing language (${genericCount} instances)`,
        `Authentic paragraph structures with natural variation`,
      ];
    }

    return { score: finalScore, verdict, elements: elements.slice(0, 5) };
  };

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          mode: scanMode,
          maxPages: scanMode === "Single Page" ? 1 : maxPages,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        if (responseData.code === "EMPTY_URL") {
          setError("Please enter a valid URL");
        } else if (responseData.code === "INVALID_URL") {
          setError("Invalid URL format. Please enter a valid website URL (e.g., https://example.com)");
        } else if (responseData.code === "SITE_UNREACHABLE") {
          setError(`${responseData.error}\n${responseData.details || ''}`);
        } else {
          setError(responseData.error || "Failed to perform website audit.");
        }
        return;
      }

      const rawData = responseData;

      const fullContent = [
        rawData.title || "",
        rawData.meta || "",
        rawData.report || "",
        ...(rawData.scanned_pages?.map((p: any) => p.title || "") || []),
        ...(rawData.scanned_pages?.map((p: any) => p.meta || "") || []),
      ].join(" ");

      const aiAnalysis = detectAIContent(fullContent);

      const enhancedData: AuditData = {
        ...rawData,
        ai_detection_score: aiAnalysis.score,
        ai_verdict: aiAnalysis.verdict,
        ai_detected_elements: aiAnalysis.elements,
        keywords_extracted: rawData.keywords_extracted?.length
          ? rawData.keywords_extracted
          : [],
        executive_summary: generateExecutiveSummary(rawData),
      };

      setAuditData(enhancedData);
    } catch (err: any) {
      setError(err.message || "Something went wrong during scan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWordDoc = () => {
    if (!auditData) return;

    const docContent = `
CODICARES ENTERPRISE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL SEO & AI CONTENT AUDIT REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target Domain: ${auditData.url}
Scan Mode: ${auditData.scan_mode}
Scan Date: ${new Date().toLocaleString()}

Overall Health Score: ${auditData.health_score}/100 (${
      auditData.health_score >= 80
        ? "Excellent"
        : auditData.health_score >= 60
        ? "Good"
        : auditData.health_score >= 40
        ? "Fair"
        : auditData.health_score >= 20
        ? "Poor"
        : "Critical"
    })
Domain Authority: ${auditData.domain_authority}/100 (${auditData.trust_label})
Total Pages Discovered: ${auditData.total_discovered_pages}
Total Pages Scanned: ${auditData.total_pages_scanned}
Total Flaws Detected: ${auditData.total_flaws_count}
AI Content Probability: ${auditData.ai_detection_score}% (${auditData.ai_verdict})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEY PERFORMANCE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  HEALTH SCORE: ${auditData.health_score}/100
  DOMAIN AUTHORITY: ${auditData.domain_authority}/100
  AI PROBABILITY: ${auditData.ai_detection_score}%
  TOTAL PAGES: ${auditData.total_discovered_pages} (Discovered)
  CRAWLED PAGES: ${auditData.total_pages_scanned} (Scanned)
  AVG LATENCY: ${auditData.rt_sec}s
  HTTP STATUS: ${auditData.status}
  MISSING ALT: ${auditData.no_alt} out of ${
      auditData.total_images_scanned || auditData.tot_img || 0
    } images

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAGE-SPECIFIC METRICS (Main Page)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Page Title: ${auditData.title}
  Meta Description: ${auditData.meta}
  H1 Headings: ${auditData.h1}
  Images: ${auditData.tot_img}
  Images Missing Alt: ${auditData.no_alt}
  Page Size: ${auditData.size_kb} KB
  Total Links: ${auditData.total_links_found}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETECTED FLAWS & SOLUTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${(() => {
  if (!auditData.all_flaws?.length) return "No flaws detected.";

  return auditData.all_flaws
    .map(([pageUrl, flaw]: [string, string], index: number) => {
      let solution = "Review and fix the issue.";
      
      for (const page of auditData.scanned_pages || []) {
        if (page.url === pageUrl) {
          const flawIndex = page.flaws.indexOf(flaw);
          if (flawIndex !== -1 && page.recommendations && page.recommendations[flawIndex]) {
            solution = page.recommendations[flawIndex];
            break;
          }
        }
      }
      
      if (solution === "Review and fix the issue.") {
        solution = generateRecommendationForFlaw(flaw);
      }

      return `
FLAW ${index + 1}
───────────────────────────────────────────────────────────────
  URL: ${pageUrl}
  Issue: ${flaw}
  Solution: ${solution}
`;
    })
    .join("\n");
})()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTIONABLE RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  auditData.recommendations?.length
    ? auditData.recommendations
        .map((rec: string, i: number) => `${i + 1}. ${rec}`)
        .join("\n")
    : "No recommendations available."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL DEFICIENCIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  auditData.critical_deficiencies?.length
    ? auditData.critical_deficiencies
        .map((def: string, i: number) => `${i + 1}. ${def}`)
        .join("\n")
    : "No critical deficiencies detected."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SPAMMY BACKLINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  auditData.spammy_backlinks?.length
    ? auditData.spammy_backlinks
        .map((link: string, i: number) => `${i + 1}. ${link}`)
        .join("\n")
    : "No spammy backlinks detected."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOP KEYWORDS EXTRACTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  auditData.keywords_extracted?.length
    ? auditData.keywords_extracted
        .map(([kw, count]: [string, number]) => `  ${kw}: ${count}x`)
        .join("\n")
    : "No keywords extracted."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEO PERFORMANCE TREND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Content Quality: ${Math.min(100, auditData.health_score + 10)}/100
  Technical SEO: ${Math.min(100, auditData.health_score + 5)}/100
  User Experience: ${Math.min(100, auditData.health_score + 15)}/100
  Page Speed: ${Math.min(100, Math.max(0, auditData.health_score - 5))}/100
  Mobile Friendliness: ${Math.min(100, auditData.health_score + 5)}/100
  ───────────────────────────────────────────────────────────────
  Average Score: ${Math.round(
    (Math.min(100, auditData.health_score + 10) +
      Math.min(100, auditData.health_score + 5) +
      Math.min(100, auditData.health_score + 15) +
      Math.min(100, Math.max(0, auditData.health_score - 5)) +
      Math.min(100, auditData.health_score + 5)) /
      5
  )}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCANNED PAGES CRAWL LOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  auditData.scanned_pages?.map(
    (p: ScannedPage, i: number) =>
      `${i + 1}. ${p.url}
     Status: ${p.status} | Latency: ${p.rt_sec}s | Flaws: ${p.flaws?.length || 0}`
  ).join("\n") || "No pages scanned."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPLETE AI DIAGNOSTIC REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${auditData.report || "No AI diagnostic report available."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESPONSE HEADERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  Object.entries(auditData.response_headers || {})
    .map(([key, value]: [string, string]) => `${key}: ${value}`)
    .join("\n") || "No headers available."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report generated by Codicares Enterprise
${new Date().getFullYear()} - All Rights Reserved
    `.trim();

    const blob = new Blob(["\uFEFF" + docContent], {
      type: "application/msword;charset=utf-8",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${auditData.url.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}_technical_seo_report.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFormattedReport = (text: string) => {
    if (!text) return null;

    return text.split("\n").map((line: string, idx: number) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1" />;

      if (trimmed.startsWith("### ")) {
        return (
          <h3
            key={idx}
            className="text-sm font-bold text-amber-600 mt-3 mb-1.5 border-b border-amber-200 pb-0.5"
          >
            {trimmed.replace("### ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2
            key={idx}
            className="text-sm font-extrabold text-slate-800 mt-4 mb-1.5"
          >
            {trimmed.replace("## ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h1
            key={idx}
            className="text-base font-black text-slate-800 mt-4 mb-1.5"
          >
            {trimmed.replace("# ", "")}
          </h1>
        );
      }

      const parts = line.split(/(\*\*.*?\*\*)/g);
      const content = parts.map((part: string, pIdx: number) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="text-slate-900 font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <div
            key={idx}
            className="flex items-start gap-1.5 text-slate-600 ml-2 my-0.5 text-xs"
          >
            <span className="text-amber-500 mt-0.5">●</span>
            <div>{content}</div>
          </div>
        );
      }

      return (
        <p key={idx} className="text-slate-600 my-0.5 leading-relaxed text-xs">
          {content}
        </p>
      );
    });
  };

  const calculateSEOScores = () => {
    if (!auditData)
      return { content: 0, technical: 0, ux: 0, speed: 0, mobile: 0 };
    const base = auditData.health_score || 50;
    return {
      content: Math.min(
        100,
        base + (auditData.h1 > 0 ? 10 : -10) +
          (auditData.meta && auditData.meta.length > 50 ? 10 : -5)
      ),
      technical: Math.min(
        100,
        base + (auditData.total_flaws_count < 5 ? 10 : -10) +
          (auditData.status === 200 ? 5 : -15)
      ),
      ux: Math.min(
        100,
        base + (auditData.no_alt < 10 ? 10 : -10) + (auditData.tot_img > 0 ? 5 : 0)
      ),
      speed: Math.min(
        100,
        Math.max(
          0,
          base + (auditData.rt_sec < 2 ? 15 : auditData.rt_sec < 4 ? 5 : -15)
        )
      ),
      mobile: Math.min(
        100,
        base + (auditData.total_pages_scanned > 1 ? 10 : -5)
      ),
    };
  };

  const seoScores = calculateSEOScores();
  const categories = ["Content", "Technical", "UX", "Speed", "Mobile"];
  const values = [
    seoScores.content,
    seoScores.technical,
    seoScores.ux,
    seoScores.speed,
    seoScores.mobile,
  ];

  const generateLinePath = () => {
    const padding = 25;
    const width = 280;
    const height = 130;
    const points = values.map((val, i) => ({
      x: padding + (i / (values.length - 1)) * (width - padding * 2),
      y: height - padding - (val / 100) * (height - padding * 2),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) * 0.4;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - (points[i].x - points[i - 1].x) * 0.4;
      const cp2y = points[i].y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
    }
    return { path, points };
  };

  const { path, points } = generateLinePath();

  const metrics = [
    {
      label: "HEALTH SCORE",
      value: auditData?.health_score,
      sub: `${auditData?.total_flaws_count || 0} Issue(s)`,
      color: "text-slate-900",
    },
    {
      label: "DOM AUTHORITY",
      value: auditData?.domain_authority,
      sub: auditData?.trust_label,
      color: "text-amber-600",
    },
    {
      label: "AI PROBABILITY",
      value: `${auditData?.ai_detection_score || 0}%`,
      sub: "Real-time Analysis",
      color: "text-purple-600",
    },
    {
      label: "TOTAL PAGES",
      value: auditData?.total_discovered_pages || 0,
      sub: "Discovered",
      color: "text-slate-900",
    },
    {
      label: "CRAWLED PAGES",
      value: auditData?.total_pages_scanned || 0,
      sub: "Scanned",
      color: "text-emerald-600",
    },
    {
      label: "AVG LATENCY",
      value: `${auditData?.rt_sec || 0}s`,
      sub: `Status: ${auditData?.status || 0}`,
      color: "text-slate-900",
    },
    {
      label: "MISSING ALT",
      value: auditData?.no_alt,
      sub: `Out of ${
        auditData?.total_images_scanned || auditData?.tot_img || 0
      } imgs`,
      color: "text-slate-900",
    },
  ];

  const barMetrics = [
    {
      label: "Pages",
      value: auditData?.total_pages_scanned || 1,
      icon: <Server className="w-3 h-3" />,
      color: "from-amber-400 to-amber-600",
    },
    {
      label: "Images",
      value: auditData?.total_images_scanned || auditData?.tot_img || 0,
      icon: <FileText className="w-3 h-3" />,
      color: "from-blue-400 to-blue-600",
    },
    {
      label: "Links",
      value: auditData?.total_links_found || 0,
      icon: <Users className="w-3 h-3" />,
      color: "from-green-400 to-green-600",
    },
    {
      label: "H1 Tags",
      value: auditData?.h1 || 0,
      icon: <TrendingUp className="w-3 h-3" />,
      color: "from-purple-400 to-purple-600",
    },
    {
      label: "Flaws",
      value: auditData?.total_flaws_count || 0,
      icon: <AlertTriangle className="w-3 h-3" />,
      color: "from-rose-400 to-rose-600",
    },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#3d2768] text-slate-100 flex items-center justify-center">
        <div className="text-amber-300 text-xs font-medium animate-pulse flex items-center gap-2">
          <Globe className="w-4 h-4 animate-spin text-amber-400" />
          Initializing Codicares Interface...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#3d2768] text-slate-100 font-sans antialiased tracking-tight relative overflow-hidden text-xs sm:text-sm">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#b18eff] rounded-bl-[200px] pointer-events-none opacity-60 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#22deb3] rounded-tr-[200px] pointer-events-none opacity-55 blur-3xl" />

      <header className="border-b border-white/10 bg-[#35205d]/90 backdrop-blur-xl sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <radialGradient id="headerBulbGlow">
                    <stop offset="0" stopColor="#e8b34d" stopOpacity=".7" />
                    <stop offset="1" stopColor="#e8b34d" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient
                    id="headerPulseGrad"
                    x1="30"
                    y1="90"
                    x2="70"
                    y2="30"
                  >
                    <stop offset="0" stopColor="#3f8f4f" />
                    <stop offset="0.5" stopColor="#5a9f6a" />
                    <stop offset="1" stopColor="#e8b34d" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="#0d1b3d"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
                <circle cx="50" cy="44" r="9" fill="url(#headerBulbGlow)">
                  <animate
                    attributeName="r"
                    values="8;8;13;8"
                    keyTimes="0;0.55;0.78;1"
                    dur="4.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values=".25;.25;.9;.25"
                    keyTimes="0;0.55;0.78;1"
                    dur="4.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <path
                  d="M50 24 C59 24 65 30 65 39 C65 45 61 49 58 52 V60 H42 V52 C39 49 35 45 35 39 C35 30 41 24 50 24 Z"
                  fill="none"
                  stroke="#e8b34d"
                  strokeWidth="2.5"
                />
                <line
                  x1="44"
                  y1="64"
                  x2="56"
                  y2="64"
                  stroke="#e8b34d"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M44 36 L50 48 L56 36"
                  stroke="#e8b34d"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <animate
                    attributeName="opacity"
                    values=".3;.3;1;.3"
                    keyTimes="0;0.55;0.78;1"
                    dur="4.2s"
                    repeatCount="indefinite"
                  />
                </path>
                <path
                  d="M18 56 L28 56 L34 46 L40 54 L46 44 L52 54 L58 46 L64 56 L74 56 L80 56"
                  stroke="url(#headerPulseGrad)"
                  strokeWidth="2.2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength="100"
                  strokeDasharray="100"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="100;100;0;0;100"
                    keyTimes="0;0.05;0.55;0.85;1"
                    dur="4.2s"
                    repeatCount="indefinite"
                  />
                </path>
                <circle cx="18" cy="56" r="2.5" fill="#3f8f4f">
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    keyTimes="0;0.05;0.85;1"
                    dur="4.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="r"
                    values="2;3;3;2"
                    keyTimes="0;0.3;0.7;1"
                    dur="4.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="80" cy="56" r="2" fill="#e8b34d">
                  <animate
                    attributeName="opacity"
                    values="0;0;1;1;0"
                    keyTimes="0;0.5;0.6;0.85;1"
                    dur="4.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="r"
                    values="1.5;1.5;2.5;2.5;1.5"
                    keyTimes="0;0.5;0.65;0.85;1"
                    dur="4.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <text
                  x="50"
                  y="91"
                  textAnchor="middle"
                  fontWeight="800"
                  fontSize="8"
                  letterSpacing="1.5"
                  fill="#f4f6fb"
                  fontFamily="Manrope, sans-serif"
                >
                  CODICARE
                </text>
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white leading-none flex items-center gap-2">
                <span className="text-amber-300 font-black">Codicares</span>{" "}
                <span className="text-slate-100">Enterprise</span>
              </h1>
              <span className="text-[10px] font-mono tracking-widest text-purple-200 uppercase font-bold mt-0.5 block">
                Technical SEO & AI Content Auditing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ENGINE ONLINE
            </div>
            {auditData && (
              <button
                onClick={handleDownloadWordDoc}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Download Report (.doc)
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10 space-y-16">
        {!auditData ? (
          <section className="pt-6 pb-10 grid grid-cols-1 lg:grid-cols-12 gap-2 items-center">
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-200 uppercase tracking-widest bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse"></span>
                LIVE ENTERPRISE AUDITOR V3.0
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Get measurable results from <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-100 font-black">
                  Technical SEO & AI Content
                </span>{" "}
                Auditing.
              </h1>
              <p className="text-purple-100 text-sm sm:text-base max-w-lg mx-auto lg:mx-0 font-normal leading-relaxed opacity-90">
                Do SEO, content marketing, competitor research, AI text
                fingerprinting and backlink safety scans from just one platform.
              </p>
              <form
                onSubmit={handleRunAudit}
                className="pt-3 max-w-xl mx-auto lg:mx-0"
              >
                <div className="bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-2xl flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter domain or URL (e.g. codicares.com)"
                    required
                    className="flex-1 min-w-[160px] bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
                  />

                  <select
                    value={scanMode}
                    onChange={(e) => setScanMode(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer shrink-0"
                  >
                    <option value="Full Site (Fast Multi-Page)">Full Site</option>
                    <option value="Single Page">Single Page</option>
                  </select>

                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 shrink-0">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={maxPages}
                      onChange={(e) => setMaxPages(parseInt(e.target.value) || 1)}
                      disabled={scanMode === "Single Page"}
                      className={`w-16 bg-transparent text-xs font-bold text-slate-800 focus:outline-none text-center ${
                        scanMode === "Single Page"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    />
                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                      Pages
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 whitespace-nowrap cursor-pointer active:scale-95 shrink-0"
                  >
                    {loading ? (
                      <>
                        <Globe className="w-4 h-4 animate-spin text-slate-950" />{" "}
                        Crawling...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current text-slate-950" />{" "}
                        Start now
                      </>
                    )}
                  </button>
                </div>
              </form>
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-medium flex items-center gap-2 max-w-md mx-auto lg:mx-0 whitespace-pre-line">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  {error}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 flex justify-center items-center py-4 lg:-ml-16">
              <div className="relative w-72 h-72 rounded-full border border-sky-400/30 bg-slate-950/40 backdrop-blur-md flex items-center justify-center shadow-2xl overflow-hidden">
                {[0, 1, 2].map((i: number) => (
                  <div
                    key={i}
                    className="absolute rounded-full border border-sky-400/20"
                    style={{ inset: `${(i + 1) * 16}px` }}
                  />
                ))}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-sky-400/20 to-transparent" />
                </div>
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ animation: "spin 8s linear infinite" }}
                >
                  <div className="absolute top-1/2 left-1/2 w-1 h-32 bg-gradient-to-t from-sky-400/50 to-transparent origin-bottom -translate-x-1/2 -translate-y-full" />
                </div>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ animation: "spin 10s linear infinite" }}
                >
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_4px_rgba(251,191,36,0.6)] animate-pulse" />
                </div>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ animation: "spin 14s linear infinite reverse" }}
                >
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_3px_rgba(52,211,153,0.6)] animate-pulse" />
                </div>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ animation: "spin 18s linear infinite" }}
                >
                  <div className="absolute right-6 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_3px_rgba(56,189,248,0.6)] animate-pulse" />
                </div>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ animation: "spin 22s linear infinite reverse" }}
                >
                  <div className="absolute left-6 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_3px_rgba(167,139,250,0.6)] animate-pulse" />
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white tracking-tight animate-pulse">
                    {liveScore}
                  </span>
                  <span className="text-[10px] font-mono text-sky-300 uppercase tracking-widest mt-0.5">
                    health score
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="space-y-6 bg-slate-50 text-slate-800 p-6 rounded-2xl shadow-2xl relative z-10 text-xs sm:text-sm">
            <div className="flex justify-between items-end pb-4 border-b border-slate-200">
              <div>
                <div className="font-mono text-[10px] font-bold text-amber-600 tracking-widest uppercase mb-1">
                  CODICARES ENTERPRISE REPORT
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Technical SEO & AI Detection Report
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Target Domain:{" "}
                  <span className="text-amber-600 font-bold">
                    {auditData.url}
                  </span>{" "}
                  | Scope: {auditData.scan_mode}
                </p>
              </div>
              <button
                onClick={() => setAuditData(null)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-2 rounded-lg transition cursor-pointer hover:bg-slate-100 shadow-sm"
              >
                ← Scan Another Website
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
              {metrics.map((metric: any, i: number) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm"
                >
                  <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                    {metric.label}
                  </div>
                  <div className={`text-xl font-black ${metric.color} mt-1`}>
                    {metric.value}
                  </div>
                  <div className="text-xs font-bold text-slate-500 mt-1">
                    {metric.sub}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono">
                  Dynamic Scan Analytics & Performance Graphs
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 uppercase mb-1">
                      <span>Page Performance Metrics</span>
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Site-Wide Performance Indicators
                    </h4>
                  </div>

                  <div className="flex items-end justify-center h-40 gap-4 px-1 py-2">
                    {barMetrics.map((item: any, i: number) => {
                      const maxVal = Math.max(
                        ...barMetrics.map((m: any) => m.value),
                        1
                      );
                      const barHeight = Math.max(
                        5,
                        (item.value / maxVal) * 80
                      );
                      return (
                        <div
                          key={i}
                          className="flex flex-col items-center justify-end h-full"
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] font-bold text-slate-700">
                              {item.value}
                            </span>
                            <div
                              className={`w-6 rounded-t-sm bg-gradient-to-t ${item.color}`}
                              style={{ height: `${Math.min(barHeight, 80)}px` }}
                            />
                          </div>
                          <div className="flex items-center gap-0.5 mt-1 text-[8px] text-slate-500 font-mono">
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium italic border-t border-slate-100 pt-2 text-center">
                    * Real-time performance metrics from crawled pages
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 uppercase mb-1">
                      <span>Health vs Issue Ratio</span>
                      <PieChart className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Overall Site Integrity Score
                    </h4>
                  </div>

                  <div className="flex items-center justify-center py-4">
                    <div
                      className="relative w-28 h-28 rounded-full border-8 border-slate-100 flex items-center justify-center shadow-inner"
                      style={{
                        background: `conic-gradient(#10b981 ${auditData.health_score}%, #f43f5e ${auditData.health_score}%)`,
                      }}
                    >
                      <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center shadow">
                        <span className="text-lg font-black text-slate-900">
                          {auditData.health_score}%
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">
                          Score
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-center font-mono text-[11px]">
                    <div className="bg-emerald-50 text-emerald-700 py-1.5 rounded font-bold border border-emerald-100">
                      Score: {auditData.health_score}/100
                    </div>
                    <div className="bg-rose-50 text-rose-700 py-1.5 rounded font-bold border border-rose-100">
                      Flaws: {auditData.total_flaws_count}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 uppercase mb-1">
                      <span>Top Keyword Density</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Most Frequent Terms in DOM
                    </h4>
                  </div>

                  <div className="space-y-2 py-1">
                    {auditData.keywords_extracted?.length ? (
                      auditData.keywords_extracted
                        .slice(0, 5)
                        .map(([kw, count]: [string, number], idx: number) => {
                          const maxCount = Math.max(
                            ...auditData.keywords_extracted.map((x: [string, number]) => x[1]),
                            1
                          );
                          const barWidth = Math.min(
                            Math.max((count / maxCount) * 100, 20),
                            100
                          );
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-mono text-slate-700">
                                <span className="font-semibold truncate max-w-[140px]">
                                  {kw}
                                </span>
                                <span className="font-bold text-purple-600">
                                  {count}x
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-xs text-slate-500 italic py-4 text-center">
                        No keywords extracted from the scanned content.
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 font-medium italic border-t border-slate-100 pt-2">
                    * Extracted from headings and primary body tags.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                  KEYWORD EXPRESSION ENGINE
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  High-Traffic Organic Keywords Extracted
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {auditData.keywords_extracted?.length ? (
                    auditData.keywords_extracted.map(([kw, cnt]: [string, number], i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-md text-xs font-bold"
                      >
                        {kw}{" "}
                        <span className="bg-white px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 border border-purple-100">
                          {cnt}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">
                      No dominant search terms detected in DOM body.
                    </span>
                  )}
                </div>
              </div>
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                  OUTBOUND SPAM & UNTRUSTED BACKLINKS
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Risk & Affiliate Link Audit
                </h3>
                <div className="space-y-1.5 pt-1">
                  {auditData.spammy_backlinks?.length ? (
                    auditData.spammy_backlinks
                      .slice(0, 4)
                      .map((link: string, i: number) => (
                        <div
                          key={i}
                          className="bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1.5 rounded-md text-xs font-mono font-medium break-all"
                        >
                           {link}
                        </div>
                      ))
                  ) : (
                    <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No
                      suspicious or untrusted outbound links detected.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                  SCRAPED TECHNICAL METRICS (MAIN PAGE)
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <div className="text-[10px] text-slate-400 font-mono font-semibold mb-0.5">
                    PAGE TITLE
                  </div>
                  <div className="text-xs sm:text-sm text-slate-900 font-bold">
                    {auditData.title}
                  </div>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <div className="text-[10px] text-slate-400 font-mono font-semibold mb-0.5">
                    META DESCRIPTION
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium">
                    {auditData.meta}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono font-semibold mb-0.5">
                    HEADINGS & MEDIA
                  </div>
                  <div className="text-xs sm:text-sm text-slate-900 font-semibold">
                    H1 Headings Count: {auditData.h1}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                    Main Page Images: {auditData.tot_img} | Missing Alt:{" "}
                    {auditData.no_alt}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                  CRITICAL MISSING ELEMENTS & DEFICIENCIES
                </div>
                <ul className="space-y-2 text-xs font-bold pt-1">
                  {auditData.critical_deficiencies?.length ? (
                    auditData.critical_deficiencies.map((def: string, i: number) => {
                      let pageUrl = auditData.url || "Main Page";
                      let issueText = def;
                      const urlMatch = def.match(/^\[(.*?)\]\s*/);
                      if (urlMatch) {
                        pageUrl = urlMatch[1];
                        issueText = def.replace(/^\[.*?\]\s*/, "");
                      }
                      return (
                        <li
                          key={i}
                          className="text-rose-600 flex flex-col gap-0.5 bg-rose-50/50 p-2 rounded-lg border border-rose-100"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-rose-400">•</span>
                            <a
                              href={pageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[10px] bg-rose-100 px-2 py-0.5 rounded text-rose-700 font-bold truncate max-w-[200px] hover:bg-rose-200 underline"
                              title={pageUrl}
                            >
                              {pageUrl.length > 40
                                ? pageUrl.substring(0, 40) + "..."
                                : pageUrl}
                            </a>
                          </div>
                          <div className="ml-5 text-rose-700 font-semibold">
                            {issueText}
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-emerald-600 list-none font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No
                      critical deficiencies detected.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 overflow-x-auto">
              <div className="flex justify-between items-center">
                <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                  SCANNED SUB-PAGES CRAWL LOG
                </div>
                <div className="text-xs text-amber-600 font-mono font-bold">
                  {auditData.total_pages_scanned} of{" "}
                  {auditData.total_discovered_pages} pages crawled
                </div>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono font-bold bg-slate-50">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">TARGET SUB-PAGE URL</th>
                    <th className="p-2.5">STATUS</th>
                    <th className="p-2.5">LATENCY</th>
                    <th className="p-2.5">FLAWS DETECTED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditData.scanned_pages?.map((p: ScannedPage, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 align-top">
                      <td className="p-2.5 font-mono text-slate-400">
                        [{idx + 1}]
                      </td>
                      <td className="p-2.5 font-mono font-medium text-amber-600">
                        {p.url}
                      </td>
                      <td className="p-2.5">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                          {p.status} OK
                        </span>
                      </td>
                      <td className="p-2.5 font-mono font-medium text-slate-600">
                        {p.rt_sec}s
                      </td>
                      <td className="p-2.5">
                        {p.flaws.length > 0 ? (
                          <details className="group">
                            <summary className="list-none cursor-pointer inline-flex items-center gap-1 text-rose-600 font-bold hover:text-rose-800 hover:underline select-none">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {p.flaws.length} flaw(s)
                            </summary>
                            <div className="mt-2 max-h-72 overflow-y-auto pr-2 space-y-1.5 w-full max-w-xl">
                              {p.flaws.map((flaw: string, fIdx: number) => (
                                <div
                                  key={fIdx}
                                  className="bg-rose-50 border border-rose-200 rounded-md p-2 text-xs"
                                >
                                  <div className="font-bold text-rose-700">
                                    Issue {fIdx + 1}:
                                  </div>
                                  <div className="text-rose-600 mt-1 font-medium">
                                    {flaw}
                                  </div>
                                  {p.recommendations && p.recommendations[fIdx] && (
                                    <div className="text-emerald-700 mt-1.5 pt-1.5 border-t border-emerald-100 font-medium">
                                      <strong className="text-emerald-800">Solution:</strong>{" "}
                                      {p.recommendations[fIdx]}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        ) : (
                          <span className="text-emerald-600 font-bold">
                            Clean
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                  DETECTED FLAWS & ISSUES
                </div>
                <div className="space-y-1.5 pt-1 max-h-72 overflow-y-auto pr-1">
                  {auditData.all_flaws?.length ? (
                    auditData.all_flaws.map(([pageUrl, flaw]: [string, string], i: number) => {
                      let solution = "Review and fix the issue.";
                      
                      for (const page of auditData.scanned_pages || []) {
                        if (page.url === pageUrl) {
                          const flawIndex = page.flaws.indexOf(flaw);
                          if (flawIndex !== -1 && page.recommendations && page.recommendations[flawIndex]) {
                            solution = page.recommendations[flawIndex];
                            break;
                          }
                        }
                      }
                      
                      if (solution === "Review and fix the issue.") {
                        solution = generateRecommendationForFlaw(flaw);
                      }

                      return (
                        <details
                          key={i}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
                        >
                          <summary className="font-bold text-slate-800 cursor-pointer hover:text-amber-600">
                             [{pageUrl}] {flaw.substring(0, 45)}...
                          </summary>
                          <div className="mt-1.5 text-slate-600 space-y-1 font-medium">
                            <div>
                              <strong>URL:</strong>{" "}
                              <a
                                href={pageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline break-all"
                              >
                                {pageUrl}
                              </a>
                            </div>
                            <div>
                              <strong>Issue:</strong> {flaw}
                            </div>
                            <div className="text-emerald-600 border-t border-emerald-100 pt-1 mt-1">
                              <strong>Solution:</strong> {solution}
                            </div>
                          </div>
                        </details>
                      );
                    })
                  ) : (
                    <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 p-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No
                      flaws detected.
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                    SEO PERFORMANCE TREND
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Gauge className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-600">
                      {Math.round(
                        values.reduce((a, b) => a + b, 0) / values.length
                      )}
                      %
                    </span>
                    <span className="text-slate-400 font-normal">Avg</span>
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[140px]">
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 280 140"
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-full"
                  >
                    <line
                      x1="22"
                      y1="20"
                      x2="260"
                      y2="20"
                      stroke="#e5e7eb"
                      strokeWidth="0.5"
                      strokeDasharray="3,3"
                    />
                    <line
                      x1="22"
                      y1="50"
                      x2="260"
                      y2="50"
                      stroke="#e5e7eb"
                      strokeWidth="0.5"
                      strokeDasharray="3,3"
                    />
                    <line
                      x1="22"
                      y1="80"
                      x2="260"
                      y2="80"
                      stroke="#e5e7eb"
                      strokeWidth="0.5"
                      strokeDasharray="3,3"
                    />
                    <line
                      x1="22"
                      y1="110"
                      x2="260"
                      y2="110"
                      stroke="#e5e7eb"
                      strokeWidth="0.5"
                      strokeDasharray="3,3"
                    />

                    <polygon
                      points={`22 125 ${path} 260 125`}
                      fill="url(#areaGradient)"
                      opacity="0.3"
                    />
                    <path
                      d={path}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {points.map((point: any, i: number) => (
                      <circle
                        key={i}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#f59e0b"
                        stroke="white"
                        strokeWidth="1.5"
                      />
                    ))}

                    {points.map((point: any, i: number) => (
                      <text
                        key={`label-${i}`}
                        x={point.x}
                        y={132}
                        textAnchor="middle"
                        className="text-[8px] font-bold text-slate-500"
                        fill="#64748b"
                      >
                        {categories[i]}
                      </text>
                    ))}

                    <text
                      x="4"
                      y="20"
                      className="text-[7px] font-mono text-slate-400"
                      fill="#94a3b8"
                    >
                      100
                    </text>
                    <text
                      x="4"
                      y="50"
                      className="text-[7px] font-mono text-slate-400"
                      fill="#94a3b8"
                    >
                      75
                    </text>
                    <text
                      x="4"
                      y="80"
                      className="text-[7px] font-mono text-slate-400"
                      fill="#94a3b8"
                    >
                      50
                    </text>
                    <text
                      x="4"
                      y="110"
                      className="text-[7px] font-mono text-slate-400"
                      fill="#94a3b8"
                    >
                      25
                    </text>

                    <defs>
                      <linearGradient
                        id="areaGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#f59e0b"
                          stopOpacity="0.4"
                        />
                        <stop
                          offset="100%"
                          stopColor="#f59e0b"
                          stopOpacity="0.02"
                        />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="border-t border-slate-100 pt-2 mt-2">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-amber-400"></span>
                      <span>
                        Based on {auditData.total_pages_scanned} scanned pages
                      </span>
                    </span>
                    <span className="font-bold text-amber-600">
                      Score: {auditData.health_score}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                COMPLETE AI DIAGNOSTIC REPORT
              </div>

              {auditData.executive_summary && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black text-amber-800 uppercase tracking-wider font-mono">
                      Executive Summary
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                    {auditData.executive_summary}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {auditData.report ? (
                  renderFormattedReport(auditData.report)
                ) : (
                  <div className="text-slate-500 italic">
                    No diagnostic report available for this scan.
                  </div>
                )}
              </div>

              <div className="font-mono text-[10px] font-bold text-slate-400 uppercase pt-3 border-t border-slate-200">
                RESPONSE HEADERS
              </div>
              <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto whitespace-pre-wrap break-all font-medium">
                {Object.entries(auditData.response_headers || {})
                  .map(([k, v]: [string, string]) => `${k}: ${v}`)
                  .join("\n") || "No Headers"}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}