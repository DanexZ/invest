const BillingPeriod = require('../models/BillingPeriod');
const Functions = require('../Functions');
const functions = new Functions();

exports.home = async function(req, res){

    res.render('frontend/home', {
        regErrors: req.flash('regErrors')
    });

}

exports.makeBillingPeriod = async function(req, res){

    const period = functions.get_billing_period('2019-10-16');

    const billingPeriod = new BillingPeriod();
    billingPeriod.create(period);
}



