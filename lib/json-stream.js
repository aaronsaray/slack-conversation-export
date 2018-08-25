/**
 * This gets a stream that is configured in the manner that we need.
 *
 * Basically its a json stream that creates an array wrapped around the content
 */

const JSONStream = require("JSONStream");

module.exports = file => {
  const jsonwriter = JSONStream.stringify("[", ",", "]");
  const writeStream = fs.createWriteStream(file);
  jsonwriter.pipe(writeStream);
  return jsonwriter;
};
