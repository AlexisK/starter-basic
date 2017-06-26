import { forEach } from 'core/helpers';
import { dataAnchorsService as anchors } from './data-anchors.service';

const TITLEANCHOR = 'title';

function RoutingService() {
    var self = this;

    self.init = function () {
        window.addEventListener('popstate', ev => {
            if ( ev.state && ev.state.url ) {
                self.goSilent(ev.state.url);
            }
        });
    };

    self._requestPage = function (path, params, cb) {
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
    };

    self.goSilent = function (path, params, cb) {

        self._requestPage(path, null, result => {
            var tempNode       = document.createElement('div');
            tempNode.innerHTML = result;

            var pageAnchors = anchors.retrieveAnchors(document);
            var dataAnchors = anchors.retrieveAnchors(tempNode);
            anchors.updateAnchorsWithElements(pageAnchors, dataAnchors);

            if ( cb ) {
                cb({path, params, pageAnchors, dataAnchors});
            }
        });
    };

    self.go = self.navigate = function (path, params, cb) {
        console.log('Routing.navigate', path, params);
        self.goSilent(path, params, results => {
            self._pushHistory(results.path, results.dataAnchors[TITLEANCHOR][0].textContent);

            if ( cb ) {
                cb(results);
            }
        });
    };

    self.init();
}

export const routingService = new RoutingService();
