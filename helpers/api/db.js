import getConfig from 'next/config';
import mysql from 'mysql2/promise';
import { Sequelize, DataTypes } from 'sequelize';

const { serverRuntimeConfig } = getConfig();

export const db = {
    initialized: false,
    initialize
};

// initialize db and models, called on first api request from /helpers/api/api-handler.js
async function initialize() {
    // create db if it doesn't already exist
    const { host, port, user, password, database, dialect, pool } = serverRuntimeConfig.dbConfig;
    
    try {
        const connection = await mysql.createConnection({ host, port, user, password });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    } catch (error) {
        console.log(error);
    }

    // connect to db
    const sequelize = new Sequelize(
        database,
        user,
        password,
        {
          host: host,
          dialect: dialect,
          operatorsAliases: false,
          pool: {
            max: pool.max,
            min: pool.min,
            acquire: pool.acquire,
            idle: pool.idle
          }
        }
      );

    // init models and add them to the exported db object
    db.User = userModel(sequelize);

    // sync all models with database
    await sequelize.sync({ alter: true });

    db.initialized = true;
}

// sequelize models with schema definitions

function userModel(sequelize) {
    const attributes = {
        email: { type: DataTypes.STRING, allowNull: false },
        hash: { type: DataTypes.STRING, allowNull: false },
        firstName: { type: DataTypes.STRING, allowNull: false },
        lastName: { type: DataTypes.STRING, allowNull: false }
    };

    const options = {
        defaultScope: {
            // exclude password hash by default
            attributes: { exclude: ['hash'] }
        },
        scopes: {
            // include hash with this scope
            withHash: { attributes: {}, }
        }
    };

    return sequelize.define('User', attributes, options);
}