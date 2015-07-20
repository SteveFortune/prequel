# prequel

Use SQL and tagged template strings to query JavaScript objects in style:

    import q from 'prequel';
    q`SELECT * FROM ${users} WHERE count > 14 ORDER BY name, count DESC`

Prequel is under development - watch this space.

## Test

    ❯ npm install
    ❯ npm install -g faucet
    ❯ npm test
