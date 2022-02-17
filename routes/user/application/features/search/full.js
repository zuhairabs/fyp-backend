const router = require('express').Router();
const handleError = require('../../../../../error_handling/handler');
const Business = require('../../../../../models/entities/business-schema');
const Store = require('../../../../../models/entities/store-schema');
const Video = require('../../../../../models/operations/video-schema');
const Tag = require('../../../../../models/classifiers/tag-schema');
const Category = require('../../../../../models/classifiers/category-schema');
const Brand = require('../../../../../models/classifiers/brand-schema');

const unclog = async (businesses) => {
  let a=[];
  businesses.forEach(o => {
    a=[...a, ...o.stores];
  });
  return Promise.resolve(a);
}

const remdup = async (data) => {
  let result = data.filter(function({_id}) {
                const a = _id.toString();
                console.log(this,a,this.has(a));
                return !(this.has(a)) && this.add(a);
              }, new Set);
  return Promise.resolve(result);
};

const remdupvid = async (data) => {
  let result = data.filter(function({_id}) {
                const a = _id.toString();
                console.log(this,a,this.has(a));
                return !(this.has(a)) && this.add(a);
              }, new Set);
  return Promise.resolve(result);
};

const searchStores = async (query, location, size) => {
  try {
    const businessNames = await Business.find(
      { display_name: { $regex: ".*"+query+".*", $options: 'ix' } }
    ).populate("stores","name location_desc avg_rating business");

    const storeNames = await unclog(businessNames);

    const businessBrands = await Business.find(
      { brands: query }
    ).populate("stores","name location_desc avg_rating business");

    const storeBrands = await unclog(businessBrands);

    const stores = await Store.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [location.lng, location.lat],
          },
          distanceField: 'displacement',
          spherical: true,
          distanceMultiplier: 0.001,
        },
      },
      { $match: { tags: query } },
      {
        $project: {
          name: 1,
          location_desc: 1,
          avg_rating: 1,
          business: 1,
        },
      },
      { $sample: { size } },
    ]);
    const x = [...storeNames, ...storeBrands, ...stores];
    const xx = await remdup(x);
    await Business.populate(xx, {
      path: 'business',
      select: 'display_name category title_image',
    });
    return xx;
  } catch (e) {
    handleError(e);
    return [];
  }
};

const getVideos = async (query = null, size) => {
  let aggregations;
  if (!query) {
    aggregations = [{ $sample: { size } }];
  }
  if (query && query.length > 0) {
    aggregations = [{ $match: { tags: query } }, { $sample: { size } }];
  }
  const video = await Video.aggregate(aggregations);
  const video1 = await Video.find(
    { display_name: { $regex: ".*"+query+".*", $options: 'ix' } }
  );
  let vid = [...video1, ...video];
  const videos = await remdupvid(vid);
  await Business.populate(videos, {
    path: 'business',
    select: 'display_name',
  });
  await Brand.populate(videos, {
    path: 'brand',
    select: 'name _id',
  });
  return videos;
};


const searchVideos = async (query, size) => {
    try {
        const videos = await getVideos(query, size);
        let searchedTag = await Category.findOne({ tag: query });
        if (!searchedTag) {
            searchedTag = await Category.findOne({ name: { $regex: categoryFromName.replace(/ /g, ".") + ".*", $options: 'ix' } });
            searchedTag1 = await Category.findOne({ name: { $regex: parentCategoryFromName.replace(/ /g, ".") + ".*", $options: 'ix' } });
            console.log(10);
            //console.log(categoryFromName,parentCategoryFromName);
            console.log(searchedTag, searchedTag1);
        }
        console.log(searchedTag.name, " Tag");
        let relatedVideos = [];
        if ((searchedTag && searchedTag.name) || (searchedTag1 && searchedTag1.name)) {
            const { tag } = searchedTag;
            console.log(tag);
            relatedVideos = await getRelated(tag);
            if (relatedVideos.length < 1) {
                relatedVideos1 = await getRelated(searchedTag1.tag);
                relatedVideos = [...relatedVideos, ...relatedVideos1]
            }
        } else {
            relatedVideos = await getVideos(null);
        }
        axe.clear();
        return { videos, relatedVideos };
    } catch (e) {
        handleError(e);
        return [];

    }
};

router.post('/store', async (req, res) => {
    const { query } = req.body;
    const lat = req.query.lat * 1 || 18.969955;
    const lng = req.query.lng * 1 || 72.8188194;

    searchStores(query, { lat, lng }, 10)
        .then((stores) => res.status(200).json({ response: { stores } }))
        .catch(() => res.status(500).json({ error: 'Internal server error' }));
});

router.post('/video', async (req, res) => {
    const { query } = req.body;
    searchVideos(query, 10)
        .then(({ videos, relatedVideos }) =>
            res.status(200).json({ response: { videos, relatedVideos } })
        )
        .catch(() => res.status(500).json({ error: 'Internal server error' }));
});

router.post('/', async (req, res) => {
    const { query } = req.body;
    const lat = req.query.lat * 1 || 18.969955;
    const lng = req.query.lng * 1 || 72.8188194;
    try {
        const stores = await searchStores(query, { lat, lng }, 10);
        const { videos, relatedVideos } = await searchVideos(query, 10);
        console.log(relatedVideos);
        return res
            .status(200)
            .json({ response: { videos, stores, relatedVideos } });
    } catch (e) {
        handleError(e);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
