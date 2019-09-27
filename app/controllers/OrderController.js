const Order = require('../models/Order');

exports.create = (req, res) => {

    const backURL = req.header('Referer') || '/dashboard';

    console.log(req.session.user)

    if(req.session.user.status != 'new'){
        
        const order = new Order();

        order.create(req.session.user._id, req.params.id, req.params.type)

        .then((order_id) => {

            req.flash('success', "Zamówienie zostało złożone i dodane do Twoich zamówień");
            req.session.save(() => res.redirect(backURL));
        })

        .catch((errors) => {
            console.log(errors);
            errors.forEach(error => req.flash('errors', error));
            req.session.save(() => res.redirect(backURL));
        });
    } else {
        req.flash('errors', 'Zweryfikuj swoje dane aby móc złożyć rezerwację/zamówienie');
        req.session.save(() => res.redirect(backURL));
    }
 
}