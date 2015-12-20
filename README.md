# prequel

[![Build](https://travis-ci.org/jwhitfieldseed/prequel.svg?branch=master)](https://travis-ci.org/jwhitfieldseed/prequel)
[![Coverage Status](https://coveralls.io/repos/jwhitfieldseed/prequel/badge.svg?branch=master&service=github)](https://coveralls.io/github/jwhitfieldseed/prequel?branch=master)
[![Dependency Status](https://david-dm.org/jwhitfieldseed/prequel/master.svg)](https://david-dm.org/jwhitfieldseed/prequel/master)
[![devDependency Status](https://david-dm.org/jwhitfieldseed/prequel/master/dev-status.svg)](https://david-dm.org/jwhitfieldseed/prequel/master#info=devDependencies)

Use SQL and tagged template strings to query JavaScript objects in style:

    import q from 'prequel';
    q`SELECT * FROM ${users} WHERE count > 14 ORDER BY name, count DESC`

Coming soon.

## Test

    ❯ npm install
    ❯ npm test
