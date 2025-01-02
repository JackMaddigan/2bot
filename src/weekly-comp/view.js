const { events } = require("./events");
const { readData } = require("../db");
const { EmbedBuilder } = require("@discordjs/builders");

async function handleView(int) {
  const data = await readData(`SELECT * FROM results WHERE userId=?`, [
    int.member.id,
  ]);
  const fields = [];
  for (const result of data) {
    fields.push({
      name: events[result.eventId].name,
      value: new events[result.eventId].obj(
        result.userId,
        result.username,
        result.eventId,
        result.list,
        result.best,
        result.average
      ).toViewString(),
      inline: true,
    });
  }
  const embed = new EmbedBuilder()
    .setTitle(`Results for ${int.member.displayName}`)
    .setColor(0x7289dd);

  if (fields.length === 0) {
    embed.setDescription("No results yet!");
  } else {
    embed.addFields(fields);
  }
  await int.reply({ flags: 64, embeds: [embed] });
}

module.exports = { handleView };
