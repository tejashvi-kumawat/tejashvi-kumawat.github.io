(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  initCellField();
  initHeroSpotlight();
  initTimeline();
  initProjectStage();
  initRecentPosts();
  initBlogIndex();
  initBlogPost();
})();

function initHeroSpotlight() {
  const copy = document.getElementById("heroCopy");
  const spot = document.getElementById("heroSpotlight");
  if (!copy || !spot) return;

  const move = (e) => {
    const rect = copy.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    copy.classList.add("is-spotlit");
  };

  const leave = () => {
    copy.classList.remove("is-spotlit");
  };

  copy.addEventListener("pointermove", move, { passive: true });
  copy.addEventListener("pointerenter", move, { passive: true });
  copy.addEventListener("pointerleave", leave);
}

function initTimeline() {
  const root = document.getElementById("timeline");
  if (!root) return;
  root.querySelectorAll(".timeline-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".timeline-item");
      if (!item) return;
      const open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
}

function initProjectStage() {
  const stage = document.getElementById("projectStage");
  if (!stage) return;
  const tiles = [...stage.querySelectorAll(".project-tile")];
  const panels = [...stage.querySelectorAll(".project-panel")];
  const prev = document.getElementById("projectPrev");
  const next = document.getElementById("projectNext");
  const indexEl = document.getElementById("projectIndex");
  const totalEl = document.getElementById("projectTotal");
  if (!tiles.length || !panels.length) return;

  const ids = tiles.map((t) => t.dataset.project);
  let current = 0;
  if (totalEl) totalEl.textContent = String(ids.length);

  const show = (i, dir = 1) => {
    current = (i + ids.length) % ids.length;
    const id = ids[current];
    tiles.forEach((tile, idx) => {
      const on = idx === current;
      tile.classList.toggle("is-active", on);
      tile.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach((panel) => {
      const on = panel.dataset.project === id;
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
      if (on) {
        panel.style.setProperty("--dir", String(dir >= 0 ? 1 : -1));
        panel.style.animation = "none";
        void panel.offsetWidth;
        panel.style.animation = "";
      }
    });
    if (indexEl) indexEl.textContent = String(current + 1);
  };

  tiles.forEach((tile, idx) => {
    tile.addEventListener("click", () => show(idx, idx > current ? 1 : -1));
  });
  prev?.addEventListener("click", () => show(current - 1, -1));
  next?.addEventListener("click", () => show(current + 1, 1));

  show(0, 1);
}

function initCellField() {
  const canvas = document.getElementById("cellField");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const HOLD_MS = 280;
  const RADIUS = 150;
  let cells = [];
  let cols = 0;
  let rows = 0;
  let size = 32;
  let gap = 3;
  let pointer = { x: -9999, y: -9999, active: false };
  let raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    size = w < 700 ? 26 : w < 1100 ? 30 : 34;
    gap = w < 700 ? 2.5 : 3.5;
    cols = Math.ceil(w / size) + 1;
    rows = Math.ceil(h / size) + 1;
    cells = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const shade = 8 + ((x * 7 + y * 13) % 10);
        cells.push({
          x,
          y,
          base: shade,
          heat: 0,
          holdUntil: 0,
        });
      }
    }
  }

  function draw(now) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    for (const c of cells) {
      const cx = c.x * size + size * 0.5;
      const cy = c.y * size + size * 0.5;
      let target = 0;
      if (pointer.active) {
        const dist = Math.hypot(cx - pointer.x, cy - pointer.y);
        if (dist < RADIUS) {
          const t = 1 - dist / RADIUS;
          target = t * t; // circular soft falloff
        }
      }

      if (target > c.heat) {
        c.heat = target;
        c.holdUntil = now + HOLD_MS;
      } else if (now > c.holdUntil) {
        c.heat += (0 - c.heat) * 0.18;
        if (c.heat < 0.002) c.heat = 0;
      }

      const lit = c.heat;
      const r = Math.round(c.base + lit * (235 - c.base));
      const g = Math.round(c.base + lit * (240 - c.base));
      const b = Math.round(c.base + 2 + lit * (220 - c.base));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(
        c.x * size + gap,
        c.y * size + gap,
        size - gap * 2,
        size - gap * 2
      );
    }
    raf = requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => {
    cancelAnimationFrame(raf);
    resize();
    raf = requestAnimationFrame(draw);
  });

  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("blur", () => {
    pointer.active = false;
  });

  window.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    if (!t) return;
    pointer.x = t.clientX;
    pointer.y = t.clientY;
    pointer.active = true;
  }, { passive: true });

  window.addEventListener("touchend", () => {
    pointer.active = false;
  }, { passive: true });

  resize();
  raf = requestAnimationFrame(draw);
}

async function loadPosts() {
  const res = await fetch("blog/posts.json", { cache: "no-store" });
  if (!res.ok) throw new Error("posts.json missing");
  const posts = await res.json();
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function initRecentPosts() {
  const el = document.getElementById("recentPosts");
  if (!el) return;
  try {
    const posts = await loadPosts();
    renderPostCards(el, posts, 3, "blog/");
  } catch {
    el.innerHTML = `<p>Writing lives in <a href="blog/">/blog</a> — first posts coming soon.</p>`;
  }
}

async function initBlogIndex() {
  const el = document.getElementById("allPosts");
  if (el && el.dataset.prerendered) return;
  if (!el) return;
  try {
    const res = await fetch("posts.json", { cache: "no-store" });
    if (!res.ok) throw new Error("missing");
    const postsLocal = await res.json();
    postsLocal.sort((a, b) => (a.date < b.date ? 1 : -1));
    renderPostCards(el, postsLocal, null, "");
  } catch {
    el.innerHTML = "<p>No posts yet.</p>";
  }
}

function renderPostCards(container, posts, limit, base) {
  const slice = typeof limit === "number" ? posts.slice(0, limit) : posts;
  if (!slice.length) {
    container.innerHTML = "<p>No posts yet.</p>";
    return;
  }
  container.innerHTML = slice.map((p) => {
    const tags = normalizeTags(p.tags);
    const tagHtml = tags.length
      ? `<div class="post-tags post-tags-card">${tags.map((t) =>
          `<span class="post-tag">${escapeHtml(t.label)}</span>`
        ).join("")}</div>`
      : "";
    return `
    <a class="post-card" href="${base}${p.slug}.html">
      <time datetime="${p.date}">${formatDate(p.date)}</time>
      <h3>${escapeHtml(p.title)}</h3>
      ${tagHtml}
      <p>${escapeHtml(p.summary)}</p>
    </a>
  `;
  }).join("");
}

async function initBlogPost() {
  const el = document.getElementById("postBody");
  if (!el) return;
  const slug = el.dataset.slug;
  if (!slug) return;
  if (el.dataset.prerendered) {
    enhanceCodeBlocks(el);
    return;
  }
  try {
    const res = await fetch(`${slug}.md`, { cache: "no-store" });
    if (!res.ok) throw new Error("missing md");
    const md = await res.text();
    const { meta, body } = parseFrontMatter(md);
    if (meta.title) {
      document.title = `${meta.title} · Tejashvi Kumawat`;
      const h = document.getElementById("postTitle");
      if (h) h.textContent = meta.title;
    }
    if (meta.date) {
      const t = document.getElementById("postDate");
      if (t) {
        t.dateTime = meta.date;
        t.textContent = formatDate(meta.date);
      }
    }
    renderPostTags(meta.tags);
    if (window.marked) {
      if (typeof window.marked.setOptions === "function") {
        window.marked.setOptions({ gfm: true, breaks: false });
      }
      el.innerHTML = window.marked.parse(body);
    } else {
      el.textContent = body;
    }
    enhanceCodeBlocks(el);
    await renderPostNav(slug);
  } catch {
    el.innerHTML = "<p>Could not load this post.</p>";
  }
}

function renderPostTags(rawTags) {
  const host = document.getElementById("postTags");
  if (!host) return;
  const tags = normalizeTags(rawTags);
  if (!tags.length) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }
  host.hidden = false;
  host.innerHTML = tags.map((t) => {
    if (t.href) {
      return `<a class="post-tag post-tag-link" href="${escapeAttr(t.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.label)}</a>`;
    }
    return `<span class="post-tag">${escapeHtml(t.label)}</span>`;
  }).join("");
}

function normalizeTags(raw) {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return normalizeTags(parsed);
    } catch {
      return raw.split(",").map((s) => parseTagToken(s.trim())).filter(Boolean);
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (!item) return null;
    if (typeof item === "string") return parseTagToken(item);
    if (typeof item === "object") {
      const label = String(item.label || item.name || "").trim();
      if (!label) return null;
      const href = String(item.href || item.url || "").trim();
      return href ? { label, href } : { label };
    }
    return null;
  }).filter(Boolean);
}

function parseTagToken(token) {
  if (!token) return null;
  const pipe = token.indexOf("|");
  if (pipe === -1) return { label: token.trim() };
  const label = token.slice(0, pipe).trim();
  const href = token.slice(pipe + 1).trim();
  if (!label) return null;
  return href ? { label, href } : { label };
}

function enhanceCodeBlocks(root) {
  if (!root) return;
  root.querySelectorAll("pre").forEach((pre) => {
    if (pre.parentElement?.classList.contains("code-block")) return;
    const wrap = document.createElement("div");
    wrap.className = "code-block";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-copy";
    btn.setAttribute("aria-label", "Copy code");
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      const text = pre.innerText;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
        btn.classList.add("is-copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("is-copied");
        }, 1600);
      } catch {
        btn.textContent = "Failed";
        setTimeout(() => { btn.textContent = "Copy"; }, 1600);
      }
    });
    wrap.appendChild(btn);
  });
}

async function renderPostNav(slug) {
  const nav = document.getElementById("postNav");
  if (!nav) return;
  try {
    const res = await fetch("posts.json", { cache: "no-store" });
    if (!res.ok) return;
    const posts = (await res.json()).sort((a, b) => (a.date < b.date ? 1 : -1));
    const i = posts.findIndex((p) => p.slug === slug);
    if (i === -1) return;
    const newer = i > 0 ? posts[i - 1] : null;
    const older = i < posts.length - 1 ? posts[i + 1] : null;
    nav.innerHTML = `
      ${older ? `<a href="${older.slug}.html"><span class="dir">← Older</span><span class="title">${escapeHtml(older.title)}</span></a>` : "<span></span>"}
      ${newer ? `<a href="${newer.slug}.html" style="text-align:right"><span class="dir">Newer →</span><span class="title">${escapeHtml(newer.title)}</span></a>` : "<span></span>"}
    `;
  } catch {
    /* ignore */
  }
}

function parseFrontMatter(md) {
  if (!md.startsWith("---")) return { meta: {}, body: md };
  const end = md.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: md };
  const raw = md.slice(3, end).trim();
  const body = md.slice(end + 4).trim();
  const meta = {};
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (/^\s+-\s+/.test(line)) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key === "tags" && (!val || val === "|" || val === ">-")) {
      const items = [];
      while (i + 1 < lines.length && /^\s+-\s+/.test(lines[i + 1])) {
        i += 1;
        items.push(lines[i].replace(/^\s+-\s+/, "").trim());
      }
      meta.tags = items;
      continue;
    }
    if (key === "tags" && val.startsWith("[")) {
      let json = val;
      while (!json.trim().endsWith("]") && i + 1 < lines.length) {
        i += 1;
        json += lines[i];
      }
      try {
        meta.tags = JSON.parse(json);
      } catch {
        meta.tags = val;
      }
      continue;
    }
    meta[key] = val;
  }
  return { meta, body };
}

function formatDate(iso) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
