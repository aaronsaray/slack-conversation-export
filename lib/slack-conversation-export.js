/**
 * Main export for public methods of this service
 */

const Service = require("./service");

class SlackConversationExportProxy {
  constructor(logger, token, rootDestination) {
    this.service = new Service(logger, token, rootDestination);
  }

  export() {
    return this.service.export();
  }
}

module.exports = SlackConversationExportProxy;
