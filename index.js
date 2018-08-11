#!/usr/bin/env node

const SlackConversationExport = require("./src/slack-conversation-export"),
  winston = require("winston");

// temporary configuration of logger, should be more robust
const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const options = require("yargs")
  .usage("$0 <cmd> [args]")
  .option("t", {
    alias: "token",
    demand: true,
    describe:
      "Your API Token (https://api.slack.com/custom-integrations/legacy-tokens)",
    type: "string"
  })
  .option("d", {
    alias: "destination",
    demand: true,
    describe: "The source destination for the date-time named folder."
  })
  .help().argv;

const exporter = new SlackConversationExport(
  options.token,
  options.destination,
  logger
);

exporter.export();
