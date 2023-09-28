require("dotenv").config();

const { EmbedBuilder } = require("@discordjs/builders");
const {
  ActionRowBuilder,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

async function createSession(interaction, desc, category) {
  const preExistingChannel = interaction.guild.channels.cache.find(
    (channel) => channel.topic === interaction.user.id.toString()
  );

  if (preExistingChannel !== undefined) {
    await interaction.reply({
      content: "You already have a pre-existing session!",
      ephemeral: true,
    });
    return;
  }

  let cat;

  if (category === "quick") {
    cat = process.env.QUICK_CHECKUP_CATEGORY;
  } else if (category === "longer") {
    cat = process.env.LONGER_SESSION_CATEGORY;
  } else if (category === "intense") {
    cat = process.env.INTENSE_COUNCILING_CATEGORY;
  }

  await interaction.reply({
    content: "Creating a session!",
    ephemeral: true,
  });

  const sessionChannel = await interaction.guild.channels.create({
    name: interaction.user.username,
    type: 0,
    topic: interaction.user.id.toString(),
    parent: cat,
    reason: "Session created by " + interaction.user.id.toString(),
  });

  await sessionChannel.permissionOverwrites
    .edit(interaction.user.id, {
      ViewChannel: true,
    })
    .catch(console.error());

  const msg = await sessionChannel.send({
    content: `<@&${
      process.env.COUNSELOR_ROLE
    }> <@${interaction.user.id.toString()}>`,
    embeds: [
      new EmbedBuilder()
        .setTitle("Session Created")
        .setDescription("A new session was just created!")
        .addFields({ name: "Prompt", value: desc })
        .setTimestamp()
        .setFooter({
          text: interaction.user.id,
          iconURL: interaction.user.displayAvatarURL(),
        }),
    ],
  });
  msg.pin();
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
      }
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.split(" - ")[0] === "sessionPrompt") {
        const desc = interaction.fields.getTextInputValue("promptDescription");

        await createSession(
          interaction,
          desc,
          interaction.customId.split(" - ")[1]
        );
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "sessionType") {
        const modal = new ModalBuilder()
          .setCustomId("sessionPrompt - " + interaction.values[0])
          .setTitle("Pre-Session Prompt");

        const promptDescription = new TextInputBuilder()
          .setCustomId("promptDescription")
          .setLabel("Please describe your situation")
          .setStyle(TextInputStyle.Paragraph);

        const firstActionRow = new ActionRowBuilder().addComponents(
          promptDescription
        );

        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
      }
    }
  },
};
