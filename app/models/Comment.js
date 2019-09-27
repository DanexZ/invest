const commentsCollection = require('../../db').db().collection("comments");
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const timezone = require('moment-timezone');
const sanitizeHtml = require('sanitize-html');

class Comment{
    constructor(data, author_id, author_username){
        this.data = data;
        this.author_id = author_id;
        this.author_username = author_username;
        this.errors = [];
    }



    cleanUp(){
        if(typeof(this.data.content) != 'string'){ this.data.username = '' }
        if(typeof(this.data.email) != 'string'){ this.data.email = '' }
        if(typeof(this.data.password) != 'string'){ this.data.password = '' }

        //get rid of any bonus properties
        this.data = {
            author_id: ObjectID(this.data.author_id),
            author_username: this.author_username,
            commentable_id: ObjectID(this.data.commentable_id),
            content: sanitizeHtml(
                this.data.content.trim(),
                { allowedTags: [], allowedAttributes: {} }
            ),
            created_at: moment().tz('Europe/Warsaw').format('YYYY-MM-DD HH:mm:ss')
        }
    }



    validate(){
        if(this.data.content == ''){
            this.errors.push("Musisz podać treść");
        }
    }



    create(){
        return new Promise((resolve, reject) => {

            this.cleanUp();
            this.validate();

            if(!this.errors.length){

                commentsCollection.insertOne(this.data)
                .then(function(info){
                    resolve(info.ops[0]._id);
                })
                .catch(function(){
                    this.errors.push("Prosimy spróbować za chwilę");
                    reject(this.errors);
                });
                
            } else {
                reject(this.errors);
            }

        });
    }



    reusableCommentQuery(uniqueOperations, visitorId) {
        return new Promise( async (resolve, reject) => {

            let aggOperations = uniqueOperations.concat([
                { $lookup: {from: 'users', localField: "author_id", foreignField: "_id", as: "authorDocument"} },
                { $project: {
                    author_id: '$author_id',
                    author_username: 1,
                    content: 1,
                    created_at: 1,
                    author: {$arrayElemAt: ['$authorDocument', 0]}
                } }
            ]);

            let comments = await commentsCollection.aggregate(aggOperations).toArray();

            resolve(comments);
        });
    }



    getComments(commentable_id){
        return new Promise( async (resolve, reject) => {
            
            let comments = await this.reusableCommentQuery([
                 { $match: { commentable_id: ObjectID(commentable_id) } },
                 { $sort: { created_at: -1 } }
             ]);
 
             resolve(comments);
         });  
    }
}

module.exports = Comment