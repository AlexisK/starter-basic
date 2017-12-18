import { forEach } from 'core/helpers';
import { EventManager } from 'core/classes';
import { dataAnchorsService as anchors } from './data-anchors.service';
import { urlService } from './url.service';

var TITLEANCHOR   = 'title';

export class RoutingService {
    
    constructor() {
        this.init();
    }
    
    init() {
        this.events = new EventManager();
        this.currentPage = null;
        this.currentPageNode = null;
        window.addEventListener('popstate', ev => {
            if ( ev.state && ev.state.url ) {
                this.events.emit('go.popstate', ev.state.url, ev.state);
                this.goBasic(ev.state.url, null, function() {
                    urlService.query = ev.state.url;
                });
            }
        });
    }

    requestPage(path, params, cb) {
        this.events.emit('requestPage', path, params);
        function reqListener() {
            cb(this.responseText, this);
        }

        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", reqListener);
        oReq.open("GET", path);
        oReq.send();
    }

    _pushHistory(url, title) {
        history.pushState({
            url
        }, title, url);
        urlService.query = url;
        this.events.emit('history.push', url, title);
    }

    _goBasic(path, params, cb) {
        var pageAnchors = anchors.retrieveAnchors(document);
        var dataAnchors = anchors.retrieveAnchors(this.currentPageNode);
        anchors.updateAnchorsWithElements(pageAnchors, dataAnchors);
        if ( cb ) {
            cb({path, params, pageAnchors, dataAnchors});
        }
    }

    goBasic(path, params, cb) {
        if (this.currentPage == path.split('?')[0]) {
            this._goBasic(path, params, cb);
        } else {
            this.requestPage(path, null, result => {
                var tempNode       = document.createElement('div');
                tempNode.innerHTML = result;
                this.currentPage = path.split('?')[0];
                this.currentPageNode = tempNode;

                this._goBasic(path, params, cb);
            });
        }

    }

    goSilent(path, params, cb) {
        this.goBasic(path, params, function(results) {
            this.events.emit('go.silent', path, params);
            if ( cb ) {
                cb(results);
            }
        });
    }

    navigate(path, params, cb) {
        console.log('Routing.navigate', path, params);
        this.goBasic(path, params, results => {
            this._pushHistory(results.path, results.dataAnchors[TITLEANCHOR][0].textContent);

            this.events.emit('go.navigate', path, params);
            if ( cb ) {
                cb(results);
            }
        });
    }
}

export const routingService = new RoutingService();
