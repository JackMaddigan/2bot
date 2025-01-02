const { deleteData } = require("../db");
const { PermissionsBitField } = require("discord.js");

async function handleUnsubmit(int) {
  const isMod = int.member.permissions.has(
    PermissionsBitField.Flags.KickMembers
  );
  if (!isMod) {
    await int.reply({ ephemeral: true, content: "Missing permission!" });
    return;
  }
  const user = int.options.getUser("user");
  if (!user) return;
  const eventId = int.options.getString("event");

  await deleteData(`DELETE FROM results WHERE userId=? AND eventId=?`, [
    user.id,
    eventId,
  ]);
  await int.reply({ ephemeral: true, content: "Removed successfully!" });
}

module.exports = { handleUnsubmit };
