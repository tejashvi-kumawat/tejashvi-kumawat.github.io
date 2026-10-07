# How to post blogs securely (recommended)

This site is static GitHub Pages. **Do not** put a public “admin login” or shared CMS password on the website — that becomes an attack surface.

## Best workflow (secure + frequent + nice UI)

### 1. Markdown in this repo (default — what you have now)
1. Copy `blog/_post-template.html` → `blog/my-slug.html` and set `data-slug="my-slug"`.
2. Write `blog/my-slug.md` with YAML front matter (`title`, `date`).
3. Add an entry to `blog/posts.json` (slug, title, summary, date).
4. Commit & push to `main` as yourself. Pages updates in ~1 minute.

**Why it’s secure:** only people with write access to the repo can publish. Auth is GitHub’s (2FA, SSO, deploy keys) — not a custom form on your site.

**Nice UI while writing:**
- **VS Code / Cursor** + Markdown preview
- Or [Obsidian](https://obsidian.md) → export/copy into `blog/`
- Or GitHub web editor for quick fixes on phone

### 2. Decap CMS / Sveltia CMS (optional polish)
If you want a **browser UI** to write posts without a public password:

- Use **Decap CMS** or **Sveltia CMS** with **GitHub OAuth** (Netlify Identity *or* a tiny OAuth proxy).
- Editors authenticate with **your GitHub account** (enable 2FA).
- CMS commits Markdown into `blog/` — same static site, nicer editor.

Still no “shared blog password” on the public internet.

### 3. What to avoid
- WordPress / PHP admin on this Pages site
- Hardcoded API keys in the frontend
- A publicly reachable write API without GitHub auth
- Committing `.env` secrets

## Frequent posting tips
- Keep posts short (300–800 words). Update `posts.json` every time.
- Home page auto-shows the **3 most recent** by date.
- Draft privately in a branch; merge when ready.
- Optional later: custom domain (`tejashvi.dev`) + HTTPS via Pages.

## Checklist for each post
- [ ] `blog/<slug>.md`
- [ ] `blog/<slug>.html` (clone an existing post page)
- [ ] entry in `blog/posts.json`
- [ ] push to `main`

## SEO build (required after every change)
Posts are pre-rendered into static HTML (so search engines see the text, not an empty "Loading…" page),
and `sitemap.xml`, `robots.txt` and `feed.xml` are regenerated:

```bash
pip install markdown pyyaml
python tools/build_seo.py
```
Commit the generated files together with your post. Each post's `description:` in its front matter is used as the meta description.
