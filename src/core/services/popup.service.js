import { dataAnchorsService as anchors } from './data-anchors.service';
import { routingService as routing } from './routing.service';
import { urlService as url } from './url.service';

var CONTENTANCHOR = 'main-content';
var SELECTORPOPUP = 'popup-wrapper';

function PopupService() {
    var self = this;

    self.init = function () {
        self.popUpWrapperElement = document.getElementsByClassName(SELECTORPOPUP)[0];
        self.currentPopup        = null;
        self.closePopupIntrerval = null;
        self.popUpWrapperElement.addEventListener('click', function () {
            clearInterval(self.closePopupIntrerval);
            self.closePopupIntrerval = setTimeout(function () {
                delete url.query.popup;
            }, 10);
        });
        self.handlePopup(url);

        url.events.subscribe('change.query', self.handlePopup);
    };


    self.handlePopup = function () {
        if ( !self.popUpWrapperElement ) { return null; }

        if ( url.query.popup ) {
            if ( self.currentPopup != url.query.popup ) {
                self.currentPopup = url.query.popup;
                routing.requestPage(url.query.popup, null, result => {

                    var tempNode       = document.createElement('div');
                    tempNode.innerHTML = result;

                    var dataAnchors = anchors.retrieveAnchors(tempNode);
                    if ( dataAnchors[CONTENTANCHOR] && dataAnchors[CONTENTANCHOR][0] ) {
                        var newDataContainer       = document.createElement('div');
                        newDataContainer.className = 'container';
                        self.popUpWrapperElement.appendChild(newDataContainer);
                        newDataContainer.addEventListener('click', function () {
                            setTimeout(function () {
                                clearInterval(self.closePopupIntrerval);
                            }, 1);
                        });

                        anchors.updateAnchorWithElement(newDataContainer, dataAnchors[CONTENTANCHOR][0]);
                        self.popUpWrapperElement.classList.remove('hidden');
                    }
                });
            }

        } else {
            self.currentPopup = null;
            anchors.clear(self.popUpWrapperElement);
            self.popUpWrapperElement.classList.add('hidden');
        }
    };

    self.init();

}

export var popupService = new PopupService();
