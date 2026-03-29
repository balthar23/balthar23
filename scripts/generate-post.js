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
    max_tokens: 4000,
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

// 14 article types — morning and evening for each day
// morning[0]=Mon AM, morning[1]=Tue AM ... morning[6]=Sun AM
// evening[0]=Mon PM, evening[1]=Tue PM ... evening[6]=Sun PM
const schedule = {
  morning: [
    {
      // Monday AM
      category: 'Tour News',
      imageQuery: 'golf tournament trophy winners',
      searches: [
        'PGA Tour latest results {month} {year}',
        'DP World Tour news {month} {year}',
        'LIV Golf latest {month} {year}'
      ],
      instructions: 'Write a tour news roundup covering the latest results and standings from professional golf. Include scores, leaderboard positions and notable performances. Include a stats-bar with 2-4 real scores or stats. Tone: authoritative, punchy, British golf journalism.'
    },
    {
      // Tuesday AM
      category: 'Instruction',
      imageQuery: 'golf swing instruction lesson driving range',
      searches: [
        'golf swing tips mid handicap {year}',
        'how to improve golf iron play {year}',
        'golf driving tips amateur {year}'
      ],
      instructions: 'Write a practical golf instruction article for mid-handicap golfers (10-20 handicap). Focus on full swing technique — driving, iron play or fairway woods. Include step-by-step tips and drills. Include a stats-bar with 2-4 interesting improvement stats. Tone: coaching, encouraging, practical.'
    },
    {
      // Wednesday AM
      category: 'Equipment & More',
      imageQuery: 'golf driver club new technology',
      searches: [
        'best new golf driver {year} review',
        'new golf clubs release {year}',
        'golf equipment review {month} {year}'
      ],
      instructions: 'Write a golf equipment review or roundup covering the latest driver or iron releases. Include specs, key technology features, who each club suits and value for money. Include a stats-bar with 2-4 specs or performance stats. Tone: informed, enthusiastic, practical buying advice.'
    },
    {
      // Thursday AM
      category: 'Player Focus',
      imageQuery: 'professional golfer swing action shot',
      searches: [
        'PGA Tour player in form {month} {year}',
        'best golfer world rankings {month} {year}',
        'golf player profile {month} {year}'
      ],
      instructions: 'Write a player profile on a professional golfer currently in form or making headlines. Cover their recent results, playing style, career highlights and what makes them worth watching. Include a stats-bar with 2-4 career or current season stats. Tone: engaging, insightful, fan-friendly.'
    },
    {
      // Friday AM
      category: 'Tour News',
      imageQuery: 'golf course fairway aerial view',
      searches: [
        'PGA Tour weekend preview {month} {year}',
        'golf tournament this weekend {month} {year}',
        'DP World Tour upcoming {month} {year}'
      ],
      instructions: 'Write a weekend tournament preview. Cover the venue, course details, key contenders, recent form and what to watch out for. Include a stats-bar with 2-4 relevant course or tournament stats. Tone: preview, build anticipation, British golf journalism.'
    },
    {
      // Saturday AM
      category: 'Instruction',
      imageQuery: 'golf short game chipping bunker',
      searches: [
        'golf short game tips improvement {year}',
        'golf chipping tips amateur {year}',
        'bunker play golf tips {year}'
      ],
      instructions: 'Write a practical short game instruction article for mid-handicap golfers. Focus on chipping, pitching, bunker play or putting. Include step-by-step tips and on-course drills. Include a stats-bar with 2-4 stats about scoring or short game. Tone: friendly, practical, encouraging.'
    },
    {
      // Sunday AM
      category: 'Equipment & More',
      imageQuery: 'golf balls selection comparison',
      searches: [
        'best golf balls mid handicap {year}',
        'golf ball review comparison {year}',
        'golf ball distance spin {year}'
      ],
      instructions: 'Write a golf ball review or comparison article aimed at mid-handicap golfers. Compare distance, spin, feel and price across popular models. Give clear recommendations for different types of players. Include a stats-bar with 2-4 specs or performance comparisons. Tone: helpful, practical, honest.'
    }
  ],
  evening: [
    {
      // Monday PM
      category: 'Course Guide',
      imageQuery: 'famous golf course landscape scenic',
      searches: [
        'famous golf courses world top ranked {year}',
        'bucket list golf courses {year}',
        'best golf courses to play {year}'
      ],
      instructions: 'Write a course guide or feature on a famous or bucket-list golf course. Cover the history, signature holes, challenges and what makes it special. Include a stats-bar with 2-4 course facts like par, yardage, notable records. Tone: evocative, descriptive, inspiring.'
    },
    {
      // Tuesday PM
      category: 'Equipment & More',
      imageQuery: 'golf accessories rangefinder GPS watch',
      searches: [
        'best golf rangefinder {year} review',
        'golf GPS watch review {year}',
        'golf technology accessories {year}'
      ],
      instructions: 'Write an equipment review covering golf technology accessories — rangefinders, GPS watches, launch monitors or training aids. Include key features, accuracy, battery life and value. Include a stats-bar with 2-4 specs or comparisons. Tone: tech-savvy, practical, helpful.'
    },
    {
      // Wednesday PM
      category: 'Instruction',
      imageQuery: 'golf putting green practice stroke',
      searches: [
        'golf putting tips improvement {year}',
        'how to putt better amateur golf {year}',
        'golf green reading tips {year}'
      ],
      instructions: 'Write a putting instruction article for mid-handicap golfers. Cover stroke technique, green reading, distance control or pre-putt routine. Include practical drills. Include a stats-bar with 2-4 stats about putting averages or improvement. Tone: coaching, focused, practical.'
    },
    {
      // Thursday PM
      category: 'Tour News',
      imageQuery: 'golf leaderboard scoreboard tournament',
      searches: [
        'LIV Golf news results {month} {year}',
        'DP World Tour leaderboard {month} {year}',
        'golf tour standings rankings {month} {year}'
      ],
      instructions: 'Write a tour news update covering LIV Golf and DP World Tour results and standings. Include leaderboard positions, notable performances and what is at stake going forward. Include a stats-bar with 2-4 real scores or standings stats. Tone: authoritative, informative, British golf journalism.'
    },
    {
      // Friday PM
      category: 'Player Focus',
      imageQuery: 'golfer celebrating winning putt',
      searches: [
        'golf rising star young player {year}',
        'best young golfer tour {month} {year}',
        'golf player to watch {year}'
      ],
      instructions: 'Write a player focus piece on a rising star or young professional golfer making their mark on tour. Cover their background, recent breakthrough performances and potential for the future. Include a stats-bar with 2-4 career stats. Tone: enthusiastic, inspiring, fan-friendly.'
    },
    {
      // Saturday PM
      category: 'Instruction',
      imageQuery: 'golf course management strategy',
      searches: [
        'golf course management tips scoring {year}',
        'golf mental game strategy {year}',
        'how to score better golf round {year}'
      ],
      instructions: 'Write a course management and strategy article for mid-handicap golfers. Cover topics like when to lay up, club selection, playing to your strengths, avoiding big numbers or the mental side of the game. Include a stats-bar with 2-4 relevant scoring stats. Tone: strategic, insightful, practical.'
    },
    {
      // Sunday PM
      category: 'Tour News',
      imageQuery: 'golf tournament Sunday final round',
      searches: [
        'PGA Tour results this week {month} {year}',
        'golf tournament winner {month} {year}',
        'golf weekend results roundup {month} {year}'
      ],
      instructions: 'Write a Sunday results roundup covering the weekend tournament outcomes from professional golf. Cover the winner, key moments, final leaderboard and any storylines that emerged. Include a stats-bar with 2-4 real scores or stats. Tone: authoritative, recap style, British golf journalism.'
    }
  ]
};

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
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const hour = now.getUTCHours(); // workflow passes UTC hour

  // Map day: 0=Sun->6, 1=Mon->0, 2=Tue->1 etc
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // 21:00 UTC = 7am Melbourne (AEDT), 08:00 UTC = 6pm Melbourne (AEDT)
  const isMorning = hour >= 18 && hour < 22; // catches 21:00 UTC
  const slot = isMorning ? 'morning' : 'evening';
  const articleType = schedule[slot][dayIndex];

  console.log('Day index:', dayIndex, '| Slot:', slot, '| Category:', articleType.category);

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
    'ARTICLE TYPE: ' + articleType.category,
    '',
    'WRITING INSTRUCTIONS:',
    articleType.instructions,
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
    'STRUCTURE REQUIREMENTS (mandatory):',
    '- Start with a h2 section heading',
    '- Include EXACTLY 5 sections each with a h2 heading',
    '- Each section must have at least 2 substantial paragraphs of body text',
    '- Each paragraph must be at least 3 sentences long',
    '- Include a stats-bar div with 2-4 real stats',
    '- Include at least one blockquote',
    'WORD COUNT: The body text MUST be between 900 and 1100 words. This is a strict requirement.',
    'Count your words before finalising. If you are under 900 words, expand each section further.',
    'No placeholder text.',
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

  // Clean up body - strip newlines and normalise whitespace
  postData.body = postData.body.replace(/\\n/g, " ").replace(/\\r/g, "").replace(/  +/g, " ").trim();

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
