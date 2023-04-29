const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

const { body, validationResult } = require('express-validator');

const asyncHandler = require('express-async-handler');
const async = require('async');

exports.index = asyncHandler(async (req, res, next) => {
    async.parallel(
        {
            book_count(callback) {
                Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
            },
            book_instance_count(callback) {
                BookInstance.countDocuments({}, callback);
            },
            book_instance_available_count(callback) {
                BookInstance.countDocuments({ status: "Available" }, callback);
            },
            author_count(callback) {
                Author.countDocuments({}, callback);
            },
            genre_count(callback) {
                Genre.countDocuments({}, callback);
            },
        },
        (err, results) => {
            res.render("index", {
                title: "Local Library Home",
                error: err,
                data: results,
            });
        }
    );
});

// display list of all Books
exports.book_list = asyncHandler(async (req, res, next) => {
    Book.find({}, "title author")
        .sort({ title: 1 })
        .populate("author")
        .exec(function (err, list_books) {
            if (err) {
                return next(err);
            }
            res.render("book_list", { title: "Book List", book_list: list_books });
        });
});

// display detail page of a specific Book
exports.book_detail = asyncHandler(async (req, res, next) => {
    // get details of books, book instances for specific book
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id).populate('author').populate('genre').exec(),
        BookInstance.find({ book: req.params.id }).exec()
    ]);

    if (book === null) {
        const err = new Error('Book nof found'); // no results
        err.status = 404;
        return next(err);
    }

    res.render('book_detail', {
        title: book.title,
        book: book,
        book_instances: bookInstances
    });
});

// display Book create form on GET
exports.book_create_get = asyncHandler(async (req, res, next) => {
    // get all author and genres, wich we can use for adding to our book.
    const [allAuthors, allGenres] = await Promise.all([
        Author.find().exec(),
        Genre.find().exec()
    ]);

    res.render('book_form', {
        title: 'Create Book',
        authors: allAuthors,
        genres: allGenres
    });
});

// handle Book create on POST
exports.book_create_post = [
    // convert the genre to an array 
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') req.body.genre = [];
            else req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // validate and sanitize fields 
    body('title', 'Title must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('author', 'Author must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('summary', 'Summary must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('isbn', 'ISBN must not be empty')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('genre.*')
        .escape(),

    // process request after validation and sanitization

    asyncHandler(async (req, res, next) => {
        // extract the validation errors from a request
        const errors = validationResult(req);

        // created a book object with escaped and timmed data
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        });

        if (!errors.isEmpty()) {
            // there are errors, render form again with sanitized value/error messages
            // get all authors and genres for form

            const [allAuthors, allGenres] = await Promise.all([
                Author.find().exec(),
                Genre.find().exec()
            ]);

            // mark our selected genres as checked 
            for (const genre of allGenres) {
                if (book.genre.indexOf(genre._id) > - 1) {
                    genre.checked = 'true';
                }
            }

            res.render('book_form', {
                title: 'Create Book',
                authors: allAuthors,
                genres: allGenres,
                book: book,
                errors: errors.array()
            });
        } else {
            // data from form is valid, save book
            await book.save();
            res.redirect(book.url);
        }
    }),
];

// display Book delete form on GET
exports.book_delete_get = asyncHandler(async (req, res, next) => {
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id).populate('author').populate('genre').exec(),
        BookInstance.find({ book: req.params.id }).exec()
    ]);

    if (book === null) {
        res.redirect('/catalog/books');
    }

    res.render('book_delete', {
        title: 'Delete Book',
        book: book,
        book_instances: bookInstances
    });

});

// handle Book delete on POST
exports.book_delete_post = asyncHandler(async (req, res, next) => {
    const [book, allBookInstances] = await Promise.all([
        Book.findById(req.params.id).populate('author').populate('genre').exec(),
        BookInstance.find({ book: req.params.id }, 'title').exec()
    ]);

    if (book === null) {
        res.redirect('/catalog/books');
    }

    if (allBookInstances.length > 0) {
        // book has bookinstance
        res.render('book_delete', {
            title: 'Delete Book',
            book: book,
            book_instances: allBookInstances
        });
        return;
    } else {
        // book has no bookinstance
        await Book.findByIdAndRemove(req.body.id);
        res.redirect('/catalog/books');
    }

});

// display Book update form on GET
exports.book_update_get = asyncHandler(async (req, res, next) => {
    // get book, authors and genres for form 
    const [book, allAuthors, allGenres] = await Promise.all([
        Book.findById(req.params.id).populate('author').populate('genre').exec(),
        Author.find().exec(),
        Genre.find().exec()
    ]);

    if (book === null) {
        // no results
        const error = new Error('Book not found');
        error.status = 404;
        return next();
    }

    // mark our selected genres as checked
    for (const genre of allGenres) {
        for (const book_g of book.genre) {
            if (genre._id.toString() === book_g._id.toString()) {
                genre.checked = 'true';
            }
        }
    }

    res.render('book_form', {
        title: 'Update Book',
        authors: allAuthors,
        genres: allGenres,
        book: book,
    });
});

// handle Book update on POST 
exports.book_update_post = [
    // convert the genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undfined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },

    // validate and sanitize fields
    body('title', 'Title must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('author', 'Author must not be empty')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('summary', 'Summary must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('isbn', 'ISBN must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization
    asyncHandler(async (req, res, next) => {
        // extract the validation errors from a request.
        const errors = validationResult(req);

        // create a Book object with escaped/trimmed data and old id.
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: typeof req.body.genre === 'undefined' ? [] : req.body.genre,
            _id: req.params.id, // this is required, or a new ID will be assigned !
        });

        if (!errors.isEmpty()) {
            // there are errors. Render form again with sanitized values/error messages
            // get all authors and genres from form 
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().exec(),
                Genre.find().exec()
            ]);

            // mark our selected genres as checked 
            for (const genre of allGenres) {
                if (book.genre.indexOf(genres._id) > -1) {
                    genre.checked = 'true';
                }
            }
            res.render('book_form', {
                title: req.body.title,
                authors: allAuthors,
                genres: allGenres,
                book: book,
                errors: errors.array(),
            });
            return;
        } else {
            // data from form is valid, Update the record
            const thebook = await Book.findByIdAndUpdate(req.params.id, book, {});
            res.redirect(thebook.url);
        }
    })
];