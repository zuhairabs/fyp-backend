const router = require('express').Router();
const Store = require('../../../../../models/entities/store-schema');
const Business = require('../../../../../models/entities/business-schema');
const Category = require('../../../../../models/classifiers/category-schema');
const handleError = require('../../../../../error_handling/handler');

// CATEGORY
router.post('/category/list', (req, res) => {
  // let city = req.body.city;
  Category.find({}, (err, categories) => {
    if (err) {
      handleError(err);
      res.status(500).json({ error: 'Internal server error' });
    } else res.status(200).json({ response: categories });
  });
});

// FEATURED STORES
router.post('/featured', (req, res) => {
  const { city } = req.body;
  Store.aggregate(
    [
      { $match: { city } },
      { $sample: { size: 5 } },
      {
        $project: {
          avg_rating: 1,
          name: 1,
          location: 1,
          location_desc: 1,
          virtual_enabled: 1,
          physical_enabled: 1,
          business: 1,
        },
      },
    ],
    (err, featuredStores) => {
      if (err) {
        handleError(err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        Business.populate(
          featuredStores,
          {
            path: 'business',
            select: {
              display_name: 1,
              category: 1,
              title_image: 1,
            },
          },
          (err, stores) => {
            if (err) {
              handleError(err);
              res.status(500).json({ error: 'Internal Server Error' });
            } else res.status(200).json({ response: stores });
          }
        );
      }
    }
  );
});

// NEAREST STORES
router.post('/nearest', (req, res) => {
  const lat = req.query.lat * 1 || 18.969955;
  const lng = req.query.lng * 1 || 72.8188194;

  Store.aggregate(
    [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          distanceField: 'displacement',
          spherical: true,
          distanceMultiplier: 0.001,
        },
      },
      {
        $project: {
          avg_rating: 1,
          name: 1,
          location: 1,
          location_desc: 1,
          virtual_enabled: 1,
          physical_enabled: 1,
          business: 1,
          displacement: 1,
        },
      },
      {
        $sort: {
          displacement: 1,
        },
      },
      { $limit: 10 },
    ],
    (err, featuredStores) => {
      if (err) {
        handleError(err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        Business.populate(
          featuredStores,
          {
            path: 'business',
            select: {
              display_name: 1,
              category: 1,
              title_image: 1,
            },
          },
          (err, stores) => {
            if (err) {
              handleError(err);
              res.status(500).json({ error: 'Internal Server Error' });
            } else res.status(200).json({ response: stores });
          }
        );
      }
    }
  );
});

// NEW STORES
router.post('/new', (req, res) => {
  const { city } = req.body;
  Store.aggregate(
    [
      { $match: { city } },
      { $sort: { _id: -1 } },
      {
        $project: {
          avg_rating: 1,
          name: 1,
          location: 1,
          location_desc: 1,
          virtual_enabled: 1,
          physical_enabled: 1,
          business: 1,
        },
      },
      { $limit: 5 },
    ],
    (err, recentAddedStores) => {
      if (err) {
        handleError(err);
        res.status(500).json({ error: 'Error in finding recent added store' });
      } else {
        Business.populate(
          recentAddedStores,
          {
            path: 'business',
            select: {
              display_name: 1,
              category: 1,
              title_image: 1,
            },
          },
          (recentStores) => {
            res.status(200).json({ response: recentAddedStores });
          }
        );
      }
    }
  );
});

router.post('/category/single', (req, res) => {
  const { name } = req.query;
  const lat = req.query.lat * 1 || 18.969955;
  const lng = req.query.lng * 1 || 72.8188194;
  Store.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        distanceField: 'displacement',
        spherical: true,
        distanceMultiplier: 0.001,
      },
    },
    { $match: { $or: [{category: name }, {oldCategory: name} ] } },
    {
      $project: {
        avg_rating: 1,
        name: 1,
        location: 1,
        location_desc: 1,
        virtual_enabled: 1,
        physical_enabled: 1,
        business: 1,
        displacement: 1,
      },
    },
    {
      $sort: {
        displacement: 1,
      },
    },
    { $limit: 10 },
  ]).exec((err, stores) => {
    if (err) {
      handleError(err);
      res.status(500).json({ error: 'Error in finding recent added store' });
    } else {
      Business.populate(
        stores,
        {
          path: 'business',
          select: {
            display_name: 1,
            category: 1,
            title_image: 1,
          },
        },
        (results) => {
          res.status(200).json({ response: stores });
        }
      );
    }
  });
});

module.exports = router;
