import { forEach } from 'core/helpers';
import { EventManager } from 'core/classes';
import { dataAnchorsService as anchors } from './data-anchors.service';
import { urlService } from './url.service';

var TITLEANCHOR   = 'title';

function RoutingService() {
    var self = this;

    self.init = function () {
        self.events = new EventManager();
        self.currentPage = null;
        self.currentPageNode = null;
        window.addEventListener('popstate', ev => {
            if ( ev.state && ev.state.url ) {
                self.events.emit('go.popstate', ev.state.url, ev.state);
                self.goBasic(ev.state.url, null, function() {
                    urlService.query = ev.state.url;
                });
            }
        });
    };

    self.requestPage = function (path, params, cb) {
        self.events.emit('requestPage', path, params);
        function reqListener() {
            cb(this.responseText, this);
        }

        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", reqListener);
        oReq.open("GET", path);
        oReq.send();
    };

    self._pushHistory = function (url, title) {
        history.pushState({
            url
        }, title, url);
        urlService.query = url;
        self.events.emit('history.push', url, title);
    };

    self._goBasic = function(path, params, cb) {
        var pageAnchors = anchors.retrieveAnchors(document);
        var dataAnchors = anchors.retrieveAnchors(self.currentPageNode);
        anchors.updateAnchorsWithElements(pageAnchors, dataAnchors);
        if ( cb ) {
            cb({path, params, pageAnchors, dataAnchors});
        }
    };

    self.goBasic = function (path, params, cb) {
        if (self.currentPage == path.split('?')[0]) {
            self._goBasic(path, params, cb);
        } else {
            self.requestPage(path, null, result => {
                var tempNode       = document.createElement('div');
                tempNode.innerHTML = result;
                self.currentPage = path.split('?')[0];
                self.currentPageNode = tempNode;

                self._goBasic(path, params, cb);
            });
        }

    };

    self.goSilent = function (path, params, cb) {
        self.goBasic(path, params, function(results) {
            self.events.emit('go.silent', path, params);
            if ( cb ) {
                cb(results);
            }
        });
    };

    self.navigate = function (path, params, cb) {
        console.log('Routing.navigate', path, params);
        self.goBasic(path, params, results => {
            self._pushHistory(results.path, results.dataAnchors[TITLEANCHOR][0].textContent);

            self.events.emit('go.navigate', path, params);
            if ( cb ) {
                cb(results);
            }
        });
    };

    self.init();
}

export var routingService = new RoutingService();
