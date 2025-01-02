const { saveData, readData } = require("../db");
const Submission = require("./Submission");

async function handleSubmit(int) {
  const sub = new Submission(int);

  if (sub.error) {
    await int.reply({ flags: 64, content: sub.error });
    return;
  }

  await int.reply({
    flags: sub.showSubmitFor ? 64 : 0,
    content: sub.response.text,
  });

  await saveData(
    `INSERT INTO results (userId, username, eventId, list, best, average, bestAo5) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(userId, eventId) DO UPDATE SET username = excluded.username, list = excluded.list, best = excluded.best, average = excluded.average, bestAo5=excluded.bestAo5`,
    sub.data
  );
}

module.exports = { handleSubmit };
