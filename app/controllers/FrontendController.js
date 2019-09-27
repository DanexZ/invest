
exports.home = async function(req, res){

    res.render('frontend/home', {
        regErrors: req.flash('regErrors')
    });

}


