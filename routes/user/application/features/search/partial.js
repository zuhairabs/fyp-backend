const router = require('express').Router();
const { promisify } = require('util');
const Tag = require('../../../../../models/classifiers/tag-schema');
const handleError = require('../../../../../error_handling/handler');

router.post('/', async (req, res) => {
  const { query } = req.body;
  const modifiedQuery = new RegExp(`^${query}`);

  try {
    const response = await Tag.find({
      name: {
        $regex: modifiedQuery,
        $options: 'ix',
      },
    })
      .select('name')
      .limit(10);
    return res.status(200).json({ response });
  } catch (e) {
    handleError(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/elastic', async (req, res) => {
  let { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Please provide a valid query!' });
  }

  query = query.toLowerCase();

  try {
    const searchTags = await promisify(Tag.esSearch).bind(Tag)(
      {
        query: {
          regexp: { name: `.*${query}.*` },
        },
      },
      {
        hydrate: true,
      }
    );
    const tags = searchTags.hits.hits;
    const relatedTags = await Tag.populate(tags, {
      path: 'related',
    });

    return res.status(200).json(relatedTags);
  } catch (err) {
    handleError(err);

    return res.status(500).json({
      error: 'Internal server error.',
    });
  }
});

module.exports = router;
