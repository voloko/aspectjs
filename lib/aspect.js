/**
* Aspects for js (Function call interception)
* Released under the MIT License
* @copyright 2009 Vladimir Kolesnikov
* @author Vladimir Kolesnikov <voloko@gmail.com>
*/

var Aspect = new function() {

    this.add = function(obj, aspectName, aspect) {
        if (typeof(aspectName) == 'string') {
            obj.aspects = getAspects(obj);
            if (obj.aspects[aspectName]) this.remove(obj, aspectName);
            obj.aspects[aspectName] = aspect;

            for (var selector in aspect) {
                wrapMethod(obj, selector, aspect[selector])
            }
            return obj;
        } else {
            var aspects = aspectName || {};
            for (aspectName in aspects) {
                if (!aspects.hasOwnProperty(aspectName)) continue;
                this.add(obj, aspectName, aspects[aspectName]);
            }
        }
    },

    this.remove = function(obj, aspectName) {
        obj.aspects = getAspects(obj);
        var aspect = obj.aspects[aspectName],
            selector;
        for (selector in aspect) {
            unwrapMethod(obj, selector, aspect[selector]);
        }
        delete obj.aspects[aspectName];
        return obj;
    }

    // do not break prototypes
    function getAspects(obj) {
        if (obj.aspects) {
            if (obj.hasOwnProperty('aspects')) return obj.aspects;
            var aspects = {};
            for (var i in obj.aspects) {
                aspects[i] = obj.aspects[i];
            };
            return aspects;
        }
        return {};
    }

    // do not break prototypes
    function getWrappableMethod(obj, methodName) {
        if (obj[methodName]) {
            if (!obj.hasOwnProperty(methodName) && obj[methodName].__wrappers && obj[methodName].__wrappers.method) {
                var method = createInterceptor(obj[methodName].__wrappers.method);
                method.__wrappers.before  = [].concat(obj[methodName].__wrappers.before)
                method.__wrappers.after   = [].concat(obj[methodName].__wrappers.after)
                method.__wrappers.replace = [].concat(obj[methodName].__wrappers.replace)
                return method;
            }
            if (!obj[methodName].__wrappers) { // method redefined in subclass
                return createInterceptor(obj[methodName]);
            }
            return obj[methodName];
        }
        return createInterceptor(function() {}); // method deleted in subclass
    }

    function wrapMethod(obj, selector, wrapper) {
        var wrapperDescription = getWrapperDescription(selector),
            method;

        method = obj[wrapperDescription.methodName] = getWrappableMethod(obj, wrapperDescription.methodName);
        if (!method.__wrappers) {
            method = obj[wrapperDescription.methodName] = createInterceptor(method);
        };
        if (wrapperDescription.type == 'after') {
            method.__wrappers.after.push(wrapper);
        } else {
            method.__wrappers[wrapperDescription.type] = [wrapper].concat(method.__wrappers[wrapperDescription.type]);
        }
    }

    function unwrapMethod(obj, selector, wrapper) {
        var wrapperDescription = getWrapperDescription(selector),
            method = getWrappableMethod(obj, wrapperDescription.methodName),
            wrappers = method.__wrappers;
        wrappers[wrapperDescription.type] = without(wrappers[wrapperDescription.type], wrapper);
        obj[wrapperDescription.methodName] = method;
    }

    function getWrapperDescription(selector) {
        var match = selector.match(/^(after|before|replace) (.*)$/);
        return {
            type: (match ? match[1] : 'replace'),
            methodName: match ? match[2] : selector
        }
    }

    function without(array, item) {
        var result = [];
        for (var i=0, l = array.length; i < l; i++) {
            if (array[i] != item) result[result.length] = array[i];
        };
        return result;
    }

    function createInterceptor(method) {
        var interceptor = function() {
            for (var items = interceptor.__wrappers.before, l = items.length, i = 0; i < l; i++) {
                try{
                    items[i].apply(this, arguments);
                } catch (e) {
                    if (e instanceof AspectReturnException) return e.value;
                    throw e
                }
            }
            var method = interceptor.__wrappers.replace.length ? interceptor.__wrappers.replace[0] : interceptor.__wrappers.method,
                result = method.apply(this, arguments);

            for (items = interceptor.__wrappers.after, l = items.length, i = 0; i < l; i++) {
                try {
                    items[i].apply(this, arguments);
                } catch (e) {
                    throw e;
                }
            }
            return result;
        }
        interceptor.__wrappers = {
            before: [],
            after: [],
            replace: [],
            method: method
        }
        return interceptor;
    }
};

var AspectReturnException = function(value) { this.value = value }