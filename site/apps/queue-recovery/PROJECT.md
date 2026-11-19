# Queue Recovery Calculator

Released 2026-11-20. Estimate when a worker pool will clear its backlog while new jobs continue to arrive.

Assumes steady arrival and processing rates. With no spare processing capacity, a nonempty backlog has no finite drain time.

## Run

Open index.html through the [portfolio](https://lavkeshhhh.github.io/daily-cloud-tools/apps/queue-recovery/). The browser interface uses the shared stylesheet and calculator UI in site/shared. The standalone Node program in this directory requires no packages.

```sh
node model.js '{"backlog":18000,"incoming":40,"workers":6,"rate":10,"target":10}'
```

## Verification

From the repository root run `node --test test/*.test.cjs` and `node scripts/verify.cjs`. The project metadata and expected examples are in tool.json and cases.json. The generator is scripts/publish.cjs.
