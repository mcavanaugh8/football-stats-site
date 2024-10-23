const express = require('express');
const path = require('path');
const handlebars = require('express-handlebars');
const helpers = require('handlebars-helpers')();
const dotenv = require('dotenv').config();
const passport = require('passport');
const morgan = require('morgan');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 3000;

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@football-stats-data.vdolk.mongodb.net/football_data?retryWrites=true&w=majority&appName=football-stats-data`;

// mongoose.connect(uri, {
//     dbName: 'football_data',
//   })
//   .then((result) => {
    console.log('Connected to DB!');
  
    app.use(express.json()); 
    app.use(express.urlencoded({ extended: true }));
    
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
      }
      app.engine('.hbs', handlebars.engine({
        defaultLayout: 'main',
        extname: '.hbs',
        helpers: {
          ...helpers, // Spread existing helpers
          json: function(context) {
            return JSON.stringify(context);
          }
        }
      }));
      app.set('view engine', '.hbs');
      app.use('/public', express.static(path.join(__dirname, 'public')));
      app.use('/img', express.static(path.join(__dirname, 'public/img')));
      app.use('/api', express.json());
      app.use('/', require('./routes/routes'));
      app.use((req, res) => {
        res.render('error', {
          layout: 'main',
          errorCode: res.statusCode,
        });
      });
      app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
    
      // })
  // .catch((err) => {
  //   console.error('ERR: Failed to connect to DB:', err);
  // });
