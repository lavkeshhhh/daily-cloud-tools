# Daily Cloud Tools

A public collection of small Oracle and general engineering utilities. Each released application includes a browser interface, its own source directory, release metadata and project notes. The generated tools can also run as standalone Node programs.

## Run the project

Use Node 22 or later, Git and Python 3.9 or later. The publishing tools use the standard libraries. Run these commands from the repository root.

```sh
node --test test/*.test.cjs
node scripts/verify.cjs
python3 -m http.server 8000 --directory site
```

Open http://localhost:8000. Use Oracle Plan Compare's synthetic example or paste two Oracle DBMS_XPLAN text tables. A generated application's PROJECT.md includes its CLI example. Browser inputs stay in the tab.

## Daily release

The GitHub Actions workflow is configured for 03:47 UTC, or 09:17 Asia/Kolkata, each day. GitHub controls actual queue timing. The same workflow supports Run workflow in the Actions tab. Only main is eligible. Concurrency serializes releases, and the publisher uses the current India date to identify a daily release even if the job crosses midnight UTC. A second run for the same local date rebuilds the catalog and redeploys the same content without creating a second application or making an empty commit. A missed date does not get a backdated release.

The first launch app is Oracle Plan Compare. The first daily release is the Queue Recovery Calculator. A daily run does the following.

1. Test known answers, invalid inputs, date boundaries, duplicate prevention and Oracle plan comparison.
2. Pick the next unused solution. While both are available, alternate a general engineering calculator with a builder for one documented OCI list operation. The initial stock has six different calculation models and nine cached OCI command signatures.
3. Write the new tool to a temporary directory, then move it into site/apps. Each daily directory includes index.html, model.js, tool.json, cases.json and PROJECT.md. model.js is a runnable program containing that day's solver or CLI signature.
4. Verify every published tool, its expected results and its local links. Commit only the built app directory and catalog to main. The short-lived GitHub token can write to this repository. No personal access token or model API key is needed by the runner.
5. Upload site as a Pages artifact and deploy it in a separate job. That job has pages:write and id-token:write permissions. A retry after a successful commit but failed deployment can deploy the saved release.

## Supply of new tools

recipes/calculators.cjs defines authored engineering problems, inputs, solver functions and independently specified expected outputs. Add a recipe with a unique slug and meaningful edge cases to add more calculator designs.

scripts/oci_reference.py reads Oracle's public CLI documentation. The checked-in queue contains only command names and parameter signatures with source links. When the local queue is exhausted the publisher reads the current official service indexes and selects an unused compatible list operation. For each operation it generates an interactive POSIX command builder and a standalone CLI. The generated source includes only documented parameters supported by the form. Input is quoted as shell data, and the tool itself makes no Oracle API calls. The release fails visibly if the source is unreachable or offers no compatible unused operation. More general-purpose solvers can be added at any time.

This is a source-driven publisher. Its ongoing discovery builds tools in the OCI command-builder family. The service index can change, so available inventory and uninterrupted future releases are not guaranteed. Oracle cloud access and external model inference are not part of this workflow.

## Rebuild and recover

Run `node scripts/publish.cjs` to build the next app for today's India date, then run the checks above. This command writes to the checkout. Run `node scripts/catalog.cjs` to rebuild the catalog without creating an application. Run `python3 scripts/oci_reference.py seed` to refresh the starter command facts from public documentation. The network discovery path can be exercised with `python3 scripts/oci_reference.py next`.

To create a fresh deployment, use a public GitHub repository, push these files to main, set Settings > Pages > Source to GitHub Actions, and enable Actions. If you fork under a new name, update the portfolio and source URLs in the site, README and generator. Start the first release with `gh workflow run daily.yml`. Inspect the run summary and the commit on main. The repository's Pages environment serves the site. GitHub can delay schedules or disable inactive public-repository schedules. An operator can rerun a failed job or dispatch the workflow once the underlying issue is fixed.

## References

[Oracle execution plans](https://docs.oracle.com/en/database/oracle/oracle-database/26/tgsql/generating-and-displaying-execution-plans.html) · [Oracle CLI command reference](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/) · [GitHub Actions scheduling](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) · [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Publication privacy

The runner checks out this public project on GitHub-hosted Linux. Its inputs are the synthetic examples and calculators in this tree, and the command signatures at the linked public Oracle documentation. List helpers format commands locally in the browser. Pages serves static files. The pages use a content security policy that disables outbound connections and form submissions.

Run the following checks before pushing a release. They require Git, Python 3.9 or later, Bash, curl, tar and shasum. The secret scanner runs locally on Apple Silicon and in CI on Linux x64.

```sh
python3 -B -m unittest discover -s test -p 'privacy_test.py'
python3 -B scripts/privacy.py --history HEAD
bash scripts/secret-scan.sh
```

The inventory allows named source files and each tool's expected artifacts. The Pages check walks the full site directory, including files ignored by Git. It rejects unexpected files, links, binary content, private paths, literal IP addresses, personal emails, cloud resource identifiers and URLs outside the listed public sources. Commit authors and committers use the project identities and GitHub noreply addresses. Daily commits must consist of one tool and its catalog update. The pinned Gitleaks release is verified against its published SHA-256 digest. A failed check stops the workflow before either the push or the Pages artifact upload.

The checks cover detectable patterns. Keep private documents, logs, inputs and real deployment data outside this repository. New input sources and publishing destinations require an explicit inventory change.
