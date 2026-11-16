const languages = ['en', 'zh-hk', 'zh-cn'];

const targets = Object.fromEntries([
  ['fulfillment-ratio', 'participating-products'],
  ['total-cash-value-ratio', 'participating-products'],
  ['crediting-interest-rate-history', 'universal-life'],
].map(([slug, category]) => [slug, { slug, path: `${category}/${slug}` }]));

module.exports = { languages, targets };
