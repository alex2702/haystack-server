const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    user: 'haystack_user',
    database: 'haystack_db',
    password: 'haystack',
    port: 5432,
});

module.exports = {
    query: (text: any, params:any , callback:any) => {
        return pool.query(text, params, callback);
    },
    connect: (err: any, client: any, done: any) => {
        return pool.connect(err, client, done);
    },
};
