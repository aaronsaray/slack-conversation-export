const fs = require("fs"),
  Slack = require("slack"),
  JSONStream = require("JSONStream"),
  Bottleneck = require("bottleneck"),
  archiver = require("archiver"),
  del = require("del");

/**
 * Main Class
 */
class SlackConversationExport {
  constructor(logger, token, rootDestination) {
    this.logger = logger;
    this.slack = new Slack({ token });
    this.rootDestination = rootDestination;
    this.exportUsers = this.exportUsers.bind(this);
    this.exportConversations = this.exportConversations.bind(this);
  }

  export() {
    this.logger.info("Begin export");

    this.createDateTimeFolder()
      .then(destination => {
        return Promise.all([
          this.exportUsers(destination),
          this.exportConversations(destination)
        ]);
      })
      .then(([destination]) => {
        return this.zip(destination);
      })
      .then(folder => del(folder))
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

    // 20+ / minute  60,000 / 20 = 3000 (3 secs), making 4 seconds just to be safe (4000)
    const tier2MethodLimiterForUsersList = new Bottleneck({
      maxConcurrent: 1,
      minTime: 4000
    });

    const pager = nextCursor => {
      page++;
      this.logger.debug("Retrieving users page " + page, { nextCursor });

      return tier2MethodLimiterForUsersList
        .schedule(this.slack.users.list, { limit: 100, cursor: nextCursor })
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
      this.logger.debug("Closing user streams.");
      jsonwriter.end();
      this.logger.info("Finished retrieving users.");
      return destination;
    });
  }

  exportConversations(destination) {
    const userFile = destination + "/conversations.json";
    this.logger.info("Begin user export to " + userFile);

    const jsonwriter = JSONStream.stringify("[", ",", "]");
    const writeStream = fs.createWriteStream(userFile);
    jsonwriter.pipe(writeStream);

    let page = 0;

    // 20+ / minute  60,000 / 20 = 3000 (3 secs), making 4 seconds just to be safe (4000)
    const tier2MethodLimiterForConversationsList = new Bottleneck({
      maxConcurrent: 1,
      minTime: 4000
    });

    // 50+ / minute  60,000 / 20 = 1200 (1.2 secs), to make it safe, making it 2 seconds (2000)
    // note we have to have this outside of the individual method because otherwise it'll just create copies of itself
    const tier3MethodLimiterForConversationHistory = new Bottleneck({
      maxConcurrent: 1,
      minTime: 2000
    });

    const pager = nextCursor => {
      page++;
      this.logger.debug("Retrieving conversations page " + page, {
        nextCursor
      });

      return tier2MethodLimiterForConversationsList
        .schedule(this.slack.conversations.list, {
          limit: 100,
          cursor: nextCursor,
          exclude_archived: false,
          types: "public_channel,private_channel,mpim,im"
        })
        .then(results => {
          let childPromises = [];

          results.channels.forEach(channel => {
            jsonwriter.write(channel);

            childPromises.push(
              this.exportIndividualConversation(
                channel,
                destination,
                tier3MethodLimiterForConversationHistory
              )
            );
          });

          if (results.response_metadata.next_cursor) {
            return pager(results.response_metadata.next_cursor);
          }

          // the last time through it needs to wait on all the children, not a recursive call of itself
          return Promise.all(childPromises);
        });
    };

    return pager().then(() => {
      this.logger.debug("Closing conversations streams.");
      jsonwriter.end();
      this.logger.info("Finished retrieving conversations.");
      return destination;
    });
  }

  exportIndividualConversation(
    channel,
    destination,
    tier3MethodLimiterForConversationHistory
  ) {
    const channelId = channel.id;
    const userFile = destination + "/" + channelId + ".json";
    this.logger.info("Begin individual conversation export to " + userFile);

    const jsonwriter = JSONStream.stringify("[", ",", "]");
    const writeStream = fs.createWriteStream(userFile);
    jsonwriter.pipe(writeStream);

    let page = 0;

    const pager = nextCursor => {
      page++;
      this.logger.debug(
        "Retrieving individual conversation " + channelId + " page " + page,
        {
          nextCursor
        }
      );

      return tier3MethodLimiterForConversationHistory
        .schedule(this.slack.conversations.history, {
          channel: channelId,
          limit: 100,
          cursor: nextCursor
        })
        .then(results => {
          results.messages.forEach(message => {
            jsonwriter.write(message);
          });

          if (
            results.response_metadata &&
            results.response_metadata.next_cursor
          ) {
            return pager(results.response_metadata.next_cursor);
          }
        });
    };

    return pager().then(() => {
      this.logger.debug("Closing conversation " + channelId + " streams.");
      jsonwriter.end();
      this.logger.info(
        "Finished retrieving individual conversation " + channelId
      );
    });
  }

  zip(sourceFolder) {
    return new Promise(resolve => {
      // this cleverly puts it in the same folder as the named folder with that as the zip name
      const zipFile = sourceFolder + ".zip";

      this.logger.debug("Creating a zip named " + zipFile);

      const output = fs.createWriteStream(zipFile);
      output.on("close", () => {
        // probably bad to resolve the source folder and not the zip itself, but it makes my other code better
        // probably want to figure this out and fix it better, maybe with a higher up nested promise
        resolve(sourceFolder);
      });

      const zip = archiver("zip", {
        zlib: { level: 9 }
      });
      zip.pipe(output);

      this.logger.info("Adding source folder to zip file", {
        sourceFolder,
        zipFile
      });
      zip.directory(sourceFolder, false);

      this.logger.debug("Finalize the zip");
      zip.finalize();
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
