# RAG Context Budget

Released 2026-11-23. Find how many equal-sized retrieval chunks fit after reserving room for the prompt, history and answer.

Use token counts from the target model tokenizer. Each chunk incurs the same citation and formatting overhead.

## Run

Open index.html through the [portfolio](https://lavkeshhhh.github.io/daily-cloud-tools/apps/context-packing/). The browser interface uses the shared stylesheet and calculator UI in site/shared. The standalone Node program in this directory requires no packages.

```sh
node model.js '{"window":8192,"prompt":1200,"answer":1500,"chunk":600,"overhead":40}'
```

## Verification

From the repository root run `node --test test/*.test.cjs` and `node scripts/verify.cjs`. The project metadata and expected examples are in tool.json and cases.json. The generator is scripts/publish.cjs.
