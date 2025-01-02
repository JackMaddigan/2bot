const { processAoN, AoN_Result } = require("./formats/AoN");
const { MoN_Result, processMoN } = require("./formats/MoN");

const events = {
  222: {
    name: "2x2",
    short: "2x2",
    process: processAoN,
    scr: ["222so", "0"],
    attempts: 12,
    obj: AoN_Result,
    showBestSingle: true,
    showBestAo5: true,
  },
  "2bld": {
    name: "2BLD",
    short: "2bld",
    process: processMoN,
    scr: ["222so", "0"],
    attempts: 3,
    obj: MoN_Result,
    showBestSingle: true,
    showBestAo5: false,
  },
  "2oh": {
    name: "2x2 OH",
    short: "2x2oh",
    process: processAoN,
    scr: ["222so", "0"],
    attempts: 5,
    obj: AoN_Result,
    showBestSingle: true,
    showBestAo5: false,
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
