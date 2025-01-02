const { events, eventShortNameToId } = require("./events");
const { PermissionsBitField } = require("discord.js");

/**
  event, eventId, username, userId, showSubmitFor, error, data, response;
  response has two nodes: text, react. react is the emoji to react with pre formatted. Text is the reply to the submission.
  event is the child of the eventId from events.js
 */
class Submission {
  event;
  eventId;
  username;
  userId;
  showSubmitFor;
  error;
  data;
  response;
  ephemeral = false;

  constructor(int) {
    this.eventId = eventShortNameToId[int.options.getSubcommand()];
    this.addUserInfo(int);
    this.addResultInfo(int);
  }

  addUserInfo(int) {
    const isMod = int.member.permissions.has(
      PermissionsBitField.Flags.KickMembers
    );
    const submitForMember = int.options.getMember("submit-for");
    const member = isMod && submitForMember ? submitForMember : int.member;
    this.username = member.displayName;
    this.userId = member.id;
    this.showSubmitFor = isMod && submitForMember;
  }

  addResultInfo(int) {
    const resultText = int.options.getString("results");
    this.event = events[this.eventId];
    if (!this.event.process) {
      this.error = "This event doesn't exist?";
      return;
    }
    const processed = this.event.process(resultText, this);
    console.log(processed);
    this.error = processed.error;
    if (this.error) return;
    this.data = [
      this.userId,
      this.username,
      this.eventId,
      ...Object.values(processed.toSave),
    ];
    this.response = processed.chatResponse;
    this.bestAo5 = processed.bestAo5;
  }
}

module.exports = Submission;
