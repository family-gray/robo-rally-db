// server.js
// where your node app starts

// init project
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// init sqlite db
const dbFile = "./.data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {    
    db.run(
      "CREATE TABLE IF NOT EXISTS Actions (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT, priority INTEGER)"
    )
    console.log("New table Actions created!");

    
  } else {
    console.log('Database "Actions" ready to go!');

    db.each("SELECT * from Actions", (err, row) => {
      if (row) {
        console.log(`record: ${row.action}, ${row.priority}` );
      }
    });
  }
});


// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

// endpoint to get all the actions in the database
app.get("/getActions", (request, response) => {
  db.all("SELECT * from Actions", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

// endpoint to add a dream to the database
app.post("/addAction", (request, response) => {
  console.log(`add to actions ${request.body.action}`);

  // DISALLOW_WRITE is an ENV variable that gets reset for new projects
  // so they can write to the database
  if (!process.env.DISALLOW_WRITE) {
    const cleansedAction = cleanseString(request.body.action);
    console.log("insert:", cleansedAction, " with priority:", request.body.priority);
    db.run(`INSERT INTO Actions (action, priority) VALUES (?, ?)`, [cleansedAction, request.body.priority], error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
      }
    });
  }
});

// endpoint to clear dreams from the database
app.get("/clearActions", (request, response) => {
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    db.each(
      "SELECT * from Actions",
      (err, row) => {
        console.log("row", row);
        db.run(`DELETE FROM Actions WHERE ID=?`, row.id, error => {
          if (row) {
            console.log(`deleted row ${row.id}`);
          }
        });
      },
      err => {
        if (err) {
          response.send({ message: "error!" });
        } else {
          response.send({ message: "success" });
        }
      }
    );
  }
});

app.get("/loadDefaultActions", (request, response) => {
 // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
   
  let actions = [
     ["Move 3", 830],
     ["Move 3", 780],
     ["Move 2", 660],
     ["Move 3", 680],
  ];

    console.log(JSON.stringify(actions));

  // create the statement for the insertion of just ONE record
  let actionQuery = 
     "INSERT INTO Actions (action, priority) " +
     "VALUES (?, ?)"; 

  // 'prepare' returns a 'statement' object which allows us to 
  // bind the same query to different parameters each time we run it
  let statement = db.prepare(actionQuery);

  // run the query over and over for each inner array
  for (var i = 0; i < actions.length; i++) {
      statement.run(actions[i], err => {
               
      });
  }
    
  // 'finalize' basically kills our ability to call .run(...) on the 'statement'
  // object again. Optional.
  statement.finalize();

  response.send({ message: "success" });    
  // If I call statement.run( ... ) here again, I will get an error due 
  // to the 'finalize' call above.      
  }
});


// helper function that prevents html/css/script malice
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});