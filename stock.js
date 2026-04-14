const https = require('https');

function fetchURL(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
            },
            timeout: 6000,
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchURL(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

async function tryYahooQ1() {
    const { body } = await fetchURL('https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d');
    const meta = JSON.parse(body).chart.result[0].meta;
    const price = meta.regularMarketPrice;
    const prev  = meta.chartPreviousClose;
    if (!price) throw new Error('No price in Yahoo q1');
    return { price, change: price - prev, changePercent: ((price - prev) / prev) * 100, previousClose: prev };
}

async function tryYahooQ2() {
    const { body } = await fetchURL('https://query2.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d');
    const meta = JSON.parse(body).chart.result[0].meta;
    const price = meta.regularMarketPrice;
    const prev  = meta.chartPreviousClose;
    if (!price) throw new Error('No price in Yahoo q2');
    return { price, change: price - prev, changePercent: ((price - prev) / prev) * 100, previousClose: prev };
}

async function tryStooq() {
    const { body } = await fetchURL('https://stooq.com/q/l/?s=tsla.us&f=sd2t2ohlcv&h&e=csv');
    const cols  = body.trim().split('\n')[1].split(',');
    const close = parseFloat(cols[6]);
    const open  = parseFloat(cols[3]);
    if (!close || isNaN(close)) throw new Error('No price in Stooq');
    return { price: close, change: close - open, changePercent: ((close - open) / open) * 100, previousClose: open };
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    const sources = [
        { name: 'yahoo-q1', fn: tryYahooQ1 },
        { name: 'yahoo-q2', fn: tryYahooQ2 },
        { name: 'stooq',    fn: tryStooq   },
    ];

    const errors = [];
    for (const source of sources) {
        try {
            const result = await source.fn();
            return res.json({ ...result, source: source.name });
        } catch (e) {
            errors.push(`${source.name}: ${e.message}`);
        }
    }

    res.status(502).json({ error: 'All sources failed', details: errors });
};
