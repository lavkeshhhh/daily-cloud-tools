# Daily Cloud Tools

Small applications for Oracle, cloud operations and software engineering. Each application has its own source directory and project notes.

[Open the collection](https://lavkeshhhh.github.io/daily-cloud-tools/) · [Browse the applications](site/apps/)

## Run locally

Serve the site with `python3 -m http.server 8000 --directory site` and open http://localhost:8000. Oracle Plan Compare also works by opening its index.html directly. Run its checks with `node --test test/plan.test.cjs`. Rebuild the static catalog with `node scripts/catalog.cjs`.

## Oracle Plan Compare

Paste two DBMS_XPLAN text plans. The comparison shows added and removed access paths and changes to matching steps. Use the built-in example to try a shift from a full table scan to an index range scan. Inputs stay in the browser.

[Source and usage](site/apps/oracle-plan-compare/PROJECT.md)

## Daily publishing

GitHub Actions builds, tests and publishes one distinct app per India calendar day. The daily target is **09:17 IST**. Start a run manually from the Actions tab. Repeating a successful day keeps the existing release.

The collection starts with authored engineering calculators and browser tools for specific OCI list commands. After the starter queue, the builder discovers additional commands in Oracle's public reference. Each new tool has a browser interface, source, an example and project notes. The account's laptop, Oracle credentials and model API keys are unnecessary for the hosted workflow.

[How publishing works](PROJECT.md) · [Workflow runs](https://github.com/lavkeshhhh/daily-cloud-tools/actions)
