---
title: "Document Studio v1.2.0 — Word and PowerPoint editors, Quick Tools and tool pages with live preview"
date: 2026-10-07
description: "What is new in Document Studio v1.2.0, the free offline PDF and Office desktop app for Windows, macOS and Linux: Word and PowerPoint editors, a customizable Quick Tools bar, preview-pane tool pages, PDF files opening as tabs, faster PDF editing and qpdf-free tools."
tags:
  - GitHub | https://github.com/tejashvi-kumawat/DocumentStudio
  - v1.2.0 | https://github.com/tejashvi-kumawat/DocumentStudio/releases/tag/v1.2.0
  - Offline PDF
  - Open Source
---

<div class="blog-split">
<div class="blog-split-main">
<p><strong>Document Studio v1.2.0</strong> is out. It is still a free, ad-free, offline desktop app for PDF and Office documents on Windows, macOS and Linux, and files still never leave your device. This release is about editing documents, not only converting them, and about making every tool page feel like one product.</p>
</div>
<aside class="blog-rail">
<p class="blog-rail-label">Get it</p>
<a class="blog-rail-btn" href="https://github.com/tejashvi-kumawat/DocumentStudio/releases/tag/v1.2.0">Download v1.2.0 →</a>
<a class="blog-rail-btn ghost" href="https://tejashvi-kumawat.github.io/DocumentStudio/">Product site</a>
<a class="blog-rail-btn ghost" href="https://github.com/tejashvi-kumawat/DocumentStudio">Source on GitHub</a>
<ul class="blog-rail-meta">
<li><strong>Latest:</strong> v1.2.0</li>
<li><strong>Platforms:</strong> Win · macOS · Linux</li>
<li><strong>Price:</strong> Free, open source</li>
</ul>
</aside>
</div>

## What is new

- **Word editor.** Edit `.docx` in the app with headers and footers, tables, images you can select, resize and move, comments, and a **suggesting mode** that marks edits as tracked changes you can accept or reject. Documents round-trip back to `.docx`.
- **PowerPoint editor.** Edit `.pptx` slides with text, shapes and images, **animations and transitions**, speaker notes and a slideshow mode. Slides render faster and switching between a PDF and a deck no longer re-renders everything.
- **Customizable Quick Tools bar.** A slim floating bar with the tools you use most, and a “more” button to pin any tool to it, in the order you choose, like Acrobat’s quick tools.
- **Tool pages with a live preview.** Compress, Encrypt, Decrypt, Properties, Remove metadata, OCR, PDF ↔ images, Office convert, Image tools, Create PDF, Images to PDF, Batch and Split now use one layout: options on the left, your document filling the rest of the window. Locked PDFs show an *Enter password* state instead of an error.
- **PDF files open as tabs.** Double-clicking a PDF, or “Open with Document Studio”, now opens it as a **new tab in the app that is already running**, not a second window (Linux and Windows; macOS hands files over the same way).
- **Faster PDF editing, better font identification.** Text edits are committed in batches, and fonts are identified from the font name, the embedded family and glyph-width metrics.
- **Works without qpdf.** Watermarks, headers and footers, page numbers and links are stamped by a built-in engine first, with qpdf kept as a fallback for encrypted or damaged files.
- **Fixes.** A crash when unlocking a PDF to preview a compressed size, and table dialogs in the Word and PowerPoint editors, are fixed.

## Download

<div class="dl-grid">
<a class="dl-card" href="https://github.com/tejashvi-kumawat/DocumentStudio/releases/download/v1.2.0/DocumentStudio-1.2.0-Setup.exe">
<span class="dl-os">Windows</span>
<span class="dl-file">DocumentStudio-1.2.0-Setup.exe</span>
<span class="dl-go">Download →</span>
</a>
<a class="dl-card" href="https://github.com/tejashvi-kumawat/DocumentStudio/releases/download/v1.2.0/DocumentStudio-1.2.0-macos.dmg">
<span class="dl-os">macOS</span>
<span class="dl-file">DocumentStudio-1.2.0-macos.dmg</span>
<span class="dl-go">Download →</span>
</a>
<a class="dl-card" href="https://github.com/tejashvi-kumawat/DocumentStudio/releases/download/v1.2.0/document-studio_1.2.0_amd64.deb">
<span class="dl-os">Linux (Debian/Ubuntu)</span>
<span class="dl-file">document-studio_1.2.0_amd64.deb</span>
<span class="dl-go">Download →</span>
</a>
</div>

A portable Windows zip and a macOS zip are also on the [release page](https://github.com/tejashvi-kumawat/DocumentStudio/releases/tag/v1.2.0). Installers are not yet code-signed, so Windows SmartScreen or macOS Gatekeeper may warn on first launch. A WinGet package is submitted and not yet merged, so it is not available through `winget` yet.

Earlier overview of what Document Studio is and why it runs offline: [Document Studio — offline PDF toolkit vs Acrobat and online converters](document-studio-open-and-fast.html).
