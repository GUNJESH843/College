const multer = require('multer');
const path = require('path');
const Book = require('../models/Book');
const flash = require('connect-flash');
const app = require('express')();


// Set Storage Engine
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
}).single('coverPage');

// Render the page to create a new book
exports.renderCreateBook = async (req, res) => {
  const books = await Book.find({ user_id: req.session.userId });
  res.render('books', { books });
};

// Handle the creation of a new book
exports.createBook = (req, res) => {
  upload(req, res, async (err) => {
    console.log('Form data received:', req.body); // Debug form data
    console.log('File uploaded:', req.file); // Debug file upload

    if (err) {
      console.log('Multer error:', err); // Log Multer errors
      return res.render('books', { msg: err });
    } else {
      if (!req.file) {
        console.log('No file uploaded!'); // Log when no file is uploaded
        return res.render('books', { msg: 'No file uploaded!' });
      } else {
        const { title, description, publishYear, author } = req.body;
        const coverPagePath = `/uploads/${req.file.filename}`;

        try {
          const newBook = new Book({
            user_id: req.session.userId,
            title,
            description,
            publishYear,
            author,
            coverPagePath
          });
          
          await newBook.save();
          console.log('Book saved:', newBook); // Log book save success
          req.flash('success_msg', 'Book created successfully');
          return res.redirect('/books');
        } catch (error) {
          console.log('Error saving book to the database:', error); // Log any DB error
          req.flash('error_msg', 'Error: ' + error.message);
          return res.redirect('/books');
        }
      }
    }
  });
};



// Render the page to edit a book
exports.renderEditBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (book.user_id.toString() === req.session.userId) {
    res.render('edit-book', { book });
  } else {
    res.redirect('/books');
  }
};

// Handle updating a book
exports.updateBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (book.user_id.toString() === req.session.userId) {
    await Book.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/books');
  } else {
    res.redirect('/books');
  }
};

// Handle deleting a book
exports.deleteBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (book.user_id.toString() === req.session.userId) {
    await Book.findByIdAndDelete(req.params.id);
  }
  res.redirect('/books');
};

// Render a single book view
exports.renderViewBook = async (req, res) => {
  const book = await Book.findById(req.params.id).populate('user_id');
  res.render('view-book', { book });
};

// Render all books
exports.renderAllBooks = async (req, res) => {
  const books = await Book.find({});
  res.render('all-books', { books });
};

// Search for books
exports.searchBooks = async (req, res) => {
  const { query } = req.query;
  const books = await Book.find({ title: { $regex: query, $options: 'i' } });
  res.render('all-books', { books });
};
