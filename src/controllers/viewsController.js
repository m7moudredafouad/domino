exports.getMain = (req, res, next) => {
    try{
        if(req.query.room){
            return res.render('game', {
                room: req.query.room,
                name: req.query.name,
            })
        }
        
        res.render('index')
    } catch(err){
        next(err)
    }
}

exports.getSingle = (req, res, next) => {
    try{
        res.render('single')
    } catch(err){
        next(err)
    }
}