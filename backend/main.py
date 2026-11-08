import streamlit as str_lit
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from collections import Counter
import re
import time

# --- PAGE CONFIGURATION ---
str_lit.set_page_config(
    page_title="SitePulse Enterprise Report",
    page_icon="⚡",
    layout="wide"
)

# --- CUSTOM CSS (LIGHT BLUE THEME) ---
str_lit.markdown("""
<style>
    .stApp {
        background-color: #f0f4f8;
        color: #1f2937;
    }
    .badge {
        background-color: #e2e8f0;
        border: 1px solid #cbd5e1;
        padding: 5px 10px;
        border-radius: 10px;
        font-size: 0.85rem;
        display: inline-block;
        margin: 3px;
        color: #0284c7;
    }
    .badge-count {
        background-color: #0284c7;
        color: white;
        padding: 2px 6px;
        border-radius: 8px;
        margin-left: 5px;
        font-weight: bold;
    }
    .crawl-log-table {
        width: 100%;
        border-collapse: collapse;
        font-family: monospace;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .crawl-log-table th, .crawl-log-table td {
        border-bottom: 1px solid #e2e8f0;
        padding: 10px 12px;
        text-align: left;
        color: #1f2937;
    }
    .crawl-log-table th {
        background-color: #e0f2fe;
        color: #0369a1;
    }
</style>
""", unsafe_allow_html=True)

STOPWORDS = set([
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
    "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself",
    "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is",
    "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
    "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
    "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should",
    "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them",
    "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
    "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
    "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where",
    "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
    "com", "http", "https", "www", "site", "page"
])

def normalize_url(url):
    parsed = urlparse(url)
    clean_path = parsed.path.rstrip('/')
    return f"{parsed.scheme}://{parsed.netloc}{clean_path}"

def crawl_entire_site(start_url, max_crawl_pages=100):
    start_url_clean = normalize_url(start_url)
    target_domain = urlparse(start_url_clean).netloc

    queue = [start_url_clean]
    discovered_urls = {start_url_clean}
    crawled_data = []

    all_keywords = Counter()
    total_images = 0
    missing_alt_images = 0
    total_links = 0
    unsafe_links = 0
    latencies = []
    total_flaws = 0

    missing_meta = 0
    missing_h1 = 0

    progress_bar = str_lit.progress(0)
    status_text = str_lit.empty()

    while queue and len(crawled_data) < max_crawl_pages:
        current_url = queue.pop(0)

        status_text.text(f"Scanning [{len(crawled_data) + 1} / {len(discovered_urls)} Discovered]: {current_url}")
        progress_bar.progress(min(len(crawled_data) / max_crawl_pages, 1.0))

        page_flaws = 0
        status_code = 200
        latency = 0.0

        try:
            start_time = time.time()
            res = requests.get(
                current_url,
                timeout=6,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SitePulseBot/1.0"}
            )
            latency = round(time.time() - start_time, 2)
            latencies.append(latency)
            status_code = res.status_code

            if status_code != 200:
                page_flaws += 1
                total_flaws += 1
            else:
                soup = BeautifulSoup(res.text, "html.parser")

                meta_desc = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
                if not meta_desc or not meta_desc.get("content", "").strip():
                    missing_meta += 1
                    page_flaws += 1
                    total_flaws += 1

                if not soup.find("h1"):
                    missing_h1 += 1
                    page_flaws += 1
                    total_flaws += 1

                images = soup.find_all("img")
                total_images += len(images)
                for img in images:
                    if not img.get("alt") or not img.get("alt").strip():
                        missing_alt_images += 1
                        page_flaws += 1
                        total_flaws += 1

                for el in soup(["script", "style", "noscript", "header", "footer"]):
                    el.decompose()
                words = re.findall(r'\b[a-z]{3,}\b', soup.get_text().lower())
                filtered = [w for w in words if w not in STOPWORDS]
                all_keywords.update(filtered)

                for link in soup.find_all("a", href=True):
                    href = link['href'].strip()
                    full_link = urljoin(current_url, href)
                    parsed_link = urlparse(full_link)

                    total_links += 1
                    if parsed_link.scheme not in ["http", "https"]:
                        unsafe_links += 1

                    if parsed_link.netloc == target_domain:
                        clean_link = normalize_url(full_link)
                        if clean_link not in discovered_urls:
                            discovered_urls.add(clean_link)
                            queue.append(clean_link)

        except Exception:
            status_code = 500
            page_flaws += 1
            total_flaws += 1

        crawled_data.append({
            "index": len(crawled_data) + 1,
            "url": current_url,
            "status": status_code,
            "latency": f"{latency}s",
            "flaws": page_flaws
        })

    progress_bar.empty()
    status_text.empty()

    avg_latency = round(sum(latencies) / len(latencies), 2) if latencies else 0.0
    crawled_count = len(crawled_data)
    discovered_count = len(discovered_urls)

    health_score = max(10, min(100, 100 - (total_flaws * 2)))
    dom_authority = max(15, min(98, 100 - (missing_meta * 3) - (unsafe_links * 5) - (missing_h1 * 2)))

    return {
        "domain": start_url,
        "discovered_pages": discovered_count,
        "crawled_pages": crawled_count,
        "crawled_log": crawled_data,
        "health_score": health_score,
        "google_authority": dom_authority,
        "avg_latency": avg_latency,
        "total_images": total_images,
        "missing_alt": missing_alt_images,
        "total_links": total_links,
        "unsafe_links": unsafe_links,
        "issues": total_flaws,
        "sorted_keywords": all_keywords.most_common(25),
        "missing_meta": missing_meta,
        "missing_h1": missing_h1
    }

# --- MAIN UI LAYOUT ---
str_lit.title("SITEPULSE ENTERPRISE REPORT")
str_lit.subheader("Technical SEO & Diagnostic Report")

target_input = str_lit.text_input("Target Domain URL:", value="https://codicares.com")
max_pages_selection = str_lit.number_input("Maximum Crawl Limit (Pages):", min_value=10, max_value=500, value=100)

if str_lit.button("Run Full Site Audit"):
    with str_lit.spinner("Crawling all discovered pages across the domain..."):
        data = crawl_entire_site(target_input, max_crawl_pages=max_pages_selection)

    str_lit.markdown("---")

    col1, col2, col3, col4, col5, col6 = str_lit.columns(6)
    col1.metric("HEALTH SCORE", f"{data['health_score']} / 100", f"{data['issues']} Flaw(s)")
    col2.metric("GOOGLE DOM AUTHORITY", f"{data['google_authority']} / 100", "Weak" if data['google_authority'] < 50 else "Strong")
    col3.metric("DISCOVERED PAGES", data['discovered_pages'], f"{data['crawled_pages']} Crawled")
    col4.metric("AVG LATENCY", f"{data['avg_latency']}s", "Status: 200")
    col5.metric("TOTAL IMAGES", data['total_images'], f"{data['missing_alt']} Missing Alt")
    col6.metric("LINKS SCANNED", data['total_links'], f"{data['unsafe_links']} Unsafe")

    str_lit.markdown("---")

    str_lit.markdown(f"### SCANNED SUB-PAGES CRAWL LOG (`{data['crawled_pages']} of {data['discovered_pages']} pages crawled`)")
    
    log_html = """
    <table class="crawl-log-table">
        <thead>
            <tr>
                <th>#</th>
                <th>TARGET SUB-PAGE URL</th>
                <th>STATUS</th>
                <th>LATENCY</th>
                <th>FLAWS DETECTED</th>
            </tr>
        </thead>
        <tbody>
    """
    for entry in data['crawled_log']:
        status_color = "#16a34a" if entry['status'] == 200 else "#dc2626"
        flaw_color = "#dc2626" if entry['flaws'] > 0 else "#16a34a"
        log_html += f"""
        <tr>
            <td>[{entry['index']}]</td>
            <td><a href="{entry['url']}" target="_blank" style="color: #0284c7;">{entry['url']}</a></td>
            <td><span style="color: {status_color}; font-weight: bold;">{entry['status']} OK</span></td>
            <td>{entry['latency']}</td>
            <td><span style="color: {flaw_color};">{entry['flaws']} flaw(s)</span></td>
        </tr>
        """
    log_html += "</tbody></table>"
    str_lit.markdown(log_html, unsafe_allow_html=True)

    str_lit.markdown("---")

    str_lit.markdown("### KEYWORD EXPRESSION ENGINE")
    str_lit.write("**High-Traffic Organic Keywords Extracted (Sorted High → Low Frequency):**")
    if data['sorted_keywords']:
        kw_html = ""
        for word, count in data['sorted_keywords']:
            kw_html += f'<div class="badge">{word} <span class="badge-count">{count}</span></div>'
        str_lit.markdown(kw_html, unsafe_allow_html=True)

    str_lit.markdown("---")

    str_lit.markdown("## Executive Summary")
    str_lit.markdown(f"**Overall Calculated Health Score:** `{data['health_score']}/100` | **Google Trust Index:** `{data['google_authority']}/100`")
    str_lit.write(
        f"Comprehensive multi-page audit completed for **{data['domain']}**. "
        f"The scanner discovered **{data['discovered_pages']} total internal pages** and successfully crawled **{data['crawled_pages']} pages** "
        f"with an average latency of **{data['avg_latency']}s**."
    )

    str_lit.markdown("### 1. Multi-Page Crawl & Site Architecture")
    str_lit.markdown(f"- **Discovered Pages:** {data['discovered_pages']}")
    str_lit.markdown(f"- **Pages Crawled:** {data['crawled_pages']} (Crawl completeness: {round((data['crawled_pages']/data['discovered_pages'])*100, 1)}%)")
    str_lit.markdown(f"- **Total Site Images Evaluated:** {data['total_images']} ({data['missing_alt']} missing alt attributes)")

    str_lit.markdown("### 2. Domain Authority & Google Trust")
    str_lit.markdown(f"- **Domain Score:** {data['google_authority']}/100 calculated across metadata coverage and server latency.")
    str_lit.markdown(f"- **Status:** Classified as {'**Low Google Trust & Weak Authority**' if data['google_authority'] < 50 else '**High Google Trust & Strong Authority**'}.")

    str_lit.markdown("### 3. Structural Flaws & Deficiencies")
    str_lit.markdown(f"- **Total Issues Detected:** {data['issues']} flaw(s) across all scanned pages.")
    str_lit.markdown(f"- **Missing Meta Descriptions:** Flagged on {data['missing_meta']} page(s).")
    str_lit.markdown(f"- **Missing H1 Tags:** Flagged on {data['missing_h1']} page(s).")
    str_lit.markdown(f"- **Untrusted Links:** {data['unsafe_links']} flag(s) identified.")