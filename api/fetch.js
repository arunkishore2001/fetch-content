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

    const result = selectors.map(sel => {
      const el = document.querySelector(sel);
      return {
        selector: sel,
        content: el ? el.outerHTML : null
      };
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch page' });
  }
}
