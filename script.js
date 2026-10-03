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

  const paletteA = ["#0A0F14", "#101820", "#0E1620", "#121A24"];
  const paletteB = ["#E8FF47", "#FF5C39", "#5CE1E6", "#F4F1EA", "#2A3A4A"];
  let cells = [];
  let cols = 0;
  let rows = 0;
  let size = 28;
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

    size = w < 700 ? 22 : w < 1100 ? 26 : 30;
    cols = Math.ceil(w / size) + 1;
    rows = Math.ceil(h / size) + 1;
    cells = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        cells.push({
          x,
          y,
          base: paletteA[(x + y) % paletteA.length],
          flip: paletteB[(x * 3 + y * 5) % paletteB.length],
          t: Math.random(),
          speed: 0.15 + Math.random() * 0.35,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  function mix(a, b, t) {
    const pa = hexToRgb(a);
    const pb = hexToRgb(b);
    const r = Math.round(pa.r + (pb.r - pa.r) * t);
    const g = Math.round(pa.g + (pb.g - pa.g) * t);
    const bl = Math.round(pa.b + (pb.b - pa.b) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  function draw(now) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.fillStyle = "#0A0F14";
    ctx.fillRect(0, 0, w, h);

    const time = now * 0.001;
    for (const c of cells) {
      const cx = c.x * size + size * 0.5;
      const cy = c.y * size + size * 0.5;
      const dx = cx - pointer.x;
      const dy = cy - pointer.y;
      const dist = Math.hypot(dx, dy);
      const hover = pointer.active ? Math.max(0, 1 - dist / 160) : 0;
      const wave = 0.08 + 0.08 * Math.sin(time * c.speed + c.pulse + c.x * 0.15 + c.y * 0.1);
      c.t += (Math.max(hover, wave) - c.t) * 0.12;
      const color = mix(c.base, c.flip, c.t);
      const gap = 1;
      ctx.fillStyle = color;
      ctx.fillRect(c.x * size + gap, c.y * size + gap, size - gap * 2, size - gap * 2);
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

  window.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    if (!t) return;
    pointer.x = t.clientX;
    pointer.y = t.clientY;
    pointer.active = true;
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

function renderPostCards(container, posts, limit) {
  const slice = typeof limit === "number" ? posts.slice(0, limit) : posts;
  if (!slice.length) {
    container.innerHTML = "<p>No posts yet.</p>";
    return;
  }
  const base = container.dataset.base || "blog/";
  container.innerHTML = slice.map((p) => `
    <a class="post-card" href="${base}${p.slug}.html">
      <time datetime="${p.date}">${formatDate(p.date)}</time>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.summary)}</p>
    </a>
  `).join("");
}

async function initRecentPosts() {
  const el = document.getElementById("recentPosts");
  if (!el) return;
  try {
    const posts = await loadPosts();
    renderPostCards(el, posts, 3);
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
    el.innerHTML = postsLocal.map((p) => `
      <a class="post-card" href="${p.slug}.html">
        <time datetime="${p.date}">${formatDate(p.date)}</time>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.summary)}</p>
      </a>
    `).join("");
  } catch {
    el.innerHTML = "<p>No posts yet.</p>";
  }
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
