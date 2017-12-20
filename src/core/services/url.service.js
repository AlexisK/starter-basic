import { EventManager } from 'core/classes';

export class UrlService {
    constructor() {
        this.init();

        this.__defineGetter__('query', () => {
            this._query = this.getQuery(window.location.href);
            this._cacheQuery = JSON.stringify(this._query);
            clearInterval(this._updateInterval);
            this._updateInterval = setTimeout(this.setUpQuery.bind(this), 1);
            return this._query;
        });
        this.__defineSetter__('query', (data) => {
            if ( typeof(data) === "string" ) {
                this._query = this.getQuery(data);
            } else {
                this._query = data;
            }
            clearInterval(this._updateInterval);
            this._updateInterval = setTimeout(this.setUpQuery.bind(this), 1);
            return this._query;
        });
    }

    init() {
        this.events = new EventManager();
        this._updateInterval = null;
    };

    

    setUpQuery(data) {
        data = data || this._query;

        if (!this._cacheQuery || this._cacheQuery != JSON.stringify(data) ) {
            var queryString = Object.keys(data).reduce((acc, key) => {
                acc.push([key, encodeURIComponent(data[key])].join('='));
                return acc;
            }, []).join('&');
            var newUrlMap = [window.location.href.split('?')[0]];
            if ( queryString ) { newUrlMap.push(queryString); }
            var newUrl = newUrlMap.join('?');

            window.history.replaceState({
                url: newUrl
            }, '', newUrl);

            this.events.emit('change.query', {
                url: newUrl,
                query: data
            });
        }
    };

    getQuery(path) {
        path = path.split('?')[1];
        if ( !path ) { return {}; }
        return path.split('&').reduce((acc, pairString) => {
            var pair     = pairString.split('=');
            acc[pair[0]] = decodeURIComponent(pair[1]);
            return acc;
        }, {});
    }
}

export const urlService = new UrlService();
