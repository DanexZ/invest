const ordersCollection = require('../../db').db().collection("orders");
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const timezone = require('moment-timezone');


class Order{
    constructor(){
        this.data = {};
        this.errors = [];
    }


    create(user_id, orderable_id, type){
        return new Promise(async (resolve, reject) => {

            if(typeof(type) != 'string'){
                this.data.type = '';
                this.errors.push('Wykryto manipulację');
            }

            const userOrders = await this.getUserOrders(user_id);

            for(let i=0; i<userOrders.length; i++){
                if( userOrders[i].orderable_id == orderable_id){
                    this.errors.push('Posiadasz już ten produkt w zamówieniach');
                }
            }

            this.data.author_id = ObjectID(user_id);
            this.data.orderable_id = ObjectID(orderable_id);
            this.data.orderable_type = type;
            this.data.status = 'new';
            this.data.created_at = moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss')

            if(!this.errors.length){

                ordersCollection.insertOne(this.data)
                .then(function(info){
                    resolve(info.ops[0]._id);
                })
                .catch(function(){
                    this.errors.push("Please try later");
                    reject(this.errors);
                });
                
            } else {
                reject(this.errors);
            }
        });
    }



    reusableOrderQuery(uniqueOperations) {
        return new Promise( async (resolve, reject) => {

            let aggOperations = uniqueOperations.concat([
                { $lookup: {from: 'users', localField: "author_id", foreignField: "_id", as: "authorDocument"} },
                { $project: {
                    orderable_id: 1,
                    orderable_type: 1,
                    status: 1,
                    created_at: 1,
                    author: {$arrayElemAt: ['$authorDocument', 0]}
                } }
            ]);

            let orders = await ordersCollection.aggregate(aggOperations).toArray();

            resolve(orders);
        });
    }



    all(){
        return new Promise( async (resolve, reject) => {
            
            let orders = await this.reusableOrderQuery([
                 { $sort: { created_at: -1 } }
             ]);
 
             resolve(orders);
         });  
    }



    getUserOrders(user_id){
        return new Promise( async (resolve, reject) => {
            
            let orders = await this.reusableOrderQuery([
                { $match: { author_id: ObjectID(user_id)}},
                { $sort: { created_at: -1 } }
             ]);
 
             resolve(orders);
         });  
    }



    update(order_id, status){
        return new Promise(async (resolve, reject) => {
            await ordersCollection.findOneAndUpdate(
                { _id: ObjectID(order_id) },
                { $set: {status: status} }
            );
            resolve('success');
        });
    }

}

module.exports = Order