const express = require('express');
const path = require('path');
const handlebars = require('express-handlebars');
const helpers = require('handlebars-helpers')();
const dotenv = require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const morgan = require('morgan');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
  app.engine('.hbs', handlebars.engine({
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: helpers
  }));
  app.set('view engine', '.hbs');
  app.use('/public', express.static(path.join(__dirname, 'public')));
  app.use('/img', express.static(path.join(__dirname, 'public/img')));
  app.use('/', require('./routes/routes'));
  app.use((req, res) => {
    res.render('error', {
      layout: 'main',
      errorCode: res.statusCode,
    });
  });
  app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
