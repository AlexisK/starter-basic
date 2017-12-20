export class EventManager {
    constructor() {
        this.actions = {};
    }

    _iterateEvent(event, cb) {
        if ( typeof(event) == 'string' ) {
            event = event.split('.');
        }
        while(event.length) {
            var key = event.join('.');
            cb(key);
            event.pop();
        }
    };

    subscribe(event, action) {
        this._iterateEvent(event, (key) => {
            this.actions[key] = this.actions[key] || [];
            this.actions[key].push(action);
        });
        return function() {
            this.unsubscribe(event, action);
        }
    };

    unsubscribe(event, action) {
        this._iterateEvent(event, (key) => {
            if ( this.actions[key] ) {
                var ind = this.actions[key].indexOf(action);
                if ( ind >= 0 ) {
                    this.actions[key].splice(ind, 1);
                }
            }
        });
    };

    emit() {
        var event = Array.prototype.shift.call(arguments);
        this._iterateEvent(event, (key) => {
            if ( this.actions[key] ) {
                this.actions[key].forEach(function(action) { action.apply(this, arguments); })
            }
        });
    };
}
