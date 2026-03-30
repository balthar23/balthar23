const https = require('https');
const fs = require('fs');

// ─── Amazon AU affiliate tag ─────────────────────────────────────────────────
const AMAZON_TAG = 'midhandicap-22';

// ─── Product link library ────────────────────────────────────────────────────
// Keywords matched case-insensitively against post body.
// More specific entries must come before generic ones.
const productLibrary = [
  // IRONS (specific models first)
  { keywords: ['callaway rogue st', 'rogue st irons', 'rogue st iron'], label: 'Callaway Rogue ST Irons', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Callaway+Rogue+ST+irons` },
  { keywords: ['taylormade stealth irons', 'stealth irons', 'stealth 2 irons'], label: 'TaylorMade Stealth Irons', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=TaylorMade+Stealth+irons` },
  { keywords: ['ping g430 irons', 'ping g430 iron'], label: 'Ping G430 Irons', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Ping+G430+irons` },
  { keywords: ['titleist t300', 't300 irons'], label: 'Titleist T300 Irons', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Titleist+T300+irons` },
  { keywords: ['cleveland launcher xl', 'launcher xl irons'], label: 'Cleveland Launcher XL Irons', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Cleveland+Launcher+XL+irons` },
  { keywords: ['cobra aerojet irons', 'aerojet irons'], label: 'Cobra Aerojet Irons', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Cobra+Aerojet+irons` },
  // DRIVERS
  { keywords: ['taylormade qi10', 'qi10 driver'], label: 'TaylorMade Qi10 Driver', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=TaylorMade+Qi10+driver` },
  { keywords: ['callaway paradym', 'paradym driver'], label: 'Callaway Paradym Driver', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Callaway+Paradym+driver` },
  { keywords: ['ping g430 max', 'ping g430 driver'], label: 'Ping G430 Max Driver', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Ping+G430+Max+driver` },
  { keywords: ['cobra aerojet driver'], label: 'Cobra Aerojet Driver', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Cobra+Aerojet+driver` },
  // BALLS — Pro V1x must come before Pro V1
  { keywords: ['pro v1x', 'prov1x'], label: 'Titleist Pro V1x Golf Balls', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Titleist+Pro+V1x+golf+balls` },
  { keywords: ['pro v1', 'prov1'], label: 'Titleist Pro V1 Golf Balls', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Titleist+Pro+V1+golf+balls` },
  { keywords: ['chrome soft', 'callaway chrome soft'], label: 'Callaway Chrome Soft Golf Balls', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Callaway+Chrome+Soft+golf+balls` },
  { keywords: ['taylormade tp5', 'tp5 golf ball'], label: 'TaylorMade TP5 Golf Balls', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=TaylorMade+TP5+golf+balls` },
  { keywords: ['srixon z-star', 'srixon zstar', 'z-star golf'], label: 'Srixon Z-Star Golf Balls', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Srixon+Z-Star+golf+balls` },
  { keywords: ['bridgestone tour b', 'bridgestone golf'], label: 'Bridgestone Tour B Golf Balls', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Bridgestone+Tour+B+golf+balls` },
  { keywords: ['vice pro golf', 'vice pro ball'], label: 'Vice Pro Golf Balls', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Vice+Pro+golf+balls` },
  // RANGEFINDERS
  { keywords: ['bushnell pro x3', 'bushnell pro x'], label: 'Bushnell Pro X3 Rangefinder', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Bushnell+Pro+X3+rangefinder` },
  { keywords: ['garmin approach z82', 'garmin z82'], label: 'Garmin Approach Z82 Rangefinder', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Garmin+Approach+Z82+rangefinder` },
  { keywords: ['nikon coolshot'], label: 'Nikon Coolshot Rangefinder', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Nikon+Coolshot+golf+rangefinder` },
  // GPS WATCHES
  { keywords: ['garmin approach s62', 'garmin s62'], label: 'Garmin Approach S62 GPS Watch', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Garmin+Approach+S62+golf+watch` },
  { keywords: ['garmin approach s42', 'garmin s42'], label: 'Garmin Approach S42 GPS Watch', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Garmin+Approach+S42+golf+watch` },
  { keywords: ['shot scope v5', 'shot scope watch'], label: 'Shot Scope V5 GPS Watch', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Shot+Scope+V5+GPS+golf+watch` },
  // HYBRIDS
  { keywords: ['taylormade stealth hybrid', 'stealth hybrid'], label: 'TaylorMade Stealth Hybrid', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=TaylorMade+Stealth+hybrid` },
  { keywords: ['callaway apex hybrid'], label: 'Callaway Apex Hybrid', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Callaway+Apex+hybrid` },
  { keywords: ['ping g430 hybrid'], label: 'Ping G430 Hybrid', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Ping+G430+hybrid` },
  // WEDGES
  { keywords: ['vokey sm9', 'titleist vokey'], label: 'Titleist Vokey SM9 Wedge', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Titleist+Vokey+SM9+wedge` },
  { keywords: ['cleveland rtx', 'cleveland wedge'], label: 'Cleveland RTX Wedge', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Cleveland+RTX+wedge` },
  { keywords: ['callaway mack daddy', 'mack daddy wedge'], label: 'Callaway Mack Daddy Wedge', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Callaway+Mack+Daddy+wedge` },
  // PUTTERS
  { keywords: ['odyssey white hot', 'odyssey putter'], label: 'Odyssey White Hot Putter', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Odyssey+White+Hot+putter` },
  { keywords: ['scotty cameron', 'scotty cameron putter'], label: 'Scotty Cameron Putter', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Scotty+Cameron+putter` },
  { keywords: ['ping sigma 2', 'ping putter'], label: 'Ping Sigma 2 Putter', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Ping+Sigma+2+putter` },
  // TRAINING AIDS
  { keywords: ['orange whip'], label: 'Orange Whip Swing Trainer', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Orange+Whip+golf+swing+trainer` },
  { keywords: ['alignment stick', 'alignment sticks'], label: 'Golf Alignment Sticks', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+alignment+sticks` },
  { keywords: ['impact bag', 'golf impact bag'], label: 'Golf Impact Bag Training Aid', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+impact+bag` },
  { keywords: ['swing trainer', 'golf swing trainer'], label: 'Golf Swing Trainer', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+swing+trainer` },
  { keywords: ['putting mat', 'golf putting mat'], label: 'Golf Putting Mat', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+putting+mat` },
  // NEW DRIVER MODELS
  { keywords: ['taylormade qi35', 'qi35 driver'], label: 'TaylorMade Qi35 Driver', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=TaylorMade+Qi35+driver` },
  { keywords: ['callaway ai smoke', 'ai smoke driver'], label: 'Callaway Ai Smoke Driver', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Callaway+Ai+Smoke+driver` },
  { keywords: ['cobra darkspeed', 'darkspeed driver'], label: 'Cobra Darkspeed Driver', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Cobra+Darkspeed+driver` },
  // NEW IRON MODELS
  { keywords: ['taylormade qi35 irons', 'qi35 irons'], label: 'TaylorMade Qi35 Irons', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=TaylorMade+Qi35+irons` },
  { keywords: ['callaway ai smoke irons', 'ai smoke irons'], label: 'Callaway Ai Smoke Irons', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Callaway+Ai+Smoke+irons` },
  { keywords: ['srixon zx7', 'srixon zx5', 'srixon irons'], label: 'Srixon ZX Irons', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Srixon+ZX+irons` },
  // GOLF GLOVES
  { keywords: ['footjoy glove', 'footjoy golf glove', 'footjoy contour'], label: 'FootJoy Golf Glove', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=FootJoy+golf+glove` },
  { keywords: ['callaway golf glove', 'callaway glove'], label: 'Callaway Golf Glove', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Callaway+golf+glove` },
  { keywords: ['titleist golf glove', 'titleist glove'], label: 'Titleist Golf Glove', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Titleist+golf+glove` },
  // GOLF TROLLEYS / PUSHCARTS
  { keywords: ['sun mountain trolley', 'sun mountain cart', 'sun mountain push cart'], label: 'Sun Mountain Push Cart', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Sun+Mountain+golf+push+cart` },
  { keywords: ['clicgear trolley', 'clicgear cart', 'clicgear push cart'], label: 'Clicgear Golf Trolley', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Clicgear+golf+trolley` },
  { keywords: ['electric trolley', 'electric golf trolley', 'motorised trolley'], label: 'Electric Golf Trolley', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=electric+golf+trolley` },
  // GOLF BAGS
  { keywords: ['titleist golf bag', 'titleist bag'], label: 'Titleist Golf Bag', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Titleist+golf+bag` },
  { keywords: ['callaway golf bag', 'callaway stand bag'], label: 'Callaway Golf Bag', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Callaway+golf+bag` },
  { keywords: ['ping golf bag', 'ping stand bag'], label: 'Ping Golf Bag', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Ping+golf+bag` },
  // LAUNCH MONITORS
  { keywords: ['flightscope mevo', 'mevo plus', 'mevo launch monitor'], label: 'FlightScope Mevo Launch Monitor', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=FlightScope+Mevo+launch+monitor` },
  { keywords: ['garmin approach r10', 'approach r10'], label: 'Garmin Approach R10 Launch Monitor', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Garmin+Approach+R10+launch+monitor` },
  // GOLF SUNGLASSES
  { keywords: ['oakley golf sunglasses', 'oakley sunglasses'], label: 'Oakley Golf Sunglasses', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Oakley+golf+sunglasses` },
  // GOLF FITNESS
  { keywords: ['golf fitness band', 'resistance band golf', 'golf resistance band'], label: 'Golf Fitness Resistance Bands', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+fitness+resistance+bands` },
  // GOLF TOWELS & ACCESSORIES
  { keywords: ['golf towel', 'microfibre golf towel'], label: 'Golf Towel', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+towel` },
  // GENERIC FALLBACKS
  { keywords: ['golf irons', 'set of irons', 'iron set'], label: 'Golf Irons on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+irons+mid+handicap` },
  { keywords: ['golf driver', 'new driver'], label: 'Golf Driver on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+driver` },
  { keywords: ['golf balls', 'dozen balls'], label: 'Golf Balls on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+balls+mid+handicap` },
  { keywords: ['rangefinder'], label: 'Golf Rangefinder on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+rangefinder` },
  { keywords: ['gps watch', 'golf watch'], label: 'Golf GPS Watch on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+GPS+watch` },
  { keywords: ['hybrid club', 'hybrid iron'], label: 'Golf Hybrid on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+hybrid+club` },
  { keywords: ['golf wedge', 'wedge loft'], label: 'Golf Wedges on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+wedges` },
  { keywords: ['golf putter', 'putter style'], label: 'Golf Putters on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+putters` },
  { keywords: ['golf shoes'], label: 'Golf Shoes on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+shoes` },
  { keywords: ['golf bag'], label: 'Golf Bags on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+bag` }
];

// ─── Inject affiliate links into post body ───────────────────────────────────
function injectAffiliateLinks(body) {
  const bodyLower = body.toLowerCase();

  // Find all matching products, preserving library order (specific first)
  const seen = new Set();
  const matched = [];
  for (const product of productLibrary) {
    for (const kw of product.keywords) {
      if (bodyLower.includes(kw.toLowerCase()) && !seen.has(product.label)) {
        matched.push(product);
        seen.add(product.label);
        break;
      }
    }
  }

  console.log(`Affiliate links matched (${matched.length}):`, matched.map(p => p.label).join(', ') || 'none');

  // Fallback pool if nothing matched
  const fallbackPool = [
    { label: 'Golf Equipment on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+equipment` },
    { label: 'Golf Clubs on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+clubs` },
    { label: 'Golf Accessories on Amazon AU', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+accessories` }
  ];

  const count = (body.match(/\[AFFILIATE LINK\]/gi) || []).length;

  let matchIndex = 0;
  const result = body.replace(/\[AFFILIATE LINK\]/gi, () => {
    const product = matched[matchIndex] || fallbackPool[matchIndex % fallbackPool.length];
    matchIndex++;
    return `<a href="${product.url}" target="_blank" rel="noopener sponsored" class="affiliate-link">${product.label} &rarr;</a>`;
  });

  console.log(`Replaced ${count} [AFFILIATE LINK] placeholder(s)`);
  return result;
}

// ─── Related Gear section ────────────────────────────────────────────────────
// Appended to every post. Uses product card layout with Amazon product images.
// Image URL format: https://m.media-amazon.com/images/P/[ASIN]._AC_SX300_.jpg
const relatedGearByCategory = {
  'Tour News': [
    { label: 'Titleist Pro V1 Golf Balls', img: 'https://m.media-amazon.com/images/P/B0BR2YF8T6._AC_SX300_.jpg', url: `https://www.amazon.com.au/dp/B0BR2YF8T6?tag=${AMAZON_TAG}` },
    { label: 'TaylorMade Qi10 Driver', img: 'https://m.media-amazon.com/images/P/B0CNRY4WBD._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=TaylorMade+Qi10+driver` },
    { label: 'Bushnell Tour V6 Rangefinder', img: 'https://m.media-amazon.com/images/P/B0BY4QWQCX._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Bushnell+golf+rangefinder` },
    { label: 'Garmin Approach S62 GPS Watch', img: 'https://m.media-amazon.com/images/P/B08F5KV9PL._AC_SX300_.jpg', url: `https://www.amazon.com.au/dp/B08F5KV9PL?tag=${AMAZON_TAG}` }
  ],
  'Player Focus': [
    { label: 'Titleist Pro V1 Golf Balls', img: 'https://m.media-amazon.com/images/P/B0BR2YF8T6._AC_SX300_.jpg', url: `https://www.amazon.com.au/dp/B0BR2YF8T6?tag=${AMAZON_TAG}` },
    { label: 'TaylorMade Qi10 Driver', img: 'https://m.media-amazon.com/images/P/B0CNRY4WBD._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=TaylorMade+Qi10+driver` },
    { label: 'Callaway Chrome Soft Golf Balls', img: 'https://m.media-amazon.com/images/P/B0CL4FQFBJ._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Callaway+Chrome+Soft+golf+balls` },
    { label: 'Garmin Approach S42 GPS Watch', img: 'https://m.media-amazon.com/images/P/B09BJ5J3GX._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Garmin+Approach+S42+golf+watch` }
  ],
  'Instruction': [
    { label: 'Golf Alignment Sticks', img: 'https://m.media-amazon.com/images/P/B001AXOGP2._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+alignment+sticks` },
    { label: 'Orange Whip Swing Trainer', img: 'https://m.media-amazon.com/images/P/B003YH3HW2._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Orange+Whip+golf+swing+trainer` },
    { label: 'Golf Putting Mat', img: 'https://m.media-amazon.com/images/P/B07BQMG93B._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=golf+putting+mat` },
    { label: 'Titleist Pro V1 Golf Balls', img: 'https://m.media-amazon.com/images/P/B0BR2YF8T6._AC_SX300_.jpg', url: `https://www.amazon.com.au/dp/B0BR2YF8T6?tag=${AMAZON_TAG}` }
  ],
  'Equipment & More': [
    { label: 'TaylorMade Stealth Irons', img: 'https://m.media-amazon.com/images/P/B09VCQ3K6B._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=TaylorMade+Stealth+irons` },
    { label: 'Callaway Chrome Soft Golf Balls', img: 'https://m.media-amazon.com/images/P/B0CL4FQFBJ._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Callaway+Chrome+Soft+golf+balls` },
    { label: 'Bushnell Tour V6 Rangefinder', img: 'https://m.media-amazon.com/images/P/B0BY4QWQCX._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Bushnell+golf+rangefinder` },
    { label: 'Titleist Vokey SM9 Wedge', img: 'https://m.media-amazon.com/images/P/B0B2WVJN6Q._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Titleist+Vokey+SM9+wedge` }
  ],
  'Course Guide': [
    { label: 'Bushnell Tour V6 Rangefinder', img: 'https://m.media-amazon.com/images/P/B0BY4QWQCX._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Bushnell+golf+rangefinder` },
    { label: 'Titleist Pro V1 Golf Balls', img: 'https://m.media-amazon.com/images/P/B0BR2YF8T6._AC_SX300_.jpg', url: `https://www.amazon.com.au/dp/B0BR2YF8T6?tag=${AMAZON_TAG}` },
    { label: 'Garmin Approach S62 GPS Watch', img: 'https://m.media-amazon.com/images/P/B08F5KV9PL._AC_SX300_.jpg', url: `https://www.amazon.com.au/dp/B08F5KV9PL?tag=${AMAZON_TAG}` },
    { label: 'TaylorMade Qi10 Driver', img: 'https://m.media-amazon.com/images/P/B0CNRY4WBD._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=TaylorMade+Qi10+driver` }
  ]
};

const relatedGearDefault = [
  { label: 'Titleist Pro V1 Golf Balls', img: 'https://m.media-amazon.com/images/P/B0BR2YF8T6._AC_SX300_.jpg', url: `https://www.amazon.com.au/dp/B0BR2YF8T6?tag=${AMAZON_TAG}` },
  { label: 'TaylorMade Stealth Irons', img: 'https://m.media-amazon.com/images/P/B09VCQ3K6B._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=TaylorMade+Stealth+irons` },
  { label: 'Bushnell Tour V6 Rangefinder', img: 'https://m.media-amazon.com/images/P/B0BY4QWQCX._AC_SX300_.jpg', url: `https://www.amazon.com.au/s?tag=${AMAZON_TAG}&k=Bushnell+golf+rangefinder` },
  { label: 'Garmin Approach S62 GPS Watch', img: 'https://m.media-amazon.com/images/P/B08F5KV9PL._AC_SX300_.jpg', url: `https://www.amazon.com.au/dp/B08F5KV9PL?tag=${AMAZON_TAG}` }
];

function buildRelatedGearSection(category) {
  let products = relatedGearByCategory[category];
  if (!products) {
    const key = Object.keys(relatedGearByCategory).find(k =>
      (category || '').toLowerCase().includes(k.toLowerCase())
    );
    products = key ? relatedGearByCategory[key] : relatedGearDefault;
  }

  // onerror hides the image cleanly if ASIN image is unavailable
  const cards = products.map(p =>
    `<a class="product-card" href="${p.url}" target="_blank" rel="noopener sponsored">` +
    `<img src="${p.img}" alt="${p.label}" onerror="this.style.display='none'">` +
    `<div class="product-card-name">${p.label}</div>` +
    `<div class="product-card-btn">View on Amazon AU &rarr;</div>` +
    `</a>`
  ).join('');

  console.log(`Related gear section added (${products.length} product cards) for category: ${category}`);

  return `<div class="related-gear-section"><h2>&#9971; Related Gear</h2><p>Gear worth checking out for mid-handicap golfers:</p><div class="related-gear-grid">${cards}</div></div>`;
}
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

async function getYouTubeVideo(query) {
  try {
    const searchQuery = encodeURIComponent(query + ' golf');
    const res = await httpsRequest(
      'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + searchQuery + '&type=video&maxResults=5&videoCategoryId=17&key=' + process.env.YOUTUBE_API_KEY,
      { method: 'GET' }
    );
    const data = JSON.parse(res.body);
    if (data.items && data.items.length > 0) {
      const preferred = data.items.find(item =>
        /pga tour|golf channel|rick shiels|me and my golf|golf digest|european tour|liv golf/i.test(item.snippet.channelTitle)
      );
      const video = preferred || data.items[0];
      const videoId = video.id.videoId;
      console.log('YouTube video found:', video.snippet.title, '(' + videoId + ')');
      return videoId;
    }
  } catch (e) {
    console.warn('YouTube search failed:', e.message);
  }
  return null;
}

function buildYouTubeEmbed(videoId) {
  if (!videoId) return '';
  return '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:28px 0;border:1px solid rgba(201,168,76,0.15);">' +
    '<iframe style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" ' +
    'src="https://www.youtube.com/embed/' + videoId + '?rel=0&modestbranding=1" ' +
    'title="Golf Video" allowfullscreen loading="lazy"></iframe></div>';
}

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
      instructions: 'Write a practical golf instruction article for mid-handicap golfers focusing on full swing technique — driving, iron play or fairway woods. Include step-by-step tips and drills. Recommend alignment sticks [AFFILIATE LINK] as a great practice tool. Include a stats-bar with 2-4 improvement stats. Tone: coaching, encouraging, practical.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf short game chipping bunker',
      searches: ['golf short game tips improvement {year}', 'golf chipping tips amateur {year}', 'bunker play golf tips {year}'],
      instructions: 'Write a short game instruction article for mid-handicap golfers. Focus on chipping, pitching or bunker play. Include step-by-step tips and on-course drills. Recommend a Cleveland RTX wedge [AFFILIATE LINK] as the go-to option. Include a stats-bar with 2-4 scoring or short game stats. Tone: friendly, practical, encouraging.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf putting green practice stroke',
      searches: ['golf putting tips improvement {year}', 'how to putt better amateur golf {year}', 'golf green reading tips {year}'],
      instructions: 'Write a putting instruction article for mid-handicap golfers. Cover stroke technique, green reading, distance control or pre-putt routine. Include practical drills. Recommend a golf putting mat [AFFILIATE LINK] for home practice. Include a stats-bar with 2-4 putting stats. Tone: coaching, focused, practical.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf course management strategy',
      searches: ['golf course management tips scoring {year}', 'golf mental game strategy {year}', 'how to score better golf round {year}'],
      instructions: 'Write a course management and strategy article for mid-handicap golfers. Cover laying up, club selection, playing to strengths, avoiding big numbers or the mental game. Recommend a Garmin Approach S42 GPS watch [AFFILIATE LINK] for precise distance measurement. Include a stats-bar with 2-4 scoring stats. Tone: strategic, insightful, practical.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf practice drills training aid',
      searches: ['golf practice drills at home {year}', 'golf training aids review {year}', 'best golf practice routine {year}'],
      instructions: 'Write a practice and improvement article for mid-handicap golfers. Cover effective practice drills and training aids. Recommend an Orange Whip swing trainer [AFFILIATE LINK] and alignment sticks [AFFILIATE LINK] as must-have aids. Include a stats-bar with 2-4 improvement or practice stats. Tone: motivating, practical, evidence-based.'
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
      instructions: 'Write an article about building consistency in golf through routine and setup. Cover pre-shot routine, alignment, grip, stance and how to replicate good shots. Recommend alignment sticks [AFFILIATE LINK] as the simplest consistency tool. Include a stats-bar with 2-4 stats about consistency or handicap improvement. Tone: methodical, practical, encouraging.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf ball striking impact position',
      searches: ['golf ball striking tips {year}', 'how to hit golf ball better {year}', 'golf impact position tips {year}'],
      instructions: 'Write an article on improving ball striking for mid-handicap golfers. Cover impact position, compression, contact quality and common mistakes to avoid. Recommend a golf impact bag [AFFILIATE LINK] as a great drill aid. Include practical drills. Include a stats-bar with 2-4 relevant stats. Tone: technical but accessible, practical.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf driver club new technology',
      searches: ['best new golf driver {year} review', 'new golf clubs release {year}', 'golf equipment review {month} {year}'],
      instructions: 'Write a golf equipment review covering the latest driver or iron releases. Recommend TaylorMade Qi10 [AFFILIATE LINK] and Callaway Paradym [AFFILIATE LINK] as the top picks. Include specs, key technology features, who each club suits and value for money. Include a stats-bar with 2-4 specs or performance stats. Tone: informed, enthusiastic, practical buying advice.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf balls selection comparison',
      searches: ['best golf balls mid handicap {year}', 'golf ball review comparison {year}', 'golf ball distance spin {year}'],
      instructions: 'Write a golf ball review comparing distance, spin, feel and price across popular models. Recommend Titleist Pro V1 [AFFILIATE LINK] as the premium pick and Callaway Chrome Soft [AFFILIATE LINK] as the best-value option. Include a stats-bar with 2-4 specs or performance comparisons. Tone: helpful, practical, honest.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf accessories rangefinder GPS watch',
      searches: ['best golf rangefinder {year} review', 'golf GPS watch review {year}', 'golf technology accessories {year}'],
      instructions: 'Write an equipment review covering golf technology accessories. Recommend Bushnell Pro X3 rangefinder [AFFILIATE LINK] and Garmin Approach S62 GPS watch [AFFILIATE LINK] as the top picks. Include key features, accuracy, battery life and value. Include a stats-bar with 2-4 specs or comparisons. Tone: tech-savvy, practical, helpful.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf bag accessories equipment',
      searches: ['golf accessories review {year}', 'best golf bag {year}', 'golf equipment accessories {year}'],
      instructions: 'Write a golf accessories and gear article. Cover golf bags [AFFILIATE LINK], headcovers, gloves, tees, umbrellas or other accessories. Give practical recommendations. Include a stats-bar with 2-4 specs or value comparisons. Tone: helpful, practical, honest buying guide.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf iron set clubs mid handicap',
      searches: ['best golf irons mid handicap {year}', 'game improvement irons review {year}', 'golf irons buying guide {year}'],
      instructions: 'Write a golf irons buying guide aimed at mid-handicap golfers. Recommend Callaway Rogue ST Irons [AFFILIATE LINK] and TaylorMade Stealth Irons [AFFILIATE LINK] as top picks. Cover forgiveness, distance, feel and value. Include a stats-bar with 2-4 specs or performance stats. Tone: informed, practical, helpful.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf wedge short game equipment',
      searches: ['best golf wedges {year} review', 'golf wedge buying guide {year}', 'golf wedge loft selection {year}'],
      instructions: 'Write a golf wedge review or buying guide. Recommend Titleist Vokey SM9 [AFFILIATE LINK] as the premium pick and Cleveland RTX wedge [AFFILIATE LINK] as the best-value option. Cover loft gapping, bounce and grind options. Include a stats-bar with 2-4 specs or performance stats. Tone: technical but accessible, practical buying advice.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf putter styles mallet blade',
      searches: ['best golf putters {year} review', 'golf putter buying guide {year}', 'mallet vs blade putter {year}'],
      instructions: 'Write a putter review or buying guide. Recommend Odyssey White Hot putter [AFFILIATE LINK] as the best value and Ping Sigma 2 [AFFILIATE LINK] as the alignment specialist. Compare blade and mallet styles. Include a stats-bar with 2-4 specs or stats. Tone: informed, practical, helpful.'
    },
    {
      category: 'Equipment & More',
      imageQuery: 'golf shoes spikeless waterproof',
      searches: ['best golf shoes {year} review', 'golf shoes waterproof comfort {year}', 'spikeless golf shoes {year}'],
      instructions: 'Write a golf shoes review or buying guide. Recommend the top golf shoes [AFFILIATE LINK] for comfort and waterproofing. Cover grip, stability and style. Compare spiked vs spikeless options. Include a stats-bar with 2-4 specs or comparisons. Tone: practical, helpful, honest.'
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
      instructions: 'Write a course guide focused on great golf courses in Australia or the Asia Pacific region. Cover layout, conditions, history and what makes them stand out. Recommend a Bushnell Pro X3 rangefinder [AFFILIATE LINK] as ideal for visiting golfers. Include a stats-bar with 2-4 course facts. Tone: enthusiastic, descriptive, inspiring.'
    },
    {
      category: 'Course Guide',
      imageQuery: 'golf resort destination travel',
      searches: ['best golf resorts world {year}', 'golf holiday destination {year}', 'golf travel bucket list {year}'],
      instructions: 'Write a golf travel and destination guide. Cover a great golf resort or destination, what courses are available, facilities, best time to visit and travel tips. Recommend Titleist Pro V1 golf balls [AFFILIATE LINK] as the ball to bring on tour. Include a stats-bar with 2-4 destination or course facts. Tone: inspiring, practical, travel-focused.'
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
      instructions: 'Write a buying guide covering fairway woods and hybrids. Recommend TaylorMade Stealth Hybrid [AFFILIATE LINK] as the top mid-handicap pick. Compare the two categories, cover key models and explain who should use each. Include a stats-bar with 2-4 specs or performance stats. Tone: informed, practical, helpful.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf beginner tips basics',
      searches: ['golf tips for beginners high handicap {year}', 'how to improve fast golf {year}', 'golf basics fundamentals {year}'],
      instructions: 'Write a fundamentals article aimed at higher handicap golfers. Cover grip, stance, alignment and posture. Recommend alignment sticks [AFFILIATE LINK] as the single most useful tool for working on fundamentals. Include a stats-bar with 2-4 relevant stats. Tone: encouraging, clear, accessible.'
    },
    {
      category: 'Instruction',
      imageQuery: 'golf weather wind rain playing conditions',
      searches: ['golf tips playing in wind {year}', 'golf wet weather tips {year}', 'how to play golf in bad weather {year}'],
      instructions: 'Write an article about playing golf in challenging weather conditions — wind, rain or cold. Cover club selection adjustments, ball flight management and maintaining focus. Recommend Callaway Chrome Soft golf balls [AFFILIATE LINK] as a great low-spin option in the wind. Include a stats-bar with 2-4 relevant stats. Tone: practical, experienced, helpful.'
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
      instructions: 'Write a player profile or news piece focused on the LPGA Tour or womens professional golf. Cover results, player profiles, tour news or a feature on a leading player. Include a stats-bar with 2-4 stats. Tone: celebratory, authoritative, inspiring.'
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

  // Pick a random article type from all available types
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
    'IMPORTANT: Where the instructions say [AFFILIATE LINK], write exactly [AFFILIATE LINK] in your output — it will be replaced automatically with a real Amazon link. Do not remove or change it.',
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
    '  "videoQuery": "specific YouTube search query e.g. Scottie Scheffler Masters 2026 highlights",',
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
    'For the videoQuery field: provide a specific YouTube search query relevant to this post topic.',
    'Use player names, tournament names or specific techniques — be as specific as possible.',
    'Examples: "Rory McIlroy 2026 highlights", "how to chip in golf tutorial", "TaylorMade Qi35 driver review"',
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

  // ─── Inject affiliate links ────────────────────────────────────────────────
  console.log('Injecting affiliate links...');
  postData.body = injectAffiliateLinks(postData.body);

  // ─── Append Related Gear section ──────────────────────────────────────────
  postData.body = postData.body + buildRelatedGearSection(articleType.category);

  // ─── Fetch YouTube video and embed after second section ────────────────────
  if (process.env.YOUTUBE_API_KEY && postData.videoQuery) {
    console.log('Searching YouTube for:', postData.videoQuery);
    const videoId = await getYouTubeVideo(postData.videoQuery);
    if (videoId) {
      const embedHTML = buildYouTubeEmbed(videoId);
      const h2matches = [...postData.body.matchAll(/<\/h2>/gi)];
      if (h2matches.length >= 2) {
        const insertAt = h2matches[1].index + '</h2>'.length;
        postData.body = postData.body.slice(0, insertAt) + embedHTML + postData.body.slice(insertAt);
      } else {
        postData.body = postData.body + embedHTML;
      }
      console.log('YouTube embed added to post');
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
