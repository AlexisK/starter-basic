import { EventManager } from 'core/classes';

function UrlService() {
    var self = this;

    self.init = function() {
        self.events = new EventManager();
        self._updateInterval = null;
    };

    self.__defineGetter__('query', function() {
        self._query = self.getQuery(window.location.href);
        self._cacheQuery = JSON.stringify(self._query);
        clearInterval(self._updateInterval);
        self._updateInterval = setTimeout(self.setUpQuery, 1);
        return self._query;
    });
    self.__defineSetter__('query', function(data) {
        if ( typeof(data) === "string" ) {
            self._query = self.getQuery(data);
        } else {
            self._query = data;
        }
        clearInterval(self._updateInterval);
        self._updateInterval = setTimeout(self.setUpQuery, 1);
        return self._query;
    });

    self.setUpQuery = function(data) {
        data = data || self._query;

        if (!self._cacheQuery || self._cacheQuery != JSON.stringify(data) ) {
            var queryString = Object.keys(data).reduce(function(acc, key) {
                acc.push([key, encodeURIComponent(data[key])].join('='));
                return acc;
            }, []).join('&');
            var newUrlMap = [window.location.href.split('?')[0]];
            if ( queryString ) { newUrlMap.push(queryString); }
            var newUrl = newUrlMap.join('?');

            window.history.replaceState({
                url: newUrl
            }, '', newUrl);

            self.events.emit('change.query', {
                url: newUrl,
                query: data
            });
        }
    };

    self.getQuery = function (path) {
        path = path.split('?')[1];
        if ( !path ) { return {}; }
        return path.split('&').reduce(function (acc, pairString) {
            var pair     = pairString.split('=');
            acc[pair[0]] = decodeURIComponent(pair[1]);
            return acc;
        }, {});
    };

    self.init();
}

export var urlService = new UrlService();
