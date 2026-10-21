<p align="center">
  <img src="assets/wordmark.webp" alt="Ascendant" width="360" />
</p>

This site is the TypeScript documentation for Ascendant: a library for sidereal
astrology on npm as `astro-ascendant`. You can calculate charts, dashas, yogas,
Ashtakavarga, and Jaimini results, and you can use those results with coding
agents.

Python has its own docs in the
[ascendant repo](https://github.com/thaletto/ascendant/tree/main/docs/content).

## What you can learn

- How Ascendant calculates a chart, and which defaults it uses
- The difference between signs, houses, charts, and timing
- How Parashari, Jaimini, and KP approaches differ
- How saved person records work with agent skills
- How to install the TypeScript library and choose calculation settings
- What a reading can and cannot claim

## How calculations work

By default Ascendant uses the sidereal zodiac, KrishnamurtiVP291 ayanamsa, and
Placidus houses.

Methods are named so you can check and repeat a result. A reading is guidance,
not certainty, and not a substitute for medical, legal, or financial advice.

## Docs

- [Getting started](content/index.md)
- [Birth Chart Calculator](content/chart.mdx)
- API reference: [Chart](content/api-reference/chart.md),
  [Dasha](content/api-reference/dasha.md), [SAV](content/api-reference/sav.md),
  [Jaimini](content/api-reference/jaimini.md),
  [Ephemeris](content/api-reference/ephemeris.md),
  [AstroParams](content/api-reference/astro-params.md),
  [Swisseph](content/api-reference/swisseph.md)
- [Skills and Plugins](content/skills.md)

## Contributing

See [CONTRIBUTION.md](CONTRIBUTION.md).
