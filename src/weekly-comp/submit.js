const { saveData } = require("../db");
const Submission = require("./Submission");

async function handleSubmit(int) {
  const sub = new Submission(int);

  if (sub.error) {
    await int.reply({ ephemeral: true, content: sub.error });
    return;
  }

  await int.reply({
    ephemeral: sub.showSubmitFor,
    content: sub.response.text,
  });

  await saveData(
    `INSERT INTO results (userId, username, eventId, list, best, average) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(userId, eventId) DO UPDATE SET username = excluded.username, list = excluded.list, best = excluded.best, average = excluded.average`,
    sub.data
  );
}

module.exports = { handleSubmit };
