const poolsCollection = require('../../db').db().collection("pools");
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const timezone = require('moment-timezone');
const Comment = require('../models/Comment');
const sanitizeHtml = require('sanitize-html');

class Pool{
    constructor(data){
        this.data = data;
        this.errors = [];
    }



    cleanUp(){

        if(typeof(this.data.type) != 'string'){ this.data.type = '' }
        if(typeof(this.data.details) != 'string'){ this.data.details = '' } 

        this.data = {
            type: this.data.type,
            amount: parseFloat(this.data.amount),
            rent: parseFloat(this.data.rent),
            profit_netto: parseFloat(this.data.profit_netto),
            profitability: parseFloat(this.data.profitability),
            nr: parseInt(this.data.nr),
            details: sanitizeHtml(
                this.data.details.trim(),
                { allowedTags: ['strong', 'p', 'div', 'br'], allowedAttributes: {} }
            ),
            created_at: moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss')
        }
    }



    validate(){
        if(this.data.type == ''){
            this.errors.push('Podaj typ inwestycji');
        }

        if(this.data.details.length < 50){
            this.errors.push('Opis jest stanowczo za krótki');
        }
    }



    create(){
        return new Promise( (resolve, reject) => {
            this.cleanUp();
            this.validate();

            if(!this.errors.length){

                this.data.status = 'current';

                poolsCollection.insertOne(this.data)
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


    getPools(){
        return new Promise(async (resolve, reject) => {

            const pools = await poolsCollection.find().toArray();

            resolve(pools);
        });
    }


    getFinishedPools(){
        return new Promise(async (resolve, reject) => {

            const pools = await poolsCollection.find({status: 'finished'}).toArray();

            resolve(pools);
        });
    }


    getPoolById(id){

        return new Promise(async (resolve, reject) => {
    
           const pool = await poolsCollection.findOne({_id: ObjectID(id)})
    
           if(pool){

                const comment = new Comment();
                const comments= await comment.getComments(pool._id);

                pool.comments = comments;

                resolve(pool);
            } else{
                resolve(false);
            }
        });
    }



    getCurrent(){
        return new Promise( async (resolve, reject) => {

            const currentPool = await poolsCollection.findOne({ status: 'current' });

            if(currentPool){

                const comment = new Comment();
                const comments= await comment.getComments(currentPool._id);

                currentPool.comments = comments;

                resolve(currentPool);
            } else{
                resolve(false);
            }
            
        });
    }


    getLastFinishedPool(){
        return new Promise( async (resolve, reject) => {

            const pools = await poolsCollection.find({ status: 'finished' }).toArray();

            resolve(pools[pools.length-1]);
            
        });
    }


    edit(pool_id, body){
        return new Promise( async (resolve, reject) => {

            if(body.status == 'finished'){
                //aktualizacja statusu

                if(!this.errors.length){
                    await poolsCollection.findOneAndUpdate(
                        { _id: ObjectID(pool_id) },
                        { $set: {status: body.status} }
                    );
                    resolve('success');
                } else {
                    resolve('failure');
                }
            }
        });
    }
}

module.exports = Pool