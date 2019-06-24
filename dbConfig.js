// TODO: SET OPTIONS FOR YOUR OWN DATABASE

const options = { 
    client: 'mysql2',
    connection: {
        host: '127.0.0.1',
        user: 'rwoo',
        password: '123Password',
        database: 'interactions_vincent'
    }
}

const knex = require('knex')(options);
module.exports = knex;