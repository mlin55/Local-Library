var Book = require('../models/book');
var async = require('async');
const {body, validationResult} = require('express-validator');

var Genre = require('../models/genre');
const genre = require('../models/genre');

// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find()
    .exec(function(err, list_genres) {
        if (err)
            return next(err);
        res.render('genre_list', {title: 'Genre List', genre_list: list_genres});
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    
    //Validate and sanitize name field
    body('name', 'Genre name required').trim().isLength({min: 1}).escape(),

    //Process request after validation and sanitization
    (req, res, next) => {
        //Extract validation errors from request
        const errors = validationResult(req);

        //Create genre object with escaped and trimmed data
        var genre = new Genre(
            {name: req.body.name}
        );

        if (!errors.isEmpty()) {
            //There are errors. Render the form again with sanitized values/error messages
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
            return;
        }
        else {
            //Data from form is valid
            //Check if Genre with same name already exists
            Genre.findOne({ 'name': req.body.name })
            .exec(function(err, found_genre) {
                if (err) {return next(err);}

                if (found_genre) {
                    //Genre exists, redirect to its detail page
                    res.redirect(found_genre.url);
                }
                else {
                    genre.save(function (err) {
                        if (err) { return next(err); }
                        //Genre saved. Redirect to genre detail page.
                        res.redirect(genre.url);
                    });
                }
            });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    //console.log('Reached here');
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        bookList: function(callback) {
            Book.find({ 'genre': req.params.id }).exec(callback)
        },
    },
        function(err, results) {
            if (err) {return next(err)};

            if (results.genre === null)
                res.redirect('/catalog/genres');
            
            res.render('genre_delete', {title: 'Delete Genres', genre: results.genre, bookList: results.bookList});
        }
    );
    
    //res.send('NOT IMPLEMENTED: Genre delete GET');
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback)
        },
        bookList: function(callback) {
            Book.find({ 'genre': req.body.genreid }).exec(callback)
        },
    },
        function(err, results) {
            if (err) {return next(err);}
            if (results.bookList.length > 0) {
                res.render('genre_delete', {title: 'Delete Genres', genre: results.genre, bookList: results.bookList});
                return;
            }
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) return next(err);
                res.redirect('/catalog/genres');
            });
        }
    
    );
    
    //res.send('NOT IMPLEMENTED: Genre delete POST');
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id).exec(
        function(err, genre) {
            if (err) return next(err);
            if (genre == null)
            {
                var err = new Erorr('Genre not found');
                err.status = 404;
                return next(err);
            }
            //Success
            res.render('genre_form', {title: 'Update Genre', genre: genre});
        }
    );
};

// Handle Genre update on POST.
exports.genre_update_post = [

    body('name', 'Genre name required').trim().isLength({min: 1}).escape(),
    (req, res, next) => {
        const errors = validationResult(req);

        var genre = new Genre({
            _id: req.params.id,
            name: req.body.name
        });

        if (!errors.isEmpty()) {
            res.render('genre_form', {title: 'Update Genre', genre: genre, errors: errors.array()});
            return;
        }
        else {
            //Valid data   
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, newgenre) {
                if (err) return next(err);
                //redirect
                res.redirect(newgenre.url);
            });
        }
    }

    //res.send('NOT IMPLEMENTED: Genre update POST');
];