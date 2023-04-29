const Genre = require('../models/genre');
const Book = require('../models/book');

const { body, validationResult } = require('express-validator');

const asyncHandler = require('express-async-handler');
const async = require('async');

// display list of all Genre
exports.genre_list = asyncHandler(async (req, res, next) => {
    Genre.find()
        .sort([['name', 'ascending']])
        .exec(function (err, list_genres) {
            if (err) {
                return next(err);
            }
            res.render('genre_list', {
                title: 'Genre List',
                genre_list: list_genres
            });
        });
});

// display detail page for a specific Genre
exports.genre_detail = asyncHandler(async (req, res, next) => {
    // gets details of genres and all associated books (in parallel)
    const [genre, booksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, 'title summary').exec()
    ]);

    if (genre === null) {
        const err = new Error('Genre not found'); // no results
        err.status = 404;
        return next(err);
    }

    res.render('genre_detail', {
        title: 'Genre Detail',
        genre: genre,
        genre_books: booksInGenre
    });
});

// display genre create form on GET
exports.genre_create_get = (req, res, next) => {
    res.render('genre_form', { title: 'Create Genre' });
};

// handle genre create on POST 
exports.genre_create_post = [
    // validate and sanitize the date field
    body('name', 'Genre name must contain at least 3 characters')
        .trim()
        .isLength({ min: 3 })
        .escape(),

    // process request after validation and sanitization
    asyncHandler(async (req, res, next) => {
        // extract the validation errors from a request 
        const errors = validationResult(req);

        // create a genre object with escaped and trimed data
        const genre = new Genre({ name: req.body.name });

        if (!errors.isEmpty()) {
            // there are errors. Render the form agin with sanitized values/error messages.
            res.render('genre_form', {
                title: 'Create Genre',
                genre: genre,
                errors: errors.array(),
            });
            return;
        } else {
            // data from form is valid
            // check if Genre with same name already exists
            const genreExists = await Genre.findOne({ name: req.body.name }).exec();
            if (genreExists) {
                // genre exists, redirect to its detail page 
                res.redirect(genreExists.url);
            } else {
                await genre.save();
                // new genre saved. Redirect to genre detail page
                res.redirect(genre.url);
            }
        }
    }),
];

// display genre delete form on GET
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
    const [genre, allBooksByGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, 'title summary').exec()
    ]);

    if (genre === null) {
        res.redirect('/catalog/genres');
    }

    res.render('genre_delete', {
        title: 'Delete Genre',
        genre: genre,
        books: allBooksByGenre
    });
});

// handle genre delete on POST
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
    const [genre, allBooksByGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, 'title summary').exec()
    ]);

    if (allBooksByGenre.length > 0) {
        res.render('genre_delete', {
            title: 'Delete Genre',
            genre: genre,
            books: allBooksByGenre
        });
        return;
    } else {
        await Genre.findByIdAndRemove(req.body.genreid);
        res.redirect('/catalog/genres');
    }
});

// display genre update form on GET
exports.genre_update_get = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Genre update GET");
});

// handle genre update on POST
exports.genre_update_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Genre update POST");
});