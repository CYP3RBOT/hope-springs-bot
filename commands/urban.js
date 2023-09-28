require("dotenv").config();

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("urban")
    .setDescription("Get a definition from the urban dictionary")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("The urban dictionary query")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString("query");

    let config = {
      method: "get",
      mostBodyLength: Infinity,
      url:
        "https://mashape-community-urban-dictionary.p.rapidapi.com/define?term=" +
        query.replaceAll(" ", "-"),
      headers: {
        "X-RapidAPI-Key": process.env.URBAN_RAPID_API_KEY,
        "X-RapidAPI-Host": "mashape-community-urban-dictionary.p.rapidapi.com",
      },
    };

    const responseObject = await axios
      .request(config)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.log(error);
      });

    let mostLikes = -Infinity;
    let objectWithMostLikes = null;

    try {
      for (const obj of responseObject.list) {
        if (obj.thumbs_down > mostLikes) {
          mostLikes = obj.thumbs_down;
          objectWithMostLikes = obj;
        }
      }

      const newDate = new Date(objectWithMostLikes.written_on);
      const written = Math.floor(newDate.getTime() / 1000);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: objectWithMostLikes.author,
          url:
            "https://www.urbandictionary.com/author.php?author=" +
            objectWithMostLikes.author,
          iconURL:
            "https://images.crunchbase.com/image/upload/c_lpad,f_auto,q_auto:eco,dpr_1/u8zidc2jnlhz3n1dcbrr",
        })
        .setTitle(objectWithMostLikes.word)
        .setDescription("```" + objectWithMostLikes.definition + "```")
        .setColor(0x4b7ba1)
        .addFields(
          {
            name: "Example",
            value: "```" + objectWithMostLikes.example + "```",
          },
          {
            name: "Thumbs Up",
            value: "`" + objectWithMostLikes.thumbs_up + "`",
            inline: true,
          },
          {
            name: "Written On",
            value: `<t:${written}:d>`,
            inline: true,
          }
        );

      await interaction.editReply({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("Word Page")
              .setURL(objectWithMostLikes.permalink)
              .setStyle(ButtonStyle.Link)
          ),
        ],
      });
    } catch (e) {
      await interaction.editReply(
        "An error occured. Please make sure you're using valid spelling of the word!"
      );
    }
  },
};
