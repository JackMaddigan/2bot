const { processAoN, AoN_Result } = require("./formats/boN");

const events = {
  222: {
    name: "2x2",
    short: "2x2",
    process: processAoN,
    scr: ["222so", "0"],
    attempts: 12,
    obj: AoN_Result,
  },
  "2bld": {
    name: "2BLD",
    short: "2BLD",
    process: processAoN,
    scr: ["222so", "0"],
    attempts: 5,
    obj: AoN_Result,
  },
  "2oh": {
    name: "2x2 OH",
    short: "2x2 OH",
    process: processAoN,
    scr: ["555bld", "60"],
    attempts: 5,
    obj: AoN_Result,
  },
};

const eventShortNameToId = Object.entries(events).reduce(
  (acc, [key, value]) => {
    acc[value.short] = key;
    return acc;
  },
  {}
);

module.exports = {
  events,
  eventShortNameToId,
};
