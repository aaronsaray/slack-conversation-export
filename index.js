#!/usr/bin/env node

/**
 * The CLI sets up all the options properly and validates information.  We expect byt he time it hits
 * SlackConversationExport that everything is good to go
 */

const path = require("path"),
  fs = require("fs"),
  winston = require("winston"),
  SlackConversationExport = require("./src/slack-conversation-export");

const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
      handleExceptions: true
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

// resolve and test access
const rootDestination = path.resolve(options.destination);
logger.debug("Testing access to write to filesystem", { rootDestination });
fs.accessSync(rootDestination, fs.constants.W_OK);

const exporter = new SlackConversationExport(
  logger,
  options.token,
  rootDestination
);
exporter.export();
