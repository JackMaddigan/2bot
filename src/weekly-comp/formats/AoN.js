const { toCenti, centiToDisplay } = require("../../helpers/converters");

function processAoN(resultText, sub) {
  const splitResultText = resultText.replace(/[()+]/g, "").split(/[ ,]+/);
  const errors = [];
  if (splitResultText.length != sub.event.attempts) {
    errors.push(
      `Invalid number of attempts!\nExpected: ${sub.event.attempts}, received: ${splitResultText.length}`
    );
  }

  const regex = /^(dnf|dns|\d{1,2}(:\d{1,2}){0,2}(\.\d+)?)$/i;
  for (const solve of splitResultText) {
    if (!solve.match(regex)) {
      errors.push(`Invalid time: ${solve}`);
    }
  }

  if (errors.length > 0) {
    return { error: errors.join("\n") };
  }

  const solves = splitResultText.map((solve) => toCenti(solve));
  const list = solves.map((solve) => centiToDisplay(solve)).join(", ");
  const { best, average } = calculateAvgStats(solves);
  const bestAo5 = solves.length > 5 ? getBestAo5(solves) : null;
  return {
    toSave: {
      list,
      best,
      average,
      bestAo5,
    },
    chatResponse: {
      text: `(${list}) = ${centiToDisplay(average)} average${
        sub.showSubmitFor ? ` for <@${sub.userId}>` : ""
      }`,
    },
    error: false,
  };
}

function getBestAo5(solves) {
  let currentBestAvg = -1;
  for (let i = 0; i < solves.length - 4; i++) {
    const { average } = calculateAvgStats(solves.slice().splice(i, 5));
    if ((average < currentBestAvg || currentBestAvg < 0) && average > 0) {
      currentBestAvg = average;
    }
  }
  return currentBestAvg;
}

function calculateAvgStats(solves) {
  const filteredSortedSolves = solves
    .slice()
    .sort((a, b) => a - b)
    .filter((item) => item > 0);

  const best = filteredSortedSolves.length === 0 ? -1 : filteredSortedSolves[0];
  const trim = Math.ceil(0.05 * solves.length);
  const isDnfAvg = solves.length - filteredSortedSolves.length > trim;
  const countingSolves = filteredSortedSolves
    .concat(Array(solves.length - filteredSortedSolves.length).fill(-1))
    .splice(trim, solves.length - 1 - trim);

  return {
    average: isDnfAvg
      ? -1
      : Math.round(
          countingSolves.reduce((acc, curr) => acc + curr, 0) /
            countingSolves.length
        ),
    best: best,
  };
}

/**
 * Make result object from info from db
 */
class AoN_Result {
  placing;
  constructor(userId, username, eventId, list, best, average, bestAo5) {
    this.userId = userId;
    this.username = username;
    this.eventId = eventId;
    this.list = list;
    this.best = best;
    this.average = average;
    this.isDnf = best <= 0;
    this.bestAo5 = bestAo5;
  }

  compare(other) {
    if (this.average <= 0 && other.average > 0) {
      return 1; // `this` is worse, so it should come later
    }
    if (this.average > 0 && other.average <= 0) {
      return -1; // `other` is worse, so `this` should come earlier
    }
    // Both values are positive or both are <= 0, so sort normally
    const avgDiff = this.average - other.average;
    if (avgDiff === 0) {
      return this.best - other.best;
    }
    return avgDiff;
  }

  givePlacing(inFront, index) {
    if (inFront.compare(this) < 0) {
      this.placing = index + 1;
    } else {
      this.placing = inFront.placing;
    }
  }

  toViewString() {
    return `Average: **${centiToDisplay(
      this.average
    )}**\nBest: **${centiToDisplay(this.best)}**\n(*${this.list}*)`;
  }

  toCRString() {
    return `#${this.placing} ${this.username} **${centiToDisplay(
      this.average
    )}**`;
  }

  toTxtFileString() {
    return `\n#${this.placing} ${this.username} average: ${centiToDisplay(
      this.average
    )}, best: ${centiToDisplay(this.best)}\n  (${this.list})`;
  }

  toPodiumString() {
    const medals = [":first_place:", ":second_place:", ":third_place:"];
    return `\n${medals[this.placing - 1]} <@${this.userId}> **${centiToDisplay(
      this.average
    )}**\n-# *(${this.list})*`;
  }
}

module.exports = {
  processAoN,
  AoN_Result,
};
