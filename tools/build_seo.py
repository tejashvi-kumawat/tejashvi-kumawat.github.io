#!/usr/bin/env python3
"""Pre-render the blog for search engines and write sitemap.xml, robots.txt, feed.xml.

Posts are still written as blog/<slug>.md + an entry in blog/posts.json.
Run this after every change, then commit the generated files:

    pip install markdown pyyaml
    python tools/build_seo.py
"""
import html
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import markdown
import yaml

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://tejashvi-kumawat.github.io"
AUTHOR = "Tejashvi Kumawat"
OG_IMAGE = f"{SITE}/assets/tejashvi.jpg"
FONTS = (
    "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&"
    "family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
)
ICONS = (
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">'
    '<symbol id="i-arrow" viewBox="0 0 24 24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></symbol></svg>'
)


def pretty_date(iso):
    return datetime.strptime(iso, "%Y-%m-%d").strftime("%d %b %Y").lstrip("0")


def esc(s):
    return html.escape(str(s), quote=True)


def split_front_matter(text):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        return {}, text
    return yaml.safe_load(m.group(1)) or {}, m.group(2)


def tags_html(raw):
    out = []
    for t in raw or []:
        label, _, href = (str(t).partition("|"))
        label, href = label.strip(), href.strip()
        if href:
            out.append(
                f'<a class="post-tag post-tag-link" href="{esc(href)}" target="_blank" rel="noopener noreferrer">{esc(label)}</a>'
            )
        else:
            out.append(f'<span class="post-tag">{esc(label)}</span>')
    return "".join(out)


def head(title, description, canonical, og_type="website", extra="", prefix="../"):
    return f"""<meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}" />
  <meta name="author" content="{AUTHOR}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="{esc(canonical)}" />
  <link rel="alternate" type="application/atom+xml" title="{AUTHOR} — blog" href="{SITE}/feed.xml" />
  <meta property="og:site_name" content="{AUTHOR}" />
  <meta property="og:type" content="{og_type}" />
  <meta property="og:title" content="{esc(title)}" />
  <meta property="og:description" content="{esc(description)}" />
  <meta property="og:url" content="{esc(canonical)}" />
  <meta property="og:image" content="{OG_IMAGE}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="{esc(title)}" />
  <meta name="twitter:description" content="{esc(description)}" />
  <meta name="theme-color" content="#000000" />
  <meta name="google-site-verification" content="QkLkGs-dC5ODQAl7S6HN8J9Vq0is6BIBXomtna_aylA" />
  {extra}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="{FONTS}" rel="stylesheet" />
  <link rel="stylesheet" href="{prefix}styles.css" />
  <script src="{prefix}script.js" defer></script>"""


def header(cta_href, cta_label):
    return f"""<header class="top">
    <a class="logo" href="../">Tejashvi</a>
    <nav>
      <a href="../#about">About</a>
      <a href="../#work">Building</a>
      <a href="./">Blog</a>
      <a href="../#contact">Contact</a>
    </nav>
    <a class="nav-cta" href="{cta_href}">{cta_label}</a>
  </header>"""


def render_post(post, posts):
    slug = post["slug"]
    meta, body = split_front_matter((ROOT / "blog" / f"{slug}.md").read_text(encoding="utf-8"))
    title = meta.get("title") or post["title"]
    desc = meta.get("description") or post["summary"]
    date = str(meta.get("date") or post["date"])
    canonical = f"{SITE}/blog/{slug}.html"
    content = markdown.markdown(body, extensions=["tables", "fenced_code", "sane_lists"])
    ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": desc,
        "datePublished": date,
        "dateModified": date,
        "mainEntityOfPage": canonical,
        "url": canonical,
        "image": OG_IMAGE,
        "author": {"@type": "Person", "name": AUTHOR, "url": SITE + "/"},
        "publisher": {"@type": "Person", "name": AUTHOR, "url": SITE + "/"},
    }
    ordered = sorted(posts, key=lambda p: p["date"], reverse=True)
    i = next(k for k, p in enumerate(ordered) if p["slug"] == slug)
    newer = ordered[i - 1] if i > 0 else None
    older = ordered[i + 1] if i < len(ordered) - 1 else None
    nav = (
        (f'<a href="{older["slug"]}.html"><span class="dir">← Older</span><span class="title">{esc(older["title"])}</span></a>' if older else "<span></span>")
        + (f'<a href="{newer["slug"]}.html" style="text-align:right"><span class="dir">Newer →</span><span class="title">{esc(newer["title"])}</span></a>' if newer else "<span></span>")
    )
    pretty = datetime.strptime(date, "%Y-%m-%d").strftime("%d %B %Y").lstrip("0")
    extra = (
        f'<meta property="article:published_time" content="{date}" />\n  '
        f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'
    )
    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  {head(f"{title} · {AUTHOR}", desc, canonical, "article", extra)}
</head>
<body class="blog-page">
  <canvas id="cellField" aria-hidden="true"></canvas>
  {ICONS}
  {header("./", "All posts")}
  <main>
    <div class="blog-bar">
      <a class="back-link" href="./">
        <svg class="icon" width="16" height="16" aria-hidden="true"><use href="#i-arrow"/></svg>
        Back to blog
      </a>
      <a class="back-link" href="../">Home</a>
    </div>
    <article class="panel">
      <p class="post-meta"><time id="postDate" datetime="{date}">{pretty}</time></p>
      <h1 id="postTitle" style="font-family:var(--font-display);letter-spacing:-0.03em;margin:0 0 0.75rem">{esc(title)}</h1>
      <div class="post-tags" id="postTags">{tags_html(meta.get("tags"))}</div>
      <div id="postBody" class="prose" data-slug="{slug}" data-prerendered="1">
{content}
      </div>
      <nav class="post-nav" id="postNav" aria-label="Post navigation">{nav}</nav>
    </article>
  </main>
  <footer class="footer">
    <p><a href="./">← Blog</a> · <a href="../">Home</a></p>
  </footer>
</body>
</html>
"""
    (ROOT / "blog" / f"{slug}.html").write_text(page, encoding="utf-8")


def render_index(posts):
    ordered = sorted(posts, key=lambda p: p["date"], reverse=True)
    cards = "".join(
        f'<a class="post-card" href="{p["slug"]}.html"><time datetime="{p["date"]}">{pretty_date(p["date"])}</time>'
        f'<h3>{esc(p["title"])}</h3><p>{esc(p["summary"])}</p></a>'
        for p in ordered
    )
    ld = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": f"{AUTHOR} — blog",
        "url": f"{SITE}/blog/",
        "author": {"@type": "Person", "name": AUTHOR, "url": SITE + "/"},
        "blogPost": [
            {"@type": "BlogPosting", "headline": p["title"], "url": f"{SITE}/blog/{p['slug']}.html", "datePublished": p["date"]}
            for p in ordered
        ],
    }
    src = (ROOT / "blog" / "index.html").read_text(encoding="utf-8")
    desc = "Writing by Tejashvi Kumawat — LLM agent research, Document Studio releases, platforms and shipping notes."
    canonical = f"{SITE}/blog/"
    new_head = head(f"Blog · {AUTHOR}", desc, canonical, "website",
                    f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>')
    src = re.sub(r"<head>.*?</head>", f"<head>\n  {new_head}\n</head>", src, flags=re.S)
    src = re.sub(
        r'<div id="allPosts"[^>]*>.*?</div>',
        f'<div id="allPosts" class="post-list" aria-live="polite" data-prerendered="1">{cards}</div>',
        src, flags=re.S,
    )
    (ROOT / "blog" / "index.html").write_text(src, encoding="utf-8")


def render_home(posts):
    ordered = sorted(posts, key=lambda p: p["date"], reverse=True)
    desc = (
        "Tejashvi Kumawat builds Document Studio, a free offline PDF and Office desktop app, "
        "and researches shared memory for parallel LLM agents (BACM). Systems, AI agents, "
        "optimization and platform engineering."
    )
    title = "Tejashvi Kumawat — Document Studio, BACM research and engineering notes"
    ld = [
        {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": AUTHOR,
            "url": SITE + "/",
            "image": OG_IMAGE,
            "description": desc,
            "sameAs": ["https://github.com/tejashvi-kumawat"],
            "knowsAbout": ["LLM agents", "agent memory", "PDF tooling", "platform engineering", "optimization"],
        },
        {"@context": "https://schema.org", "@type": "WebSite", "name": AUTHOR, "url": SITE + "/"},
    ]
    new_head = head(title, desc, SITE + "/", "website",
                    f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>', prefix="")
    new_head = new_head.replace('href="../', 'href="').replace('src="../', 'src="')
    src = (ROOT / "index.html").read_text(encoding="utf-8")
    src = re.sub(r"<head>.*?</head>", f"<head>\n  {new_head}\n</head>", src, count=1, flags=re.S)
    cards = "".join(
        f'<a class="post-card" href="blog/{p["slug"]}.html"><time datetime="{p["date"]}">{pretty_date(p["date"])}</time>'
        f'<h3>{esc(p["title"])}</h3><p>{esc(p["summary"])}</p></a>'
        for p in ordered[:3]
    )
    src = re.sub(
        r'<div id="recentPosts"[^>]*>.*?</div>',
        lambda m: f'<div id="recentPosts" class="post-list" aria-live="polite">{cards}</div>',
        src, count=1, flags=re.S,
    )
    (ROOT / "index.html").write_text(src, encoding="utf-8")


def write_site_files(posts):
    ordered = sorted(posts, key=lambda p: p["date"], reverse=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    urls = [(f"{SITE}/", today, "1.0"), (f"{SITE}/blog/", ordered[0]["date"], "0.9")]
    urls += [(f"{SITE}/blog/{p['slug']}.html", p["date"], "0.8") for p in ordered]
    urls.append((f"{SITE}/assets/bacm-paper.pdf", "2026-10-07", "0.7"))
    body = "".join(
        f"  <url><loc>{u}</loc><lastmod>{d}</lastmod><priority>{pr}</priority></url>\n" for u, d, pr in urls
    )
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}</urlset>\n',
        encoding="utf-8",
    )
    (ROOT / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\nSitemap: {SITE}/DocumentStudio/sitemap.xml\n", encoding="utf-8"
    )
    entries = "".join(
        f"""  <entry>
    <title>{esc(p["title"])}</title>
    <link href="{SITE}/blog/{p["slug"]}.html"/>
    <id>{SITE}/blog/{p["slug"]}.html</id>
    <updated>{p["date"]}T00:00:00Z</updated>
    <summary>{esc(p["summary"])}</summary>
  </entry>
"""
        for p in ordered
    )
    (ROOT / "feed.xml").write_text(
        f"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>{AUTHOR} — blog</title>
  <link href="{SITE}/blog/"/>
  <link rel="self" href="{SITE}/feed.xml"/>
  <id>{SITE}/</id>
  <updated>{ordered[0]["date"]}T00:00:00Z</updated>
  <author><name>{AUTHOR}</name></author>
{entries}</feed>
""",
        encoding="utf-8",
    )


def main():
    posts = json.loads((ROOT / "blog" / "posts.json").read_text(encoding="utf-8"))
    for p in posts:
        render_post(p, posts)
    render_index(posts)
    render_home(posts)
    write_site_files(posts)
    print(f"built {len(posts)} posts, blog index, sitemap.xml, robots.txt, feed.xml")


if __name__ == "__main__":
    sys.exit(main())
