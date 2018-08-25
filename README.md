# [WIP] Slack Conversation Export

Want to archive your Slack conversations? This might be the tool for you!

## Usage

1. Obtain a [web token](https://api.slack.com/custom-integrations/legacy-tokens) to use on the command line.

2. Make command executable (for example:)

`chmod +x index.js`

3. Run this from the command line:

`./index.js -t MY_TOKEN_HERE -d PATH_TO_EXPORT_DIRECTORY`

The script will create a folder named after the current date+time in the export directory. Inside of there, it will create the following files:

- **users.json** The users you have access to view
- **conversations.json** The meta information about all the conversations you're part of
- **ABC###.json** The conversations you have access to view. This includes public channels, private channels you're a member of, DM's and multi-person-DMs. `ABC###` refers to the internal conversation identifier.

## Viewing Content

The main purpose of this is to archive information in json form for later parsing. However, you may want to follow a sibling project I have going on that parses this format and builds a Jekyll-based static site from it.
You can visit [slack-conversation-export-display](https://github.com/aaronsaray/slack-conversation-export-display) to find out more.

## Limitations

There's a couple things to know about this utility.

- This is currently a pet project of mine. That being said, I am focusing on my workflow first. In the future, I may accept issues and alter or improve features. I wouldn't expect any support currently.
- The security is limited to only permissions that your current web token has.
- This script does not combine or make the information viewable. It just exports the data. In the future I might make an interface to do this, but I wouldn't hold your breath. :)

## Todo

- [ ] Add start/end time to the last output
- [ ] For my own use, have it check on each conversation and only keep ones you're a member of (first, get user info, then filter each conversation that's mabye public?)
- [ ] Unit tests and include travis ci/coveralls info
- [ ] Handle token in env too instead of command line (I'm lookin at you .bash_history)
- [ ] Debug logging seems to write at bottleneck step registration, not execution
- [ ] Better logging configuration for Winston
- [ ] Separate out the package better so that people can use my downloading/parsing without having to write to a file, general refactor into classes
- [ ] Give more options - like - how to not delete the folder when you're done, etc.
- [ ] Handle rate limiting better (ie - making sure you can recover from it)
- [ ] Handle errors better if the interwebs goes away for a bit
- [ ] Figure out what to do if a failed download - delete it?
- [ ] Download attachments maybe at some point?
- [ ] Figure out how to download posts
- [ ] Incremental export based on date option (this won't necessarily be friendly if people alter history tho)
