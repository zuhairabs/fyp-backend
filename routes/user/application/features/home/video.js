const router = require('express').Router();
const { ObjectId } = require('mongodb');
const Brand = require('../../../../../models/classifiers/brand-schema');
const Business = require('../../../../../models/entities/business-schema');
const Tag = require('../../../../../models/classifiers/tag-schema');
const Video = require('../../../../../models/operations/video-schema');
const handleError = require('../../../../../error_handling/handler');

const defaultAggreagations = [{ $sample: { size: 5 } }];

const populateVideos = async (videos) => {
  try {
    await Business.populate(videos, {
      path: 'business',
      select: 'display_name',
    });
    await Tag.populate(videos, {
      path: 'tag',
      select: 'name _id',
    });
    await Brand.populate(videos, {
      path: 'brand',
      select: 'name _id',
    });
    return videos;
  } catch (e) {
    handleError(e);
    return [];
  }
};

const fetchVideos = async (aggregations = defaultAggreagations) =>
  new Promise((resolve, reject) => {
    Video.aggregate(aggregations, async (err, videos) => {
      if (err) reject(err);
      const result = await populateVideos(videos);
      resolve(result);
    });
  });

// Top featured videos
router.post('/featured', (req, res) => {
  fetchVideos()
    .then((videos) => res.status(200).json({ response: videos }))
    .catch(() => res.status(500).json({ error: 'Internal server error' }));
});

// videos of one category
router.post('/category/single', (req, res) => {
  const { name } = req.query;
  const aggregations = [
    { $match: { category: name } },
    {
      $sample: {
        size: 10,
      },
    },
  ];

  fetchVideos(aggregations)
    .then((videos) => res.status(200).json({ response: videos }))
    .catch(() => res.status(500).json({ error: 'Internal server error' }));
});

router.post('/business', (req, res) => {
  const { _id } = req.body;
  const aggregations = [
    { $match: { business: ObjectId(_id) } },
    {
      $sample: {
        size: 10,
      },
    },
  ];

  fetchVideos(aggregations)
    .then((videos) => res.status(200).json({ response: videos }))
    .catch(() => res.status(500).json({ error: 'Internal server error' }));
});

module.exports = router;
