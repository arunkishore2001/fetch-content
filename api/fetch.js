import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, selectors } = req.body;

    // Basic validation
    if (!url || !Array.isArray(selectors) || selectors.length === 0) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Fetch page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (HTML Fetch Tool)'
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch page HTML' });
    }

    const html = await response.text();

    // Parse HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract HTML by selectors
    const result = selectors.map(selector => {
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

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      error: 'Server error while fetching HTML'
    });
  }
}
