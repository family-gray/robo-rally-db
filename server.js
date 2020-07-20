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

// endpoint to get all the actions in the database
app.get("/getUniqueCardText", (request, response) => {
  db.all("SELECT DISTINCT cardText from Actions", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
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

app.get("/createActions", (request, response) => {
  db.serialize(() => {
    db.run(
      "CREATE TABLE IF NOT EXISTS Actions" +
      "(id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL," + 
      "cardText TEXT NOT NULL," +
      "priority INTEGER NOT NULL," +
      "action CHAR(4) NOT NULL REFERENCES ActionTypes(action)," + 
      "unit INTEGER NOT NULL)"
    ).run(
      "CREATE TABLE IF NOT EXISTS ActionTypes" +
      "(action CHAR(4) PRIMARY KEY NOT NULL," + 
      "seq INTEGER UNIQUE)"
    ).run(
      "INSERT INTO ActionTypes(action,seq) VALUES ('TURN',1)"
    ).run(
      "INSERT INTO ActionTypes(action,seq) VALUES ('STEP',2)"  
    )
  });
  response.send({ message: "success" });
  console.log("New table Actions created!");
});

app.get("/dropActions", (request, response) => {
  db.serialize(() => {
    db.run("DROP TABLE Actions").run("DROP TABLE ActionTypes");
  });
  response.send({ message: "success" });
  console.log("table Actions deleted!");
});

function genActionsArray(
  cardText,
  priorityStart,
  priorityEnd,
  priorityIncrement,
  action,
  unit
) {
  var actionsArray = [];
  for (
    var priority = priorityStart;
    priority <= priorityEnd;
    priority += priorityIncrement
  ) {
    actionsArray.push([cardText, priority, action, unit]);
  }

  return actionsArray;
}

app.get("/loadDefaultActions", (request, response) => {
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    let actions = genActionsArray("U-Turn", 10, 60, 10, "TURN", 180)
      .concat(genActionsArray("Rotate Right", 80, 420, 20, "TURN", 90))
      .concat(genActionsArray("Rotate Left", 70, 410, 20, "TURN", -90))
      .concat(genActionsArray("Back Up", 430, 480, 10, "STEP", -1))
      .concat(genActionsArray("Move 1", 430, 480, 10, "STEP", 1))
      .concat(genActionsArray("Move 2", 490, 780, 10, "STEP", 2))
      .concat(genActionsArray("Move 3", 790, 840, 10, "STEP", 3));
    console.log(JSON.stringify(actions));

    // create the statement for the insertion of just ONE record
    let actionQuery =
      "INSERT INTO Actions (cardText, priority, action, unit) " +
      "VALUES (?, ?, ?, ?)";

    // 'prepare' returns a 'statement' object which allows us to
    // bind the same query to different parameters each time we run it
    let statement = db.prepare(actionQuery);

    // run the query over and over for each inner array
    for (var i = 0; i < actions.length; i++) {
      statement.run(actions[i], err => {});
    }

    // 'finalize' basically kills our ability to call .run(...) on the 'statement'
    // object again. Optional.
    statement.finalize();

    response.send({ message: "success" });
    // If I call statement.run( ... ) here again, I will get an error due
    // to the 'finalize' call above.
  }
});

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
