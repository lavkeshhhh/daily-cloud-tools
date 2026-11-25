# Archive Storage Runway

Released 2026-11-25. Estimate when archive storage will reach its reserve threshold using observed generation and reclamation rates.

Both rates use GiB per day and must refer to the same destination. Results assume steady rates and the capacity you entered.

## Run

Open index.html through the [portfolio](https://lavkeshhhh.github.io/daily-cloud-tools/apps/archive-runway/). The browser interface uses the shared stylesheet and calculator UI in site/shared. The standalone Node program in this directory requires no packages.

```sh
node model.js '{"free":980,"reserve":140,"generated":96,"reclaimed":36}'
```

## Verification

From the repository root run `node --test test/*.test.cjs` and `node scripts/verify.cjs`. The project metadata and expected examples are in tool.json and cases.json. The generator is scripts/publish.cjs.
