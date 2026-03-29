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

  const unsplashQuery = encodeURIComponent('golf tournament');
  const heroImg = 'https://source.unsplash.com/1200x600/?' + unsplashQuery;

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
    'Write a complete post and return ONLY valid JSON (no markdown, no code fences) in exactly this format:',
    '{',
    '  "title": "Compelling headline max 70 chars",',
    '  "category": "Tour News",',
    '  "date": "' + month + ' ' + year + '",',
    '  "excerpt": "1-2 sentence teaser max 200 chars",',
    '  "body": "<h2>Section heading</h2><p>Body text.</p>"',
    '}',
    '',
    'Rules for the body field:',
    '- Use only these HTML tags: h2, h3, p, blockquote, div',
    '- Allowed div classes: stats-bar, stat-item, stat-label, stat-value, gold-bar, pill, card-section',
    '- Start with a h2 section heading (NOT the title)',
    '- Include 3-5 sections with h2 headings',
    '- Always include a stats-bar div with 2-4 real stats from the research',
    '- 350-500 words total',
    '- Tone: authoritative, punchy, British-inflected golf journalism',
    '- No placeholder text, every sentence must be real and factual',
    '- category must be one of: Tour News, Equipment & More, Player Focus, Course Guide, Instruction',
    '- In the JSON body value, escape all forward slashes as \\/ and all double quotes as \\"',
    '',
    'Return ONLY the JSON object. No preamble. No explanation.'
  ].join('\n');

  const raw = await groqComplete(prompt);

  let postData;
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
    postData = JSON.parse(cleaned);
  } catch (e) {
    console.error('JSON parse failed. Raw output:', raw);
    throw new Error('Groq returned invalid JSON: ' + e.message);
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

  // Publish directly to the API if key is available
  if (process.env.FAIRWAY_API_KEY) {
    console.log('Publishing post to API...');
    const body = JSON.stringify(postData);
    const res = await httpsRequest(
      'https://midhandicap.com/api.php/posts',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.FAIRWAY_API_KEY,
          'Content-Length': Buffer.byteLength(body)
        }
      },
      body
    );
    console.log('API response:', res.body);
    if (res.body.includes('"success":true')) {
      console.log('✅ Post published successfully');
    } else {
      console.warn('⚠️  API publish may have failed — check response above');
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
