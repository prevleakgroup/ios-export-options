const GoDaddy = require('godaddy-api');

function createGoDaddyClient({ apiKey = process.env.GODADDY_API_KEY, apiSecret = process.env.GODADDY_API_SECRET } = {}) {
  if (!apiKey || !apiSecret) {
    throw new Error('GoDaddy API credentials are not configured');
  }

  return GoDaddy(apiKey, apiSecret);
}

async function getGoDaddyDomain(domainName, options = {}) {
  const client = createGoDaddyClient(options);
  const response = await client.domains.get({ domain: domainName });
  return response.body;
}

module.exports = {
  createGoDaddyClient,
  getGoDaddyDomain,
};
