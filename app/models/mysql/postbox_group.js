
const abstract          = require('knex-abstract');

const { Opt }           = abstract;

const extend            = abstract.extend;

const prototype         = abstract.prototype;

const log               = require('inspc');

const fs                = require('fs');

const path              = require('path');

const a                 = prototype.a;

const isObject          = require('nlab/isObject');

const se = require('nlab/se');

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

const table             = 'postbox_group';

const id                = 'id';

module.exports = knex => extend(knex, prototype, {
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
            // name: '',
            // users: [],
            // enabled: true,
            ...extra,
        }
    },
    fromDb: async function (row, opt, trx) {

        if ( ! isObject(row) ) {

            return row;
        }

        return row;
    },
    toDb: async function (row, opt, trx) {

        if ( ! isObject(row) ) {

            return row;
        }

        return row;
    },
    // updateUsers: async function (...args) {
    //
    //     let [debug, trx, groupId, usersIds] = a(args);
    //
    //     log.dump({
    //         groupId,
    //         usersIds,
    //     })
    //
    //     await this.clearUsers(debug, trx, groupId);
    //
    //     log.dump({
    //         list: await this.query(true, trx, 'select * from user_group where group_id = :id', {
    //             id: groupId,
    //         })
    //     })
    //
    //     if (Array.isArray(usersIds)) {
    //
    //         for (let user_id of usersIds) {
    //
    //             await knex.model.user_groups.insert(true, trx, {
    //                 group_id: groupId,
    //                 user_id,
    //             })
    //         }
    //     }
    // },
    // clearUsers: async function(...args) {
    //
    //     let [debug, trx, groupId] = a(args);
    //
    //     return await this.query(debug, trx, `delete from user_group where group_id = :id`, {
    //         id: groupId,
    //     });
    // },
    update: async function (...args) {

        let [debug, trx, entity, id] = a(args);

        return await this.transactify(trx, async trx => {

            const {
                users = [],
              ...rest
            } = entity;

            // log.dump({
            //     users_update: users,
            //     rest
            // })
            //
            // await this.updateUsers(debug, trx, id, users);

            return prototype.prototype.update.call(this, debug, trx, rest, id);
        });
    },
    insert: async function (...args) {

        let [debug, trx, entity] = a(args);

        return await this.transactify(trx, async trx => {

            // let users = [];
            //
            // if (Array.isArray(entity.users)) {
            //
            //     users = entity.users;
            // }
            //
            // entity = this.toDb(Object.assign({}, entity));

            const id = await prototype.prototype.insert.call(this, debug, trx, entity);

            // log.dump({
            //     group_id: id
            // })
            //
            // if (users) {
            //
            //     await this.updateUsers(trx, id, users);
            // }

            return id;
        });
    },
    delete: async function (id, ...args) {

        // await this.clearUsers(id);

        return await prototype.prototype.delete.call(this, id, ...args);
    },
//     find: async function (...args) {
//
//         let [debug, trx, id] = a(args);
//
//         if ( ! id ) {
//
//             throw `groups.js::find(): id not specified or invalid`;
//         }
//
//         const query = `
// select              g.*, group_concat(ug.user_id) users
// from                \`group\` g
//           left join user_group ug
//                  on g.id = ug.group_id
// where               g.id = :id
// GROUP BY            g.id
// ORDER BY            id desc
//         `;
//
//         const params = {id};
//
//         const data = await this.queryOne(Opt({
//             ...debug,
//             both: false,
//         }), trx, query, params);
//
//         return this.fromDb(data);
//     },
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
    prepareToValidate: function (data = {}, mode) {

        data = {...data};

        // if (typeof data.id !== 'undefined') {
        //
        //     delete data.id;
        // }

        // delete data.created;
        //
        // delete data.updated;

        // delete data.label;
        //
        // delete data.password;

        return data;
    },
    getValidators: function (mode, id, entityPrepared) {

        const collection = {
            id: new Optional(),
            // users: new Optional(),
            // name: new Required([
            //     new NotBlank(),
            //     new Length({max: 50}),
            // ]),
            // lastName: new Required([
            //     new NotBlank(),
            //     new Length({max: 50}),
            // ]),
            // // password: new Required([
            // //     new NotBlank(),
            // //     new Length({max: 255}),
            // // ]),
            // email: new Required([
            //     new NotBlank(),
            //     new Email(),
            //     new Length({max: 255}),
            // ]),
            // enabled: new Required([
            //     new Type('bool'),
            // ]),
        };

        return new Collection(collection);
    },
}, table, id);