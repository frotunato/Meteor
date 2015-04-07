var spawn = require('child_process').spawn;
var async = require('async');

module.exports = function (io, db) {


  db.run('CREATE TABLE IF NOT EXISTS meteor (temperature INT, humidity INT, timestamp INTEGER, delay INT)');

  function insertToDB (value) {
    var entry = db.prepare('INSERT INTO meteor VALUES(?, ?, ?, ?)');
    entry.run(value.temperature, value.humidity, value.timestamp, value.delay);
    entry.finalize();
  }

  (function getLastInsert () {
    db.get('SELECT timestamp FROM meteor WHERE timestamp = (SELECT MAX (timestamp) FROM meteor)', function (err, row) {
      last.insert = row.timestamp;
    });
  })();

  function query (hours, cb) {
    var margin = Date.now() - (hours * 3600000);
    db.all('SELECT rowid as id, temperature, humidity, delay, timestamp FROM meteor WHERE timestamp > ' + margin, function (err, rows) {
      if (hours === 1) {
        cb(err, rows);
      } else {
        console.log('Entries for', hours, 'hours:', rows.length);
        var res = [];

        for (var i = rows.length - 1; i >= 0; i--) {
          if (i % Math.round(rows.length / 60) === 0) {
            res.push(rows[i]);
          }
        }
        cb(err, res);
      }
    });
  }

/*
  db.serialize(function () {
    //db.run('CREATE TABLE Data (cosa TEXT)');
    /*
    var stmt = db.prepare('INSERT INTO Data VALUES (?)');
    var rnd;
    for (var i = 9; i >= 0; i--) {
      rnd = Math.floor(Math.random());
      stmt.run('Cosa #' + rnd);
    }
    */

    //stmt.finalize();
  /*
    db.each('SELECT rowid AS id, cosa FROM Data', function (err, row) {
      console.log(row.id, ':', row.cosa);
    });
  });
*/

  var cache = {
    hourly: {time: null, data: null},
    halfDay: {time: null, data: null},
    fullDay: {time: null, data: null}
  };

  var last = {
    insert: null,
    measure: null,
    hourlyUpdate: null,
    halfDayUpdate: null,
    fullDayUpdate: null
  };

  return {
    start: function () {
      var tempServer = spawn('python', ['temp.py'], {cwd: __dirname});
 
      tempServer.stdout.on('data', function (stdout) {
        incomingData = JSON.parse(stdout + "");

        if (last.insert && incomingData.timestamp - last.insert >= 60000) {
          insertToDB(incomingData);
          last.insert = Date.now();
          last.horlyUpdate = Date.now();
          io.emit('hourly_update', incomingData);
        }

        if (!last.halfDayUpdate || incomingData.timestamp - last.halfDayUpdate >= 600000) {
          console.log('half day updated', new Date(Date.now()));
          last.halfDayUpdate = Date.now();
          io.emit('halfDay_update', incomingData);
        }

        if (!last.fullDayUpdate || incomingData.timestamp - last.fullDayUpdate >= 1200000) {
          console.log('full day updated', new Date(Date.now()));
          last.fullDayUpdate = Date.now();
          io.emit('fullDay_update', incomingData);
        }
      });

      tempServer.on('exit', function () {

      }); 
    },
    pull: function (cb) {
      var response = {hourly: [], halfDay: [], fullDay: []};
      async.parallel([
        function (cb) {
          if (Date.now() - cache.hourly.time >= 60000) {
            query(1, function (err, rows) {
              response.hourly = rows;
              console.log(rows)
              cache.hourly = {time: Date.now(), data: rows};
            });
          } else {
            response.hourly = cache.hourly.data;
            console.log('hourly from cache');
          }
          last.hourlyUpdate = Date.now();
          cb(null);
        },
        function (cb) {
          if (Date.now() - cache.halfDay.time >= 600000) {
            query(12, function (err, rows) {
              response.halfDay = rows;
              cache.halfDay = {time: Date.now(), data: rows};
            });
          } else {
            response.halfDay = cache.halfDay.data;
            console.log('half day from cache');
          }
          last.halfDayUpdate = Date.now();
          cb(null);
        },
        function (cb) {
          if (Date.now() - cache.fullDay.time >= 1200000) {
            query(24, function (err, rows) {
              response.fullDay = rows;
              cache.fullDay = {time: Date.now(), data: rows};
            });
          } else {
            response.fullDay = cache.fullDay.data;
            console.log('full day from cache');
          }
          last.fullDayUpdate = Date.now();
          cb(null);
        }
      ], function () {
        cb(response);
      });    
    }
  };
};