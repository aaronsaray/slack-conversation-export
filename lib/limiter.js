/**
 * Gets a limiter instance from bottleneck
 * It takes the requests per minute from slack, then subtracts 20% so we have a buffer
 * So if you have 20 requests per minute, we ask for only 16 requests per minute
 * 20 - 20% = 16.  60secs in a minute / 16 = once every 3.75 seconds. multiply by 1k for millisecs
 */

const Bottleneck = require("bottleneck");

module.exports = requestsPerMinute => {
  const buffer = requestsPerMinute - Math.ceil(requestsPerMinute * 0.2);
  const minTime = (60 / buffer) * 1000;

  return new Bottleneck({
    maxConcurrent: 1,
    minTime
  });
};
