const AssetClient = require('../models/AssetClient');
const Asset = require('../models/Asset');
const Order = require('../models/Order');

exports.update = (req, res) => {

    const backURL = req.header('Referer') || '/dashboard';

    if(req.session.user.role != 'administrator'){

        req.flash('errors', "Nie masz uprawnień");

        return req.session.save(() => res.redirect(backURL));
    };

    const assetClient = new AssetClient();
    assetClient.update(req.body.asset_id, req.body.client_id)
  

    .then(async (status) => {

        const order = new Order();
        await order.update(req.body.order_id, req.body.status);

        const asset = new Asset();

        let state = 'zajęte';

        if(req.body.type == 'Kawalerka'){
            state = 'zajęta';
        }

        await asset.updateState(req.body.asset_id, state);
        

        req.flash('success', "Aktywo zostało przydzielone do klienta!");
        req.session.save(() => res.redirect(backURL));
    })

    .catch((errors) => {
        console.log(errors);
        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(backURL));
    });
}