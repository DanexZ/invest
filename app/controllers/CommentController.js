const Comment = require('../models/Comment');

exports.create = async (req, res) => {

    let comment = new Comment(req.body, req.session.user._id, req.session.user.username);

    comment.create()

    .then((comment_id) => {

        const backURL = req.header('Referer') || '/dashboard';

        req.flash('success', "Komentarz został dodany");
        req.session.save(() => res.redirect(backURL));

    })

    .catch((errors) => {
        console.log(errors);
        const backURL = req.header('Referer') || '/dashboard';

        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(backURL));
    });

}