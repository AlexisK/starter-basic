import { forEach } from 'core/helpers';
import { rendererService as renderer } from 'core/services';

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

    self._retrieveCandidates = function (target) {
        return Array.prototype.reduce.call(target.querySelectorAll('[data-anchor]'), (acc, node) => {
            var key  = node.getAttribute('data-anchor');
            acc[key] = acc[key] || [];
            acc[key].push(node);
            node._fetchEmpty = (node.getAttribute('data-anchor-fetchempty') === 'true');
            return acc;
        }, {});
    };

    self._updateCandidate = function (toUpdate, newCandidate) {
        if ( toUpdate._fetchEmpty || newCandidate.children.length ) {
            renderer.clear(toUpdate);
            toUpdate.innerHTML = newCandidate.innerHTML;
            // Solution without using `innerHTML` however - it alters `newCandidate`
            //while (newCandidate.firstChild) {
            //    toUpdate.appendChild(newCandidate.firstChild);
            //}
            renderer.process(toUpdate);
        }
    };

    self._updateCandidates = function (toUpdate, newCandidates) {
        forEach(newCandidates, (nodes, key) => {
            if ( toUpdate[key] ) {
                toUpdate[key].forEach((element, i) => self._updateCandidate(element, nodes[i] || nodes[nodes.length-1]));
            }
        })
    };

    self._pushHistory = function (url, title) {
        history.pushState({
            url
        }, title, url);
    };

    self.goSilent = function (path, params, cb) {
        console.log('Routing.navigate', path, params);

        self._requestPage(path, null, result => {
            var tempNode       = document.createElement('div');
            tempNode.innerHTML = result;

            var pageCandidates = self._retrieveCandidates(document);
            var dataCandidates = self._retrieveCandidates(tempNode);
            this._updateCandidates(pageCandidates, dataCandidates);

            if ( cb ) {
                cb({path, params, pageCandidates, dataCandidates});
            }
        });
    };

    self.go = self.navigate = function (path, params, cb) {
        self.goSilent(path, params, results => {
            self._pushHistory(results.path, results.dataCandidates.title);

            if ( cb ) {
                cb(results);
            }
        });
    };

    self.init();
}

export const routingService = new RoutingService();
