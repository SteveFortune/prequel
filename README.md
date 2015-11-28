# prequel

[![Build](https://travis-ci.org/jwhitfieldseed/prequel.svg?branch=master)](https://travis-ci.org/jwhitfieldseed/prequel)

[![Coverage Status](https://coveralls.io/repos/jwhitfieldseed/prequel/badge.svg?branch=master&service=github)](https://coveralls.io/github/jwhitfieldseed/prequel?branch=master)

Use SQL and tagged template strings to query JavaScript objects in style:

    import q from 'prequel';
    q`SELECT * FROM ${users} WHERE count > 14 ORDER BY name, count DESC`

Prequel is under development - watch this space. Currently ES6 and io.js/recent browser only - ES5 and Node support coming soon.

## Test

    ❯ npm install
    ❯ npm test
