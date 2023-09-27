require("dotenv").config();

const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require("discord.js");

async function sendSessionLog(interaction, sessionChannel) {
  const fs = require("fs");

  // Get all messages in the channel
  sessionChannel.messages
    .fetch({ limit: 100 })
    .then(async (messages) => {
      // Format the messages
      const formattedMessages = messages
        .map((m) => `${m.author.tag} (${m.createdAt}): ${m.content}`)
        .join("\n");

      const loggingChannel = interaction.guild.channels.cache.get(
        process.env.TRANSCRIPT_CHANNEL
      );
      // Save the messages to a file
      fs.writeFile(
        "./session_transcripts/" + interaction.user.id.toString() + ".txt",
        formattedMessages,
        async (err) => {
          if (err) {
            console.error(err);

            if (loggingChannel) {
              await loggingChannel.send(
                `A transcript has failed to be saved. The session was created by ${interaction.member} (${interaction.user.tag}) on ${interaction.createdAt}.`
              );
            }

            return;
          }

          await interaction.reply({
            content: "Closing session...",
            ephemeral: true,
          });
        }
      );

      const attachment = new AttachmentBuilder(
        "./session_transcripts/" + interaction.user.id.toString() + ".txt"
      );
      const timestamp = Math.floor(interaction.createdAt.getTime() / 1000);

      await loggingChannel
        .send({
          embeds: [
            new EmbedBuilder()
              .setTitle("Session")
              .setDescription("A session has been closed.")
              .addFields(
                {
                  name: "Created By",
                  value:
                    `<@${interaction.user.id}>` + ` (${interaction.user.tag})`,
                },
                {
                  name: "Closed",
                  value: `<t:${timestamp}:R>`,
                }
              ),
          ],
          files: [attachment],
        })
        .then(() => {
          // If the message is sent successfully, delete the file
          fs.unlinkSync(
            "./session_transcripts/" + interaction.user.id.toString() + ".txt"
          );
        })
        .catch(console.error);
    })
    .catch(console.error);

  await sessionChannel.delete();
}

async function closeSession(interaction) {
  const preExistingChannel = interaction.guild.channels.cache.find(
    (channel) => channel.topic === interaction.user.id.toString()
  );
  const preExistingVC = interaction.guild.channels.cache.find(
    (channel) => channel.name.split(" - ")[1] === interaction.user.id.toString()
  );

  if (preExistingChannel === undefined) {
    await interaction.reply({
      content: "You don't have an open session!",
      ephemeral: true,
    });
    return;
  }

  await sendSessionLog(interaction, preExistingChannel);
  if (preExistingVC) {
    await preExistingVC.delete();
  }
}

async function createVC(interaction) {
  const preExistingChannel = interaction.guild.channels.cache.find(
    (channel) => channel.topic === interaction.user.id.toString()
  );
  const preExistingVC = interaction.guild.channels.cache.find(
    (channel) => channel.name.split(" - ")[1] === interaction.user.id.toString()
  );

  if (preExistingChannel) {
    if (preExistingVC === undefined) {
      const sessionVC = await interaction.guild.channels.create({
        name:
          interaction.user.username + " - " + interaction.user.id.toString(),
        type: 2,
        parent: preExistingChannel.parentId,
        reason: "Session created by " + interaction.user.id.toString(),
      });

      await sessionVC.permissionOverwrites
        .edit(interaction.user.id, {
          ViewChannel: true,
        })
        .catch(console.error());

      await interaction.reply({
        content: "A vc has been created!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There is already a pre-existing vc!",
        ephemeral: true,
      });
      return;
    }
  } else {
    await interaction.reply({
      content: "You must open a session to create a vc!",
      ephemeral: true,
    });
    return;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("session")
    .setDescription("Create a session interaction")
    .addSubcommand((subcommand) =>
      subcommand.setName("create").setDescription("Create a new session")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("close")
        .setDescription("Close an already existing session")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("vc").setDescription("Create a vc for your session")
    ),
  async execute(interaction) {
    const commandRan = interaction.options._subcommand;
    if (commandRan === "create") {
      const embed = new EmbedBuilder()
        .setTitle("Session Creation")
        .setDescription(
          `Hey ${interaction.member}. Thank you for reaching out. Please select one of the options below.`
        );

      const select = new StringSelectMenuBuilder()
        .setCustomId("sessionType")
        .setPlaceholder("Please select the session type you'd like")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("🟢 Quick Checkup")
            .setDescription("Have a quick chat with a counselor")
            .setValue("quick"),
          new StringSelectMenuOptionBuilder()
            .setLabel("🟡 Longer Discussion")
            .setDescription("Have a longer discussion with a counselor")
            .setValue("longer"),
          new StringSelectMenuOptionBuilder()
            .setLabel("🔴 Intense Counseling")
            .setDescription("Have an intense counseling session")
            .setValue("intense")
        );
      const row = new ActionRowBuilder().addComponents(select);
      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      });
    } else if (commandRan === "close") {
      await closeSession(interaction);
    } else {
      await createVC(interaction);
    }
  },
};
