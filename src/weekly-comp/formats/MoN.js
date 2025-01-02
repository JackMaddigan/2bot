const { toCenti, centiToDisplay } = require("../../helpers/converters");

function processMoN(resultText, sub) {
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
  return {
    toSave: {
      list,
      best,
      average,
      bestAo5: null,
    },
    chatResponse: {
      text: `(${list}) = ${centiToDisplay(average)} average${
        sub.showSubmitFor ? ` for <@${sub.userId}>` : ""
      }`,
    },
    error: false,
  };
}

function calculateAvgStats(solves) {
  const filteredSortedSolves = solves
    .slice()
    .sort((a, b) => a - b)
    .filter((item) => item > 0);

  const best = filteredSortedSolves.length === 0 ? -1 : filteredSortedSolves[0];
  const isDnfAvg = solves.length !== filteredSortedSolves.length;

  return {
    average: isDnfAvg
      ? -1
      : Math.round(solves.reduce((acc, curr) => acc + curr, 0) / solves.length),
    best: best,
  };
}

/**
 * Make result object from info from db
 */
class MoN_Result {
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
    if (this.average <= 0 && other.average > 0) return 1; // `this` is worse, so it should come later
    if (this.average > 0 && other.average <= 0) return -1; // `other` is worse, so `this` should come earlier

    // Both values are positive or both are <= 0, so sort normally
    const avgDiff = this.average - other.average;
    if (avgDiff === 0) {
      if (this.best <= 0 && other.best > 0) return 1;
      if (this.best > 0 && other.best <= 0) return -1;
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
  processMoN,
  MoN_Result,
};
