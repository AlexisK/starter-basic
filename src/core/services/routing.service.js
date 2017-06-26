import { forEach } from 'core/helpers';
import { dataAnchorsService as anchors } from './data-anchors.service';
import { urlService } from './url.service';

var TITLEANCHOR   = 'title';

function RoutingService() {
    var self = this;

    self.init = function () {
        self.events = {
            go: [],
            goSilent: [],
            historyPush: []
        };
        self.currentPage = null;
        self.currentPageNode = null;
        window.addEventListener('popstate', ev => {
            if ( ev.state && ev.state.url ) {
                self.goSilent(ev.state.url, null, function() {
                    urlService.query = ev.state.url;
                });
            }
        });
    };

    self.requestPage = function (path, params, cb) {
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
        self.events.historyPush.forEach(function(todo) { todo(path, params); });
    };

    self._goSilent = function(path, params, cb) {
        var pageAnchors = anchors.retrieveAnchors(document);
        var dataAnchors = anchors.retrieveAnchors(self.currentPageNode);
        anchors.updateAnchorsWithElements(pageAnchors, dataAnchors);

        self.events.goSilent.forEach(function(todo) { todo(path, params); });
        if ( cb ) {
            cb({path, params, pageAnchors, dataAnchors});
        }
    };

    self.goSilent = function (path, params, cb) {
        if (self.currentPage == path.split('?')[0]) {
            self._goSilent(path, params, cb);
        } else {
            self.requestPage(path, null, result => {
                var tempNode       = document.createElement('div');
                tempNode.innerHTML = result;
                self.currentPage = path.split('?')[0];
                self.currentPageNode = tempNode;

                self._goSilent(path, params, cb);
            });
        }

    };

    self.go = self.navigate = function (path, params, cb) {
        console.log('Routing.navigate', path, params);
        self.goSilent(path, params, results => {
            self._pushHistory(results.path, results.dataAnchors[TITLEANCHOR][0].textContent);

            self.events.go.forEach(function(todo) { todo(path, params); });
            if ( cb ) {
                cb(results);
            }
        });
    };

    self.init();
}

export var routingService = new RoutingService();
