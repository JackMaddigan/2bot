const { saveData, readData, deleteData } = require("../db");
const { events } = require("./events");
const { generateRankedResults } = require("./results");
const cstimer = require("cstimer_module");
const fs = require("fs");

async function sendPodiums(resultsChannel, rankedResultsData, title) {
  // make podium text
  await resultsChannel.send(title);
  for (const eventId in rankedResultsData) {
    const results = rankedResultsData[eventId];
    // no results or first one is dnf
    if (results.length == 0 || results[0]?.isDnf) continue;
    let text = `**${events[eventId].name}**`;
    for (const result of results) {
      // only include podium places
      if (result.placing > 3 || result.isDnf) break;
      text += result.toPodiumString();
    }
    await resultsChannel.send(text);
  }
}

async function sendResultsFile(resultsChannel, rankedResultsData) {
  // make results file
  let text = "";
  for (const eventId in rankedResultsData) {
    const results = rankedResultsData[eventId];
    if (results.length == 0) continue;
    text += `${events[eventId].name}\n`;
    for (const result of results) {
      text += result.toTxtFileString();
    }
    text += "\n\n";
  }
  text = text.trim();
  fs.writeFile("results.txt", text || "No Results", function (err) {
    if (err) throw err;
  });
  await resultsChannel.send({ files: ["results.txt"] });
}

async function sendScrambles(client, week) {
  // get event ids excluding extra event
  const scramblesChannel = client.channels.cache.get(
    process.env.scramblesChannelId
  );

  await scramblesChannel.send(
    `<@&${process.env.weeklyCompRoleId}> Week ${week} Scrambles!`
  );

  for (const eventId of Object.keys(events)) {
    const event = events[eventId];
    if (!event.scr) continue;
    let text = `-\n**${event.name}**`;
    for (let i = 0; i < event.attempts; i++) {
      text += `\n> ${i + 1}) ${cstimer.getScramble(
        event.scr[0],
        event.scr[1]
      )}`;
    }
    await scramblesChannel.send(text);
  }
}

async function handleWeeklyComp(client) {
  let week = await getWeek();
  const resultsChannel = client.channels.cache.get(
    process.env.podiumsChannelId
  );
  const rankedResultsData = await generateRankedResults();
  const thereIsResults = Object.values(rankedResultsData).some(
    (value) => value.length > 0
  );
  if (thereIsResults) {
    const podiumsTitle = `Week ${week} results!`;
    await sendPodiums(resultsChannel, rankedResultsData, podiumsTitle);
    await sendResultsFile(resultsChannel, rankedResultsData);
  }
  await deleteData(`DELETE FROM results`, []);
  week++;
  const submitChannel = client.channels.cache.get(process.env.submitChannelId);
  await submitChannel.send(`## Week ${week}`);
  await sendScrambles(client, week);
  await saveData(
    `INSERT INTO key_value_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    ["week", week]
  );
}

async function getWeek() {
  const weekData = await readData(
    `SELECT value FROM key_value_store WHERE key=?`,
    ["week"]
  );
  let week = 90; // set as default week
  if (weekData.length > 0) week = weekData[0].value;
  return week;
}

module.exports = { handleWeeklyComp };
