const https = require('https');
const fs = require('fs');

function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function serperSearch(query) {
  const body = JSON.stringify({ q: query, num: 5 });
  const res = await httpsRequest(
    'https://google.serper.dev/search',
    {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    },
    body
  );
  return JSON.parse(res.body);
}

async function jinaFetch(url) {
  const res = await httpsRequest(
    'https://r.jina.ai/' + url,
    { method: 'GET', headers: { 'Accept': 'text/plain' } }
  );
  return res.body.substring(0, 6000);
}

async function groqComplete(prompt) {
  const body = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  });
  const res = await httpsRequest(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    },
    body
  );
  const parsed = JSON.parse(res.body);
  return parsed.choices[0].message.content;
}

async function getPexelsImage(query) {
  try {
    const res = await httpsRequest(
      'https://api.pexels.com/v1/search?query=' + encodeURIComponent(query) + '&per_page=5&orientation=landscape',
      {
        method: 'GET',
        headers: {
          'Authorization': process.env.PEXELS_API_KEY
        }
      }
    );
    const data = JSON.parse(res.body);
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.large2x;
    }
  } catch (e) {
    console.warn('Pexels fetch failed:', e.message);
  }
  return null;
}

// Curated fallback golf images from Pexels (direct URLs, always work)
const fallbackImages = [
  'https://images.pexels.com/photos/1325681/pexels-photo-1325681.jpeg',
  'https://images.pexels.com/photos/91228/pexels-photo-91228.jpeg',
  'https://images.pexels.com/photos/1174996/pexels-photo-1174996.jpeg',
  'https://images.pexels.com/photos/2735981/pexels-photo-2735981.jpeg',
  'https://images.pexels.com/photos/6542947/pexels-photo-6542947.jpeg'
];

function extractField(fieldName, str) {
  const re = new RegExp('"' + fieldName + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"');
  const m = str.match(re);
  return m ? m[1] : null;
}

async function main() {
  const now = new Date();
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const month = months[now.getMonth()];
  const year = now.getFullYear();

  console.log('Searching for golf news:', month, year);

  const queries = [
    'PGA Tour latest results ' + month + ' ' + year,
    'DP World Tour news today ' + month + ' ' + year,
    'LIV Golf latest ' + month + ' ' + year
  ];

  let bestArticleUrl = null;
  let searchSummary = '';

  for (const q of queries) {
    const results = await serperSearch(q);
    if (results.organic && results.organic.length > 0) {
      const top = results.organic[0];
      searchSummary += '\nQuery: ' + q + '\nTop result: ' + top.title + '\n' + top.snippet + '\nURL: ' + top.link + '\n';
      if (!bestArticleUrl) {
        bestArticleUrl = top.link;
      }
    }
    await sleep(500);
  }

  console.log('Best article URL:', bestArticleUrl);

  let articleContent = searchSummary;
  if (bestArticleUrl) {
    try {
      console.log('Fetching article via Jina...');
      articleContent = await jinaFetch(bestArticleUrl);
      console.log('Fetched ' + articleContent.length + ' chars');
    } catch (e) {
      console.warn('Jina fetch failed, using snippet:', e.message);
    }
  }

  // Get hero image from Pexels, fall back to curated list
  let heroImg = null;
  if (process.env.PEXELS_API_KEY) {
    heroImg = await getPexelsImage('golf tournament course');
  }
  if (!heroImg) {
    // pick a random fallback image
    heroImg = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    console.log('Using fallback image');
  } else {
    console.log('Pexels image found:', heroImg);
  }

  console.log('Generating post with Groq...');

  const prompt = [
    'You are a golf journalist writing for midhandicap.com, a blog for mid-handicap amateur golfers.',
    'Based on the following research, write a golf news post. TODAY IS ' + month + ' ' + year + '.',
    '',
    'RESEARCH:',
    searchSummary,
    '',
    'FULL ARTICLE CONTENT:',
    articleContent,
    '',
    'Return your response as valid JSON with these exact fields:',
    '{',
    '  "title": "Compelling headline max 70 chars",',
    '  "category": "Tour News",',
    '  "date": "' + month + ' ' + year + '",',
    '  "excerpt": "1-2 sentence teaser max 200 chars",',
    '  "body": "HTML content here"',
    '}',
    '',
    'For the body field write HTML using only: h2, h3, p, blockquote, div tags.',
    'Allowed div classes: stats-bar, stat-item, stat-label, stat-value, gold-bar, pill, card-section.',
    'Start with a h2 section heading. Include 3-5 sections. Include a stats-bar div with 2-4 real stats.',
    '350-500 words. Tone: authoritative punchy British golf journalism. No placeholder text.',
    'category must be one of: Tour News, Equipment & More, Player Focus, Course Guide, Instruction.',
    '',
    'CRITICAL JSON RULES:',
    '- Use straight double quotes only',
    '- In the body string value: replace all " with \\" and all \\ with \\\\',
    '- Do NOT use single quotes anywhere in the JSON',
    '- Do NOT include newlines inside string values - use spaces instead',
    '- Return ONLY the JSON object, nothing else'
  ].join('\n');

  const raw = await groqComplete(prompt);
  console.log('Raw Groq response length:', raw.length);

  let postData;

  try {
    let cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];
    postData = JSON.parse(cleaned);
    console.log('JSON parsed successfully on first attempt');
  } catch (e1) {
    console.warn('Direct parse failed:', e1.message);
    try {
      console.log('Attempting field extraction fallback...');
      let cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];

      const title    = extractField('title', cleaned);
      const category = extractField('category', cleaned);
      const date     = extractField('date', cleaned);
      const excerpt  = extractField('excerpt', cleaned);
      const bodyMatch = cleaned.match(/"body"\s*:\s*"([\s\S]+?)"\s*\}?\s*$/);
      const body = bodyMatch ? bodyMatch[1] : null;

      if (!title || !category || !date || !excerpt || !body) {
        throw new Error('Missing fields after extraction. title=' + title + ' category=' + category);
      }
      postData = { title, category, date, excerpt, body };
      console.log('Field extraction succeeded');
    } catch (e2) {
      console.error('All parse attempts failed. Raw output:', raw);
      throw new Error('Could not parse Groq response: ' + e2.message);
    }
  }

  const timestamp = Date.now();
  postData.id = timestamp;
  postData.img = heroImg;

  const required = ['id', 'title', 'category', 'date', 'img', 'excerpt', 'body'];
  for (const field of required) {
    if (!postData[field]) throw new Error('Missing field: ' + field);
  }

  fs.mkdirSync('pending-posts', { recursive: true });
  const filename = 'pending-posts/post-' + timestamp + '.json';
  fs.writeFileSync(filename, JSON.stringify(postData, null, 2));

  console.log('Post written to', filename);
  console.log('Title:', postData.title);
  console.log('Category:', postData.category);
  console.log('Date:', postData.date);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
