var module = angular.module('ParseAngular.GeoPoint', []);

module.factory('ParseGeoPoint', function($q){

    var ParseGeoPoint;

    /**
    * Creates a new GeoPoint with any of the following forms:<br>
    *   <pre>
    *   new GeoPoint(otherGeoPoint)
    *   new GeoPoint(30, 30)
    *   new GeoPoint([30, 30])
    *   new GeoPoint({latitude: 30, longitude: 30})
    *   new GeoPoint()  // defaults to (0, 0)
    *   </pre>
    * @class
    *
    * <p>Represents a latitude / longitude point that may be associated
    * with a key in a ParseObject or used as a reference point for geo queries.
    * This allows proximity-based queries on the key.</p>
    *
    * <p>Only one key in a class may contain a GeoPoint.</p>
    *
    * <p>Example:<pre>
    *   var point = new ParseGeoPoint(30.0, -20.0);
    *   var object = new Parse.Object("PlaceObject");
    *   object.set("location", point);
    *   object.save();</pre></p>
    */
    ParseGeoPoint = function(arg1, arg2) {
        if (_.isArray(arg1)) {
            ParseGeoPoint._validate(arg1[0], arg1[1]);
            this.latitude = arg1[0];
            this.longitude = arg1[1];
        } else if (_.isObject(arg1)) {
            ParseGeoPoint._validate(arg1.latitude, arg1.longitude);
            this.latitude = arg1.latitude;
            this.longitude = arg1.longitude;
        } else if (_.isNumber(arg1) && _.isNumber(arg2)) {
            ParseGeoPoint._validate(arg1, arg2);
            this.latitude = arg1;
            this.longitude = arg2;
        } else {
            this.latitude = 0;
            this.longitude = 0;
        }

        // Add properties so that anyone using Webkit or Mozilla will get an error
        // if they try to set values that are out of bounds.
        var self = this;
        if (this.__defineGetter__ && this.__defineSetter__) {
            // Use _latitude and _longitude to actually store the values, and add
            // getters and setters for latitude and longitude.
            this._latitude = this.latitude;
            this._longitude = this.longitude;
            this.__defineGetter__("latitude", function() {
                return self._latitude;
            });
            this.__defineGetter__("longitude", function() {
                return self._longitude;
            });
            this.__defineSetter__("latitude", function(val) {
                ParseGeoPoint._validate(val, self.longitude);
                self._latitude = val;
            });
            this.__defineSetter__("longitude", function(val) {
                ParseGeoPoint._validate(self.latitude, val);
                self._longitude = val;
            });
        }
    };

    /**
    * @lends ParseGeoPoint.prototype
    * @property {float} latitude North-south portion of the coordinate, in range
    *   [-90, 90].  Throws an exception if set out of range in a modern browser.
    * @property {float} longitude East-west portion of the coordinate, in range
    *   [-180, 180].  Throws if set out of range in a modern browser.
    */

    /**
    * Throws an exception if the given lat-long is out of bounds.
    */
    ParseGeoPoint._validate = function(latitude, longitude) {
        if (latitude < -90.0) {
            throw "ParseGeoPoint latitude " + latitude + " < -90.0.";
        }
        if (latitude > 90.0) {
            throw "ParseGeoPoint latitude " + latitude + " > 90.0.";
        }
        if (longitude < -180.0) {
            throw "ParseGeoPoint longitude " + longitude + " < -180.0.";
        }
        if (longitude > 180.0) {
            throw "ParseGeoPoint longitude " + longitude + " > 180.0.";
        }
    };

    /**
    * Creates a GeoPoint with the user's current location, if available.
    * Calls options.success with a new GeoPoint instance or calls options.error.
    * @param {Object} options An object with success and error callbacks.
    */
    ParseGeoPoint.current = function() {
        var defer = $q.defer();
        navigator.geolocation.getCurrentPosition(function(location) {
            defer.resolve(new ParseGeoPoint({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            }));
        }, function(error) {
            defer.reject(error);
        });

        return defer.promise;
    };

    ParseGeoPoint.prototype = {
        /**
        * Returns a JSON representation of the GeoPoint, suitable for Parse.
        * @return {Object}
        */
        toJSON: function() {
            ParseGeoPoint._validate(this.latitude, this.longitude);
                return {
                "__type": "GeoPoint",
                latitude: this.latitude,
                longitude: this.longitude
            };
        },

        /**
        * Returns the distance from this GeoPoint to another in radians.
        * @param {ParseGeoPoint} point the other ParseGeoPoint.
        * @return {Number}
        */
        radiansTo: function(point) {
            var d2r = Math.PI / 180.0;
            var lat1rad = this.latitude * d2r;
            var long1rad = this.longitude * d2r;
            var lat2rad = point.latitude * d2r;
            var long2rad = point.longitude * d2r;
            var deltaLat = lat1rad - lat2rad;
            var deltaLong = long1rad - long2rad;
            var sinDeltaLatDiv2 = Math.sin(deltaLat / 2);
            var sinDeltaLongDiv2 = Math.sin(deltaLong / 2);
            // Square of half the straight line chord distance between both points.
            var a = ((sinDeltaLatDiv2 * sinDeltaLatDiv2) +
            (Math.cos(lat1rad) * Math.cos(lat2rad) *
            sinDeltaLongDiv2 * sinDeltaLongDiv2));
            a = Math.min(1.0, a);
            return 2 * Math.asin(Math.sqrt(a));
        },

        /**
        * Returns the distance from this GeoPoint to another in kilometers.
        * @param {ParseGeoPoint} point the other ParseGeoPoint.
        * @return {Number}
        */
        kilometersTo: function(point) {
            return this.radiansTo(point) * 6371.0;
        },

        /**
        * Returns the distance from this GeoPoint to another in miles.
        * @param {ParseGeoPoint} point the other ParseGeoPoint.
        * @return {Number}
        */
        milesTo: function(point) {
         return this.radiansTo(point) * 3958.8;
        }
    };

    return ParseGeoPoint;

});