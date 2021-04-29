const express = require("express");
const app = express();
const bodyParser = require('body-parser');
require("dotenv").config();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())


//require route 

require('./routes/contact.route')(app)

//define the port 
const port = process.env.PORT || 8080;

module.exports =
app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`)
})