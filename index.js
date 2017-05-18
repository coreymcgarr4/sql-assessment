var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var massive = require('massive');
var config = require('./.config.js');
//Need to enter username and password for your database
var connString = 'postgres://postgres:postgres@localhost/assessbox';

var app = express();

app.use(bodyParser.json());
app.use(cors());

//The test doesn't like the Sync version of connecting,
//  Here is a skeleton of the Async, in the callback is also
//  a good place to call your database seeds.
var db = massive.connect({connectionString : connString},
  function(err, localdb){
    db = localdb;
    app.set('db', db);
    
    db.user_create_seed(function(){
      console.log("User Table Init");
    });
    db.vehicle_create_seed(function(){
      console.log("Vehicle Table Init")
    });
})

app.get('/api/users', function(req, res, next){
  db.run('select * from users', function(error, users){
    if(error){
      console.log(error)
    } else {
      res.json(users)
    }
  })
});

app.get('/api/vehicles', function(req, res, next){
  db.run('select * from vehicles', function(error, vehicles){
    if(error){
      console.log(error)
    } else{
      res.json(vehicles)
    }
  })
});

app.post('/api/users', function(req, res, next){
  db.run('insert into users (firstname, lastname, email) values($1, $2, $3)', [req.body.firstname, req.body.lastname, req.body.email], function(error, user){
    if(error){
      console.log(error)
    } res.json(user);
  });
});

app.post('/api/vehicles', function(req, res, next){
  db.run('insert into vehicles (make, model, year, ownerId) values ($1, $2, $3, $4)', [req.body.make, req.body.model, req.body.year, req.body.ownerId], function(error, vehicle){
    if(error){
      console.log(error)
    } res.json(vehicle);
  });
});

app.get('api/user/:userId/vehicleCount', function(req, res, next){
  db.run('select count(make) from users u join vehicles v on u.id = v.ownerId where u.id = $1', [parseInt(req.params.id)], function(error, count){
    res.json({count: count})
  })
});

app.get('/api/user/:userId/vehicle', function(req, res, next){
    db.run('select make, model, year from vehicles where ownerId = (select id from users where id = $1)', [parseInt(req.params.userId)], function(err, response){
        res.status(200).json(response)
    })
});

app.get('/api/vehicle', function(req, res, next){
    if(req.query.UserEmail) {
        db.run('select * from users u join vehicles v on u.id = v.ownerId where u.email = $1', [req.query.UserEmail], function(error, response){
            res.status(200).json(response);
        });
    } else if(req.query.userFirstStart){
        db.run('select * from users u join vehicles v on u.id = v.ownerId where u.firstname like $1', [req.query.userFirstStart + '%'], function(error, response){
            res.status(200).json(response);
        });
    }
});

app.get('/api/newervehiclesbyyear', function(req, res, next){
    db.run('select firstname, lastname, make, model, year from vehicles v join users u on u.id = v.ownerId where v.year > 2000 order by year desc', function(error, response){
        res.json(response);
    });
});

app.put('/api/vehicle/:vehicleId/user/:userId', function(req, res, next){
  db.run('update vehicles set ownerId = $1 where id = $2', [parseInt(req.params.userId), parseInt(req.params.vehicleId)], function(error, response){
    res.json(response);
  })
});

app.delete('/api/user/:userId/vehicle/:vehicleId', function(req, res, next){
  db.run('update vehicles set ownerId = null where id = $1', [parseInt(req.params.vehicleId)], function(error, response){
    res.json(response);
  })
});

app.delete('/api/vehicle/:vehicleId', function(req, res, next){
  db.run('delete from vehicles where id = $1', [parseInt(req.params.vehicleId)], function(error, response){
    res.send('Deleted');
  })
});

app.listen('3000', function(){
  console.log("Successfully listening on : 3000")
})

module.exports = app;
