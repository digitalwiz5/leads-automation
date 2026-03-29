/**
 * Facebook Lead Ads → Webhook Bridge
 *
 * How to use:
 * 1. Set up a Facebook App with Leads Retrieval permission
 * 2. Subscribe to "leadgen" webhook events on your page
 * 3. Deploy this file as a serverless function (Railway / Vercel / Render)
 * 4. Set FACEBOOK_VERIFY_TOKEN and WEBHOOK_URL in env vars
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving
 */

const axios = require('axios');

const FB_VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'my-verify-token';
const WEBHOOK_URL     = process.env.WEBHOOK_URL || 'https://your-app.railway.app/webhook/lead';
const WEBHOOK_SECRET  = process.env.WEBHOOK_SECRET || 'your-secret';
const FB_PAGE_TOKEN   = process.env.FB_PAGE_TOKEN || '';

// Express handler (attach to your Express app or use standalone)
module.exports = async function facebookBridge(req, res) {

  // ── Verification handshake (GET) ────────────────────────────────────────
  if (req.method === 'GET') {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
      return res.send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // ── Incoming lead event (POST) ───────────────────────────────────────────
  const { object, entry } = req.body;
  if (object !== 'page') return res.sendStatus(200);

  for (const pageEntry of entry) {
    for (const change of pageEntry.changes) {
      if (change.field !== 'leadgen') continue;

      const leadgenId = change.value.leadgen_id;

      try {
        // Fetch full lead data from Facebook Graph API
        const fbRes = await axios.get(
          `https://graph.facebook.com/v18.0/${leadgenId}`,
          { params: { access_token: FB_PAGE_TOKEN } }
        );

        const fields = {};
        for (const { name, values } of fbRes.data.field_data) {
          fields[name] = values[0];
        }

        // Forward to our webhook
        await axios.post(
          WEBHOOK_URL,
          {
            name:   fields['full_name'] || fields['first_name'] + ' ' + (fields['last_name'] || ''),
            email:  fields['email'],
            phone:  fields['phone_number'],
            source: 'facebook-lead-ads',
            data:   { leadgen_id: leadgenId, form_id: change.value.form_id, ...fields },
          },
          { headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` } }
        );
      } catch (err) {
        console.error('Facebook bridge error', err.message);
      }
    }
  }

  res.sendStatus(200);
};
