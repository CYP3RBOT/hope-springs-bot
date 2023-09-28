const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("coin-flip")
    .setDescription("Flip a coin"),
  async execute(interaction) {
    const choice = Math.floor(Math.random() * 10) % 2;

    if (choice) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Coin Flip")
            .setDescription("I choose... heads!")
            .setImage(
              "https://cdn.discordapp.com/attachments/1149808421672067133/1156758991351849002/Untitled2-removebg-preview.png?ex=65162343&is=6514d1c3&hm=04e31fd8ac32146c30c929fc9c2521b2631e5f854607f0e3a0ad94c3a20932ce&"
            )
            .setTimestamp()
            .setFooter({
              text: interaction.user.username,
              iconURL: interaction.user.displayAvatarURL(),
            }),
        ],
      });
    } else {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Coin Flip")
            .setDescription("I choose... tails!")
            .setImage(
              "https://cdn.discordapp.com/attachments/1149808421672067133/1156758991049867264/Untitled-removebg-preview.png?ex=65162343&is=6514d1c3&hm=2ab4e95dcf33ea89a9b77f1fb6602241a98a7cd88f346e6da176c35625056afe&"
            )
            .setTimestamp()
            .setFooter({
              text: interaction.user.username,
              iconURL: interaction.user.displayAvatarURL(),
            }),
        ],
      });
    }
  },
};
