const express = require('express');
const ical = require('node-ical');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('I am alive!');
});

app.get('/parse', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send("Missing 'url' query parameter");
    }

    try {
        const data = await ical.async.fromURL(url);
        const events = [];

        for (const k in data) {
            if (data[k].type === 'VEVENT') {
                events.push({
                    uid: data[k].uid, 
                    summary: data[k].summary,
                    description: data[k].description,
                    location: data[k].location,
                    start: data[k].start,
                    end: data[k].end
                });
            }
        }

        res.json(events);
    } catch (err) {
        console.error('Calendar parsing error:', err);

        // Log rate limit headers for debugging
        if (err.response && err.response.headers) {
            console.log('Response headers:', err.response.headers);
        }

        // Handle rate limiting specifically
        if (err.response && err.response.status === 429) {
            const retryAfter = err.response.headers['retry-after'];
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `Too many requests. Please try again in ${retryAfter} seconds.`,
                retryAfter: retryAfter
            });
        }
        res.status(500).send("Error parsing calendar");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});