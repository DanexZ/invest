const Asset = require('../models/Asset');
const BillingPeriod = require('../models/BillingPeriod');
const AssetPeriodCosts = require('../models/AssetPeriodCosts');
const Functions = require('../Functions');
const functions = new Functions();

exports.create = (req, res) => {

    const backURL = req.header('Referer') || '/dashboard';
    const asset = new Asset(req.body);

    if(req.session.user.role != 'administrator'){

        req.flash('errors', "Nie masz uprawnień");

        return req.session.save(() => res.redirect(backURL));
    };
    

    asset.create()

    .then(async (data) => {

        //musi się utworzyć okres rzzliczeniowy jeśli go nie ma
        //następnie muszą się dodać statiCosts do tego okresu

        const period = functions.get_billing_period(data.created_at);
        console.log(period);

        const billingPeriod = new BillingPeriod();
        const period_id = await billingPeriod.create(period);

        const assetPeriodCosts = new AssetPeriodCosts();
        await assetPeriodCosts.create(data.asset_id, period_id, data.static_costs);


        req.flash('success', "Aktywo dodane!");
        req.session.save(() => res.redirect(backURL));
    })

    .catch((errors) => {
        console.log(errors);
        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(backURL));
    });
}