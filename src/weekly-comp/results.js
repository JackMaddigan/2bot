const { events } = require("./events");
const { readData } = require("../db");
const { EmbedBuilder } = require("discord.js");

async function generateRankedResults() {
  const allResults = await readData(`SELECT * FROM results`);
  // make key value object with all event ids from the event-info file
  const eventResults = {};
  Object.keys(events).forEach((key) => (eventResults[key] = []));

  // add all the results as new result objects to their corresponding arrays
  for (const result of allResults) {
    const resultConstructor = events[result.eventId].obj;
    // skip if it is an extra event result when there is no valid extra event, although this shouldn't happen
    if (resultConstructor == null) continue;
    eventResults[result.eventId].push(
      new resultConstructor(
        result.userId,
        result.username,
        result.eventId,
        result.list,
        result.best,
        result.average
      )
    );
  }

  // sort and give places
  for (const eventId in eventResults) {
    eventResults[eventId].sort((a, b) => a.compare(b));
    for (let i = 0; i < eventResults[eventId].length; i++) {
      if (i == 0) {
        eventResults[eventId][i].placing = 1;
        continue;
      }
      eventResults[eventId][i].givePlacing(eventResults[eventId][i - 1], i);
    }
  }
  return eventResults;
}

async function handleCurrentRankings(int) {
  const rankedResults = await generateRankedResults();
  let text = "";
  for (const [eventId, eventResults] of Object.entries(rankedResults)) {
    if (eventResults.length === 0) continue;
    text += `**${events[eventId].name}**`;
    for (const eventResult of eventResults) {
      text += `\n${eventResult.toCRString()}`;
    }
    text += "\n";
  }
  const embed = new EmbedBuilder()
    .setTitle("Current Weekly Comp Rankings")
    .setDescription(text.length === 0 ? "No results yet!" : text)
    .setColor(0x7289dd);
  await int.reply({ ephemeral: true, embeds: [embed] });
}

module.exports = { handleCurrentRankings, generateRankedResults };
