const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = new Pool({
      user: 'kscapics',       
      host: 'aycapsu01ts330.aycap.bayad.co.th',          
      database: 'kscapics-db-dev',   
      password: 'P@ssw0rd!@#$',   
      port: 5435,                 
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async query(text, params) {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  }

  async getClient() {
    const client = await this.pool.connect();
    return client;
  }
}

module.exports = new Database();
