# List Object Storage Buckets

Released 2026-11-20. Build the oci os bucket list command with its documented scope and filters.

Enter the required scope and any desired supported filters. Copy the generated command into a configured OCI CLI. The helper does not access an Oracle account. For additional parameters see the [official command reference](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/os/bucket/list.html).

## Run

Open index.html through the [portfolio](https://lavkeshhhh.github.io/daily-cloud-tools/apps/oci-os-bucket-list/). The browser interface uses the shared stylesheet and oci UI in site/shared. The standalone Node program in this directory requires no packages.

```sh
node model.js '{"--compartment-id":"example-value"}'
```

## Verification

From the repository root run `node --test test/*.test.cjs` and `node scripts/verify.cjs`. The project metadata and expected examples are in tool.json and cases.json. The generator is scripts/publish.cjs.
