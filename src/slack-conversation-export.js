const fs = require("fs"),
  Slack = require("slack"),
  JSONStream = require("JSONStream");

/**
 * Main Class
 */
class SlackConversationExport {
  constructor(logger, token, rootDestination) {
    this.logger = logger;
    this.slack = new Slack({ token });
    this.rootDestination = rootDestination;
    this.exportUsers = this.exportUsers.bind(this);
  }

  export() {
    this.logger.info("Begin export");

    this.createDateTimeFolder()
      .then(this.exportUsers)
      .then(() => {
        this.logger.info("End export");
      });
  }

  exportUsers(destination) {
    const userFile = destination + "/users.json";
    this.logger.info("Begin user export to " + userFile);

    const jsonwriter = JSONStream.stringify("[", ",", "]");
    const writeStream = fs.createWriteStream(userFile);
    jsonwriter.pipe(writeStream);

    let page = 0;

    const pager = nextCursor => {
      page++;
      this.logger.debug("Retrieving users page " + page, { nextCursor });

      return this.slack.users
        .list({ limit: 2, cursor: nextCursor })
        .then(results => {
          results.members.forEach(member => {
            jsonwriter.write(member);
          });

          if (results.response_metadata.next_cursor) {
            return pager(results.response_metadata.next_cursor);
          }
        });
    };

    return pager().then(() => {
      this.logger.debug("Closing streams.");
      jsonwriter.end();
      writeStream.end();
      this.logger.info("Finished retrieving users.");
    });
  }

  createDateTimeFolder() {
    return new Promise(resolve => {
      const date = new Date();

      // creates YYYY-MM-DD-HH-MM-SS from iso date and strips seconds
      const folder = date
        .toISOString()
        .replace(/[T\:]/g, "-")
        .substr(0, 19);

      const destination = this.rootDestination + "/" + folder;
      fs.mkdirSync(destination);

      this.logger.debug("Created folder " + destination);

      resolve(destination);
    });
  }
}

/**
 * Define the public interface
 *
 * Is this ok? It works for me currently... probably cuz this app is so simple.
 */

let publicSlackConversationExport;

class PublicSlackConversationExport {
  constructor(logger, token, rootDestination) {
    publicSlackConversationExport = new SlackConversationExport(
      logger,
      token,
      rootDestination
    );
  }

  export() {
    publicSlackConversationExport.export();
  }
}

module.exports = PublicSlackConversationExport;
