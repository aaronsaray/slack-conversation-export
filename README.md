# [WIP] Slack Conversation Export

Want to archive your Slack conversations? This might be the tool for you!

## Usage

1. Obtain a [web token](https://api.slack.com/custom-integrations/legacy-tokens) to use on the command line.

2. Run this from the command line:

`node index.js --token="MY_TOKEN_HERE" --destination="PATH_TO_EXPORT_DIRECTORY"`

The script will create a folder named after the current date+time in the export directory. Inside of there, it will create the following files:

- **users.json** The users you have access to view
- **conversations.json** The conversations you have access to view. This includes public channels, private channels you're a member of, DM's and multi-person-DMs.

## Limitations

There's a couple things to know about this utility.

- This is currently a pet project of mine. That being said, I am focusing on my workflow first. In the future, I may accept issues and alter or improve features. I wouldn't expect any support currently.
- The security is limited to only permissions that your current web token has.
- This script does not combine or make the information viewable. It just exports the data. In the future I might make an interface to do this, but I wouldn't hold your breath. :)

## Todo

- [ ] Better logging configuration for Winston
- [ ] Separate out the package better so that people can use my downloading/parsing without having to write to a file
