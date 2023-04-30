const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');

const asyncHandler = require('express-async-handler');

const { body, validationResult } = require('express-validator');
const bookinstance = require('../models/bookinstance');

// display list of all BookInstances
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if (err) {
                return next(err);
            }
            res.render('bookinstance_list', {
                title: 'Book Instance List',
                bookinstance_list: list_bookinstances
            });
        });
});

// display detail page for a specific BookInstance
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate('book')
        .exec();

    if (bookInstance === null) {
        // no results 
        const err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
    }

    res.render('bookinstance_detail', {
        title: 'Book:',
        bookinstance: bookInstance
    });
});

// display BookInstance create form on GET
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, 'title').exec();

    res.render('bookinstance_form', {
        title: 'Create BookInstance',
        book_list: allBooks,
    });
});

// handle bookInstance create on POST  // book - imprint - status
exports.bookinstance_create_post = [
    body('book', 'book must be specified')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('imprint', 'Imprint must be specified')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('status').escape(),
    body('due_back', 'Invalid date')
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    // process request after validation and sanitization 
    asyncHandler(async (req, res, next) => {
        // extract the validation errors from request 
        const errors = validationResult(req);

        // create a Book Instance object with escaped and trimed data
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()) {
            // there are errors
            // render form again with sanitized data and error messages
            const allBooks = await Book.find({}, 'title').exec();

            res.render('bookinstance_form', {
                title: 'Create BookInstance',
                book_list: allBooks,
                selected_book: bookInstance.book._id,
                errors: errors.array(),
                bookinstance: bookInstance,
            });
            return;
        } else {
            // data from form is valid
            await bookInstance.save();
            res.redirect(bookInstance.url)
        }
    }),
];

// display bookInstance delete form on GET
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id).populate('book').exec();

    if (bookInstance === null) {
        // no results 
        res.redirect('/catalog/bookinstances');
    }

    res.render('bookinstance_delete', {
        title: 'Delete Book Instance',
        bookinstance: bookInstance
    });
});

// handle bookInstance delete on POST
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    await BookInstance.findByIdAndRemove(req.body.id);
    res.redirect('/catalog/bookinstances');
});

// display bookInstance update form on GET
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    const [bookInstance, allBooks] = await Promise.all([
        BookInstance.findById(req.params.id).populate('book').exec(),
        Book.find()
    ]);

    if (bookInstance === null) {
        // no results
        const error = new Error('Book copy not found');
        error.status = 404;
        return next(error);
    }

    res.render('bookinstance_form', {
        title: 'Book Instance Update',
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        bookinstance: bookInstance
    });
});

// handle bookInstance upadate on POST
exports.bookinstance_update_post = [
    body('imprint', 'Title must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('status', 'Status must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('dueback', 'Dueback must not be empty.')
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.dueback,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {

            const allBooks = await Book.find({}, 'title').exec();

            res.render('bookinstance_form', {
                title: 'Update BookInstance',
                book_list: allBooks,
                selected_book: bookInstance.book._id,
                bookinstance: bookInstance,
                errors: errors.array()
            });
            return;
        } else {
            await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
            res.redirect(bookInstance.url);
        }
    }),
];

// deploying to production - part VII



