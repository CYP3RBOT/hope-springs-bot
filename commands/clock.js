require("dotenv").config();

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { MongoClient } = require("mongodb");

async function validateUser(interaction) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const col = client.db("server").collection("clock");

    const results = await col.findOne({
      userId: interaction.user.id.toString(),
    });
    return results;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function getOTC() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const col = client.db("server").collection("clock");
    const results = await col.find({}).toArray();

    return results;
  } catch (e) {
    console.error(e);
    throw e; // Rethrow the error to handle it elsewhere, if needed.
  } finally {
    await client.close();
  }
}

async function addUserToClock(interaction, date) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const col = client.db("server").collection("clock");

    const results = await col.insertOne({
      userId: interaction.user.id.toString(),
      clockedIn: date,
    });

    return results;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function removeUserFromClock(interaction) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const col = client.db("server").collection("clock");

    const results = await col.deleteOne({
      userId: interaction.user.id.toString(),
    });

    return results;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function logClockIn(interaction, date) {
  const logInEmbed = new EmbedBuilder()
    .setTitle("Clock In")
    .setDescription(
      `
      ${interaction.member} (${interaction.user.username}) has clocked in.
      
      Start: <t:${Math.floor(date / 1000)}:t> (<t:${Math.floor(date / 1000)}:D>)
      `
    )
    .setThumbnail(interaction.user.displayAvatarURL())
    .setColor(0xa9dfbf)
    .setTimestamp()
    .setFooter({
      text: interaction.user.id,
      iconURL: interaction.user.displayAvatarURL(),
    });

  const logChannel = await interaction.guild.channels.fetch(
    process.env.CLOCK_LOGS
  );

  if (logChannel) {
    await logChannel.send({
      embeds: [logInEmbed],
    });
  }
}

async function logClockOut(interaction, date, date2) {
  const logInEmbed = new EmbedBuilder()
    .setTitle("Clock Out")
    .setDescription(
      `
        ${interaction.member} (${interaction.user.username}) has clocked out.
        
        Start: <t:${Math.floor(date / 1000)}:t> (<t:${Math.floor(
        date / 1000
      )}:D>)
        End: <t:${Math.floor(date2 / 1000)}:t> (<t:${Math.floor(
        date2 / 1000
      )}:D>)
        `
    )
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp()
    .setColor(0xdfa9a9)
    .setFooter({
      text: interaction.user.id,
      iconURL: interaction.user.displayAvatarURL(),
    });

  const logChannel = await interaction.guild.channels.fetch(
    process.env.CLOCK_LOGS
  );

  if (logChannel) {
    await logChannel.send({
      embeds: [logInEmbed],
    });
  }
}

async function logShifts(interaction, clockedIn, clockedOut) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const col = client.db("server").collection("shifts");

    const results = await col.insertOne({
      userId: interaction.user.id.toString(),
      clockedIn: clockedIn,
      clockedOut: clockedOut,
    });

    return results;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function clockInSubcommand(interaction) {
  const validation = await validateUser(interaction);

  if (validation) {
    await interaction.editReply({
      content: "You're already clocked in!",
      ephemeral: true,
    });
    return;
  }

  const clockIn = Date.now();
  const results = await addUserToClock(interaction, clockIn);
  await interaction.member.roles.add(process.env.ON_THE_CLOCK_ROLE);
  await logClockIn(interaction, clockIn);

  if (results.acknowledged) {
    await interaction.editReply({
      content: "Successfully clocked in!",
      ephemeral: true,
    });

    setTimeout(async () => {
      await interaction.member.roles.remove(process.env.ON_THE_CLOCK_ROLE);
      await interaction.member.send(
        "You have been automatically clocked out after `" +
          process.env.ON_THE_CLOCK_MINUTES +
          "` minutes."
      );
      await removeUserFromClock(interaction);
      const clockOut = Date.now();
      await logClockOut(interaction, clockIn, clockOut);
      await logShifts(interaction, clockIn, clockOut);
    }, Number(process.env.ON_THE_CLOCK_MINUTES) * 60 * 1000);
  }
}

async function clockOutSubcommand(interaction) {
  const validation = await validateUser(interaction);

  if (!validation) {
    await interaction.editReply({
      content: "You're not clocked in!",
      ephemeral: true,
    });
    return;
  }

  const results = await removeUserFromClock(interaction);
  await interaction.member.roles.remove(process.env.ON_THE_CLOCK_ROLE);
  const clockOut = Date.now();
  await logClockOut(interaction, validation.clockedIn, clockOut);
  await logShifts(interaction, validation.clockedIn, clockOut);

  if (results.acknowledged) {
    await interaction.editReply({
      content: "Successfully clocked out!",
      ephemeral: true,
    });
  }
}

async function onTheClockSubcommand(interaction) {
  const onTheClockCounselors = await getOTC();

  if (onTheClockCounselors.length === 0) {
    await interaction.editReply({
      content: "There are no clocked in counselors!",
      ephemeral: true,
    });
    return;
  }

  let counselorStrings = [];
  for (const c of onTheClockCounselors) {
    const counselor = await interaction.guild.members.fetch(c.userId);
    counselorStrings.push(
      `<@${c.userId}> (${counselor.user.username}) *@* <t:${Math.floor(
        c.clockedIn / 1000
      )}:t> (<t:${Math.floor(c.clockedIn / 1000)}:D>)`
    );
  }

  await interaction.editReply({
    content: counselorStrings.join("\n"),
    ephemeral: true,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clock")
    .setDescription("Manage the clock")
    .addSubcommand((subcommand) =>
      subcommand.setName("in").setDescription("Clock in")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("out").setDescription("Clock out")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("otc")
        .setDescription("View the current counselors on the clock")
    ),
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(process.env.COUNSELOR_ROLE)) {
      await interaction.editReply({
        content: "You do not have permission to use this command!",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const commandRan = interaction.options._subcommand;
    if (commandRan === "in") {
      await clockInSubcommand(interaction);
    } else if (commandRan === "out") {
      await clockOutSubcommand(interaction);
    } else if (commandRan === "otc") {
      await onTheClockSubcommand(interaction);
    }
  },
};
