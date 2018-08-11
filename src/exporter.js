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
  const destinationFolder = createDateTimeFolder(rootFolder, logger);

  const slack = new Slack({ token });

  const userFile = destinationFolder + "/users.json";
  const writeStream = fs.createWriteStream(userFile);

  const page = nextCursor => {
    return new Promise(resolve => {
      slack.users
        .list({
          limit: 2,
          cursor: nextCursor
        })
        .then(results => {
          results.members.forEach(member => {
            writeStream.write(JSON.stringify(member) + ",");
          });

          if (results.response_metadata.next_cursor) {
            return resolve(page(results.response_metadata.next_cursor));
          } else {
            writeStream.end();
          }
          resolve();
        });
    });
  };

  page().then(() => {
    console.log("final then");
  });
};

module.exports = {
  getResolvedAndWriteableFolder,
  export: exportFunction
};
