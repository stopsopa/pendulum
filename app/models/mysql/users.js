
const abstract          = require('knex-abstract');

const extend            = abstract.extend;

const prototype         = abstract.prototype;

const log               = require('inspc');

const fs                = require('fs');

const path              = require('path');

const a                 = prototype.a;

const isObject          = require('nlab/isObject');

const se                = require('nlab/se');

const probeClass       = require('../../probeClass');

const ms                = require('nlab/ms');

const generate          = ms.generate;

const validator         = eval('require')('@stopsopa/validator');

const {
    Required,
    Optional,
    Collection,
    All,
    Blank,
    Callback,
    Choice,
    Count,
    Email,
    IsFalse,
    IsNull,
    IsTrue,
    Length,
    NotBlank,
    NotNull,
    Regex,
    Type,
} = validator;

const table             = 'users';

const id                = 'id';

module.exports = knex => extend(knex, prototype, {
    filters: {
        def : ['created', 'updated', 'description'],
    },
    initialize: async function (extra) {

//         const id = await this.raw(`
// select r.id from roles r where r.name = ?
// `, ['user']).then(role => {
//             try {
//                 return role[0][0].id;
//             }
//             catch (e) {
//
//             }
//         });
//
//         const roles = [];
//
//         if (id) {
//
//             roles.push(id);
//         }

        return {
            enabled: true,
            config: {},
            ...extra,
        }
    },
    fromDb: async function (row, opt, trx) {

        if ( ! isObject(row) ) {

            return row;
        }

        // if (typeof row.roles === 'string') {
        //
        //     row.roles = row.roles.split(',').map(r => /^\d+$/.test(r) ? parseInt(r, 10) : r).filter(Boolean);
        // }
        //
        // if (typeof row.rnames === 'string') {
        //
        //     row.rnames = row.rnames.split(',').filter(Boolean);
        // }
        //
        // if ( ! Array.isArray(row.roles) ) {
        //
        //     row.roles = [];
        // }
        //

        row.enabled = Boolean(row.enabled);

        (function (label) {

            if (typeof row.firstName === 'string' && row.firstName.trim()) {

                label.push(row.firstName.trim())
            }

            if (typeof row.lastName === 'string' && row.lastName.trim()) {

                label.push(row.lastName.trim())
            }

            row.label = label.join(' ');
        }([]));

        (function () {

            if (typeof row.password === 'string') {

                if ( ! isObject(row.password) ) {

                    try {

                        row.password = JSON.parse(row.password);
                    }
                    catch (e) {

                        row.password = {}
                    }
                }
            }
            if ( ! isObject(row.password) ) {

                row.password = null;
            }
        }());

        if ( typeof row.config === 'string' ) {

            try {

                row.config = JSON.parse(row.config) || {};
            }
            catch (e) {

            }
        }

        if ( ! isObject(row.config)) {


            row.config = {};
        }

        return row;
    },
    toDb: async function (row, opt, trx) {

        if ( ! isObject(row) ) {

            return row;
        }

        delete row.label;

        delete row.password;

        row.enabled = Boolean(row.enabled);

        //
        // row.detailed_log = Boolean(row.detailed_log);
        //
        // row.service_mode = Boolean(row.service_mode);

        // if (typeof row.roles !== 'undefined') {
        //
        //     delete row.roles;
        // }
        //
        // if (typeof row.created !== 'undefined') {
        //
        //     delete row.created;
        // }
        //
        // if (typeof row.updated !== 'undefined') {
        //
        //     delete row.updated;
        // }
        //
        // if (!row.config) {
        //
        //     delete row.config;
        // }
        //
        // if (typeof row.config !== 'undefined' && typeof row.config !== 'string') {
        //
        //     row.config = JSON.stringify(row.config, null, 4);
        // }

        if ( isObject(row.config) ) {

            try {

                row.config = JSON.stringify(row.config, null, 4);
            }
            catch (e) {

            }
        }

        if ( typeof row.config !== 'string' ) {

            row.config = "{}";
        }

        return row;
    },
    update: function (...args) {

        let [debug, trx, entity, id] = a(args);

        // if (Array.isArray(entity.roles)) {
        //
        //     this.updateRoles(id, entity.roles)
        // }

        return prototype.prototype.update.call(this, debug, trx, entity, id);
    },
    insert: async function (...args) {

        let [debug, trx, entity] = a(args);

        // let roles = null;
        //
        // if (Array.isArray(entity.roles)) {
        //
        //     roles = entity.roles;
        // }
        //
        // entity = this.toDb(Object.assign({}, entity));

        const id = await prototype.prototype.insert.call(this, debug, trx, entity);

        // if (roles) {
        //
        //     await this.updateRoles(id, roles);
        // }

        return id;
    },
    delete: async function (id, ...args) {

        // await this.clearRoles(id);

        return await prototype.prototype.delete.call(this, id, ...args);
    },
//     find: function (...args) {
//
//         let [debug, trx, id] = a(args);
//
//         if ( ! id ) {
//
//             throw `user.js::find(): id not specified or invalid`;
//         }
//
//         const query = `
// SELECT          u.*, GROUP_CONCAT(r.id) roles
// FROM            users u
// LEFT JOIN       user_role ur
// 		     ON ur.user_id = u.id
// LEFT JOIN       roles r
// 		     ON ur.role_id = r.id
// WHERE           u.id = :id
// GROUP BY        u.id
// ORDER BY        id desc
//         `;
//
//         const params = {id};
//
//         return this.raw(debug, trx, query, params).then(data => {
//             // log.dump({
//             //     query,
//             //     params,
//             //     data: data[0][0]
//             // })
//             return data[0][0];
//         }).then(this.fromDb);
//     },
//     findAll: function (...args) {
//
//         let [debug, trx] = a(args);
//
//         return this.raw(debug, trx, `
// SELECT          u.*, GROUP_CONCAT(r.id) roles, GROUP_CONCAT(r.name) rnames
// FROM            users u
// LEFT JOIN       user_role ur
// 		     ON ur.user_id = u.id
// LEFT JOIN       roles r
// 		     ON ur.role_id = r.id
// GROUP BY        u.id
// ORDER BY        id desc
//         `).then(data => {
//             return data[0];
//         }).then(list => Promise.all(list.map(l => this.fromDb(l))));
//     },
    listImportantColumns: async function (...args) {

        let [debug, trx] = a(args);

        const columns = await this.fetchColumnsFiltered(debug, trx, {
            format: 'list',
        });

        return await this.fetch(debug, trx, `select ${columns.join(`, `)} from :table:`);
    },
    findFiltered: async function (...args) {

        let [debug, trx, id] = a(args);

        const columns = await this.fetchColumnsFiltered(debug, trx, {
            format: 'list',
        });

        return await this.queryOne(debug, trx, `select ${columns.join(`, `)} from :table: where id = :id`, {
            id,
        });
    },
    prepareToValidate: function (data = {}, mode) {

        data = {...data};

        // if (typeof data.id !== 'undefined') {
        //
        //     delete data.id;
        // }

        delete data.created;

        delete data.updated;

        delete data.label;

        delete data.password;

        return data;
    },
    getValidators: function (mode, id, {
        trx,
        entity
    }) {

        const collection = {
            id: new Optional(),
            firstName: new Required([
                new NotBlank(),
                new Length({max: 50}),
            ]),
            lastName: new Required([
                new NotBlank(),
                new Length({max: 50}),
            ]),
            description: new Optional(),
            // config: new Optional(),
            // password: new Required([
            //     new NotBlank(),
            //     new Length({max: 255}),
            // ]),
            email: new Required([
                new NotBlank(),
                new Email(),
                new Length({max: 255}),
                new Callback(async (value, context, path, extra) => {

                    try {

                        if ( typeof value !== 'string') {

                            throw new Error(`box 1`);
                        }

                        if ( ! value.trim() ) {

                            throw new Error(`box 28`);
                        }

                        let query = `SELECT COUNT(*) c FROM :table: WHERE email = :email`;

                        const params = {
                            email: value,
                        };

                        if (mode === 'edit') {

                            query += ` and :id: != :id`;

                            params.id = id;
                        }

                        const c = await this.queryColumn(trx, query, params);

                        // log.dump({
                        //     [mode]: c,
                        //     id: id || false,
                        //     query,
                        //     params,
                        // });

                        if (c > 0) {

                            context
                              .buildViolation('Email is not unique')
                              .atPath(path)
                              // .setParameter('{{ callback }}', 'not equal')
                              .setCode("CALLBACK_5")
                              .setInvalidValue(value)
                              .addViolation()
                            ;

                            if (extra && extra.stop) {

                                throw new Error(`reject Callback_5`);
                            }
                        }

                        return 'resolve Callback_5';
                    }
                    catch (e) {

                        log.dump({
                            location: 'models mysql/users.js => getValidators => email',
                            e: se(e),
                        }, 5);

                        throw e;
                    }
                }),
            ]),
            enabled: new Required([
                new Type('bool'),
            ]),
        };

        let config = {};

        // telegram
        (
          typeof process.env.PROTECTED_TELEGRAM_TOKEN === 'string' &&
          process.env.PROTECTED_TELEGRAM_TOKEN.trim()
        ) && (function () {

            try {

                if (entity.config.telegram.id) { // field is not required

                    config.telegram = new Collection({
                        id: new Regex({
                            pattern     : /^-?\d+$/g, // required, type regex
                            message     : 'Value should be a number for regular user and negative number (with minus prefix) for bot',
                            match       : true, // true     - if value match regex then validation passed
                                                // false    - if value NOT match regex then validation passed
                        })
                    });
                }
            }
            catch (e) {}
        }());

        if (Object.keys(config).length > 0) {

            collection.config = new Collection(config);
        }
        else {
            collection.config = new Optional();
        }

        return new Collection(collection);
    },
}, table, id);