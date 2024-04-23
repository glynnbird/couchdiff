# couchdiff

A command-line utility to calculate the difference between two Cloudant/CouchDB datbases. It operates in one of three modes

- default mode - gets a list of document ids and winning revision tokens for each database and "diffs" them using the `diff` command. In this mode, if the two databases are deemed equal then they have the same number of documents with the same content up the same revision number. There maybe differences in conflicting revisions. If you are interested in conflict data too, then use `--conflict` mode.
- `--quick`  - gets the count of documents and deleted documents from each database - if they match then the two databases are deemed to be the same. This is the quickest but least accurate mode of operation.
- `--conflicts` - same as default mode but also includes revision tokens of non-winning revisions i.e. conflicts. This is the slowest option because *couchdiff* has to stream the whole changes feed including the document bodies
- `--unified` - outputs the diff in unified format

This tool relies on two universal command-line tools

- `sort` the *nix command-line tool that sorts text files
- `diff` the *nix` command-line tool that calculates the difference between text files

The output of this tool is the output of the final `diff` step - the difference between the two databases.

## Installation

This is a Node.js app distributed using the `npm` tool:

    > npm install -g couchdiff

## Running

To calculate the differences between two databases, call `couchdiff` with two URLs. The URLs should include credentials where required, and the database name at the end. Either 'http' or 'https' protocols are supported:

    >  couchdiff http://localhost:5984/mydb1 http://localhost:5984/mydb2
    spooling changes...
    sorting...
    calculating difference...
    2c2
    < 1000543/1-3256046064953e2f0fdb376211fe78ab
    ---
    > 1000543/2-7d93e4800a6479d8045d192577cff4f7

The above output shows that document id `1000543` differs in the two databases.

You can use a combination of local and remote databases:

    > couchdiff http://localhost:5984/mydb https://U:P@myhost.cloudant.com/mydb
    spooling changes...
    sorting...
    calculating difference...

In this case both databases are identical.

## Quick mode

A quicker, but less thorough check can be performed by adding the `--quick` option:

    >  couchdiff --quick http://localhost:5984/mydb1 http://localhost:5984/mydb2
    Both databases have the same number of docs and deletions

Quick mode only checks the number of documents and deleted documents in each database, not the revision tokens of each document.

## Conflicts mode

A slower, but very thorough check can be performed by adding the `--conflicts` option which will return differences in the databases not only on the "winning revisions" but in any conflicted documents too:

    > couchdiff --conflicts http://localhost:5984/mydb1 http://localhost:5984/mydb2
    spooling changes...
    sorting...
    calculating difference...
    1c1
    < mydoc/1-25f9b97d75a648d1fcd23f0a73d2776e/1-icecream
    ---
    > mydoc/1-25f9b97d75a648d1fcd23f0a73d2776e/2-7942b2ce39cc4dd85f1809c1756a40c9

## Exit codes

- 0 - both databases are the same
- 1 - insufficient number of parameters
- 2 - invalid URL
- 3 - both databases are different

## Authentication

CouchDiff supports authentication using environment variables. Users can set the `COUCHDB_TOKEN_A` and `COUCHDB_TOKEN_B` environment variables to provide authentication tokens for database access. This method avoids the need to specify usernames and passwords. To use this feature, simply set the appropriate environment variable with your token before starting the application:

## Contributing

This is an open-source tool released under the Apache-2.0 license. Please feel free to use it, raise issues or contribute pull requests.
