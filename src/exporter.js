// really need to structure this better

const path = require("path"),
  fs = require("fs"),
  Slack = require("slack");

const createDateTimeFolder = (rootFolder, logger) => {
  const date = new Date();

  // creates YYYY-MM-DD-HH-MM-SS from iso date and strips seconds
  const folder = date
    .toISOString()
    .replace(/[T\:]/g, "-")
    .substr(0, 19);

  const destination = rootFolder + "/" + folder;

  try {
    fs.mkdirSync(destination);
  } catch (err) {
    logger.error("Unable to create date time folder.", { destination });
    throw err;
  }

  return destination;
};

/**
 * get a full path and validate we can write to it - then return that
 */
const getResolvedAndWriteableFolder = (folder, logger) => {
  const resolved = path.resolve(folder);

  try {
    fs.accessSync(resolved, fs.constants.W_OK);
  } catch (err) {
    logger.error("Unable to write to root destination folder.", { resolved });
    throw err;
  }

  return resolved;
};

/**
 * Run the main export:
 *
 * - create the named folder
 */
const exportFunction = (rootFolder, token, logger) => {
  createDateTimeFolder(rootFolder, logger);

  const slack = new Slack({ token });

  slack.api.test({ hello: "world" }, console.log);
};

module.exports = {
  getResolvedAndWriteableFolder,
  export: exportFunction
};
