export function EventManager() {
    var self = this;
    self.actions = {};

    self._iterateEvent = function(event, cb) {
        if ( typeof(event) == 'string' ) {
            event = event.split('.');
        }
        while(event.length) {
            var key = event.join('.');
            cb(key);
            event.pop();
        }
    };

    self.subscribe = function (event, action) {
        self._iterateEvent(event, function(key) {
            self.actions[key] = self.actions[key] || [];
            self.actions[key].push(action);
        });
        return function() {
            self.unsubscribe(event, action);
        }
    };

    self.unsubscribe = function (event, action) {
        self._iterateEvent(event, function(key) {
            if ( self.actions[key] ) {
                var ind = self.actions[key].indexOf(action);
                if ( ind >= 0 ) {
                    self.actions[key].splice(ind, 1);
                }
            }
        });
    };

    self.emit = function() {
        var event = Array.prototype.shift.call(arguments);
        self._iterateEvent(event, function(key) {
            if ( self.actions[key] ) {
                self.actions[key].forEach(function(action) { action.apply(this, arguments); })
            }
        });
    };
}
