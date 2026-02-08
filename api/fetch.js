import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, selectors } = req.body;

    const response = await fetch(url);
    const html = await response.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const result = selectors.map(selector => {
      const elements = document.querySelectorAll(selector);

      return {
        selector,
        content: elements.length
          ? Array.from(elements)
              .map(el => el.outerHTML)   // ✅ THIS LINE IS IMPORTANT
              .join('\n\n')
          : null
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch HTML' });
  }
}
