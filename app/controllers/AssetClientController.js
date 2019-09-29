const AssetClient = require('../models/AssetClient');

exports.update = (req, res) => {

    const backURL = req.header('Referer') || '/dashboard';

    if(req.session.user.role != 'administrator'){

        req.flash('errors', "Nie masz uprawnień");

        return req.session.save(() => res.redirect(backURL));
    };

    const assetClient = new AssetClient();
    assetClient.update(req.body.asset_id, req.body.client_id)
  

    .then((status) => {

        req.flash('success', "Aktywo zostało przydzielone do klienta!");
        req.session.save(() => res.redirect(backURL));
    })

    .catch((errors) => {
        console.log(errors);
        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(backURL));
    });
}