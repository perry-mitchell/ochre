<p align="center">
    <img src="ochre-small.jpg" />
</p>

# Ochre
Resource packager and backup utility

## About
Ochre _([oh-kər](https://en.wikipedia.org/wiki/Ochre))_ is a resource archival utility, designed to allow easy packaging, transferral and extraction of different types of resources. It was originally started as a machine backup system, but expanded to become a more broad-use tool.

Ochre is written entirely in JavaScript and is designed to run on NodeJS. Due to its heavy reliance on Node's `fs` module, it is not suitable for use within a browser.

## Usage
Ochre should be installed globally and used as such:

```bash
npm install -g ochre
```

> Depending on your operating system, the above command _may_ need to be run with `sudo`.

> Ochre does not support windows.

### CLI
To get help using the command line tool, once installed, simply enter `ochre --help`.

Ochre supports 2 modes of operation: **archiving** and **extraction**.

```bash
# Archive some files defined in a configuration file
ochre config.ochre.json -a --output=myArchive.ochre

# Extract files from an archive
ochre myArchive.ochre -e

# Show help and other arguments
ochre --help
```

Ochre makes use of a configuration file to perform archiving of resources.

## Disclaimer
Ochre comes with **no guarantee** for data safety or availability. Even when it becomes stable, it is at your own peril if you choose to use it to store sensitive data.

## Development and contributing
The **source** directory holds the actual library, with `index.js` exposing the necessary methods for public consumption. `cli.js` in the root is used for the CLI executable. Tests are in the `test` directory.

To run the tests, simply execute `npm test`.

When contributing to Ochre, please make sure that you run all the necessary checks (with `npm test`) before making a PR. Most editors provide plugins to allow eslint to check your code as you go. If you add more functionality be sure to add covering tests.

An `.editorconfig` is also provided for easy configuration of supporting editors (such as Microsoft's [VSCode](https://code.visualstudio.com/)). All contributions are expected to follow the same style as the rest of the project, and the editor configuration is designed to help with that.
