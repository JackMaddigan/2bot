require("dotenv").config();

const { Client, IntentsBitField } = require("discord.js");
const { registerCommands } = require("./commands");
const runSummary = require("./bld-summary/bld-summary");
const cron = require("node-cron");
const { readData, saveData } = require("./db");

// Weekly Comp imports
const { eventFormatToProcessAndObj, events } = require("./weekly-comp/events");
const { handleCurrentRankings } = require("./weekly-comp/results");
const handleSubmit = require("./weekly-comp/submit");
const { handleWeeklyComp } = require("./weekly-comp/comp");
const handleView = require("./weekly-comp/view");
const handleUnsubmit = require("./weekly-comp/unsubmit");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.once("ready", async (bot) => {
  console.log(bot.user.username + " is online!");
});

client.on("interactionCreate", async (int) => {
  try {
    switch (int.commandName) {
      case "submit":
        await handleSubmit(int);
        break;
      case "cr":
        await handleCurrentRankings(int);
        break;
      case "view":
        await handleView(int);
        break;
      case "unsubmit":
        await handleUnsubmit(int);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(error);
  }
});

// weekly comp
cron.schedule("0 20 * * 4", async () => {
  console.log("2000 Handling Comp");
  try {
    await handleWeeklyComp(client);
  } catch (error) {
    console.error("Error Handling Comp", error);
  }
});

client.login(process.env.token);
