import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, selectors } = req.body;

    if (!url || !Array.isArray(selectors)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Fetch HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (HTML Fetch Tool)'
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch page' });
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    /* -----------------------------
       1️⃣ PAGE TITLE
    ------------------------------ */
    const title = document.querySelector('title')?.textContent || null;

    /* -----------------------------
       2️⃣ INLINE CSS (<style>)
    ------------------------------ */
    const inlineStyles = Array.from(document.querySelectorAll('style'))
      .map(style => style.textContent.trim())
      .filter(Boolean)
      .join('\n\n') || null;

    /* -----------------------------
       3️⃣ INLINE JS (<script> without src)
    ------------------------------ */
    const inlineScripts = Array.from(
      document.querySelectorAll('script:not([src])')
    )
      .map(script => script.textContent.trim())
      .filter(Boolean)
      .join('\n\n') || null;

    /* -----------------------------
       4️⃣ SELECTED HTML (with wrapper)
    ------------------------------ */
    const extractedHTML = selectors.map(selector => {
      let elements;

      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        return {
          selector,
          content: null,
          error: 'Invalid selector'
        };
      }

      return {
        selector,
        content: elements.length
          ? Array.from(elements)
              .map(el => el.outerHTML) // ✅ wrapper + children
              .join('\n\n')
          : null
      };
    });

    /* -----------------------------
       FINAL RESPONSE
    ------------------------------ */
    return res.status(200).json({
      title,
      inlineStyles,
      inlineScripts,
      results: extractedHTML
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Server error while processing request'
    });
  }
}
