const router = require('express').Router();
const async = require('async');
const Gig = require('../models/gig');
const User = require('../models/user');
const Promocode = require('../models/promocode');

const algoliasearch = require('algoliasearch');
var client = algoliasearch("L3E3RMHJBU", "f5a7555c009dfcabf7e108808f1ff931");
var index = client.initIndex('GigSchema');

router.get('/', (req, res, next) => {

    Gig.find({}, function(err, gigs) {
      res.render('main/home', { gigs: gigs });
    })
});


router.route('/search')
  .get((req, res, next) => {
    if (req.query.q) {
      index.search(req.query.q, function(err, content) {
        console.log(content);
        res.render('main/search_results', { content: content, search_result: req.query.q });
      });
    }
  })
  .post((req, res, next) => {
    res.redirect('/search/?q=' + req.body.search_input);
  });

router.get('/my-gigs', (req, res, next) => {
  Gig.find({ owner: req.user._id }, function(err, gigs) {
    res.render('main/my-gigs', { gigs: gigs });
  })
});

router.route('/add-new-gig')
  .get((req, res, next) => {
    res.render('main/add-new-gig');
  })
  .post((req, res, next) => {
    async.waterfall([
      function(callback) {
        var gig = new Gig();
        gig.owner = req.user._id;
        gig.title = req.body.gig_title;
        gig.category = req.body.gig_category;
        gig.about = req.body.gig_about;
        gig.price = req.body.gig_price;
        gig.save(function(err) {
          callback(err, gig);
        });
      },

      function(gig, callback) {
        User.update(
          {
            _id: req.user._id
          },{
            $push: { gigs: gig._id }
          }, function(err, count) {
            res.redirect('/my-gigs');
          }
        )
      }
    ]);
  });

router.get('/service_detail/:id', (req, res, next) => {
  Gig.findOne({ _id: req.params.id })
    .populate('owner')
    .exec(function(err, gig) {
      res.render('main/service_detail', { gig: gig });
    });
});

router.get('/api/add-promocode', (req, res, next) => {
  var promocode = new Promocode();
  promocode.name = "testcoupon";
  promocode.discount = 0.4;
  promocode.save(function(err) {
    res.json("Successful");
  });
});

router.post('/promocode', (req, res, next) => {
  var promocode = req.body.promocode;
  var totalPrice = req.session.price;
  Promocode.findOne({ name: promocode }, function(err, foundCode) {
    if (foundCode) {
      var newPrice = foundCode.discount * totalPrice;
      newPrice = totalPrice - newPrice;
      req.session.price = newPrice;
      res.json(newPrice);
    } else {
      res.json(0);
    }
  });
});

module.exports = router;
