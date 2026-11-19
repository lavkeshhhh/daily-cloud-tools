'use strict';

const sampleBefore = `Plan hash value: 10001
----------------------------------------------------------------
| Id  | Operation          | Name        | Rows | Cost (%CPU) |
----------------------------------------------------------------
|   0 | SELECT STATEMENT   |             |  120 |    230  (1) |
|   1 |  HASH GROUP BY     |             |  120 |    230  (1) |
|*  2 |   TABLE ACCESS FULL| DEMO_ORDERS |  480 |    210  (1) |
----------------------------------------------------------------`;

const sampleAfter = `Plan hash value: 10002
---------------------------------------------------------------------------------
| Id  | Operation                       | Name             | Rows | Cost (%CPU) |
---------------------------------------------------------------------------------
|   0 | SELECT STATEMENT                |                  |   85 |     36  (1) |
|   1 |  HASH GROUP BY                  |                  |   85 |     36  (1) |
|   2 |   TABLE ACCESS BY INDEX ROWID   | DEMO_ORDERS      |  290 |     31  (1) |
|*  3 |    INDEX RANGE SCAN             | DEMO_ORDERS_IX   |  290 |      6  (0) |
---------------------------------------------------------------------------------`;

if (typeof module !== 'undefined') module.exports = { sampleBefore, sampleAfter };
