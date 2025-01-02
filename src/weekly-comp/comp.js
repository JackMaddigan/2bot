const { saveData, readData, deleteData } = require("../db");
const { centiToDisplay } = require("../helpers/converters");
const { events } = require("./events");
const { generateRankedResults } = require("./results");
const cstimer = require("cstimer_module");
const fs = require("fs");
const sharp = require("sharp");

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

    if (events[eventId].showBestSingle) {
      results.sort((a, b) => a.best - b.best);
      text += `\n\nBest single: ${centiToDisplay(results[0].best)} by <@${
        results[0].userId
      }>`;
    }

    if (events[eventId].showBestAo5) {
      results.sort((a, b) => a.bestAo5 - b.bestAo5);
      text += `\nBest Ao5: ${centiToDisplay(results[0].bestAo5)} by <@${
        results[0].userId
      }>`;
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

  const images = [];

  for (const eventId of Object.keys(events)) {
    const event = events[eventId];
    if (!event.scr) continue;
    let text = `-\n**${event.name}**`;
    const scrambles = [];
    for (let i = 0; i < event.attempts; i++) {
      const scramble = cstimer.getScramble(event.scr[0], event.scr[1]);
      const img = cstimer.getImage(scramble, "222");
      scrambles.push({ scramble, img });
    }
    // Create the combined SVG
    const combinedSVG = generateCombinedSVG(scrambles, event.name);

    // Convert SVG to PNG
    const buffer = await sharp(Buffer.from(combinedSVG)).png().toBuffer();
    images.push({ attachment: buffer, name: "scrambles.png" });
  }
  await scramblesChannel.send({
    files: images,
  });
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

function generateCombinedSVG(scrambles, title) {
  const rowHeight = 240;
  const topBotPadding = 200;
  const leftPadding = 100;
  const totalWidth = 2000;
  const midLine = rowHeight / 2;
  const svgRows = scrambles.map((item, index) => {
    const yOffset = index * rowHeight + topBotPadding;
    return `
        <!-- Outer -->
        <g transform="translate(${leftPadding}, ${yOffset})">

            <!-- Make box around scramble number -->
            <rect x="0" y="0" width="${leftPadding}" height="${rowHeight}" fill="none" stroke="black" stroke-width="2" />

            <!-- Full Row Box -->
            <rect x="0" y="0" width="${
              totalWidth - 2 * leftPadding
            }" height="${rowHeight}" fill="none" stroke="black" stroke-width="2" />

            <!-- Grey scramble box -->
            <rect x="${
              totalWidth - 2 * leftPadding - 300
            }" y="0" width="${300}" height="${rowHeight}" fill="#c8c4c4" stroke="black" stroke-width="2" />

            <!-- Scramble Number -->
<text x="${leftPadding / 2}" y="${
      midLine + 16
    }" font-family="monospace" font-size="48" fill="black" text-anchor="middle">
  ${index + 1}
</text>

          <text x="140" y="${
            midLine + 16
          }" font-family="monospace" font-size="64" fill="black">${
      item.scramble
    }</text>

          <g transform="translate(1515, 20)">${item.img}</g>
        </g>
      `;
  });

  const totalHeight = scrambles.length * rowHeight + 2 * topBotPadding;
  return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">
      <rect width="100%" height="100%" fill="white" />
      <text  x="${totalWidth / 2}" y="${
    (topBotPadding / 3) * 2
  }" font-family="monospace" font-size="72" fill="black" text-anchor="middle" alignment-baseline="middle">${title}</text>

        ${svgRows.join("\n")}
      </svg>
    `;
}

module.exports = { handleWeeklyComp };
