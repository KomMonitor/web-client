#!/usr/bin/env node
const cronstrue = require("../dist/cronstrue");
function usage() {
  (console.error('Usage: cronstrue "<expression>"'),
    console.error("  or"),
    console.error("Usage (5 args): cronstrue minute hour day-of-month month day-of-week"),
    console.error("  or"),
    console.error("Usage (6 args): cronstrue second minute hour day-of-month month day-of-week"),
    console.error("  or"),
    console.error("Usage (7 args): cronstrue second minute hour day-of-month month day-of-week year"),
    console.error(""),
    console.error("Examples:"),
    console.error('  cronstrue "*/5 * * * *"'),
    console.error('  cronstrue "@daily"'),
    console.error("  cronstrue 0 0 * * 1"));
}
const args = process.argv.slice(2);
1 === args.length && (console.log(cronstrue.toString(args[0])), process.exit(0));
const expression = args.join(" "),
  argCount = args.length;
(argCount < 5 && (console.error(`Error: too few arguments (${argCount}): ${expression}`), usage(), process.exit(1)),
  argCount > 7 && (console.error(`Error: too many arguments (${argCount}): ${expression}`), usage(), process.exit(2)),
  console.log(cronstrue.toString(expression)));
