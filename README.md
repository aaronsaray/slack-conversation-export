# [WIP] Slack Conversation Export

Want to archive your Slack conversations? This might be the tool for you!

This tool currently is a command line script that uses a legacy web token to download _your_ conversation history. This is not the entire history of the slack workspace, only conversations you're part of. This means all private IMs, all private channels and all public channels that you've joined.

## Usage

1. Obtain a [web token](https://api.slack.com/custom-integrations/legacy-tokens) to use on the command line.

2. Run this from the command line:

`slack-conversation-export -t MY_TOKEN_HERE -d PATH_TO_EXPORT_DIRECTORY`

The script will create a folder named after the current date+time in the export directory. Inside of there, it will create the following files:

- **users.json** The users you have access to view
- **conversations.json** The meta information about all the conversations you're part of
- **ABC###.json** The conversations you have access to view. This includes public channels, private channels you're a member of, DM's and multi-person-DMs. `ABC###` refers to the internal conversation identifier.

### Configuration Options

#### Command Line Options

`-t` or `--token` Your slack web legacy token
`-d` or `--destination` The folder where your export should build your dated folder/zip

#### Environment Variables

It's also possible to send through environment variables for the command line options. These are prefixed with `SLACK_CONVERSATION_EXPORT`. For example:

`SLACK_CONVERSATION_EXPORT_DESTINATION=./my-folder slack-conversation-export -t my-token-here`

You could also add those to your current environment so they do not show up in bash history. This would be a good idea for your private legacy token.

If you have multiple slacks to export, you could use multiple private slack tokens in your environment, then call the command twice, alternating the environment variable. For example:

```
export SLACK_ONE_TOKEN=abc
export SLACK_TWO_TOKEN=def
```

Then

```
SLACK_CONVERSATION_EXPORT_TOKEN="$SLACK_ONE_TOKEN" slack-conversation-export -d ./slack-one-dir
SLACK_CONVERSATION_EXPORT_TOKEN="$SLACK_TWO_TOKEN" slack-conversation-export -d ./slack-two-dir
```

## Viewing Content

The main purpose of this is to archive information in json form for later parsing. However, you may want to follow a sibling project I have going on that parses this format and builds a Jekyll-based static site from it.
You can visit [slack-conversation-export-display](https://github.com/aaronsaray/slack-conversation-export-display) to find out more.

## Limitations

There's a couple things to know about this utility.

- This is currently a pet project of mine. That being said, I am focusing on my workflow first. In the future, I may accept issues and alter or improve features. I wouldn't expect any support currently.
- The security is limited to only permissions that your current web token has.
- This script does not combine or make the information viewable. It just exports the data. In the future I might make an interface to do this, but I wouldn't hold your breath. :)

## Todo

- [ ] Better logging configuration for Winston
- [ ] Separate out the package better so that people can use my downloading/parsing without having to write to a file, general refactor into classes
- [ ] Unit tests and include travis ci/coveralls info
- [ ] Give more options - like - how to not delete the folder when you're done, etc.
- [ ] Handle rate limiting better (ie - making sure you can recover from it)
- [ ] Handle errors better if the interwebs goes away for a bit
- [ ] Figure out what to do if a failed download - delete it?
- [ ] Download attachments maybe at some point?
- [ ] Figure out how to download posts
- [ ] Incremental export based on date option (this won't necessarily be friendly if people alter history tho)
