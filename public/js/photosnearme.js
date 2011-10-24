YUI.add('photosnearme', function (Y) {

Y.PhotosNearMe = Y.Base.create('photosNearMe', Y.App, [], {

    titleTemplate : Handlebars.compile(Y.one('#title-template').getContent()),
    headerTemplate: Handlebars.compile(Y.one('#header-template').getContent()),

    views: {
        grid: {
            type    : Y.GridView,
            preserve: true
        },

        lightbox: {
            type  : Y.LightboxView,
            parent: 'grid'
        }
    },

    initializer: function () {
        this.after('placeChange', function (e) {
            this.get('photos').load({place: e.newVal});
            this.render();
        });

        this.on('gridView:more', this.morePhotos);

        // Do initial dispatch.
        if (Y.config.win.navigator.standalone) {
            // iOS saved to home screen,
            // always route to / so geolocation lookup is preformed.
            this.handleLocate();
        } else {
            this.dispatch();
        }
    },

    render: function () {
        Y.PhotosNearMe.superclass.render.apply(this, arguments);

        var place     = this.get('place'),
            placeText = place.toString(),
            container = this.get('container'),
            doc       = Y.config.doc,
            content;

        // Update the title of the browser window.
        doc && (doc.title = this.titleTemplate({place: placeText}));

        content = this.headerTemplate({
            place: !place.isNew() && {
                id  : place.get('id'),
                text: placeText
            }
        });

        container.removeClass('loading').one('#header').setContent(content);
        Y.later(1, container, 'addClass', 'located');

        return this;
    },

    handleLocate: function () {
        var self = this;

        Y.Geo.getCurrentPosition(function (res) {
            if (!res.success) {
                // TODO: Show problem View: unable to locate you.
                return;
            }

            var place = new Y.Place(res.coords);
            place.load(function () {
                self.set('place', place);
                self.replace('/place/' + place.get('id') + '/');
            });
        });
    },

    handlePlace: function (req) {
        var placeId = req.params.id,
            place   = this.get('place'),
            photos  = this.get('photos'),
            self    = this;

        if (place.get('id') !== placeId) {
            place = new Y.Place({id: placeId});
            place.load(function () {
                self.set('place', place);
            });
        }

        this.showView('grid', {modelList: photos}, function (gridView) {
            gridView.reset();
        });
    },

    handlePhoto: function (req) {
        var params = req.params,
            place  = this.get('place'),
            photos = this.get('photos'),
            photo  = photos.getById(params.id);

        this.showView('lightbox', {
            model    : photo,
            modelList: photos,
            place    : !place.isNew() && place
        }, function (lightboxView) {
            if (photo) { return; }

            photo = new Y.Photo(params);
            photo.load(Y.bind(function () {
                lightboxView.set('model', photo);

                if (place.isNew()) {
                    place = photo.get('place');
                    lightboxView.set('place', place);
                    this.set('place', place);
                }
            }, this));
        });
    },

    morePhotos: function () {
        var place     = this.get('place'),
            photos    = this.get('photos'),
            newPhotos = new Y.Photos();

        newPhotos.load({
            place: place,
            start: photos.size()
        }, function () {
            var allPhotos = photos.toArray().concat(newPhotos.toArray());
            photos.reset(allPhotos);
            // clean up temp ModelList
            newPhotos.destroy();
        });
    }

}, {

    ATTRS: {
        place : {value: new Y.Place},
        photos: {value: new Y.Photos},
        routes: {
            value: [
                {path: '/',            callback: 'handleLocate'},
                {path: '/place/:id/',  callback: 'handlePlace'},
                {path: '/photo/:id/',  callback: 'handlePhoto'}
            ]
        }
    }

});

}, '0.3.2', {
    requires: [ 'app-base'
              , 'gallery-geo'
              , 'place'
              , 'photos'
              , 'grid-view'
              , 'lightbox-view'
              ]
});