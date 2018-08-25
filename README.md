# Slack Conversation Export

Want to archive your Slack conversations? This might be the tool for you!

`slack-conversation-export` is a command line script and library that allow you to export your Slack conversations into JSON files. It's **important** to note that this is about exporting your participation, not your entire Slack space. Basically that means that it will download all things you're an active participant of, not _all_ of the information. This means all private IMs (single and group), all private channels you belong to, and only public channels you also belong to. (It will not download _all_ public channels).

**Trademark / Association** Please note that this package is not associated with, endorsed or supported by Slack.

## Installation

Running as a command line script? Install it globally:

`npm install -g slack-conversation-export`

Just using the libraries to build out your own solution? Install it as a dependency:

`npm install slack-conversation-export`

## Usage and Output

There are two mechanisms or ways to use this script.

### Usage instructions as a command line tool

1. Obtain a [web token](https://api.slack.com/custom-integrations/legacy-tokens) to use on the command line.

2. Run this from the command line:

`slack-conversation-export -t MY_TOKEN_HERE -d PATH_TO_EXPORT_DIRECTORY`

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

### Usage instructions as a library

1. Obtain a [web token](https://api.slack.com/custom-integrations/legacy-tokens) to use on the command line.

2. Require the library in your script

`const SlackConversationExport = require("slack-conversation-export");`

3. Create new instance of it and run the export method.

```
const exporter = new SlackConversationExport(logger, token, rootDestination);
exporter.export();
```

- `logger` is an instance of a compatible logger, by default it's configured / tested with [Winston](https://www.npmjs.com/package/winston)
- `token` is a string of your web token
- `rootDestination` is a string path to a folder you can write to

### Output

Currently, both methods create the same output.

In the destination folder, there will be a zip file named after the year, month, day, hour, minute and second the script started. It will contain the following:

- **users.json** The users you have access to view
- **conversations.json** The meta information about all the conversations you're part of
- **ABC###.json** The conversation. `ABC###` refers to the internal conversation identifier.

#### Viewing Content

The main purpose of this is to archive information in json form for later parsing. However, you may want to follow a sibling project I have going on that parses this format and builds a Jekyll-based static site from it.
You can visit [slack-conversation-export-display](https://github.com/aaronsaray/slack-conversation-export-display) to find out more.

## Limitations

There's a couple things to know about this utility.

- This is currently a pet project of mine. That being said, I am focusing on my workflow first. In the future, I may accept issues and alter or improve features. I wouldn't expect any support currently.
- The security is limited to only permissions that your current web token has.
- This script does not combine or make the information viewable. It just exports the data as JSON files

## Contributing / Code of Conduct

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the process for submitting pull requests to us. All participants must read and agree to the [code of conduct](CODE_OF_CONDUCT.md).

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/aaronsaray/slack-conversation-export/tags).

## Authors

- [Aaron Saray](https://aaronsaray.com)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Todo

There are a number of todos listed on the [issues page](https://github.com/aaronsaray/slack-conversation-export/issues) Please review those to see the next steps of this project.
