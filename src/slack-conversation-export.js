const path = require("path"),
  fs = require("fs"),
  Slack = require("slack"),
  JSONStream = require("JSONStream");

class SlackConversationExport {
  constructor(logger, token, rootDestination) {
    this.logger = logger;
    this.slack = new Slack({ token });
    this.rootDestination = rootDestination;
  }

  export() {
    this.logger.info("Begin export");

    this.createDateTimeFolder()
      .then(destination => {
        return this.exportUsers(destination);
      })
      .then(() => {
        this.logger.info("Export finished.");
      });
  }

  exportUsers(destination) {
    this.logger.info("Begin user export.");

    const userFile = destination + "/users.json";
    const jsonwriter = JSONStream.stringify("[", ",", "]");
    const writeStream = fs.createWriteStream(userFile);
    jsonwriter.pipe(writeStream);

    let page = 0;

    const pager = nextCursor => {
      return new Promise(resolve => {
        page++;
        this.logger.info("Retrieving users page " + page, { nextCursor });

        this.slack.users
          .list({
            limit: 2,
            cursor: nextCursor
          })
          .then(results => {
            results.members.forEach(member => {
              jsonwriter.write(member);
            });

            if (results.response_metadata.next_cursor) {
              return resolve(pager(results.response_metadata.next_cursor));
            } else {
              jsonwriter.end();
              writeStream.end();
            }
            resolve();
          });
      });
    };

    return pager();
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

      this.logger.info("Created folder " + destination);

      resolve(destination);
    });
  }
}

module.exports = SlackConversationExport;
