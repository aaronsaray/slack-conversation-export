/**
 * Main Service Class, responsible for all of the orchestration of this process
 *
 * The process:
 * - create a date and time based folder inside of the destination
 * - then simultaneously get all users and all conversations
 * -- users are written to users.json
 * -- conversations are filtered to make sure you belong to them
 * --- if you do, then that conversation is written to the conversations.json file and then all of its content is downloaded
 * - then zip the folder named the same thing at the same location
 * - then delete the folder
 */

const fs = require("fs"),
  Slack = require("slack"),
  JSONStream = require("JSONStream"),
  Bottleneck = require("bottleneck"),
  archiver = require("archiver"),
  del = require("del");

class SlackConversationExportService {
  constructor(logger, token, rootDestination) {
    this.logger = logger;
    this.slack = new Slack({ token });
    this.rootDestination = rootDestination;
    this.exportUsers = this.exportUsers.bind(this);
    this.exportConversations = this.exportConversations.bind(this);
  }

  export() {
    this.logger.info("Begin export");

    let destinationFolder, zipFile;

    return this.createDateTimeFolder(this.rootDestination)
      .then(destination => {
        destinationFolder = destination;

        return Promise.all([
          this.exportUsers(destinationFolder),
          this.exportConversations(destinationFolder)
        ]);
      })
      .then(() => {
        return this.zip(destinationFolder);
      })
      .then(zip => {
        zipFile = zip;
        del(destinationFolder);
      })
      .then(() => {
        this.logger.info(`End export to ${zipFile}`);
      });
  }

  exportUsers(destination) {
    const userFile = `${destination}/users.json`;
    this.logger.info(`Begin user export to ${userFile}`);

    const jsonwriter = this.getJsonStream(userFile);
    let page = 0;

    const tier2MethodLimiterForUsersList = this.getLimiter(20);

    const pager = nextCursor => {
      page++;

      return tier2MethodLimiterForUsersList
        .schedule(() => {
          this.logger.debug(`Retrieving users page ${page}`, { nextCursor });
          return this.slack.users.list({ limit: 100, cursor: nextCursor });
        })
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
    });
  }

  /**
   * Gets a limiter instance from bottleneck
   * It takes the requests per minute from slack, then subtracts 20% so we have a buffer
   * So if you have 20 requests per minute, we ask for only 16 requests per minute
   * 20 - 20% = 16.  60secs in a minute / 16 = once every 3.75 seconds. multiply by 1k for millisecs
   * @param {*} requestsPerMinute
   */
  getLimiter(requestsPerMinute) {
    const buffer = requestsPerMinute - Math.ceil(requestsPerMinute * 0.2);
    const minTime = (60 / buffer) * 1000;

    return new Bottleneck({
      maxConcurrent: 1,
      minTime
    });
  }

  exportConversations(destination) {
    const conversationFile = `${destination}/conversations.json`;
    this.logger.info(`Begin conversation export to ${conversationFile}`);

    const jsonwriter = this.getJsonStream(conversationFile);
    let page = 0;

    const tier2MethodLimiterForConversationsList = this.getLimiter(20);

    // note we have to have this outside of the individual method because otherwise it'll just create copies of itself
    const tier3MethodLimiterForConversationHistory = this.getLimiter(50);

    const pager = nextCursor => {
      page++;

      return tier2MethodLimiterForConversationsList
        .schedule(() => {
          this.logger.debug(`Retrieving conversations page ${page}`, {
            nextCursor
          });
          return this.slack.conversations.list({
            limit: 100,
            cursor: nextCursor,
            exclude_archived: false,
            types: "public_channel,private_channel,mpim,im"
          });
        })
        .then(results => {
          let childPromises = [];

          results.channels.forEach(channel => {
            // only write to channel list and issue download command if you're a member

            // if is_im, is_member doesn't exist.  on all other times, is_member is true or false
            if (channel.is_im || channel.is_member) {
              jsonwriter.write(channel);

              childPromises.push(
                this.exportIndividualConversation(
                  channel,
                  destination,
                  tier3MethodLimiterForConversationHistory
                )
              );
            }
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
    });
  }

  exportIndividualConversation(
    channel,
    destination,
    tier3MethodLimiterForConversationHistory
  ) {
    const channelId = channel.id;
    const channelFile = `${destination}/${channelId}.json`;
    this.logger.info(`Begin individual conversation export to ${channelFile}`);

    const jsonwriter = this.getJsonStream(channelFile);
    let page = 0;

    const pager = nextCursor => {
      page++;

      return tier3MethodLimiterForConversationHistory
        .schedule(() => {
          this.logger.debug(
            `Retrieving individual conversation ${channelId} page ${page}`,
            {
              nextCursor
            }
          );
          return this.slack.conversations.history({
            channel: channelId,
            limit: 100,
            cursor: nextCursor
          });
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
      this.logger.debug(`Closing conversation ${channelId} streams.`);
      jsonwriter.end();
      this.logger.info(
        `Finished retrieving individual conversation ${channelId}`
      );
    });
  }

  zip(sourceFolder) {
    return new Promise(resolve => {
      // this cleverly puts it in the same folder as the named folder with that as the zip name
      const zipFile = `${sourceFolder}.zip`;

      this.logger.debug(`Creating a zip named ${zipFile}`);

      const output = fs.createWriteStream(zipFile);
      output.on("close", () => {
        resolve(zipFile);
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

  createDateTimeFolder(rootDestination) {
    return new Promise(resolve => {
      const date = new Date();

      // creates YYYY-MM-DD-HH-MM-SS from iso date and strips seconds
      const folder = date
        .toISOString()
        .replace(/[T\:]/g, "-")
        .substr(0, 19);

      const destination = `${rootDestination}/${folder}`;
      fs.mkdirSync(destination);

      this.logger.debug(`Created folder ${destination}`);

      resolve(destination);
    });
  }

  /**
   * Build the standard json stream building an array
   */
  getJsonStream(file) {
    const jsonwriter = JSONStream.stringify("[", ",", "]");
    const writeStream = fs.createWriteStream(file);
    jsonwriter.pipe(writeStream);
    return jsonwriter;
  }
}

module.exports = SlackConversationExportService;
