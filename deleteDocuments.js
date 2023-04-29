const mongoose = require('mongoose');
const userArgs = process.argv.slice(2);
const BookInstance = require('./models/book');

mongoose.set("strictQuery", false);
const mongoDB = userArgs[0];

const books = [];
const bookinstances = [];

main().catch((err) => console.log(err));
async function main() {
    console.log('About to connect');
    await mongoose.connect(mongoDB);
    console.log('debug: should be connected?');
    await createBookInstances();
    console.log('debug: closing mongoose');
    mongoose.connection.close();
}

async function bookInstanceCreate(book, imprint, due_back, status) {
    bookinstancedetail = {
        book: book,
        imprint: imprint,
    };
    if (due_back != false) bookinstancedetail.due_back = due_back;
    if (status != false) bookinstancedetail.status = status;

    const bookinstance = new BookInstance(bookinstancedetail);
    await bookinstance.save();
    bookinstances.push(bookinstance);
    console.log(`Added bookinstance: ${imprint}`);
}

async function createBookInstances() {
    console.log("Adding authors");
    await Promise.all([
        bookInstanceCreate(books[0], "London Gollancz, 2014.", false, "Available"),
        bookInstanceCreate(books[1], " Gollancz, 2011.", false, "Loaned"),
        bookInstanceCreate(books[2], " Gollancz, 2015.", false, false),
        bookInstanceCreate(
            books[3],
            "New York Tom Doherty Associates, 2016.",
            false,
            "Available"
        ),
        bookInstanceCreate(
            books[3],
            "New York Tom Doherty Associates, 2016.",
            false,
            "Available"
        ),
        bookInstanceCreate(
            books[3],
            "New York Tom Doherty Associates, 2016.",
            false,
            "Available"
        ),
        bookInstanceCreate(
            books[4],
            "New York, NY Tom Doherty Associates, LLC, 2015.",
            false,
            "Available"
        ),
        bookInstanceCreate(
            books[4],
            "New York, NY Tom Doherty Associates, LLC, 2015.",
            false,
            "Maintenance"
        ),
        bookInstanceCreate(
            books[4],
            "New York, NY Tom Doherty Associates, LLC, 2015.",
            false,
            "Loaned"
        ),
        bookInstanceCreate(books[0], "Imprint XXX2", false, false),
        bookInstanceCreate(books[1], "Imprint XXX3", false, false),
    ]);
}