# Oracle Session Budget

Released 2026-11-21. Size an application pool against a database session budget, including replicas that overlap during rollout.

Supply the usable session limit for this service after accounting for other workloads. Each live application replica can open its entire pool.

## Run

Open index.html through the [portfolio](https://lavkeshhhh.github.io/daily-cloud-tools/apps/oracle-session-budget/). The browser interface uses the shared stylesheet and calculator UI in site/shared. The standalone Node program in this directory requires no packages.

```sh
node model.js '{"limit":480,"reserve":80,"replicas":8,"surge":2,"pool":45}'
```

## Verification

From the repository root run `node --test test/*.test.cjs` and `node scripts/verify.cjs`. The project metadata and expected examples are in tool.json and cases.json. The generator is scripts/publish.cjs.
