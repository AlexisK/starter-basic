import { dataAnchorsService as anchors } from './data-anchors.service';
import { routingService as routing } from './routing.service';
import { urlService as url } from './url.service';

var CONTENTANCHOR = 'main-content';
var SELECTORPOPUP = 'popup-wrapper';

export class PopupService {

  constructor() {
    this.init();
  }

  init() {
    this.popUpWrapperElement = document.getElementsByClassName(SELECTORPOPUP)[0];
    this.currentPopup = null;
    this.closePopupIntrerval = null;
    this.popUpWrapperElement.addEventListener('click', () => {
      clearInterval(this.closePopupIntrerval);
      this.closePopupIntrerval = setTimeout(() => {
        delete url.query.popup;
      }, 10);
    });
    this.handlePopup(url);

    url.events.subscribe('change.query', this.handlePopup.bind(this));
  }


  handlePopup() {
    if (!this.popUpWrapperElement) { return null; }

    if (url.query.popup) {
      if (this.currentPopup != url.query.popup) {
        this.currentPopup = url.query.popup;
        routing.requestPage(url.query.popup, null, result => {

          var tempNode = document.createElement('div');
          tempNode.innerHTML = result;

          var dataAnchors = anchors.retrieveAnchors(tempNode);
          if (dataAnchors[CONTENTANCHOR] && dataAnchors[CONTENTANCHOR][0]) {
            var newDataContainer = document.createElement('div');
            newDataContainer.className = 'container';
            this.popUpWrapperElement.appendChild(newDataContainer);
            newDataContainer.addEventListener('click', () => {
              setTimeout(() => {
                clearInterval(this.closePopupIntrerval);
              }, 1);
            });

            anchors.updateAnchorWithElement(newDataContainer, dataAnchors[CONTENTANCHOR][0]);
            this.popUpWrapperElement.classList.remove('hidden');
          }
        });
      }

    } else {
      this.currentPopup = null;
      anchors.clear(this.popUpWrapperElement);
      this.popUpWrapperElement.classList.add('hidden');
    }
  }

}

export const popupService = new PopupService();
