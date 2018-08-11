// this doens't seem like the right way to make public/private stuff - yet -

const exporter = require("./exporter");

class SlackConversationExport {
  /**
   * Store an instance of the logger, the token, store and validate a root directory
   */
  constructor(token, destination, logger) {
    this.logger = logger;
    this.token = token;

    this.rootDestinationFolder = exporter.getResolvedAndWriteableFolder(
      destination,
      logger
    );
  }

  /**
   * run the export using the root destination folder
   */
  export() {
    exporter.export(this.rootDestinationFolder, this.token, this.logger);
  }
}

module.exports = SlackConversationExport;
