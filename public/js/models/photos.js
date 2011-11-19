YUI.add('photos', function (Y) {

var Lang = Y.Lang,

    FLICKR_API_KEY = YUI.namespace('Env.Flickr').API_KEY || '';

Y.Photos = Y.Base.create('photos', Y.ModelList, [Y.ModelSync.YQL], {

    model: Y.Photo,
    cache: new Y.CacheOffline(),
    query: 'SELECT * FROM flickr.photos.search({start},{num}) ' +
                'WHERE api_key={api_key} ' +
                'AND safe_search=1 ' +
                'AND woe_id={woeid} ' +
                'AND sort="interestingness-desc" ' +
                'AND extras="path_alias,url_sq,url_z"',

    buildQuery: function (options) {
        options || (options = {});

        return Lang.sub(this.query, {
            api_key: FLICKR_API_KEY,
            start  : options.start || 0,
            num    : options.num || 60,
            woeid  : options.place.get('id')
        });
    },

    parse: function (results) {
        return results ? results.photo : [];
    },

    getPrev: function (photo) {
        // Check that the photo is in the list first.
        if (photo && this.getByClientId(photo.get('clientId'))) {
            return this.item(this.indexOf(photo) - 1);
        }
    },

    getNext: function (photo) {
        // Check that the photo is in the list first.
        if (photo && this.getByClientId(photo.get('clientId'))) {
            return this.item(this.indexOf(photo) + 1);
        }
    }

});

}, '0.4.0', {
    requires: [ 'cache-offline'
              , 'gallery-model-sync-yql'
              , 'model-list'
              , 'photo'
              , 'yql'
              ]
});
