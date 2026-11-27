# Retry Deadline Planner

Released 2026-11-27. Add up attempt timeouts and capped exponential backoff to check whether a retry policy fits its deadline.

The first request has no backoff. Every attempt takes its full timeout, including the last. Random jitter and Retry-After are excluded.

## Run

Open index.html through the [portfolio](https://lavkeshhhh.github.io/daily-cloud-tools/apps/retry-deadline/). The browser interface uses the shared stylesheet and calculator UI in site/shared. The standalone Node program in this directory requires no packages.

```sh
node model.js '{"attempts":4,"timeout":800,"initial":200,"cap":1000,"deadline":5000}'
```

## Verification

From the repository root run `node --test test/*.test.cjs` and `node scripts/verify.cjs`. The project metadata and expected examples are in tool.json and cases.json. The generator is scripts/publish.cjs.
