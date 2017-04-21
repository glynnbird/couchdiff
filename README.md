# couchdiff

A command-line utility to calculate the difference between two Cloudant/CouchDB datbases

## Installation

This is a Node.js app distributed using the `npm` tool:

    > npm install -g couchdiff

## Running

To calculate the differences between two databases, call `couchdiff` with two URLs. The URLs 
should include credentials where required, and the datbase name at the end. Either 'http' or 
'https' protocols are supported:

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

Quick mode only checks the number of documents and deleted documents in each database, not
the revision tokens of each document.

## Exit codes

- 0 - both databases are the same
- 1 - insufficient number of parameters
- 2 - invalid URL
- 3 - both databases are different