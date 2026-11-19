# World, in Six Signals

A self-contained Node.js 22 program that draws a 1024 × 1024 editorial infographic for the Make.fun competition “Sum up 18 November's world news in one image”. It uses only Node.js standard-library modules and writes `entry.png` into `MAKEFUN_OUTPUT_DIR`, or `/output` when that variable is not set. No network access or external image assets are used at runtime.

## Run

```sh
node main.ts
```

For a local run outside the competition container, set `MAKEFUN_OUTPUT_DIR` to an existing or new writable directory. Repeated runs produce the same PNG bytes.

## Editorial notes

- The two Shenzhen cards cover separate items: APEC remarks and the Xi–Putin bilateral meeting.
- The COP31 amounts are requests by small-island states, not awarded or committed funding.
- The Gulf card attributes interception reports to governments; it does not claim independent verification of every detail.
- Pax Silica distinguishes the signing date (15 November) from Japan's announcement date (18 November).
- Yemen airstrikes are omitted because the reported strikes occurred on 17 November.

## Sources

1. Associated Press, “China's Xi and other Asian leaders say Asia-Pacific must embrace open trade, fair growth” (18 November 2026): https://apnews.com/article/1e3b6161b31196c9716ca02ac8c7720c
2. Xinhua / State Council of the People's Republic of China, “Xi meets Putin in Shenzhen” (18 November 2026): https://english.www.gov.cn/news/202611/18/content_WS6afd2bebc6d00ca5f9a0e61d.html
3. Associated Press, “Island nations band together to demand 'more action' at UN climate talks” (18 November 2026): https://apnews.com/article/6d0afe638c93be3150b5bb3b5cd3fd23
4. Reuters, “Iran attacks US bases in Gulf countries despite diplomatic efforts” (18 November 2026; Reuters story republished by StreetInsider): https://new.streetinsider.com/Reuters/Iran%2Battacks%2BUS%2Bbases%2Bin%2BGulf%2Bcountries%2Bdespite%2Bdiplomatic%2Befforts/27365290.html
5. Associated Press, “Asian shares are mixed as AI stocks bounce back” (18 November 2026): https://apnews.com/article/dad5715bc91b4aba23a567a40e22b1fc
6. Japan Ministry of Foreign Affairs, “Participation in the ‘Pax Silica Founders Retreat’” (announcement dated 18 November; retreat and declaration signing on 15 November 2026): https://www.mofa.go.jp/press/release/pressite_000001_02858.html
7. Australian Department of Industry, Science and Resources, “The San Francisco Declaration on the Secure Foundations of Enduring Prosperity” (official list of governments signing on 15 November 2026): https://www.industry.gov.au/publications/san-francisco-declaration-secure-foundations-enduring-prosperity-signed-countries-attending-pax-silica-summit-15-november-2026

The PNG is drawn from geometric shapes and a built-in bitmap typeface in `main.ts`; the repository's MIT license is retained.
