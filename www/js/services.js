angular.module('mapasculturais.services', [])

.factory('BlankFactory', [function(){

}])

.service('BlankService', [function(){

}])

.service('MenuState', ['$rootScope', function($rootScope) {
    $rootScope.activeMenu = 'events';
    this.activeMenu = function(activeMenu){
        $rootScope.activeMenu = activeMenu;
    };
}])

.service('ConfigState', function($localStorage, $location) {
    // Change fixedPrefix variable below to disable interface for choosing datasource.
    // Used for mantaining a fork that communicates with only one installation
    this.fixedPrefix = null;

    this.dataSourceConfigurable = this.fixedPrefix == null;

    this.dataSources = {

        'quebradasp': {
            prefix: 'quebradasp',
            name: 'Quebrada SP',
            url: 'http://quebradasp.mapas.culturalivre.org/',
            map: {
                latitude: -23.5408,
                longitude: -46.6400,
                zoom: 11
            }
        },
        'spcultura': {
            prefix: 'spcultura',
            name: 'SP Cultura',
            url: 'http://spcultura.prefeitura.sp.gov.br/',
            map: {
                latitude: -23.5408,
                longitude: -46.6400,
                zoom: 11
            }
        },
    };

    this.defineDataSource = function(prefix){
        $localStorage.config.dataSource = prefix;

        this.dataSource = this.dataSources[prefix];
    }

    if (!$localStorage.config)
        $localStorage.config = {};

    if (this.dataSourceConfigurable) {
        if($localStorage.config.dataSource && this.dataSources[$localStorage.config.dataSource]){
            this.dataSource = this.dataSources[$localStorage.config.dataSource];
        } else {
            this.defineDataSource(this.dataSources[Object.keys(this.dataSources)[0]].prefix);
        }
    } else {
        this.defineDataSource(this.fixedPrefix);
    }
})

.service('FavoriteEvents', ['$localStorage', 'ConfigState', function($localStorage, config) {

    var self = this
    this.favorites = [];

    var sync = function() {
        while (self.favorites.length > 0){
            self.favorites.pop();
        }
        for (var key in $localStorage.favoriteEvents) {
            var event = $localStorage.favoriteEvents[key];
            event.start = moment(event.start);
            event.end = moment(event.end);
            self.favorites.push(event);
        }
    }

    if (!$localStorage.favoriteEvents) {
        $localStorage.favoriteEvents = {}
    } else {
        sync();
    }

    var getKey = function(event) {
        var key = moment(event.start.toString()).format('X') + '|' + event.occurrence_id;
        return config.dataSource.prefix + ':' + key;

    }

    this.favorite = function(event) {
        if (!event.favorite) {
            event.favorite = true;
            $localStorage.favoriteEvents[getKey(event)] = event;
        } else {
            event.favorite = false;
            delete $localStorage.favoriteEvents[getKey(event)]
        }
        sync()
    }

    this.isFavorite = function(event) {
        return !!$localStorage.favoriteEvents[getKey(event)]
    }

    this.clear = function(){
        $localStorage.favoriteEvents = {};
        sync();
    }

}])

.service('MapState', function(ConfigState){
    var self = this;

    this.getOptions = function() {
        var center = new plugin.google.maps.LatLng(ConfigState.dataSource.map.latitude, ConfigState.dataSource.map.longitude);
        return {
            'backgroundColor': 'transparent',
            'mapType': plugin.google.maps.MapTypeId.ROADMAP,
            'controls': {
                'myLocationButton': true,
                'indoorPicker': true,
                'zoom': true
            },
            'gestures': {
                'scroll': true,
                'tilt': true,
                'rotate': false,
                'zoom': true
            },
            'camera': {
                'latLng': center,
                'zoom': ConfigState.dataSource.map.zoom,
            }
        };
    }
    this.initialize = function(div) {
        self.map = plugin.google.maps.Map.getMap(div, self.getOptions());
        self.map.setClickable(true);
    }

    this.setReadyCallback = function(callback) {
        self.map.addEventListener(plugin.google.maps.event.MAP_READY, callback);
    }

    this.markers = [];
    this.addMarker = function(pin, addCallback, clickCallback) {
        self.map.addMarker(pin, function(marker) {
            self.markers.push(marker);
            addCallback(marker);
            marker.addEventListener(plugin.google.maps.event.INFO_CLICK, clickCallback);
        });
    }

    this.reset = function() {
        for (var i=0; i<self.markers.length; i++) {
            self.markers[i].remove();
        }
        self.markers = [];
        self.map.setOptions(self.getOptions());
    }

        // map options that will be kept in memory ;)
    // }
})
