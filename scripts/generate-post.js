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
    max_tokens: 3000,
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
        headers: { 'Authorization': process.env.PEXELS_API_KEY }
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

const fallbackImages = [
  'https://images.pexels.com/photos/1325681/pexels-photo-1325681.jpeg',
  'https://images.pexels.com/photos/91228/pexels-photo-91228.jpeg',
  'https://images.pexels.com/photos/1174996/pexels-photo-1174996.jpeg',
  'https://images.pexels.com/photos/2735981/pexels-photo-2735981.jpeg',
  'https://images.pexels.com/photos/6542947/pexels-photo-6542947.jpeg'
];

// Article types rotate by day of week
// Mon=Tour News, Tue=Instruction, Wed=Equipment, Thu=Player Focus, Fri=Tour News, Sat=Instruction, Sun=Equipment
const articleTypes = [
  {
    // Monday
    category: 'Tour News',
    imageQuery: 'golf tournament trophy',
    searches: [
      'PGA Tour latest results {month} {year}',
      'DP World Tour news {month} {year}',
      'LIV Golf latest {month} {year}'
    ],
    instructions: [
      'Write a tour news roundup covering the latest results and standings from professional golf.',
      'Include scores, leaderboard positions and any notable performances.',
      'Include a stats-bar with 2-4 real scores or stats from the research.',
      'Tone: authoritative, punchy, British golf journalism.'
    ]
  },
  {
    // Tuesday
    category: 'Instruction',
    imageQuery: 'golf swing instruction lesson',
    searches: [
      'golf tips mid handicap improvement {year}',
      'golf swing tips for club golfers {year}',
      'how to improve golf iron play {year}'
    ],
    instructions: [
      'Write a practical golf instruction article aimed at mid-handicap amateur golfers (10-20 handicap).',
      'Focus on a specific skill: e.g. iron play, chipping, bunker shots, putting, course management, or the mental game.',
      'Include actionable tips and drills the reader can take to the course or practice range.',
      'Include a stats-bar with 2-4 interesting facts or improvement statistics.',
      'Tone: coaching, encouraging, practical.'
    ]
  },
  {
    // Wednesday
    category: 'Equipment & More',
    imageQuery: 'golf equipment',
    searches: [
      'best new golf clubs {year} review',
      'new golf driver release {year}',
      'golf equipment review {month} {year}'
    ],
    instructions: [
      'Write a golf equipment review or roundup article.',
      'Cover new club releases, technology innovations, or a "best of" style comparison.',
      'Include specs, key features and who the equipment suits.',
      'Include a stats-bar with 2-4 specs or performance stats.',
      'Tone: informed, enthusiastic, practical buying advice.'
    ]
  },
  {
    // Thursday
    category: 'Player Focus',
    imageQuery: 'professional golfer',
    searches: [
      'PGA Tour player spotlight {month} {year}',
      'rising star professional golf {year}',
      'golf player profile form {month} {year}'
    ],
    instructions: [
      'Write a player profile or focus piece on a professional golfer who is currently in form or in the news.',
      'Cover their recent results, playing style, career highlights and what makes them interesting.',
      'Include a stats-bar with 2-4 career or current season stats.',
      'Tone: engaging, insightful, fan-friendly.'
    ]
  },
  {
    // Friday
    category: 'Tour News',
    imageQuery: 'golf course green flag',
    searches: [
      'PGA Tour weekend preview {month} {year}',
      'golf tournament this weekend {month} {year}',
      'DP World Tour upcoming event {month} {year}'
    ],
    instructions: [
      'Write a weekend tournament preview covering what is coming up in professional golf.',
      'Cover the venue, key contenders, recent form and what to watch out for.',
      'Include a stats-bar with 2-4 relevant stats about the tournament or course.',
      'Tone: preview, build anticipation, British golf journalism.'
    ]
  },
  {
    // Saturday
    category: 'Instruction',
    imageQuery: 'golf practice',
    searches: [
      'golf course management tips {year}',
      'golf mental game tips amateur {year}',
      'golf short game improvement tips {year}'
    ],
    instructions: [
      'Write a practical golf tips article for mid-handicap golfers focused on scoring better.',
      'Topics could include: course management, reading greens, pre-shot routine, playing in wind, or avoiding big numbers.',
      'Include actionable advice the reader can use in their next round.',
      'Include a stats-bar with 2-4 facts or statistics about the topic.',
      'Tone: friendly, practical, encouraging.'
    ]
  },
  {
    // Sunday
    category: 'Equipment & More',
    imageQuery: 'golf equipment',
    searches: [
      'golf accessories review {year}',
      'best golf balls mid handicap {year}',
      'golf technology gadgets {year}'
    ],
    instructions: [
      'Write an equipment or accessories article focused on golf gear that helps mid-handicap golfers.',
      'Could cover: golf balls, rangefinders, GPS watches, training aids, bags, shoes or apparel.',
      'Give practical buying advice and recommendations.',
      'Include a stats-bar with 2-4 specs or value comparisons.',
      'Tone: helpful, practical, honest buying guide.'
    ]
  }
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
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  // Map day of week to article type (0=Sun uses index 6, 1=Mon uses index 0, etc.)
  const typeIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const articleType = articleTypes[typeIndex];

  console.log('Day of week:', dayOfWeek, '- Article type:', articleType.category);

  // Build search queries for today's type
  const queries = articleType.searches.map(q =>
    q.replace('{month}', month).replace('{year}', year)
  );

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

  // Get hero image
  let heroImg = null;
  if (process.env.PEXELS_API_KEY) {
    heroImg = await getPexelsImage(articleType.imageQuery);
  }
  if (!heroImg) {
    heroImg = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    console.log('Using fallback image');
  } else {
    console.log('Pexels image found:', heroImg);
  }

  console.log('Generating post with Groq...');

  const prompt = [
    'You are a golf writer for midhandicap.com, a blog for mid-handicap amateur golfers.',
    'TODAY IS ' + month + ' ' + year + '.',
    '',
    'ARTICLE TYPE FOR TODAY: ' + articleType.category,
    '',
    'WRITING INSTRUCTIONS:',
    articleType.instructions.join(' '),
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
    '  "category": "' + articleType.category + '",',
    '  "date": "' + month + ' ' + year + '",',
    '  "excerpt": "1-2 sentence teaser max 200 chars",',
    '  "body": "HTML content here"',
    '}',
    '',
    'For the body field write HTML using only: h2, h3, p, blockquote, div tags.',
    'Allowed div classes: stats-bar, stat-item, stat-label, stat-value, gold-bar, pill, card-section.',
    'Start with a h2 section heading. Include 3-5 sections. Include a stats-bar div with 2-4 real stats.',
    '900-1100 words. No placeholder text.',
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
