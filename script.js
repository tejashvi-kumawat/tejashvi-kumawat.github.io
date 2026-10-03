(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  initCellField();
  initRecentPosts();
  initBlogIndex();
  initBlogPost();
})();

function initCellField() {
  const canvas = document.getElementById("cellField");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const HOLD_MS = 850;
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
        c.heat += (0 - c.heat) * 0.045;
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
  container.innerHTML = slice.map((p) => `
    <a class="post-card" href="${base}${p.slug}.html">
      <time datetime="${p.date}">${formatDate(p.date)}</time>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.summary)}</p>
    </a>
  `).join("");
}

async function initBlogPost() {
  const el = document.getElementById("postBody");
  if (!el) return;
  const slug = el.dataset.slug;
  if (!slug) return;
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
    if (window.marked) {
      el.innerHTML = window.marked.parse(body);
    } else {
      el.textContent = body;
    }
  } catch {
    el.innerHTML = "<p>Could not load this post.</p>";
  }
}

function parseFrontMatter(md) {
  if (!md.startsWith("---")) return { meta: {}, body: md };
  const end = md.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: md };
  const raw = md.slice(3, end).trim();
  const body = md.slice(end + 4).trim();
  const meta = {};
  for (const line of raw.split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
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
