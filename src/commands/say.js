const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription("Make the bot send a message in a specified channel")
    .addStringOption((option) =>
      option.setName("text").setDescription("The text to say").setRequired(true)
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The channel to say it in")
    ),

  async execute(interaction) {
    let channel = interaction.options.getChannel("channel");

    if (!channel) {
      channel = interaction.channel;
    }

    if (![0, 5, 11, 12].includes(channel.type)) {
      await interaction.reply({
        content: "Invalid channel type.",
        ephemeral: true,
      });
      return;
    }

    const text = interaction.options.getString("text");

    await channel.send(text);

    await interaction.reply({
      content: "Successfully sent message to <#" + channel + ">.",
      ephemeral: true,
    });
    return;
  },
};
