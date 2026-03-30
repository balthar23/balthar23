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

// 40+ article types across all categories — randomly selected each run
const schedule = {
  morning: [
    {
      category: 'Tour News',
      imageQuery: 'golf tournament trophy winners',
      searches: ['PGA Tour latest results {month} {year}', 'DP World Tour news {month} {year}', 'LIV Golf latest {month} {year}'],
      instructions: 'Write a tour news roundup covering the latest results and standings from professional golf. Include scores, leaderboard positions and notable performances. Include a stats-bar with 2-4 real scores or stats. Tone: authoritative, punchy, British golf journalism.'
    },
    {
      category: 'Tour News',
      imageQuery: 'golf course fairway aerial view',
      searches: ['PGA Tour weekend preview {month} {year}', 'golf tournament this weekend {month} {year}', 'DP World Tour upcoming {month} {year}'],
      instructions: 'Write a weekend tournament preview. Cover the venue, course details, key contenders, recent form and what to watch for. Include a stats-bar with 2-4 relevant course or tournament stats. Tone: preview, build anticipation, British golf journalism.'
    },
    {
      category: 'Tour News',
      imageQuery: 'golf leaderboard scoreboard tournament',
      searches: ['LIV Golf news results {month} {year}', 'DP World Tour leaderboard {month} {year}', 'golf tour standings rankings {month} {year}'],
      instructions: 'Write a tour news update covering LIV Golf and DP World Tour results and standings. Include leaderboard positions, notable performances and what is at stake. Include a stats-bar with 2-4 real scores or standings stats. Tone: authoritative, informative, British golf journalism.'
    },
    {
      category: 'Tour News',
      imageQuery: 'golf tournament Sunday final round',
      searches: ['PGA Tour results this week {month} {year}', 'golf tournament winner {month} {year}', 'golf weekend results roundup {month} {year}'],
      instructions: 'Write a Sunday results roundup covering weekend tournament outcomes. Cover the winner, key moments, final leaderboard and storylines that emerged. Include a stats-bar with 2-4 real scores or stats. Tone: authoritative, recap style, British golf journalism.'
    },
    {
      category: 'Tour News',
      imageQuery: 'golf major championship Augusta',
      searches: ['golf major championship {year}', 'Masters US Open The Open golf {year}', 'golf major preview {month} {year}'],
      instructions: 'Write a major championship preview or review. Cover the history of the event, the course, past champions, current favourites and what makes it special. Include a stats-bar with 2-4 course or championship stats. Tone: reverent, authoritative, British golf journalism.'
    },
    {
      category: 'Tour News',
      imageQuery: 'Ryder Cup golf team Europe USA',
      searches: ['Ryder Cup golf news {year}', 'golf team competition results {month} {year}', 'Presidents Cup golf {year}'],
      instructions: 'Write a team golf competition article — Ryder Cup, Presidents Cup or similar. Cover team selections, results, key matches and drama. Include a stats-bar with 2-4 relevant stats. Tone: passionate, dramatic, British golf journalism.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf swing instruction lesson driving range',
      searches: ['golf swing tips mid handicap {year}', 'how to improve golf iron play {year}', 'golf driving tips amateur {year}'],
      instructions: 'Write a practical golf instruction article for mid-handicap golfers focusing on full swing technique — driving, iron play or fairway woods. Include step-by-step tips and drills. Include a stats-bar with 2-4 improvement stats. Tone: coaching, encouraging, practical.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf short game chipping bunker',
      searches: ['golf short game tips improvement {year}', 'golf chipping tips amateur {year}', 'bunker play golf tips {year}'],
      instructions: 'Write a short game instruction article for mid-handicap golfers. Focus on chipping, pitching or bunker play. Include step-by-step tips and on-course drills. Include a stats-bar with 2-4 scoring or short game stats. Tone: friendly, practical, encouraging.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf putting green practice stroke',
      searches: ['golf putting tips improvement {year}', 'how to putt better amateur golf {year}', 'golf green reading tips {year}'],
      instructions: 'Write a putting instruction article for mid-handicap golfers. Cover stroke technique, green reading, distance control or pre-putt routine. Include practical drills. Include a stats-bar with 2-4 putting stats. Tone: coaching, focused, practical.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf course management strategy',
      searches: ['golf course management tips scoring {year}', 'golf mental game strategy {year}', 'how to score better golf round {year}'],
      instructions: 'Write a course management and strategy article for mid-handicap golfers. Cover laying up, club selection, playing to strengths, avoiding big numbers or the mental game. Include a stats-bar with 2-4 scoring stats. Tone: strategic, insightful, practical.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf practice drills training aid',
      searches: ['golf practice drills at home {year}', 'golf training aids review {year}', 'best golf practice routine {year}'],
      instructions: 'Write a practice and improvement article for mid-handicap golfers. Cover effective practice drills, training aids or how to structure a practice session. Include a stats-bar with 2-4 improvement or practice stats. Tone: motivating, practical, evidence-based.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf fitness workout stretching',
      searches: ['golf fitness exercises {year}', 'golf strength training tips {year}', 'flexibility exercises for golfers {year}'],
      instructions: 'Write a golf fitness and conditioning article. Cover exercises, stretches or training routines that improve golf performance. Include specific exercises and their benefits. Include a stats-bar with 2-4 relevant fitness or performance stats. Tone: energetic, practical, motivating.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf pre shot routine setup address',
      searches: ['golf pre shot routine tips {year}', 'golf setup and alignment tips {year}', 'golf consistency tips amateur {year}'],
      instructions: 'Write an article about building consistency in golf through routine and setup. Cover pre-shot routine, alignment, grip, stance and how to replicate good shots. Include a stats-bar with 2-4 stats about consistency or handicap improvement. Tone: methodical, practical, encouraging.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf ball striking impact position',
      searches: ['golf ball striking tips {year}', 'how to hit golf ball better {year}', 'golf impact position tips {year}'],
      instructions: 'Write an article on improving ball striking for mid-handicap golfers. Cover impact position, compression, contact quality and common mistakes to avoid. Include practical drills. Include a stats-bar with 2-4 relevant stats. Tone: technical but accessible, practical.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf driver club new technology',
      searches: ['best new golf driver {year} review', 'new golf clubs release {year}', 'golf equipment review {month} {year}'],
      instructions: 'Write a golf equipment review covering the latest driver or iron releases. Include specs, key technology features, who each club suits and value for money. Include a stats-bar with 2-4 specs or performance stats. Tone: informed, enthusiastic, practical buying advice.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf balls selection comparison',
      searches: ['best golf balls mid handicap {year}', 'golf ball review comparison {year}', 'golf ball distance spin {year}'],
      instructions: 'Write a golf ball review comparing distance, spin, feel and price across popular models. Give clear recommendations for different player types. Include a stats-bar with 2-4 specs or performance comparisons. Tone: helpful, practical, honest.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf accessories rangefinder GPS watch',
      searches: ['best golf rangefinder {year} review', 'golf GPS watch review {year}', 'golf technology accessories {year}'],
      instructions: 'Write an equipment review covering golf technology accessories — rangefinders, GPS watches or launch monitors. Include key features, accuracy, battery life and value. Include a stats-bar with 2-4 specs or comparisons. Tone: tech-savvy, practical, helpful.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf bag accessories equipment',
      searches: ['golf accessories review {year}', 'best golf bag {year}', 'golf equipment accessories {year}'],
      instructions: 'Write a golf accessories and gear article. Cover golf bags, headcovers, gloves, tees, umbrellas or other accessories. Give practical recommendations. Include a stats-bar with 2-4 specs or value comparisons. Tone: helpful, practical, honest buying guide.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf iron set clubs mid handicap',
      searches: ['best golf irons mid handicap {year}', 'game improvement irons review {year}', 'golf irons buying guide {year}'],
      instructions: 'Write a golf irons buying guide or review aimed at mid-handicap golfers. Cover forgiveness, distance, feel and value across different iron sets. Give clear recommendations. Include a stats-bar with 2-4 specs or performance stats. Tone: informed, practical, helpful.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf wedge short game equipment',
      searches: ['best golf wedges {year} review', 'golf wedge buying guide {year}', 'golf wedge loft selection {year}'],
      instructions: 'Write a golf wedge review or buying guide. Cover loft gapping, bounce, grind options and which wedges suit different golfers. Include a stats-bar with 2-4 specs or performance stats. Tone: technical but accessible, practical buying advice.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf putter styles mallet blade',
      searches: ['best golf putters {year} review', 'golf putter buying guide {year}', 'mallet vs blade putter {year}'],
      instructions: 'Write a putter review or buying guide. Compare blade and mallet styles, alignment aids, shaft options and what suits different putting strokes. Include a stats-bar with 2-4 specs or stats. Tone: informed, practical, helpful.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf shoes spikeless waterproof',
      searches: ['best golf shoes {year} review', 'golf shoes waterproof comfort {year}', 'spikeless golf shoes {year}'],
      instructions: 'Write a golf shoes review or buying guide. Cover comfort, waterproofing, grip, stability and style. Compare spiked vs spikeless options. Include a stats-bar with 2-4 specs or comparisons. Tone: practical, helpful, honest.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf simulator home launch monitor',
      searches: ['home golf simulator review {year}', 'golf launch monitor {year}', 'indoor golf practice technology {year}'],
      instructions: 'Write an article about golf simulators or home launch monitors. Cover accuracy, features, setup requirements and value for money. Include a stats-bar with 2-4 specs or comparisons. Tone: enthusiastic, tech-savvy, practical.'
    }
  ],
  evening: [
    {
      category: 'Player Focus',
      imageQuery: 'professional golfer swing action shot',
      searches: ['PGA Tour player in form {month} {year}', 'best golfer world rankings {month} {year}', 'golf player profile {month} {year}'],
      instructions: 'Write a player profile on a professional golfer currently in form or making headlines. Cover recent results, playing style, career highlights and what makes them worth watching. Include a stats-bar with 2-4 career or current season stats. Tone: engaging, insightful, fan-friendly.'
    },
    {
      category: 'Player Focus',
      imageQuery: 'golfer celebrating winning putt',
      searches: ['golf rising star young player {year}', 'best young golfer tour {month} {year}', 'golf player to watch {year}'],
      instructions: 'Write a player focus piece on a rising star or young professional making their mark on tour. Cover background, breakthrough performances and future potential. Include a stats-bar with 2-4 career stats. Tone: enthusiastic, inspiring, fan-friendly.'
    },
    {
      category: 'Player Focus',
      imageQuery: 'golf legend career highlight',
      searches: ['golf legend career highlights {year}', 'greatest golfers of all time {year}', 'golf hall of fame player {year}'],
      instructions: 'Write a retrospective player profile on a golf legend or hall of famer. Cover career highlights, major wins, playing style and lasting legacy on the game. Include a stats-bar with 2-4 career stats. Tone: reverent, celebratory, insightful.'
    },
    {
      category: 'Player Focus',
      imageQuery: 'golf world number one ranking',
      searches: ['world number one golfer {month} {year}', 'best golfer in the world {year}', 'Scottie Scheffler golf {year}'],
      instructions: 'Write a profile on the current world number one golfer or the player dominating the rankings. Cover their recent form, strengths, records and what sets them apart. Include a stats-bar with 2-4 ranking or performance stats. Tone: authoritative, analytical, fan-friendly.'
    },
    {
      category: 'Player Focus',
      imageQuery: 'golf comeback story emotional',
      searches: ['golf comeback story {year}', 'golfer return from injury {year}', 'inspirational golf story {year}'],
      instructions: 'Write an inspirational player focus piece on a golfer who has overcome adversity — injury, illness or a career slump — to return to form. Cover their story, struggles and comeback. Include a stats-bar with 2-4 relevant stats. Tone: inspirational, emotional, fan-friendly.'
    },
    {
      category: 'Course Guide',
      imageQuery: 'famous golf course landscape scenic',
      searches: ['famous golf courses world top ranked {year}', 'bucket list golf courses {year}', 'best golf courses to play {year}'],
      instructions: 'Write a course guide on a famous or bucket-list golf course. Cover the history, signature holes, challenges and what makes it special. Include a stats-bar with 2-4 course facts like par, yardage or notable records. Tone: evocative, descriptive, inspiring.'
    },
    {
      category: 'Course Guide',
      imageQuery: 'Augusta National golf course Masters',
      searches: ['Augusta National golf course history {year}', 'Masters golf course guide {year}', 'best golf courses USA {year}'],
      instructions: 'Write a detailed course guide on one of the great American golf courses. Cover layout, history, famous holes, course conditions and tips for playing it. Include a stats-bar with 2-4 course facts. Tone: reverent, detailed, inspiring.'
    },
    {
      category: 'Course Guide',
      imageQuery: 'links golf course Scotland Ireland coastal',
      searches: ['best links golf courses UK Ireland {year}', 'Scottish golf courses guide {year}', 'links golf tips {year}'],
      instructions: 'Write a course guide focused on links golf in the UK or Ireland. Cover what makes links golf unique, famous courses, playing conditions and strategy. Include a stats-bar with 2-4 course or history facts. Tone: evocative, passionate, knowledgeable.'
    },
    {
      category: 'Course Guide',
      imageQuery: 'golf course Australia New Zealand Pacific',
      searches: ['best golf courses Australia {year}', 'Royal Melbourne golf course {year}', 'top golf courses Asia Pacific {year}'],
      instructions: 'Write a course guide focused on great golf courses in Australia or the Asia Pacific region. Cover layout, conditions, history and what makes them stand out. Include a stats-bar with 2-4 course facts. Tone: enthusiastic, descriptive, inspiring.'
    },
    {
      category: 'Course Guide',
      imageQuery: 'golf resort destination travel',
      searches: ['best golf resorts world {year}', 'golf holiday destination {year}', 'golf travel bucket list {year}'],
      instructions: 'Write a golf travel and destination guide. Cover a great golf resort or destination, what courses are available, facilities, best time to visit and travel tips. Include a stats-bar with 2-4 destination or course facts. Tone: inspiring, practical, travel-focused.'
    },
    {
      category: 'Course Guide',
      imageQuery: 'St Andrews Old Course golf Scotland',
      searches: ['St Andrews golf course guide {year}', 'Open Championship course history {year}', 'Open Championship venue {year}'],
      instructions: 'Write a course guide on a famous Open Championship venue. Cover its history, iconic holes, how it plays in Open conditions and its place in golf history. Include a stats-bar with 2-4 course or championship facts. Tone: reverential, detailed, British golf journalism.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf apparel clothing style',
      searches: ['best golf clothing brands {year}', 'golf apparel style guide {year}', 'golf fashion trends {year}'],
      instructions: 'Write a golf apparel and style article. Cover the best golf clothing brands, what to wear on the course, performance fabrics and style trends. Include a stats-bar with 2-4 relevant stats or comparisons. Tone: stylish, practical, aspirational.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf fairway wood hybrid club',
      searches: ['best golf fairway woods hybrids {year}', 'fairway wood vs hybrid {year}', 'golf hybrid buying guide {year}'],
      instructions: 'Write a buying guide or review covering fairway woods and hybrids. Compare the two categories, cover key models and explain who should use each. Include a stats-bar with 2-4 specs or performance stats. Tone: informed, practical, helpful.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf beginner tips basics',
      searches: ['golf tips for beginners high handicap {year}', 'how to improve fast golf {year}', 'golf basics fundamentals {year}'],
      instructions: 'Write a fundamentals article aimed at higher handicap golfers looking to improve quickly. Cover the basics — grip, stance, alignment, posture — and why getting them right makes such a difference. Include a stats-bar with 2-4 relevant stats. Tone: encouraging, clear, accessible.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf weather wind rain playing conditions',
      searches: ['golf tips playing in wind {year}', 'golf wet weather tips {year}', 'how to play golf in bad weather {year}'],
      instructions: 'Write an article about playing golf in challenging weather conditions — wind, rain or cold. Cover club selection adjustments, ball flight management and maintaining focus. Include a stats-bar with 2-4 relevant stats. Tone: practical, experienced, helpful.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf mental game confidence focus',
      searches: ['golf mental game tips {year}', 'golf psychology confidence {year}', 'how to focus better golf {year}'],
      instructions: 'Write a golf psychology and mental game article. Cover managing pressure, staying focused, dealing with bad shots and building confidence on the course. Include a stats-bar with 2-4 relevant stats. Tone: thoughtful, practical, motivating.'
    },
    {
      category: 'Tour News',
      imageQuery: 'golf prize money tour earnings',
      searches: ['golf prize money rankings {month} {year}', 'PGA Tour money list {month} {year}', 'richest golfers earnings {year}'],
      instructions: 'Write a tour news article focused on prize money, earnings and the financial side of professional golf. Cover the money list leaders, biggest prize funds and how earnings compare across tours. Include a stats-bar with 2-4 earnings or prize fund stats. Tone: authoritative, informative, engaging.'
    },
    {
      category: 'Tour News',
      imageQuery: 'golf news controversy debate',
      searches: ['golf news controversy {month} {year}', 'golf rule change debate {year}', 'golf tour politics news {month} {year}'],
      instructions: 'Write a golf news feature on a current debate, controversy or talking point in the game. Cover different perspectives, the background and what it means for golf going forward. Include a stats-bar with 2-4 relevant facts or stats. Tone: balanced, analytical, British golf journalism.'
    },
    {
      category: 'Player Focus',
      imageQuery: 'women golf LPGA tour player',
      searches: ['LPGA Tour news results {month} {year}', 'best women golfer world {month} {year}', 'womens golf highlights {month} {year}'],
      instructions: 'Write a player profile or news piece focused on the LPGA Tour or women's professional golf. Cover results, player profiles, tour news or a feature on a leading player. Include a stats-bar with 2-4 stats. Tone: celebratory, authoritative, inspiring.'
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
  // Pick a random article type from all 14 available (7 morning + 7 evening)
  const allTypes = [...schedule.morning, ...schedule.evening];
  const articleType = allTypes[Math.floor(Math.random() * allTypes.length)];

  console.log('Random article type selected:', articleType.category);

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
