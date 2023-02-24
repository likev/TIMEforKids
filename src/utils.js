function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
}

function getUTCTimeStr(time) {
    return time.clone().subtract(8, 'hours').format('YYYYMMDDHH') + '00';
}

function Polyfill() {
    //https://github.com/tc39/proposal-relative-indexing-method#polyfill

    if (typeof [].at !== "function") {

        function at(n) {
            // ToInteger() abstract op
            n = Math.trunc(n) || 0;
            // Allow negative indexing from the end
            if (n < 0) n += this.length;
            // OOB access is guaranteed to return undefined
            if (n < 0 || n >= this.length) return undefined;
            // Otherwise, this is just normal property access
            return this[n];
        }

        const TypedArray = Reflect.getPrototypeOf(Int8Array);
        for (const C of [Array, String, TypedArray]) {
            Object.defineProperty(C.prototype, "at",
                {
                    value: at,
                    writable: true,
                    enumerable: false,
                    configurable: true
                });
        }

    }
}

export { fixedEncodeURIComponent, getUTCTimeStr, Polyfill };

