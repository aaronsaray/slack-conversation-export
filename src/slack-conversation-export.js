const path = require("path"),
  fs = require("fs");

class SlackConversationExport {
  constructor(token, destination, logger) {
    this.logger = logger;
    this.storeAndValidateRootDestination(destination);
  }

  export() {
    const date = new Date();

    // creates YYYY-MM-DD-HH-MM-SS from iso date and strips seconds
    const folder = date
      .toISOString()
      .replace(/[T\:]/g, "-")
      .substr(0, 19);

    const destinationDirectory = this.destination + "/" + folder;

    this.logger.info("Creating export directory", { destinationDirectory });
    fs.mkdirSync(destinationDirectory);

    console.log("wrote it");
  }

  /**
   * Validates that we can write to the destination before storing it as a property
   */
  storeAndValidateRootDestination(destination) {
    const fullPath = path.resolve(destination);

    try {
      fs.accessSync(fullPath, fs.constants.W_OK);
    } catch (error) {
      this.logger.warning("Unable to write to destination path: " + fullPath);
      throw error;
    }

    this.destination = fullPath;
  }
}

module.exports = SlackConversationExport;
