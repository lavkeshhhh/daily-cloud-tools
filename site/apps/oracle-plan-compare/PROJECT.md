# Oracle Plan Compare

Open index.html directly, or serve the site directory over HTTP. The app compares the pipe-delimited text tables printed by Oracle DBMS_XPLAN. Paste one complete table on each side and choose Compare plans. Input is processed in browser memory. The sample is synthetic.

The parser in core.js reads the column labels and uses indentation to recover the operation tree. Its matching key is the ancestor path, operation, object and ordinal among identical siblings. Step IDs can change between plans. A change of parent intentionally appears as a removal and an addition. The comparison includes Rows/E-Rows, A-Rows, optimizer Cost, Starts, Buffers and the adaptive inactive marker. Differences in these displayed values need interpretation. Cost is an optimizer estimate. Parent/child inference requires preserved indentation. Copied screenshots, JSON plans, predicates and arbitrary SQL are outside this parser's scope.

ui.js renders results with textContent. examples.js supplies the initial plans. The example changes a full scan to an index path, producing two added steps, one removed step and two changed estimates. From the repository root run `node --test test/plan.test.cjs`. The shared stylesheet is ../../style.css.

[Oracle execution plan guide](https://docs.oracle.com/en/database/oracle/oracle-database/26/tgsql/generating-and-displaying-execution-plans.html)
