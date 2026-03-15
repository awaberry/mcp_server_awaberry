const AwaberryApiRequestClient = require('./awaberryApiRequestClient');
const client = new AwaberryApiRequestClient(
  'https://agentic.awaberry.net/apirequests',
  'yourProjectKey',
  'yourProjectSecret'
);

(async () => {
  await client.initSession();
  // Use other methods as needed
})();