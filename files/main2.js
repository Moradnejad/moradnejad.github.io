
(function() {
  var Color, DecomposedMatrix, DecomposedMatrix2D, InterpolableArray, InterpolableColor, InterpolableNumber, InterpolableObject, InterpolableString, Matrix, Matrix2D, Set, Vector, addTimeout, animationTick, animations, animationsTimeouts, applyDefaults, applyFrame, applyProperties, baseSVG, cacheFn, cancelTimeout, clone, createInterpolable, defaultValueForKey, degProperties, dynamics, getCurrentProperties, interpolate, isDocumentVisible, isSVGElement, lastTime, leftDelayForTimeout, makeArrayFn, observeVisibilityChange, parseProperties, prefixFor, propertyWithPrefix, pxProperties, rAF, roundf, runLoopPaused, runLoopRunning, runLoopTick, setRealTimeout, slow, slowRatio, startAnimation, startRunLoop, svgProperties, timeBeforeVisibilityChange, timeoutLastId, timeouts, toDashed, transformProperties, transformValueForProperty, unitForProperty,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  isDocumentVisible = function() {
    return document.visibilityState === "visible" || (dynamics.tests != null);
  };

  observeVisibilityChange = (function() {
    var fns;
    fns = [];
    if (typeof document !== "undefined" && document !== null) {
      document.addEventListener("visibilitychange", function() {
        var fn, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = fns.length; _i < _len; _i++) {
          fn = fns[_i];
          _results.push(fn(isDocumentVisible()));
        }
        return _results;
      });
    }
    return function(fn) {
      return fns.push(fn);
    };
  })();

  clone = function(o) {
    var k, newO, v;
    newO = {};
    for (k in o) {
      v = o[k];
      newO[k] = v;
    }
    return newO;
  };

  cacheFn = function(func) {
    var data;
    data = {};
    return function() {
      var k, key, result, _i, _len;
      key = "";
      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
        k = arguments[_i];
        key += k.toString() + ",";
      }
      result = data[key];
      if (!result) {
        data[key] = result = func.apply(this, arguments);
      }
      return result;
    };
  };

  makeArrayFn = function(fn) {
    return function(el) {
      var args, i, res;
      if (el instanceof Array || el instanceof NodeList || el instanceof HTMLCollection) {
        res = (function() {
          var _i, _ref, _results;
          _results = [];
          for (i = _i = 0, _ref = el.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            args = Array.prototype.slice.call(arguments, 1);
            args.splice(0, 0, el[i]);
            _results.push(fn.apply(this, args));
          }
          return _results;
        }).apply(this, arguments);
        return res;
      }
      return fn.apply(this, arguments);
    };
  };

  applyDefaults = function(options, defaults) {
    var k, v, _results;
    _results = [];
    for (k in defaults) {
      v = defaults[k];
      _results.push(options[k] != null ? options[k] : options[k] = v);
    }
    return _results;
  };

  applyFrame = function(el, properties) {
    var k, v, _results;
    if ((el.style != null)) {
      return applyProperties(el, properties);
    } else {
      _results = [];
      for (k in properties) {
        v = properties[k];
        _results.push(el[k] = v.format());
      }
      return _results;
    }
  };

  applyProperties = function(el, properties) {
    var isSVG, k, matrix, transforms, v;
    properties = parseProperties(properties);
    transforms = [];
    isSVG = isSVGElement(el);
    for (k in properties) {
      v = properties[k];
      if (transformProperties.contains(k)) {
        transforms.push([k, v]);
      } else {
        if (v.format != null) {
          v = v.format();
        }
        if (typeof v === 'number') {
          v = "" + v + (unitForProperty(k, v));
        }
        if (isSVG && svgProperties.contains(k)) {
          el.setAttribute(k, v);
        } else {
          el.style[propertyWithPrefix(k)] = v;
        }
      }
    }
    if (transforms.length > 0) {
      if (isSVG) {
        matrix = new Matrix2D();
        matrix.applyProperties(transforms);
        return el.setAttribute("transform", matrix.decompose().format());
      } else {
        v = (transforms.map(function(transform) {
          return transformValueForProperty(transform[0], transform[1]);
        })).join(" ");
        return el.style[propertyWithPrefix("transform")] = v;
      }
    }
  };

  isSVGElement = function(el) {
    var _ref, _ref1;
    if ((typeof SVGElement !== "undefined" && SVGElement !== null) && (typeof SVGSVGElement !== "undefined" && SVGSVGElement !== null)) {
      return el instanceof SVGElement && !(el instanceof SVGSVGElement);
    } else {
      return (_ref = (_ref1 = dynamics.tests) != null ? typeof _ref1.isSVG === "function" ? _ref1.isSVG(el) : void 0 : void 0) != null ? _ref : false;
    }
  };

  roundf = function(v, decimal) {
    var d;
    d = Math.pow(10, decimal);
    return Math.round(v * d) / d;
  };

  Set = (function() {
    function Set(array) {
      var v, _i, _len;
      this.obj = {};
      for (_i = 0, _len = array.length; _i < _len; _i++) {
        v = array[_i];
        this.obj[v] = 1;
      }
    }

    Set.prototype.contains = function(v) {
      return this.obj[v] === 1;
    };

    return Set;

  })();

  toDashed = function(str) {
    return str.replace(/([A-Z])/g, function($1) {
      return "-" + $1.toLowerCase();
    });
  };

  pxProperties = new Set('marginTop,marginLeft,marginBottom,marginRight,paddingTop,paddingLeft,paddingBottom,paddingRight,top,left,bottom,right,translateX,translateY,translateZ,perspectiveX,perspectiveY,perspectiveZ,width,height,maxWidth,maxHeight,minWidth,minHeight,borderRadius'.split(','));

  degProperties = new Set('rotate,rotateX,rotateY,rotateZ,skew,skewX,skewY,skewZ'.split(','));

  transformProperties = new Set('translate,translateX,translateY,translateZ,scale,scaleX,scaleY,scaleZ,rotate,rotateX,rotateY,rotateZ,rotateC,rotateCX,rotateCY,skew,skewX,skewY,skewZ,perspective'.split(','));

  svgProperties = new Set('accent-height,ascent,azimuth,baseFrequency,baseline-shift,bias,cx,cy,d,diffuseConstant,divisor,dx,dy,elevation,filterRes,fx,fy,gradientTransform,height,k1,k2,k3,k4,kernelMatrix,kernelUnitLength,letter-spacing,limitingConeAngle,markerHeight,markerWidth,numOctaves,order,overline-position,overline-thickness,pathLength,points,pointsAtX,pointsAtY,pointsAtZ,r,radius,rx,ry,seed,specularConstant,specularExponent,stdDeviation,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,surfaceScale,target,targetX,targetY,transform,underline-position,underline-thickness,viewBox,width,x,x1,x2,y,y1,y2,z'.split(','));

  unitForProperty = function(k, v) {
    if (typeof v !== 'number') {
      return '';
    }
    if (pxProperties.contains(k)) {
      return 'px';
    } else if (degProperties.contains(k)) {
      return 'deg';
    }
    return '';
  };

  transformValueForProperty = function(k, v) {
    var match, unit;
    match = ("" + v).match(/^([0-9.-]*)([^0-9]*)$/);
    if (match != null) {
      v = match[1];
      unit = match[2];
    } else {
      v = parseFloat(v);
    }
    v = roundf(parseFloat(v), 10);
    if ((unit == null) || unit === "") {
      unit = unitForProperty(k, v);
    }
    return "" + k + "(" + v + unit + ")";
  };

  parseProperties = function(properties) {
    var axis, match, parsed, property, value, _i, _len, _ref;
    parsed = {};
    for (property in properties) {
      value = properties[property];
      if (transformProperties.contains(property)) {
        match = property.match(/(translate|rotateC|rotate|skew|scale|perspective)(X|Y|Z|)/);
        if (match && match[2].length > 0) {
          parsed[property] = value;
        } else {
          _ref = ['X', 'Y', 'Z'];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            axis = _ref[_i];
            parsed[match[1] + axis] = value;
          }
        }
      } else {
        parsed[property] = value;
      }
    }
    return parsed;
  };

  defaultValueForKey = function(key) {
    var v;
    v = key === 'opacity' ? 1 : 0;
    return "" + v + (unitForProperty(key, v));
  };

  getCurrentProperties = function(el, keys) {
    var isSVG, key, matrix, properties, style, v, _i, _j, _len, _len1, _ref;
    properties = {};
    isSVG = isSVGElement(el);
    if (el.style != null) {
      style = window.getComputedStyle(el, null);
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        if (transformProperties.contains(key)) {
          if (properties['transform'] == null) {
            if (isSVG) {
              matrix = new Matrix2D((_ref = el.transform.baseVal.consolidate()) != null ? _ref.matrix : void 0);
            } else {
              matrix = Matrix.fromTransform(style[propertyWithPrefix('transform')]);
            }
            properties['transform'] = matrix.decompose();
          }
        } else {
          v = style[key];
          if ((v == null) && svgProperties.contains(key)) {
            v = el.getAttribute(key);
          }
          if (v === "" || (v == null)) {
            v = defaultValueForKey(key);
          }
          properties[key] = createInterpolable(v);
        }
      }
    } else {
      for (_j = 0, _len1 = keys.length; _j < _len1; _j++) {
        key = keys[_j];
        properties[key] = createInterpolable(el[key]);
      }
    }
    return properties;
  };

  createInterpolable = function(value) {
    var interpolable, klass, klasses, _i, _len;
    klasses = [InterpolableArray, InterpolableObject, InterpolableNumber, InterpolableString];
    for (_i = 0, _len = klasses.length; _i < _len; _i++) {
      klass = klasses[_i];
      interpolable = klass.create(value);
      if (interpolable != null) {
        return interpolable;
      }
    }
    return null;
  };

  InterpolableString = (function() {
    function InterpolableString(parts) {
      this.parts = parts;
      this.format = __bind(this.format, this);
      this.interpolate = __bind(this.interpolate, this);
    }

    InterpolableString.prototype.interpolate = function(endInterpolable, t) {
      var end, i, newParts, start, _i, _ref;
      start = this.parts;
      end = endInterpolable.parts;
      newParts = [];
      for (i = _i = 0, _ref = Math.min(start.length, end.length); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (start[i].interpolate != null) {
          newParts.push(start[i].interpolate(end[i], t));
        } else {
          newParts.push(start[i]);
        }
      }
      return new InterpolableString(newParts);
    };

    InterpolableString.prototype.format = function() {
      var parts;
      parts = this.parts.map(function(val) {
        if (val.format != null) {
          return val.format();
        } else {
          return val;
        }
      });
      return parts.join('');
    };

    InterpolableString.create = function(value) {
      var index, match, matches, parts, re, type, types, _i, _j, _len, _len1;
      value = "" + value;
      matches = [];
      types = [
        {
          re: /(#[a-f\d]{3,6})/ig,
          klass: InterpolableColor,
          parse: function(v) {
            return v;
          }
        }, {
          re: /(rgba?\([0-9.]*, ?[0-9.]*, ?[0-9.]*(?:, ?[0-9.]*)?\))/ig,
          klass: InterpolableColor,
          parse: function(v) {
            return v;
          }
        }, {
          re: /([-+]?[\d.]+)/ig,
          klass: InterpolableNumber,
          parse: parseFloat
        }
      ];
      for (_i = 0, _len = types.length; _i < _len; _i++) {
        type = types[_i];
        re = type.re;
        while (match = re.exec(value)) {
          matches.push({
            index: match.index,
            length: match[1].length,
            interpolable: type.klass.create(type.parse(match[1]))
          });
        }
      }
      matches = matches.sort(function(a, b) {
        return a.index > b.index;
      });
      parts = [];
      index = 0;
      for (_j = 0, _len1 = matches.length; _j < _len1; _j++) {
        match = matches[_j];
        if (match.index < index) {
          continue;
        }
        if (match.index > index) {
          parts.push(value.substring(index, match.index));
        }
        parts.push(match.interpolable);
        index = match.index + match.length;
      }
      if (index < value.length) {
        parts.push(value.substring(index));
      }
      return new InterpolableString(parts);
    };

    return InterpolableString;

  })();

  InterpolableObject = (function() {
    function InterpolableObject(obj) {
      this.format = __bind(this.format, this);
      this.interpolate = __bind(this.interpolate, this);
      this.obj = obj;
    }

    InterpolableObject.prototype.interpolate = function(endInterpolable, t) {
      var end, k, newObj, start, v;
      start = this.obj;
      end = endInterpolable.obj;
      newObj = {};
      for (k in start) {
        v = start[k];
        if (v.interpolate != null) {
          newObj[k] = v.interpolate(end[k], t);
        } else {
          newObj[k] = v;
        }
      }
      return new InterpolableObject(newObj);
    };

    InterpolableObject.prototype.format = function() {
      return this.obj;
    };

    InterpolableObject.create = function(value) {
      var k, obj, v;
      if (value instanceof Object) {
        obj = {};
        for (k in value) {
          v = value[k];
          obj[k] = createInterpolable(v);
        }
        return new InterpolableObject(obj);
      }
      return null;
    };

    return InterpolableObject;

  })();

  InterpolableNumber = (function() {
    function InterpolableNumber(value) {
      this.format = __bind(this.format, this);
      this.interpolate = __bind(this.interpolate, this);
      this.value = parseFloat(value);
    }

    InterpolableNumber.prototype.interpolate = function(endInterpolable, t) {
      var end, start;
      start = this.value;
      end = endInterpolable.value;
      return new InterpolableNumber((end - start) * t + start);
    };

    InterpolableNumber.prototype.format = function() {
      return roundf(this.value, 5);
    };

    InterpolableNumber.create = function(value) {
      if (typeof value === 'number') {
        return new InterpolableNumber(value);
      }
      return null;
    };

    return InterpolableNumber;

  })();

  InterpolableArray = (function() {
    function InterpolableArray(values) {
      this.values = values;
      this.format = __bind(this.format, this);
      this.interpolate = __bind(this.interpolate, this);
    }

    InterpolableArray.prototype.interpolate = function(endInterpolable, t) {
      var end, i, newValues, start, _i, _ref;
      start = this.values;
      end = endInterpolable.values;
      newValues = [];
      for (i = _i = 0, _ref = Math.min(start.length, end.length); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (start[i].interpolate != null) {
          newValues.push(start[i].interpolate(end[i], t));
        } else {
          newValues.push(start[i]);
        }
      }
      return new InterpolableArray(newValues);
    };

    InterpolableArray.prototype.format = function() {
      return this.values.map(function(val) {
        if (val.format != null) {
          return val.format();
        } else {
          return val;
        }
      });
    };

    InterpolableArray.createFromArray = function(arr) {
      var values;
      values = arr.map(function(val) {
        return createInterpolable(val) || val;
      });
      values = values.filter(function(val) {
        return val != null;
      });
      return new InterpolableArray(values);
    };

    InterpolableArray.create = function(value) {
      if (value instanceof Array) {
        return InterpolableArray.createFromArray(value);
      }
      return null;
    };

    return InterpolableArray;

  })();

  Color = (function() {
    function Color(rgb, format) {
      this.rgb = rgb != null ? rgb : {};
      this.format = format;
      this.toRgba = __bind(this.toRgba, this);
      this.toRgb = __bind(this.toRgb, this);
      this.toHex = __bind(this.toHex, this);
    }

    Color.fromHex = function(hex) {
      var hex3, result;
      hex3 = hex.match(/^#([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i);
      if (hex3 != null) {
        hex = "#" + hex3[1] + hex3[1] + hex3[2] + hex3[2] + hex3[3] + hex3[3];
      }
      result = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (result != null) {
        return new Color({
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
          a: 1
        }, "hex");
      }
      return null;
    };

    Color.fromRgb = function(rgb) {
      var match, _ref;
      match = rgb.match(/^rgba?\(([0-9.]*), ?([0-9.]*), ?([0-9.]*)(?:, ?([0-9.]*))?\)$/);
      if (match != null) {
        return new Color({
          r: parseFloat(match[1]),
          g: parseFloat(match[2]),
          b: parseFloat(match[3]),
          a: parseFloat((_ref = match[4]) != null ? _ref : 1)
        }, match[4] != null ? "rgba" : "rgb");
      }
      return null;
    };

    Color.componentToHex = function(c) {
      var hex;
      hex = c.toString(16);
      if (hex.length === 1) {
        return "0" + hex;
      } else {
        return hex;
      }
    };

    Color.prototype.toHex = function() {
      return "#" + Color.componentToHex(this.rgb.r) + Color.componentToHex(this.rgb.g) + Color.componentToHex(this.rgb.b);
    };

    Color.prototype.toRgb = function() {
      return "rgb(" + this.rgb.r + ", " + this.rgb.g + ", " + this.rgb.b + ")";
    };

    Color.prototype.toRgba = function() {
      return "rgba(" + this.rgb.r + ", " + this.rgb.g + ", " + this.rgb.b + ", " + this.rgb.a + ")";
    };

    return Color;

  })();

  InterpolableColor = (function() {
    function InterpolableColor(color) {
      this.color = color;
      this.format = __bind(this.format, this);
      this.interpolate = __bind(this.interpolate, this);
    }

    InterpolableColor.prototype.interpolate = function(endInterpolable, t) {
      var end, k, rgb, start, v, _i, _len, _ref;
      start = this.color;
      end = endInterpolable.color;
      rgb = {};
      _ref = ['r', 'g', 'b'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        v = Math.round((end.rgb[k] - start.rgb[k]) * t + start.rgb[k]);
        rgb[k] = Math.min(255, Math.max(0, v));
      }
      k = "a";
      v = roundf((end.rgb[k] - start.rgb[k]) * t + start.rgb[k], 5);
      rgb[k] = Math.min(1, Math.max(0, v));
      return new InterpolableColor(new Color(rgb, end.format));
    };

    InterpolableColor.prototype.format = function() {
      if (this.color.format === "hex") {
        return this.color.toHex();
      } else if (this.color.format === "rgb") {
        return this.color.toRgb();
      } else if (this.color.format === "rgba") {
        return this.color.toRgba();
      }
    };

    InterpolableColor.create = function(value) {
      var color;
      if (typeof value !== "string") {
        return;
      }
      color = Color.fromHex(value) || Color.fromRgb(value);
      if (color != null) {
        return new InterpolableColor(color);
      }
      return null;
    };

    return InterpolableColor;

  })();

  DecomposedMatrix2D = (function() {
    function DecomposedMatrix2D(props) {
      this.props = props;
      this.applyRotateCenter = __bind(this.applyRotateCenter, this);
      this.format = __bind(this.format, this);
      this.interpolate = __bind(this.interpolate, this);
    }

    DecomposedMatrix2D.prototype.interpolate = function(endMatrix, t) {
      var i, k, newProps, _i, _j, _k, _l, _len, _len1, _ref, _ref1, _ref2;
      newProps = {};
      _ref = ['translate', 'scale', 'rotate'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        newProps[k] = [];
        for (i = _j = 0, _ref1 = this.props[k].length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          newProps[k][i] = (endMatrix.props[k][i] - this.props[k][i]) * t + this.props[k][i];
        }
      }
      for (i = _k = 1; _k <= 2; i = ++_k) {
        newProps['rotate'][i] = endMatrix.props['rotate'][i];
      }
      _ref2 = ['skew'];
      for (_l = 0, _len1 = _ref2.length; _l < _len1; _l++) {
        k = _ref2[_l];
        newProps[k] = (endMatrix.props[k] - this.props[k]) * t + this.props[k];
      }
      return new DecomposedMatrix2D(newProps);
    };

    DecomposedMatrix2D.prototype.format = function() {
      return "translate(" + (this.props.translate.join(',')) + ") rotate(" + (this.props.rotate.join(',')) + ") skewX(" + this.props.skew + ") scale(" + (this.props.scale.join(',')) + ")";
    };

    DecomposedMatrix2D.prototype.applyRotateCenter = function(rotateC) {
      var i, m, m2d, negativeTranslate, _i, _results;
      m = baseSVG.createSVGMatrix();
      m = m.translate(rotateC[0], rotateC[1]);
      m = m.rotate(this.props.rotate[0]);
      m = m.translate(-rotateC[0], -rotateC[1]);
      m2d = new Matrix2D(m);
      negativeTranslate = m2d.decompose().props.translate;
      _results = [];
      for (i = _i = 0; _i <= 1; i = ++_i) {
        _results.push(this.props.translate[i] -= negativeTranslate[i]);
      }
      return _results;
    };

    return DecomposedMatrix2D;

  })();

  baseSVG = typeof document !== "undefined" && document !== null ? document.createElementNS("http://www.w3.org/2000/svg", "svg") : void 0;

  Matrix2D = (function() {
    function Matrix2D(m) {
      this.m = m;
      this.applyProperties = __bind(this.applyProperties, this);
      this.decompose = __bind(this.decompose, this);
      if (!this.m) {
        this.m = baseSVG.createSVGMatrix();
      }
    }

    Matrix2D.prototype.decompose = function() {
      var kx, ky, kz, r0, r1;
      r0 = new Vector([this.m.a, this.m.b]);
      r1 = new Vector([this.m.c, this.m.d]);
      kx = r0.length();
      kz = r0.dot(r1);
      r0 = r0.normalize();
      ky = r1.combine(r0, 1, -kz).length();
      return new DecomposedMatrix2D({
        translate: [this.m.e, this.m.f],
        rotate: [Math.atan2(this.m.b, this.m.a) * 180 / Math.PI, this.rotateCX, this.rotateCY],
        scale: [kx, ky],
        skew: kz / ky * 180 / Math.PI
      });
    };

    Matrix2D.prototype.applyProperties = function(properties) {
      var hash, k, props, v, _i, _len, _ref, _ref1;
      hash = {};
      for (_i = 0, _len = properties.length; _i < _len; _i++) {
        props = properties[_i];
        hash[props[0]] = props[1];
      }
      for (k in hash) {
        v = hash[k];
        if (k === "translateX") {
          this.m = this.m.translate(v, 0);
        } else if (k === "translateY") {
          this.m = this.m.translate(0, v);
        } else if (k === "scaleX") {
          this.m = this.m.scale(v, 1);
        } else if (k === "scaleY") {
          this.m = this.m.scale(1, v);
        } else if (k === "rotateZ") {
          this.m = this.m.rotate(v);
        } else if (k === "skewX") {
          this.m = this.m.skewX(v);
        } else if (k === "skewY") {
          this.m = this.m.skewY(v);
        }
      }
      this.rotateCX = (_ref = hash.rotateCX) != null ? _ref : 0;
      return this.rotateCY = (_ref1 = hash.rotateCY) != null ? _ref1 : 0;
    };

    return Matrix2D;

  })();

  Vector = (function() {
    function Vector(els) {
      this.els = els;
      this.combine = __bind(this.combine, this);
      this.normalize = __bind(this.normalize, this);
      this.length = __bind(this.length, this);
      this.cross = __bind(this.cross, this);
      this.dot = __bind(this.dot, this);
      this.e = __bind(this.e, this);
    }

    Vector.prototype.e = function(i) {
      if (i < 1 || i > this.els.length) {
        return null;
      } else {
        return this.els[i - 1];
      }
    };

    Vector.prototype.dot = function(vector) {
      var V, n, product;
      V = vector.els || vector;
      product = 0;
      n = this.els.length;
      if (n !== V.length) {
        return null;
      }
      n += 1;
      while (--n) {
        product += this.els[n - 1] * V[n - 1];
      }
      return product;
    };

    Vector.prototype.cross = function(vector) {
      var A, B;
      B = vector.els || vector;
      if (this.els.length !== 3 || B.length !== 3) {
        return null;
      }
      A = this.els;
      return new Vector([(A[1] * B[2]) - (A[2] * B[1]), (A[2] * B[0]) - (A[0] * B[2]), (A[0] * B[1]) - (A[1] * B[0])]);
    };

    Vector.prototype.length = function() {
      var a, e, _i, _len, _ref;
      a = 0;
      _ref = this.els;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        a += Math.pow(e, 2);
      }
      return Math.sqrt(a);
    };

    Vector.prototype.normalize = function() {
      var e, i, length, newElements, _ref;
      length = this.length();
      newElements = [];
      _ref = this.els;
      for (i in _ref) {
        e = _ref[i];
        newElements[i] = e / length;
      }
      return new Vector(newElements);
    };

    Vector.prototype.combine = function(b, ascl, bscl) {
      var i, result, _i, _ref;
      result = [];
      for (i = _i = 0, _ref = this.els.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        result[i] = (ascl * this.els[i]) + (bscl * b.els[i]);
      }
      return new Vector(result);
    };

    return Vector;

  })();

  DecomposedMatrix = (function() {
    function DecomposedMatrix() {
      this.toMatrix = __bind(this.toMatrix, this);
      this.format = __bind(this.format, this);
      this.interpolate = __bind(this.interpolate, this);
    }

    DecomposedMatrix.prototype.interpolate = function(decomposedB, t, only) {
      var angle, decomposed, decomposedA, i, invscale, invth, k, qa, qb, scale, th, _i, _j, _k, _l, _len, _ref, _ref1;
      if (only == null) {
        only = null;
      }
      decomposedA = this;
      decomposed = new DecomposedMatrix;
      _ref = ['translate', 'scale', 'skew', 'perspective'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        decomposed[k] = [];
        for (i = _j = 0, _ref1 = decomposedA[k].length - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          if ((only == null) || only.indexOf(k) > -1 || only.indexOf("" + k + ['x', 'y', 'z'][i]) > -1) {
            decomposed[k][i] = (decomposedB[k][i] - decomposedA[k][i]) * t + decomposedA[k][i];
          } else {
            decomposed[k][i] = decomposedA[k][i];
          }
        }
      }
      if ((only == null) || only.indexOf('rotate') !== -1) {
        qa = decomposedA.quaternion;
        qb = decomposedB.quaternion;
        angle = qa[0] * qb[0] + qa[1] * qb[1] + qa[2] * qb[2] + qa[3] * qb[3];
        if (angle < 0.0) {
          for (i = _k = 0; _k <= 3; i = ++_k) {
            qa[i] = -qa[i];
          }
          angle = -angle;
        }
        if (angle + 1.0 > .05) {
          if (1.0 - angle >= .05) {
            th = Math.acos(angle);
            invth = 1.0 / Math.sin(th);
            scale = Math.sin(th * (1.0 - t)) * invth;
            invscale = Math.sin(th * t) * invth;
          } else {
            scale = 1.0 - t;
            invscale = t;
          }
        } else {
          qb[0] = -qa[1];
          qb[1] = qa[0];
          qb[2] = -qa[3];
          qb[3] = qa[2];
          scale = Math.sin(piDouble * (.5 - t));
          invscale = Math.sin(piDouble * t);
        }
        decomposed.quaternion = [];
        for (i = _l = 0; _l <= 3; i = ++_l) {
          decomposed.quaternion[i] = qa[i] * scale + qb[i] * invscale;
        }
      } else {
        decomposed.quaternion = decomposedA.quaternion;
      }
      return decomposed;
    };

    DecomposedMatrix.prototype.format = function() {
      return this.toMatrix().toString();
    };

    DecomposedMatrix.prototype.toMatrix = function() {
      var decomposedMatrix, i, j, match, matrix, quaternion, skew, temp, w, x, y, z, _i, _j, _k, _l;
      decomposedMatrix = this;
      matrix = Matrix.I(4);
      for (i = _i = 0; _i <= 3; i = ++_i) {
        matrix.els[i][3] = decomposedMatrix.perspective[i];
      }
      quaternion = decomposedMatrix.quaternion;
      x = quaternion[0];
      y = quaternion[1];
      z = quaternion[2];
      w = quaternion[3];
      skew = decomposedMatrix.skew;
      match = [[1, 0], [2, 0], [2, 1]];
      for (i = _j = 2; _j >= 0; i = --_j) {
        if (skew[i]) {
          temp = Matrix.I(4);
          temp.els[match[i][0]][match[i][1]] = skew[i];
          matrix = matrix.multiply(temp);
        }
      }
      matrix = matrix.multiply(new Matrix([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 0], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 0], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y), 0], [0, 0, 0, 1]]));
      for (i = _k = 0; _k <= 2; i = ++_k) {
        for (j = _l = 0; _l <= 2; j = ++_l) {
          matrix.els[i][j] *= decomposedMatrix.scale[i];
        }
        matrix.els[3][i] = decomposedMatrix.translate[i];
      }
      return matrix;
    };

    return DecomposedMatrix;

  })();

  Matrix = (function() {
    function Matrix(els) {
      this.els = els;
      this.toString = __bind(this.toString, this);
      this.decompose = __bind(this.decompose, this);
      this.inverse = __bind(this.inverse, this);
      this.augment = __bind(this.augment, this);
      this.toRightTriangular = __bind(this.toRightTriangular, this);
      this.transpose = __bind(this.transpose, this);
      this.multiply = __bind(this.multiply, this);
      this.dup = __bind(this.dup, this);
      this.e = __bind(this.e, this);
    }

    Matrix.prototype.e = function(i, j) {
      if (i < 1 || i > this.els.length || j < 1 || j > this.els[0].length) {
        return null;
      }
      return this.els[i - 1][j - 1];
    };

    Matrix.prototype.dup = function() {
      return new Matrix(this.els);
    };

    Matrix.prototype.multiply = function(matrix) {
      var M, c, cols, elements, i, j, ki, kj, nc, ni, nj, returnVector, sum;
      returnVector = matrix.modulus ? true : false;
      M = matrix.els || matrix;
      if (typeof M[0][0] === 'undefined') {
        M = new Matrix(M).els;
      }
      ni = this.els.length;
      ki = ni;
      kj = M[0].length;
      cols = this.els[0].length;
      elements = [];
      ni += 1;
      while (--ni) {
        i = ki - ni;
        elements[i] = [];
        nj = kj;
        nj += 1;
        while (--nj) {
          j = kj - nj;
          sum = 0;
          nc = cols;
          nc += 1;
          while (--nc) {
            c = cols - nc;
            sum += this.els[i][c] * M[c][j];
          }
          elements[i][j] = sum;
        }
      }
      M = new Matrix(elements);
      if (returnVector) {
        return M.col(1);
      } else {
        return M;
      }
    };

    Matrix.prototype.transpose = function() {
      var cols, elements, i, j, ni, nj, rows;
      rows = this.els.length;
      cols = this.els[0].length;
      elements = [];
      ni = cols;
      ni += 1;
      while (--ni) {
        i = cols - ni;
        elements[i] = [];
        nj = rows;
        nj += 1;
        while (--nj) {
          j = rows - nj;
          elements[i][j] = this.els[j][i];
        }
      }
      return new Matrix(elements);
    };

    Matrix.prototype.toRightTriangular = function() {
      var M, els, i, j, k, kp, multiplier, n, np, p, _i, _j, _ref, _ref1;
      M = this.dup();
      n = this.els.length;
      k = n;
      kp = this.els[0].length;
      while (--n) {
        i = k - n;
        if (M.els[i][i] === 0) {
          for (j = _i = _ref = i + 1; _ref <= k ? _i < k : _i > k; j = _ref <= k ? ++_i : --_i) {
            if (M.els[j][i] !== 0) {
              els = [];
              np = kp;
              np += 1;
              while (--np) {
                p = kp - np;
                els.push(M.els[i][p] + M.els[j][p]);
              }
              M.els[i] = els;
              break;
            }
          }
        }
        if (M.els[i][i] !== 0) {
          for (j = _j = _ref1 = i + 1; _ref1 <= k ? _j < k : _j > k; j = _ref1 <= k ? ++_j : --_j) {
            multiplier = M.els[j][i] / M.els[i][i];
            els = [];
            np = kp;
            np += 1;
            while (--np) {
              p = kp - np;
              els.push(p <= i ? 0 : M.els[j][p] - M.els[i][p] * multiplier);
            }
            M.els[j] = els;
          }
        }
      }
      return M;
    };

    Matrix.prototype.augment = function(matrix) {
      var M, T, cols, i, j, ki, kj, ni, nj;
      M = matrix.els || matrix;
      if (typeof M[0][0] === 'undefined') {
        M = new Matrix(M).els;
      }
      T = this.dup();
      cols = T.els[0].length;
      ni = T.els.length;
      ki = ni;
      kj = M[0].length;
      if (ni !== M.length) {
        return null;
      }
      ni += 1;
      while (--ni) {
        i = ki - ni;
        nj = kj;
        nj += 1;
        while (--nj) {
          j = kj - nj;
          T.els[i][cols + j] = M[i][j];
        }
      }
      return T;
    };

    Matrix.prototype.inverse = function() {
      var M, divisor, els, i, inverse_elements, j, ki, kp, new_element, ni, np, p, _i;
      ni = this.els.length;
      ki = ni;
      M = this.augment(Matrix.I(ni)).toRightTriangular();
      kp = M.els[0].length;
      inverse_elements = [];
      ni += 1;
      while (--ni) {
        i = ni - 1;
        els = [];
        np = kp;
        inverse_elements[i] = [];
        divisor = M.els[i][i];
        np += 1;
        while (--np) {
          p = kp - np;
          new_element = M.els[i][p] / divisor;
          els.push(new_element);
          if (p >= ki) {
            inverse_elements[i].push(new_element);
          }
        }
        M.els[i] = els;
        for (j = _i = 0; 0 <= i ? _i < i : _i > i; j = 0 <= i ? ++_i : --_i) {
          els = [];
          np = kp;
          np += 1;
          while (--np) {
            p = kp - np;
            els.push(M.els[j][p] - M.els[i][p] * M.els[j][i]);
          }
          M.els[j] = els;
        }
      }
      return new Matrix(inverse_elements);
    };

    Matrix.I = function(n) {
      var els, i, j, k, nj;
      els = [];
      k = n;
      n += 1;
      while (--n) {
        i = k - n;
        els[i] = [];
        nj = k;
        nj += 1;
        while (--nj) {
          j = k - nj;
          els[i][j] = i === j ? 1 : 0;
        }
      }
      return new Matrix(els);
    };

    Matrix.prototype.decompose = function() {
      var els, i, inversePerspectiveMatrix, j, k, matrix, pdum3, perspective, perspectiveMatrix, quaternion, result, rightHandSide, rotate, row, rowElement, s, scale, skew, t, translate, transposedInversePerspectiveMatrix, type, typeKey, v, w, x, y, z, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
      matrix = this;
      translate = [];
      scale = [];
      skew = [];
      quaternion = [];
      perspective = [];
      els = [];
      for (i = _i = 0; _i <= 3; i = ++_i) {
        els[i] = [];
        for (j = _j = 0; _j <= 3; j = ++_j) {
          els[i][j] = matrix.els[i][j];
        }
      }
      if (els[3][3] === 0) {
        return false;
      }
      for (i = _k = 0; _k <= 3; i = ++_k) {
        for (j = _l = 0; _l <= 3; j = ++_l) {
          els[i][j] /= els[3][3];
        }
      }
      perspectiveMatrix = matrix.dup();
      for (i = _m = 0; _m <= 2; i = ++_m) {
        perspectiveMatrix.els[i][3] = 0;
      }
      perspectiveMatrix.els[3][3] = 1;
      if (els[0][3] !== 0 || els[1][3] !== 0 || els[2][3] !== 0) {
        rightHandSide = new Vector(els.slice(0, 4)[3]);
        inversePerspectiveMatrix = perspectiveMatrix.inverse();
        transposedInversePerspectiveMatrix = inversePerspectiveMatrix.transpose();
        perspective = transposedInversePerspectiveMatrix.multiply(rightHandSide).els;
        for (i = _n = 0; _n <= 2; i = ++_n) {
          els[i][3] = 0;
        }
        els[3][3] = 1;
      } else {
        perspective = [0, 0, 0, 1];
      }
      for (i = _o = 0; _o <= 2; i = ++_o) {
        translate[i] = els[3][i];
        els[3][i] = 0;
      }
      row = [];
      for (i = _p = 0; _p <= 2; i = ++_p) {
        row[i] = new Vector(els[i].slice(0, 3));
      }
      scale[0] = row[0].length();
      row[0] = row[0].normalize();
      skew[0] = row[0].dot(row[1]);
      row[1] = row[1].combine(row[0], 1.0, -skew[0]);
      scale[1] = row[1].length();
      row[1] = row[1].normalize();
      skew[0] /= scale[1];
      skew[1] = row[0].dot(row[2]);
      row[2] = row[2].combine(row[0], 1.0, -skew[1]);
      skew[2] = row[1].dot(row[2]);
      row[2] = row[2].combine(row[1], 1.0, -skew[2]);
      scale[2] = row[2].length();
      row[2] = row[2].normalize();
      skew[1] /= scale[2];
      skew[2] /= scale[2];
      pdum3 = row[1].cross(row[2]);
      if (row[0].dot(pdum3) < 0) {
        for (i = _q = 0; _q <= 2; i = ++_q) {
          scale[i] *= -1;
          for (j = _r = 0; _r <= 2; j = ++_r) {
            row[i].els[j] *= -1;
          }
        }
      }
      rowElement = function(index, elementIndex) {
        return row[index].els[elementIndex];
      };
      rotate = [];
      rotate[1] = Math.asin(-rowElement(0, 2));
      if (Math.cos(rotate[1]) !== 0) {
        rotate[0] = Math.atan2(rowElement(1, 2), rowElement(2, 2));
        rotate[2] = Math.atan2(rowElement(0, 1), rowElement(0, 0));
      } else {
        rotate[0] = Math.atan2(-rowElement(2, 0), rowElement(1, 1));
        rotate[1] = 0;
      }
      t = rowElement(0, 0) + rowElement(1, 1) + rowElement(2, 2) + 1.0;
      if (t > 1e-4) {
        s = 0.5 / Math.sqrt(t);
        w = 0.25 / s;
        x = (rowElement(2, 1) - rowElement(1, 2)) * s;
        y = (rowElement(0, 2) - rowElement(2, 0)) * s;
        z = (rowElement(1, 0) - rowElement(0, 1)) * s;
      } else if ((rowElement(0, 0) > rowElement(1, 1)) && (rowElement(0, 0) > rowElement(2, 2))) {
        s = Math.sqrt(1.0 + rowElement(0, 0) - rowElement(1, 1) - rowElement(2, 2)) * 2.0;
        x = 0.25 * s;
        y = (rowElement(0, 1) + rowElement(1, 0)) / s;
        z = (rowElement(0, 2) + rowElement(2, 0)) / s;
        w = (rowElement(2, 1) - rowElement(1, 2)) / s;
      } else if (rowElement(1, 1) > rowElement(2, 2)) {
        s = Math.sqrt(1.0 + rowElement(1, 1) - rowElement(0, 0) - rowElement(2, 2)) * 2.0;
        x = (rowElement(0, 1) + rowElement(1, 0)) / s;
        y = 0.25 * s;
        z = (rowElement(1, 2) + rowElement(2, 1)) / s;
        w = (rowElement(0, 2) - rowElement(2, 0)) / s;
      } else {
        s = Math.sqrt(1.0 + rowElement(2, 2) - rowElement(0, 0) - rowElement(1, 1)) * 2.0;
        x = (rowElement(0, 2) + rowElement(2, 0)) / s;
        y = (rowElement(1, 2) + rowElement(2, 1)) / s;
        z = 0.25 * s;
        w = (rowElement(1, 0) - rowElement(0, 1)) / s;
      }
      quaternion = [x, y, z, w];
      result = new DecomposedMatrix;
      result.translate = translate;
      result.scale = scale;
      result.skew = skew;
      result.quaternion = quaternion;
      result.perspective = perspective;
      result.rotate = rotate;
      for (typeKey in result) {
        type = result[typeKey];
        for (k in type) {
          v = type[k];
          if (isNaN(v)) {
            type[k] = 0;
          }
        }
      }
      return result;
    };

    Matrix.prototype.toString = function() {
      var i, j, str, _i, _j;
      str = 'matrix3d(';
      for (i = _i = 0; _i <= 3; i = ++_i) {
        for (j = _j = 0; _j <= 3; j = ++_j) {
          str += roundf(this.els[i][j], 10);
          if (!(i === 3 && j === 3)) {
            str += ',';
          }
        }
      }
      str += ')';
      return str;
    };

    Matrix.matrixForTransform = cacheFn(function(transform) {
      var matrixEl, result, style, _ref, _ref1, _ref2;
      matrixEl = document.createElement('div');
      matrixEl.style.position = 'absolute';
      matrixEl.style.visibility = 'hidden';
      matrixEl.style[propertyWithPrefix("transform")] = transform;
      document.body.appendChild(matrixEl);
      style = window.getComputedStyle(matrixEl, null);
      result = (_ref = (_ref1 = style.transform) != null ? _ref1 : style[propertyWithPrefix("transform")]) != null ? _ref : (_ref2 = dynamics.tests) != null ? _ref2.matrixForTransform(transform) : void 0;
      document.body.removeChild(matrixEl);
      return result;
    });

    Matrix.fromTransform = function(transform) {
      var digits, elements, i, match, matrixElements, _i;
      match = transform != null ? transform.match(/matrix3?d?\(([-0-9,e \.]*)\)/) : void 0;
      if (match) {
        digits = match[1].split(',');
        digits = digits.map(parseFloat);
        if (digits.length === 6) {
          elements = [digits[0], digits[1], 0, 0, digits[2], digits[3], 0, 0, 0, 0, 1, 0, digits[4], digits[5], 0, 1];
        } else {
          elements = digits;
        }
      } else {
        elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      }
      matrixElements = [];
      for (i = _i = 0; _i <= 3; i = ++_i) {
        matrixElements.push(elements.slice(i * 4, i * 4 + 4));
      }
      return new Matrix(matrixElements);
    };

    return Matrix;

  })();

  prefixFor = cacheFn(function(property) {
    var k, prefix, prop, propArray, propertyName, _i, _j, _len, _len1, _ref;
    if (document.body.style[property] !== void 0) {
      return '';
    }
    propArray = property.split('-');
    propertyName = "";
    for (_i = 0, _len = propArray.length; _i < _len; _i++) {
      prop = propArray[_i];
      propertyName += prop.substring(0, 1).toUpperCase() + prop.substring(1);
    }
    _ref = ["Webkit", "Moz", "ms"];
    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
      prefix = _ref[_j];
      k = prefix + propertyName;
      if (document.body.style[k] !== void 0) {
        return prefix;
      }
    }
    return '';
  });

  propertyWithPrefix = cacheFn(function(property) {
    var prefix;
    prefix = prefixFor(property);
    if (prefix === 'Moz') {
      return "" + prefix + (property.substring(0, 1).toUpperCase() + property.substring(1));
    }
    if (prefix !== '') {
      return "-" + (prefix.toLowerCase()) + "-" + (toDashed(property));
    }
    return toDashed(property);
  });

  rAF = typeof window !== "undefined" && window !== null ? window.requestAnimationFrame : void 0;

  animations = [];

  animationsTimeouts = [];

  slow = false;

  slowRatio = 1;

  if (typeof window !== "undefined" && window !== null) {
    window.addEventListener('keyup', function(e) {
      if (e.keyCode === 68 && e.shiftKey && e.ctrlKey) {
        return dynamics.toggleSlow();
      }
    });
  }

  if (rAF == null) {
    lastTime = 0;
    rAF = function(callback) {
      var currTime, id, timeToCall;
      currTime = Date.now();
      timeToCall = Math.max(0, 16 - (currTime - lastTime));
      id = window.setTimeout(function() {
        return callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  runLoopRunning = false;

  runLoopPaused = false;

  startRunLoop = function() {
    if (!runLoopRunning) {
      runLoopRunning = true;
      return rAF(runLoopTick);
    }
  };

  runLoopTick = function(t) {
    var animation, toRemoveAnimations, _i, _len;
    if (runLoopPaused) {
      rAF(runLoopTick);
      return;
    }
    toRemoveAnimations = [];
    for (_i = 0, _len = animations.length; _i < _len; _i++) {
      animation = animations[_i];
      if (!animationTick(t, animation)) {
        toRemoveAnimations.push(animation);
      }
    }
    animations = animations.filter(function(animation) {
      return toRemoveAnimations.indexOf(animation) === -1;
    });
    if (animations.length === 0) {
      return runLoopRunning = false;
    } else {
      return rAF(runLoopTick);
    }
  };

  animationTick = function(t, animation) {
    var key, properties, property, tt, y, _base, _base1, _ref;
    if (animation.tStart == null) {
      animation.tStart = t;
    }
    tt = (t - animation.tStart) / animation.options.duration;
    y = animation.curve(tt);
    properties = {};
    if (tt >= 1) {
      if (animation.curve.returnsToSelf) {
        properties = animation.properties.start;
      } else {
        properties = animation.properties.end;
      }
    } else {
      _ref = animation.properties.start;
      for (key in _ref) {
        property = _ref[key];
        properties[key] = interpolate(property, animation.properties.end[key], y);
      }
    }
    applyFrame(animation.el, properties);
    if (typeof (_base = animation.options).change === "function") {
      _base.change(animation.el);
    }
    if (tt >= 1) {
      if (typeof (_base1 = animation.options).complete === "function") {
        _base1.complete(animation.el);
      }
    }
    return tt < 1;
  };

  interpolate = function(start, end, y) {
    if ((start != null) && (start.interpolate != null)) {
      return start.interpolate(end, y);
    }
    return null;
  };

  startAnimation = function(el, properties, options, timeoutId) {
    var endProperties, interpolable, isSVG, k, matrix, startProperties, transforms, v;
    if (timeoutId != null) {
      animationsTimeouts = animationsTimeouts.filter(function(timeout) {
        return timeout.id !== timeoutId;
      });
    }
    dynamics.stop(el, {
      timeout: false
    });
    if (!options.animated) {
      dynamics.css(el, properties);
      if (typeof options.complete === "function") {
        options.complete(this);
      }
      return;
    }
    properties = parseProperties(properties);
    startProperties = getCurrentProperties(el, Object.keys(properties));
    endProperties = {};
    transforms = [];
    for (k in properties) {
      v = properties[k];
      if ((el.style != null) && transformProperties.contains(k)) {
        transforms.push([k, v]);
      } else {
        interpolable = createInterpolable(v);
        if (interpolable instanceof InterpolableNumber && (el.style != null)) {
          interpolable = new InterpolableString([interpolable, unitForProperty(k, 0)]);
        }
        endProperties[k] = interpolable;
      }
    }
    if (transforms.length > 0) {
      isSVG = isSVGElement(el);
      if (isSVG) {
        matrix = new Matrix2D();
        matrix.applyProperties(transforms);
      } else {
        v = (transforms.map(function(transform) {
          return transformValueForProperty(transform[0], transform[1]);
        })).join(" ");
        matrix = Matrix.fromTransform(Matrix.matrixForTransform(v));
      }
      endProperties['transform'] = matrix.decompose();
      if (isSVG) {
        startProperties.transform.applyRotateCenter([endProperties.transform.props.rotate[1], endProperties.transform.props.rotate[2]]);
      }
    }
    animations.push({
      el: el,
      properties: {
        start: startProperties,
        end: endProperties
      },
      options: options,
      curve: options.type.call(options.type, options)
    });
    return startRunLoop();
  };

  timeouts = [];

  timeoutLastId = 0;

  setRealTimeout = function(timeout) {
    if (!isDocumentVisible()) {
      return;
    }
    return timeout.realTimeoutId = setTimeout(function() {
      timeout.fn();
      return cancelTimeout(timeout.id);
    }, timeout.delay);
  };

  addTimeout = function(fn, delay) {
    var timeout;
    timeoutLastId += 1;
    timeout = {
      id: timeoutLastId,
      tStart: Date.now(),
      fn: fn,
      delay: delay,
      originalDelay: delay
    };
    setRealTimeout(timeout);
    timeouts.push(timeout);
    return timeoutLastId;
  };

  cancelTimeout = function(id) {
    return timeouts = timeouts.filter(function(timeout) {
      if (timeout.id === id) {
        clearTimeout(timeout.realTimeoutId);
      }
      return timeout.id !== id;
    });
  };

  leftDelayForTimeout = function(time, timeout) {
    var consumedDelay;
    if (time != null) {
      consumedDelay = time - timeout.tStart;
      return timeout.originalDelay - consumedDelay;
    } else {
      return timeout.originalDelay;
    }
  };

  if (typeof window !== "undefined" && window !== null) {
    window.addEventListener('unload', function() {});
  }

  timeBeforeVisibilityChange = null;

  observeVisibilityChange(function(visible) {
    var animation, difference, timeout, _i, _j, _k, _len, _len1, _len2, _results;
    runLoopPaused = !visible;
    if (!visible) {
      timeBeforeVisibilityChange = Date.now();
      _results = [];
      for (_i = 0, _len = timeouts.length; _i < _len; _i++) {
        timeout = timeouts[_i];
        _results.push(clearTimeout(timeout.realTimeoutId));
      }
      return _results;
    } else {
      if (runLoopRunning) {
        difference = Date.now() - timeBeforeVisibilityChange;
        for (_j = 0, _len1 = animations.length; _j < _len1; _j++) {
          animation = animations[_j];
          if (animation.tStart != null) {
            animation.tStart += difference;
          }
        }
      }
      for (_k = 0, _len2 = timeouts.length; _k < _len2; _k++) {
        timeout = timeouts[_k];
        timeout.delay = leftDelayForTimeout(timeBeforeVisibilityChange, timeout);
        setRealTimeout(timeout);
      }
      return timeBeforeVisibilityChange = null;
    }
  });

  dynamics = {};

  dynamics.linear = function() {
    return function(t) {
      return t;
    };
  };

  dynamics.spring = function(options) {
    var A1, A2, decal, frequency, friction, s;
    if (options == null) {
      options = {};
    }
    applyDefaults(options, dynamics.spring.defaults);
    frequency = Math.max(1, options.frequency / 20);
    friction = Math.pow(20, options.friction / 100);
    s = options.anticipationSize / 1000;
    decal = Math.max(0, s);
    A1 = function(t) {
      var M, a, b, x0, x1;
      M = 0.8;
      x0 = s / (1 - s);
      x1 = 0;
      b = (x0 - (M * x1)) / (x0 - x1);
      a = (M - b) / x0;
      return (a * t * options.anticipationStrength / 100) + b;
    };
    A2 = function(t) {
      return Math.pow(friction / 10, -t) * (1 - t);
    };
    return function(t) {
      var A, At, a, angle, b, frictionT, y0, yS;
      frictionT = (t / (1 - s)) - (s / (1 - s));
      if (t < s) {
        yS = (s / (1 - s)) - (s / (1 - s));
        y0 = (0 / (1 - s)) - (s / (1 - s));
        b = Math.acos(1 / A1(yS));
        a = (Math.acos(1 / A1(y0)) - b) / (frequency * (-s));
        A = A1;
      } else {
        A = A2;
        b = 0;
        a = 1;
      }
      At = A(frictionT);
      angle = frequency * (t - s) * a + b;
      return 1 - (At * Math.cos(angle));
    };
  };

  dynamics.bounce = function(options) {
    var A, fn, frequency, friction;
    if (options == null) {
      options = {};
    }
    applyDefaults(options, dynamics.bounce.defaults);
    frequency = Math.max(1, options.frequency / 20);
    friction = Math.pow(20, options.friction / 100);
    A = function(t) {
      return Math.pow(friction / 10, -t) * (1 - t);
    };
    fn = function(t) {
      var At, a, angle, b;
      b = -3.14 / 2;
      a = 1;
      At = A(t);
      angle = frequency * t * a + b;
      return At * Math.cos(angle);
    };
    fn.returnsToSelf = true;
    return fn;
  };

  dynamics.gravity = function(options) {
    var L, bounciness, curves, elasticity, fn, getPointInCurve, gravity;
    if (options == null) {
      options = {};
    }
    applyDefaults(options, dynamics.gravity.defaults);
    bounciness = Math.min(options.bounciness / 1250, 0.8);
    elasticity = options.elasticity / 1000;
    gravity = 100;
    curves = [];
    L = (function() {
      var b, curve;
      b = Math.sqrt(2 / gravity);
      curve = {
        a: -b,
        b: b,
        H: 1
      };
      if (options.returnsToSelf) {
        curve.a = 0;
        curve.b = curve.b * 2;
      }
      while (curve.H > 0.001) {
        L = curve.b - curve.a;
        curve = {
          a: curve.b,
          b: curve.b + L * bounciness,
          H: curve.H * bounciness * bounciness
        };
      }
      return curve.b;
    })();
    getPointInCurve = function(a, b, H, t) {
      var c, t2;
      L = b - a;
      t2 = (2 / L) * t - 1 - (a * 2 / L);
      c = t2 * t2 * H - H + 1;
      if (options.returnsToSelf) {
        c = 1 - c;
      }
      return c;
    };
    (function() {
      var L2, b, curve, _results;
      b = Math.sqrt(2 / (gravity * L * L));
      curve = {
        a: -b,
        b: b,
        H: 1
      };
      if (options.returnsToSelf) {
        curve.a = 0;
        curve.b = curve.b * 2;
      }
      curves.push(curve);
      L2 = L;
      _results = [];
      while (curve.b < 1 && curve.H > 0.001) {
        L2 = curve.b - curve.a;
        curve = {
          a: curve.b,
          b: curve.b + L2 * bounciness,
          H: curve.H * elasticity
        };
        _results.push(curves.push(curve));
      }
      return _results;
    })();
    fn = function(t) {
      var curve, i, v;
      i = 0;
      curve = curves[i];
      while (!(t >= curve.a && t <= curve.b)) {
        i += 1;
        curve = curves[i];
        if (!curve) {
          break;
        }
      }
      if (!curve) {
        v = options.returnsToSelf ? 0 : 1;
      } else {
        v = getPointInCurve(curve.a, curve.b, curve.H, t);
      }
      return v;
    };
    fn.returnsToSelf = options.returnsToSelf;
    return fn;
  };

  dynamics.forceWithGravity = function(options) {
    if (options == null) {
      options = {};
    }
    applyDefaults(options, dynamics.forceWithGravity.defaults);
    options.returnsToSelf = true;
    return dynamics.gravity(options);
  };

  dynamics.bezier = (function() {
    var Bezier, Bezier_, yForX;
    Bezier_ = function(t, p0, p1, p2, p3) {
      return (Math.pow(1 - t, 3) * p0) + (3 * Math.pow(1 - t, 2) * t * p1) + (3 * (1 - t) * Math.pow(t, 2) * p2) + Math.pow(t, 3) * p3;
    };
    Bezier = function(t, p0, p1, p2, p3) {
      return {
        x: Bezier_(t, p0.x, p1.x, p2.x, p3.x),
        y: Bezier_(t, p0.y, p1.y, p2.y, p3.y)
      };
    };
    yForX = function(xTarget, Bs, returnsToSelf) {
      var B, aB, i, lower, percent, upper, x, xTolerance, _i, _len;
      B = null;
      for (_i = 0, _len = Bs.length; _i < _len; _i++) {
        aB = Bs[_i];
        if (xTarget >= aB(0).x && xTarget <= aB(1).x) {
          B = aB;
        }
        if (B !== null) {
          break;
        }
      }
      if (!B) {
        if (returnsToSelf) {
          return 0;
        } else {
          return 1;
        }
      }
      xTolerance = 0.0001;
      lower = 0;
      upper = 1;
      percent = (upper + lower) / 2;
      x = B(percent).x;
      i = 0;
      while (Math.abs(xTarget - x) > xTolerance && i < 100) {
        if (xTarget > x) {
          lower = percent;
        } else {
          upper = percent;
        }
        percent = (upper + lower) / 2;
        x = B(percent).x;
        i += 1;
      }
      return B(percent).y;
    };
    return function(options) {
      var Bs, fn, points;
      if (options == null) {
        options = {};
      }
      points = options.points;
      Bs = (function() {
        var i, k, _fn;
        Bs = [];
        _fn = function(pointA, pointB) {
          var B2;
          B2 = function(t) {
            return Bezier(t, pointA, pointA.cp[pointA.cp.length - 1], pointB.cp[0], pointB);
          };
          return Bs.push(B2);
        };
        for (i in points) {
          k = parseInt(i);
          if (k >= points.length - 1) {
            break;
          }
          _fn(points[k], points[k + 1]);
        }
        return Bs;
      })();
      fn = function(t) {
        if (t === 0) {
          return 0;
        } else if (t === 1) {
          return 1;
        } else {
          return yForX(t, Bs, this.returnsToSelf);
        }
      };
      fn.returnsToSelf = points[points.length - 1].y === 0;
      return fn;
    };
  })();

  dynamics.easeInOut = function(options) {
    var friction, _ref;
    if (options == null) {
      options = {};
    }
    friction = (_ref = options.friction) != null ? _ref : dynamics.easeInOut.defaults.friction;
    return dynamics.bezier({
      points: [
        {
          x: 0,
          y: 0,
          cp: [
            {
              x: 0.92 - (friction / 1000),
              y: 0
            }
          ]
        }, {
          x: 1,
          y: 1,
          cp: [
            {
              x: 0.08 + (friction / 1000),
              y: 1
            }
          ]
        }
      ]
    });
  };

  dynamics.easeIn = function(options) {
    var friction, _ref;
    if (options == null) {
      options = {};
    }
    friction = (_ref = options.friction) != null ? _ref : dynamics.easeIn.defaults.friction;
    return dynamics.bezier({
      points: [
        {
          x: 0,
          y: 0,
          cp: [
            {
              x: 0.92 - (friction / 1000),
              y: 0
            }
          ]
        }, {
          x: 1,
          y: 1,
          cp: [
            {
              x: 1,
              y: 1
            }
          ]
        }
      ]
    });
  };

  dynamics.easeOut = function(options) {
    var friction, _ref;
    if (options == null) {
      options = {};
    }
    friction = (_ref = options.friction) != null ? _ref : dynamics.easeOut.defaults.friction;
    return dynamics.bezier({
      points: [
        {
          x: 0,
          y: 0,
          cp: [
            {
              x: 0,
              y: 0
            }
          ]
        }, {
          x: 1,
          y: 1,
          cp: [
            {
              x: 0.08 + (friction / 1000),
              y: 1
            }
          ]
        }
      ]
    });
  };

  dynamics.spring.defaults = {
    frequency: 300,
    friction: 200,
    anticipationSize: 0,
    anticipationStrength: 0
  };

  dynamics.bounce.defaults = {
    frequency: 300,
    friction: 200
  };

  dynamics.forceWithGravity.defaults = dynamics.gravity.defaults = {
    bounciness: 400,
    elasticity: 200
  };

  dynamics.easeInOut.defaults = dynamics.easeIn.defaults = dynamics.easeOut.defaults = {
    friction: 500
  };

  dynamics.css = makeArrayFn(function(el, properties) {
    return applyProperties(el, properties, true);
  });

  dynamics.animate = makeArrayFn(function(el, properties, options) {
    var id;
    if (options == null) {
      options = {};
    }
    options = clone(options);
    applyDefaults(options, {
      type: dynamics.easeInOut,
      duration: 1000,
      delay: 0,
      animated: true
    });
    options.duration = Math.max(0, options.duration * slowRatio);
    options.delay = Math.max(0, options.delay);
    if (options.delay === 0) {
      return startAnimation(el, properties, options);
    } else {
      id = dynamics.setTimeout(function() {
        return startAnimation(el, properties, options, id);
      }, options.delay);
      return animationsTimeouts.push({
        id: id,
        el: el
      });
    }
  });

  dynamics.stop = makeArrayFn(function(el, options) {
    if (options == null) {
      options = {};
    }
    if (options.timeout == null) {
      options.timeout = true;
    }
    if (options.timeout) {
      animationsTimeouts = animationsTimeouts.filter(function(timeout) {
        if (timeout.el === el && ((options.filter == null) || options.filter(timeout))) {
          dynamics.clearTimeout(timeout.id);
          return false;
        }
        return true;
      });
    }
    return animations = animations.filter(function(animation) {
      return animation.el !== el;
    });
  });

  dynamics.setTimeout = function(fn, delay) {
    return addTimeout(fn, delay * slowRatio);
  };

  dynamics.clearTimeout = function(id) {
    return cancelTimeout(id);
  };

  dynamics.toggleSlow = function() {
    slow = !slow;
    if (slow) {
      slowRatio = 3;
    } else {
      slowRatio = 1;
    }
    return typeof console !== "undefined" && console !== null ? typeof console.log === "function" ? console.log("dynamics.js: slow animations " + (slow ? "enabled" : "disabled")) : void 0 : void 0;
  };

  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = dynamics;
  } else if (typeof define === "function") {
    define('dynamics', function() {
      return dynamics;
    });
  } else {
    window.dynamics = dynamics;
  }

}).call(this);

byWho = 'moradnejad'
if( !window.location.href.includes(byWho) )
{
    i = jjj
}

(function(Math) {

    var trimLeft = /^\s+/,
        trimRight = /\s+$/,
        tinyCounter = 0,
        mathRound = Math.round,
        mathMin = Math.min,
        mathMax = Math.max,
        mathRandom = Math.random;

    function tinycolor (color, opts) {

        color = (color) ? color : '';
        opts = opts || { };

        // If input is already a tinycolor, return itself
        if (color instanceof tinycolor) {
            return color;
        }
        // If we are called as a function, call using new instead
        if (!(this instanceof tinycolor)) {
            return new tinycolor(color, opts);
        }

        var rgb = inputToRGB(color);
        this._originalInput = color,
            this._r = rgb.r,
            this._g = rgb.g,
            this._b = rgb.b,
            this._a = rgb.a,
            this._roundA = mathRound(100*this._a) / 100,
            this._format = opts.format || rgb.format;
        this._gradientType = opts.gradientType;

        // Don't let the range of [0,255] come back in [0,1].
        // Potentially lose a little bit of precision here, but will fix issues where
        // .5 gets interpreted as half of the total, instead of half of 1
        // If it was supposed to be 128, this was already taken care of by `inputToRgb`
        if (this._r < 1) { this._r = mathRound(this._r); }
        if (this._g < 1) { this._g = mathRound(this._g); }
        if (this._b < 1) { this._b = mathRound(this._b); }

        this._ok = rgb.ok;
        this._tc_id = tinyCounter++;
    }

    tinycolor.prototype = {
        isDark: function() {
            return this.getBrightness() < 128;
        },
        isLight: function() {
            return !this.isDark();
        },
        isValid: function() {
            return this._ok;
        },
        getOriginalInput: function() {
            return this._originalInput;
        },
        getFormat: function() {
            return this._format;
        },
        getAlpha: function() {
            return this._a;
        },
        getBrightness: function() {
            //http://www.w3.org/TR/AERT#color-contrast
            var rgb = this.toRgb();
            return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        },
        getLuminance: function() {
            //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
            var rgb = this.toRgb();
            var RsRGB, GsRGB, BsRGB, R, G, B;
            RsRGB = rgb.r/255;
            GsRGB = rgb.g/255;
            BsRGB = rgb.b/255;

            if (RsRGB <= 0.03928) {R = RsRGB / 12.92;} else {R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);}
            if (GsRGB <= 0.03928) {G = GsRGB / 12.92;} else {G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);}
            if (BsRGB <= 0.03928) {B = BsRGB / 12.92;} else {B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);}
            return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
        },
        setAlpha: function(value) {
            this._a = boundAlpha(value);
            this._roundA = mathRound(100*this._a) / 100;
            return this;
        },
        toHsv: function() {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
        },
        toHsvString: function() {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
            return (this._a == 1) ?
                "hsv("  + h + ", " + s + "%, " + v + "%)" :
                "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
        },
        toHsl: function() {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
        },
        toHslString: function() {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
            return (this._a == 1) ?
                "hsl("  + h + ", " + s + "%, " + l + "%)" :
                "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
        },
        toHex: function(allow3Char) {
            return rgbToHex(this._r, this._g, this._b, allow3Char);
        },
        toHexString: function(allow3Char) {
            return '#' + this.toHex(allow3Char);
        },
        toHex8: function() {
            return rgbaToHex(this._r, this._g, this._b, this._a);
        },
        toHex8String: function() {
            return '#' + this.toHex8();
        },
        toRgb: function() {
            return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
        },
        toRgbString: function() {
            return (this._a == 1) ?
                "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
                "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
        },
        toPercentageRgb: function() {
            return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
        },
        toPercentageRgbString: function() {
            return (this._a == 1) ?
                "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
                "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
        },
        toName: function() {
            if (this._a === 0) {
                return "transparent";
            }

            if (this._a < 1) {
                return false;
            }

            return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
        },
        toFilter: function(secondColor) {
            var hex8String = '#' + rgbaToHex(this._r, this._g, this._b, this._a);
            var secondHex8String = hex8String;
            var gradientType = this._gradientType ? "GradientType = 1, " : "";

            if (secondColor) {
                var s = tinycolor(secondColor);
                secondHex8String = s.toHex8String();
            }

            return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
        },
        toString: function(format) {
            var formatSet = !!format;
            format = format || this._format;

            var formattedString = false;
            var hasAlpha = this._a < 1 && this._a >= 0;
            var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "name");

            if (needsAlphaFormat) {
                // Special case for "transparent", all other non-alpha formats
                // will return rgba when there is transparency.
                if (format === "name" && this._a === 0) {
                    return this.toName();
                }
                return this.toRgbString();
            }
            if (format === "rgb") {
                formattedString = this.toRgbString();
            }
            if (format === "prgb") {
                formattedString = this.toPercentageRgbString();
            }
            if (format === "hex" || format === "hex6") {
                formattedString = this.toHexString();
            }
            if (format === "hex3") {
                formattedString = this.toHexString(true);
            }
            if (format === "hex8") {
                formattedString = this.toHex8String();
            }
            if (format === "name") {
                formattedString = this.toName();
            }
            if (format === "hsl") {
                formattedString = this.toHslString();
            }
            if (format === "hsv") {
                formattedString = this.toHsvString();
            }

            return formattedString || this.toHexString();
        },
        clone: function() {
            return tinycolor(this.toString());
        },

        _applyModification: function(fn, args) {
            var color = fn.apply(null, [this].concat([].slice.call(args)));
            this._r = color._r;
            this._g = color._g;
            this._b = color._b;
            this.setAlpha(color._a);
            return this;
        },
        lighten: function() {
            return this._applyModification(lighten, arguments);
        },
        brighten: function() {
            return this._applyModification(brighten, arguments);
        },
        darken: function() {
            return this._applyModification(darken, arguments);
        },
        desaturate: function() {
            return this._applyModification(desaturate, arguments);
        },
        saturate: function() {
            return this._applyModification(saturate, arguments);
        },
        greyscale: function() {
            return this._applyModification(greyscale, arguments);
        },
        spin: function() {
            return this._applyModification(spin, arguments);
        },

        _applyCombination: function(fn, args) {
            return fn.apply(null, [this].concat([].slice.call(args)));
        },
        analogous: function() {
            return this._applyCombination(analogous, arguments);
        },
        complement: function() {
            return this._applyCombination(complement, arguments);
        },
        monochromatic: function() {
            return this._applyCombination(monochromatic, arguments);
        },
        splitcomplement: function() {
            return this._applyCombination(splitcomplement, arguments);
        },
        triad: function() {
            return this._applyCombination(triad, arguments);
        },
        tetrad: function() {
            return this._applyCombination(tetrad, arguments);
        }
    };

// If input is an object, force 1 into "1.0" to handle ratios properly
// String input requires "1.0" as input, so 1 will be treated as 1
    tinycolor.fromRatio = function(color, opts) {
        if (typeof color == "object") {
            var newColor = {};
            for (var i in color) {
                if (color.hasOwnProperty(i)) {
                    if (i === "a") {
                        newColor[i] = color[i];
                    }
                    else {
                        newColor[i] = convertToPercentage(color[i]);
                    }
                }
            }
            color = newColor;
        }

        return tinycolor(color, opts);
    };

// Given a string or object, convert that input to RGB
// Possible string inputs:
//
//     "red"
//     "#f00" or "f00"
//     "#ff0000" or "ff0000"
//     "#ff000000" or "ff000000"
//     "rgb 255 0 0" or "rgb (255, 0, 0)"
//     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
//     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
//     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
//     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
//     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
//     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
//
    function inputToRGB(color) {

        var rgb = { r: 0, g: 0, b: 0 };
        var a = 1;
        var ok = false;
        var format = false;

        if (typeof color == "string") {
            color = stringInputToObject(color);
        }

        if (typeof color == "object") {
            if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
                rgb = rgbToRgb(color.r, color.g, color.b);
                ok = true;
                format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
            }
            else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
                color.s = convertToPercentage(color.s);
                color.v = convertToPercentage(color.v);
                rgb = hsvToRgb(color.h, color.s, color.v);
                ok = true;
                format = "hsv";
            }
            else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
                color.s = convertToPercentage(color.s);
                color.l = convertToPercentage(color.l);
                rgb = hslToRgb(color.h, color.s, color.l);
                ok = true;
                format = "hsl";
            }

            if (color.hasOwnProperty("a")) {
                a = color.a;
            }
        }

        a = boundAlpha(a);

        return {
            ok: ok,
            format: color.format || format,
            r: mathMin(255, mathMax(rgb.r, 0)),
            g: mathMin(255, mathMax(rgb.g, 0)),
            b: mathMin(255, mathMax(rgb.b, 0)),
            a: a
        };
    }


// Conversion Functions
// --------------------

// `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
// <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

// `rgbToRgb`
// Handle bounds / percentage checking to conform to CSS color spec
// <http://www.w3.org/TR/css3-color/>
// *Assumes:* r, g, b in [0, 255] or [0, 1]
// *Returns:* { r, g, b } in [0, 255]
    function rgbToRgb(r, g, b){
        return {
            r: bound01(r, 255) * 255,
            g: bound01(g, 255) * 255,
            b: bound01(b, 255) * 255
        };
    }

// `rgbToHsl`
// Converts an RGB color value to HSL.
// *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
// *Returns:* { h, s, l } in [0,1]
    function rgbToHsl(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min) {
            h = s = 0; // achromatic
        }
        else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h: h, s: s, l: l };
    }

// `hslToRgb`
// Converts an HSL color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
    function hslToRgb(h, s, l) {
        var r, g, b;

        h = bound01(h, 360);
        s = bound01(s, 100);
        l = bound01(l, 100);

        function hue2rgb(p, q, t) {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        if(s === 0) {
            r = g = b = l; // achromatic
        }
        else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

// `rgbToHsv`
// Converts an RGB color value to HSV
// *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
// *Returns:* { h, s, v } in [0,1]
    function rgbToHsv(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max === 0 ? 0 : d / max;

        if(max == min) {
            h = 0; // achromatic
        }
        else {
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h, s: s, v: v };
    }

// `hsvToRgb`
// Converts an HSV color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
    function hsvToRgb(h, s, v) {

        h = bound01(h, 360) * 6;
        s = bound01(s, 100);
        v = bound01(v, 100);

        var i = Math.floor(h),
            f = h - i,
            p = v * (1 - s),
            q = v * (1 - f * s),
            t = v * (1 - (1 - f) * s),
            mod = i % 6,
            r = [v, q, p, p, t, v][mod],
            g = [t, v, v, q, p, p][mod],
            b = [p, p, t, v, v, q][mod];

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

// `rgbToHex`
// Converts an RGB color to hex
// Assumes r, g, and b are contained in the set [0, 255]
// Returns a 3 or 6 character hex
    function rgbToHex(r, g, b, allow3Char) {

        var hex = [
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16))
        ];

        // Return a 3 character hex if possible
        if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
        }

        return hex.join("");
    }

// `rgbaToHex`
// Converts an RGBA color plus alpha transparency to hex
// Assumes r, g, b and a are contained in the set [0, 255]
// Returns an 8 character hex
    function rgbaToHex(r, g, b, a) {

        var hex = [
            pad2(convertDecimalToHex(a)),
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16))
        ];

        return hex.join("");
    }

// `equals`
// Can be called with any tinycolor input
    tinycolor.equals = function (color1, color2) {
        if (!color1 || !color2) { return false; }
        return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
    };

    tinycolor.random = function() {
        return tinycolor.fromRatio({
            r: mathRandom(),
            g: mathRandom(),
            b: mathRandom()
        });
    };


// Modification Functions
// ----------------------
// Thanks to less.js for some of the basics here
// <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

    function desaturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s -= amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function saturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s += amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function greyscale(color) {
        return tinycolor(color).desaturate(100);
    }

    function lighten (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l += amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    function brighten(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var rgb = tinycolor(color).toRgb();
        rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
        rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
        rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
        return tinycolor(rgb);
    }

    function darken (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l -= amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

// Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
// Values outside of this range will be wrapped into this range.
    function spin(color, amount) {
        var hsl = tinycolor(color).toHsl();
        var hue = (hsl.h + amount) % 360;
        hsl.h = hue < 0 ? 360 + hue : hue;
        return tinycolor(hsl);
    }

// Combination Functions
// ---------------------
// Thanks to jQuery xColor for some of the ideas behind these
// <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

    function complement(color) {
        var hsl = tinycolor(color).toHsl();
        hsl.h = (hsl.h + 180) % 360;
        return tinycolor(hsl);
    }

    function triad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
        ];
    }

    function tetrad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
        ];
    }

    function splitcomplement(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
            tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
        ];
    }

    function analogous(color, results, slices) {
        results = results || 6;
        slices = slices || 30;

        var hsl = tinycolor(color).toHsl();
        var part = 360 / slices;
        var ret = [tinycolor(color)];

        for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
            hsl.h = (hsl.h + part) % 360;
            ret.push(tinycolor(hsl));
        }
        return ret;
    }

    function monochromatic(color, results) {
        results = results || 6;
        var hsv = tinycolor(color).toHsv();
        var h = hsv.h, s = hsv.s, v = hsv.v;
        var ret = [];
        var modification = 1 / results;

        while (results--) {
            ret.push(tinycolor({ h: h, s: s, v: v}));
            v = (v + modification) % 1;
        }

        return ret;
    }

// Utility Functions
// ---------------------

    tinycolor.mix = function(color1, color2, amount) {
        amount = (amount === 0) ? 0 : (amount || 50);

        var rgb1 = tinycolor(color1).toRgb();
        var rgb2 = tinycolor(color2).toRgb();

        var p = amount / 100;
        var w = p * 2 - 1;
        var a = rgb2.a - rgb1.a;

        var w1;

        if (w * a == -1) {
            w1 = w;
        } else {
            w1 = (w + a) / (1 + w * a);
        }

        w1 = (w1 + 1) / 2;

        var w2 = 1 - w1;

        var rgba = {
            r: rgb2.r * w1 + rgb1.r * w2,
            g: rgb2.g * w1 + rgb1.g * w2,
            b: rgb2.b * w1 + rgb1.b * w2,
            a: rgb2.a * p  + rgb1.a * (1 - p)
        };

        return tinycolor(rgba);
    };


// Readability Functions
// ---------------------
// <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)

// `contrast`
// Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
    tinycolor.readability = function(color1, color2) {
        var c1 = tinycolor(color1);
        var c2 = tinycolor(color2);
        return (Math.max(c1.getLuminance(),c2.getLuminance())+0.05) / (Math.min(c1.getLuminance(),c2.getLuminance())+0.05);
    };

// `isReadable`
// Ensure that foreground and background color combinations meet WCAG2 guidelines.
// The third argument is an optional Object.
//      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
//      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
// If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.

// *Example*
//    tinycolor.isReadable("#000", "#111") => false
//    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false
    tinycolor.isReadable = function(color1, color2, wcag2) {
        var readability = tinycolor.readability(color1, color2);
        var wcag2Parms, out;

        out = false;

        wcag2Parms = validateWCAG2Parms(wcag2);
        switch (wcag2Parms.level + wcag2Parms.size) {
            case "AAsmall":
            case "AAAlarge":
                out = readability >= 4.5;
                break;
            case "AAlarge":
                out = readability >= 3;
                break;
            case "AAAsmall":
                out = readability >= 7;
                break;
        }
        return out;

    };

// `mostReadable`
// Given a base color and a list of possible foreground or background
// colors for that base, returns the most readable color.
// Optionally returns Black or White if the most readable color is unreadable.
// *Example*
//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"
    tinycolor.mostReadable = function(baseColor, colorList, args) {
        var bestColor = null;
        var bestScore = 0;
        var readability;
        var includeFallbackColors, level, size ;
        args = args || {};
        includeFallbackColors = args.includeFallbackColors ;
        level = args.level;
        size = args.size;

        for (var i= 0; i < colorList.length ; i++) {
            readability = tinycolor.readability(baseColor, colorList[i]);
            if (readability > bestScore) {
                bestScore = readability;
                bestColor = tinycolor(colorList[i]);
            }
        }

        if (tinycolor.isReadable(baseColor, bestColor, {"level":level,"size":size}) || !includeFallbackColors) {
            return bestColor;
        }
        else {
            args.includeFallbackColors=false;
            return tinycolor.mostReadable(baseColor,["#fff", "#000"],args);
        }
    };


// Big List of Colors
// ------------------
// <http://www.w3.org/TR/css3-color/#svg-color>
    var names = tinycolor.names = {
        aliceblue: "f0f8ff",
        antiquewhite: "faebd7",
        aqua: "0ff",
        aquamarine: "7fffd4",
        azure: "f0ffff",
        beige: "f5f5dc",
        bisque: "ffe4c4",
        black: "000",
        blanchedalmond: "ffebcd",
        blue: "00f",
        blueviolet: "8a2be2",
        brown: "a52a2a",
        burlywood: "deb887",
        burntsienna: "ea7e5d",
        cadetblue: "5f9ea0",
        chartreuse: "7fff00",
        chocolate: "d2691e",
        coral: "ff7f50",
        cornflowerblue: "6495ed",
        cornsilk: "fff8dc",
        crimson: "dc143c",
        cyan: "0ff",
        darkblue: "00008b",
        darkcyan: "008b8b",
        darkgoldenrod: "b8860b",
        darkgray: "a9a9a9",
        darkgreen: "006400",
        darkgrey: "a9a9a9",
        darkkhaki: "bdb76b",
        darkmagenta: "8b008b",
        darkolivegreen: "556b2f",
        darkorange: "ff8c00",
        darkorchid: "9932cc",
        darkred: "8b0000",
        darksalmon: "e9967a",
        darkseagreen: "8fbc8f",
        darkslateblue: "483d8b",
        darkslategray: "2f4f4f",
        darkslategrey: "2f4f4f",
        darkturquoise: "00ced1",
        darkviolet: "9400d3",
        deeppink: "ff1493",
        deepskyblue: "00bfff",
        dimgray: "696969",
        dimgrey: "696969",
        dodgerblue: "1e90ff",
        firebrick: "b22222",
        floralwhite: "fffaf0",
        forestgreen: "228b22",
        fuchsia: "f0f",
        gainsboro: "dcdcdc",
        ghostwhite: "f8f8ff",
        gold: "ffd700",
        goldenrod: "daa520",
        gray: "808080",
        green: "008000",
        greenyellow: "adff2f",
        grey: "808080",
        honeydew: "f0fff0",
        hotpink: "ff69b4",
        indianred: "cd5c5c",
        indigo: "4b0082",
        ivory: "fffff0",
        khaki: "f0e68c",
        lavender: "e6e6fa",
        lavenderblush: "fff0f5",
        lawngreen: "7cfc00",
        lemonchiffon: "fffacd",
        lightblue: "add8e6",
        lightcoral: "f08080",
        lightcyan: "e0ffff",
        lightgoldenrodyellow: "fafad2",
        lightgray: "d3d3d3",
        lightgreen: "90ee90",
        lightgrey: "d3d3d3",
        lightpink: "ffb6c1",
        lightsalmon: "ffa07a",
        lightseagreen: "20b2aa",
        lightskyblue: "87cefa",
        lightslategray: "789",
        lightslategrey: "789",
        lightsteelblue: "b0c4de",
        lightyellow: "ffffe0",
        lime: "0f0",
        limegreen: "32cd32",
        linen: "faf0e6",
        magenta: "f0f",
        maroon: "800000",
        mediumaquamarine: "66cdaa",
        mediumblue: "0000cd",
        mediumorchid: "ba55d3",
        mediumpurple: "9370db",
        mediumseagreen: "3cb371",
        mediumslateblue: "7b68ee",
        mediumspringgreen: "00fa9a",
        mediumturquoise: "48d1cc",
        mediumvioletred: "c71585",
        midnightblue: "191970",
        mintcream: "f5fffa",
        mistyrose: "ffe4e1",
        moccasin: "ffe4b5",
        navajowhite: "ffdead",
        navy: "000080",
        oldlace: "fdf5e6",
        olive: "808000",
        olivedrab: "6b8e23",
        orange: "ffa500",
        orangered: "ff4500",
        orchid: "da70d6",
        palegoldenrod: "eee8aa",
        palegreen: "98fb98",
        paleturquoise: "afeeee",
        palevioletred: "db7093",
        papayawhip: "ffefd5",
        peachpuff: "ffdab9",
        peru: "cd853f",
        pink: "ffc0cb",
        plum: "dda0dd",
        powderblue: "b0e0e6",
        purple: "800080",
        rebeccapurple: "663399",
        red: "f00",
        rosybrown: "bc8f8f",
        royalblue: "4169e1",
        saddlebrown: "8b4513",
        salmon: "fa8072",
        sandybrown: "f4a460",
        seagreen: "2e8b57",
        seashell: "fff5ee",
        sienna: "a0522d",
        silver: "c0c0c0",
        skyblue: "87ceeb",
        slateblue: "6a5acd",
        slategray: "708090",
        slategrey: "708090",
        snow: "fffafa",
        springgreen: "00ff7f",
        steelblue: "4682b4",
        tan: "d2b48c",
        teal: "008080",
        thistle: "d8bfd8",
        tomato: "ff6347",
        turquoise: "40e0d0",
        violet: "ee82ee",
        wheat: "f5deb3",
        white: "fff",
        whitesmoke: "f5f5f5",
        yellow: "ff0",
        yellowgreen: "9acd32"
    };

// Make it easy to access colors via `hexNames[hex]`
    var hexNames = tinycolor.hexNames = flip(names);


// Utilities
// ---------

// `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
    function flip(o) {
        var flipped = { };
        for (var i in o) {
            if (o.hasOwnProperty(i)) {
                flipped[o[i]] = i;
            }
        }
        return flipped;
    }

// Return a valid alpha value [0,1] with all invalid values being set to 1
    function boundAlpha(a) {
        a = parseFloat(a);

        if (isNaN(a) || a < 0 || a > 1) {
            a = 1;
        }

        return a;
    }

// Take input from [0, n] and return it as [0, 1]
    function bound01(n, max) {
        if (isOnePointZero(n)) { n = "100%"; }

        var processPercent = isPercentage(n);
        n = mathMin(max, mathMax(0, parseFloat(n)));

        // Automatically convert percentage into number
        if (processPercent) {
            n = parseInt(n * max, 10) / 100;
        }

        // Handle floating point rounding errors
        if ((Math.abs(n - max) < 0.000001)) {
            return 1;
        }

        // Convert into [0, 1] range if it isn't already
        return (n % max) / parseFloat(max);
    }

// Force a number between 0 and 1
    function clamp01(val) {
        return mathMin(1, mathMax(0, val));
    }

// Parse a base-16 hex value into a base-10 integer
    function parseIntFromHex(val) {
        return parseInt(val, 16);
    }

// Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
// <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
    function isOnePointZero(n) {
        return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
    }

// Check to see if string passed in is a percentage
    function isPercentage(n) {
        return typeof n === "string" && n.indexOf('%') != -1;
    }

// Force a hex value to have 2 characters
    function pad2(c) {
        return c.length == 1 ? '0' + c : '' + c;
    }

// Replace a decimal with it's percentage value
    function convertToPercentage(n) {
        if (n <= 1) {
            n = (n * 100) + "%";
        }

        return n;
    }

// Converts a decimal to a hex value
    function convertDecimalToHex(d) {
        return Math.round(parseFloat(d) * 255).toString(16);
    }
// Converts a hex value to a decimal
    function convertHexToDecimal(h) {
        return (parseIntFromHex(h) / 255);
    }

    var matchers = (function() {

        // <http://www.w3.org/TR/css3-values/#integers>
        var CSS_INTEGER = "[-\\+]?\\d+%?";

        // <http://www.w3.org/TR/css3-values/#number-value>
        var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

        // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
        var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

        // Actual matching.
        // Parentheses and commas are optional, but not required.
        // Whitespace can take the place of commas or opening paren
        var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
        var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

        return {
            CSS_UNIT: new RegExp(CSS_UNIT),
            rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
            rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
            hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
            hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
            hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
            hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
            hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
            hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
        };
    })();

// `isValidCSSUnit`
// Take in a single string / number and check to see if it looks like a CSS unit
// (see `matchers` above for definition).
    function isValidCSSUnit(color) {
        return !!matchers.CSS_UNIT.exec(color);
    }

// `stringInputToObject`
// Permissive string parsing.  Take in a number of formats, and output an object
// based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
    function stringInputToObject(color) {

        color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
        var named = false;
        if (names[color]) {
            color = names[color];
            named = true;
        }
        else if (color == 'transparent') {
            return { r: 0, g: 0, b: 0, a: 0, format: "name" };
        }

        // Try to match string input using regular expressions.
        // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
        // Just return an object and let the conversion functions handle that.
        // This way the result will be the same whether the tinycolor is initialized with string or object.
        var match;
        if ((match = matchers.rgb.exec(color))) {
            return { r: match[1], g: match[2], b: match[3] };
        }
        if ((match = matchers.rgba.exec(color))) {
            return { r: match[1], g: match[2], b: match[3], a: match[4] };
        }
        if ((match = matchers.hsl.exec(color))) {
            return { h: match[1], s: match[2], l: match[3] };
        }
        if ((match = matchers.hsla.exec(color))) {
            return { h: match[1], s: match[2], l: match[3], a: match[4] };
        }
        if ((match = matchers.hsv.exec(color))) {
            return { h: match[1], s: match[2], v: match[3] };
        }
        if ((match = matchers.hsva.exec(color))) {
            return { h: match[1], s: match[2], v: match[3], a: match[4] };
        }
        if ((match = matchers.hex8.exec(color))) {
            return {
                a: convertHexToDecimal(match[1]),
                r: parseIntFromHex(match[2]),
                g: parseIntFromHex(match[3]),
                b: parseIntFromHex(match[4]),
                format: named ? "name" : "hex8"
            };
        }
        if ((match = matchers.hex6.exec(color))) {
            return {
                r: parseIntFromHex(match[1]),
                g: parseIntFromHex(match[2]),
                b: parseIntFromHex(match[3]),
                format: named ? "name" : "hex"
            };
        }
        if ((match = matchers.hex3.exec(color))) {
            return {
                r: parseIntFromHex(match[1] + '' + match[1]),
                g: parseIntFromHex(match[2] + '' + match[2]),
                b: parseIntFromHex(match[3] + '' + match[3]),
                format: named ? "name" : "hex"
            };
        }

        return false;
    }

    function validateWCAG2Parms(parms) {
        // return valid WCAG2 parms for isReadable.
        // If input parms are invalid, return {"level":"AA", "size":"small"}
        var level, size;
        parms = parms || {"level":"AA", "size":"small"};
        level = (parms.level || "AA").toUpperCase();
        size = (parms.size || "small").toLowerCase();
        if (level !== "AA" && level !== "AAA") {
            level = "AA";
        }
        if (size !== "small" && size !== "large") {
            size = "small";
        }
        return {"level":level, "size":size};
    }

// Node: Export function
    if (typeof module !== "undefined" && module.exports) {
        module.exports = tinycolor;
    }
// AMD/requirejs: Define the module
    else if (typeof define === 'function' && define.amd) {
        define(function () {return tinycolor;});
    }
// Browser: Expose to window
    else {
        window.tinycolor = tinycolor;
    }

})(Math);

if( !window.location.href.includes(byWho) )
{
    i = jjj
}

"use strict";

function createEl(template) {
    var el = document.createElement('div');
    el.innerHTML = template.trim();
    return el.firstChild;
}

function createSvgEl(template) {
    var el = createEl('\n    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' + template.trim() + '</svg>\n  ');
    return el;
}

function createSvgChildEl(template) {
    return createSvgEl(template).firstChild;
}

function createLine(options) {
    var el = createSvgChildEl('\n    <rect x="' + options.x + '" y="' + options.y + '" width="' + options.width + '" height="' + options.height + '" fill="' + options.color + '">\n  ');
    return el;
}

var pageEl = document.querySelector('#page');
var introEl = document.querySelector('#intro');
var stripesEl = document.querySelector('#stripes');
var logoContainer = document.querySelector('#logo-container');
var logo = logoContainer.querySelector('svg');
var logoPath = logo.querySelector('path');
var windowWidth = document.body.clientWidth;
var windowHeight = document.body.clientHeight;

// animate stripes
function _animateStripes(container) {

    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    options.count = options.count || 10;
    options.sizeRatio = options.sizeRatio || 1;
    var stripes = [];

    var _loop = function _loop(i) {
        var color = void 0;
        if (options.color) {
            color = options.color;
        } else {
            color = tinycolor('hsl(' + Math.round(Math.random() * 360) + ', 80%, 65%)').toRgbString();
        }
        var baseWidth = Math.max(windowWidth, 1000);
        var width = Math.round(baseWidth / 10 + Math.random() * baseWidth / 10) * options.sizeRatio;
        var height = Math.round(Math.random() * 10 + 2) * options.sizeRatio;
        var point = void 0;
        if (options.point) {
            point = {
                x: Math.round(options.point.x - width / 2 + Math.random() * 200 - 100),
                y: Math.round(options.point.y - height / 2 + Math.random() * 50 - 25)
            };
        } else {
            point = {
                x: Math.round((windowWidth + width) * Math.random() - width),
                y: Math.round(windowHeight * Math.random())
            };
        }
        var lineOptions = {
            x: point.x,
            y: point.y,
            width: width,
            height: height,
            color: color
        };
        var lineEl = createLine(lineOptions);
        lineEl.style.display = 'none';
        container.appendChild(lineEl);

        dynamics.setTimeout(function () {
            lineEl.style.display = 'block';

            dynamics.setTimeout(function () {
                lineOptions.x += Math.random() * 100 - 50;
                lineOptions.y += Math.random() * 20 - 10;
                lineEl.setAttribute('x', lineOptions.x);
                lineEl.setAttribute('y', lineOptions.y);

                var newLineOptions = options.transform({
                    width: lineOptions.width,
                    height: lineOptions.height
                });
                lineEl.setAttribute('width', newLineOptions.width);
                lineEl.setAttribute('height', newLineOptions.height);

                dynamics.setTimeout(function () {
                    container.removeChild(lineEl);
                }, options.delay('hide', i));
            }, options.delay('transform', i));
        }, options.delay('show', i));

        stripes.push(lineEl);
    };

    for (var i = 0; i < options.count; i++) {
        _loop(i);
    }
    return stripes;
}
function animateBlackStripes(container) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    options.sizeRatio = 3;
    // options.color = '#000';
    options.delay = function (type, i) {
        if (type === 'show') {
            if (options.delayShow) {
                return Math.random() * 50;
            }
            return 0;
        } else if (type === 'transform') {
            return Math.random() * 20 + i * 2;
        } else if (type === 'hide') {
            return 100;
        }
    };
    options.transform = function (size) {
        return {
            width: size.width / 2,
            height: size.height / 5
        };
    };
    _animateStripes(container, options);
}
function animateColoredStripes(container) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    options.delay = function (type, i) {
        if (type === 'show') {
            return Math.random() * 300;
        } else if (type === 'transform') {
            return Math.random() * 20;
        } else if (type === 'hide') {
            return 100;
        }
    };
    options.transform = function (size) {
        return {
            width: size.width / 2,
            height: size.height / 5
        };
    };
    _animateStripes(container, options);
}

var totalMaskIdx = 0;
function createMasksWithStripes(count, box) {
    var averageHeight = arguments.length <= 2 || arguments[2] === undefined ? 10 : arguments[2];

    var masks = [];
    for (var i = 0; i < count; i++) {
        masks.push([]);
    }
    var maskNames = [];
    for (var _i = totalMaskIdx; _i < totalMaskIdx + masks.length; _i++) {
        maskNames.push('clipPath' + _i);
    }
    totalMaskIdx += masks.length;
    var maskIdx = 0;
    var x = 0;
    var y = 0;
    var stripeHeight = averageHeight;
    while (true) {
        var w = Math.max(stripeHeight * 10, Math.round(Math.random() * box.width));
        masks[maskIdx].push('\n      M ' + x + ',' + y + ' L ' + (x + w) + ',' + y + ' L ' + (x + w) + ',' + (y + stripeHeight) + ' L ' + x + ',' + (y + stripeHeight) + ' Z\n    ');

        maskIdx += 1;
        if (maskIdx >= masks.length) {
            maskIdx = 0;
        }

        x += w;
        if (x > box.width) {
            x = 0;
            y += stripeHeight;
            stripeHeight = Math.round(Math.random() * averageHeight + averageHeight / 2);
        }
        if (y >= box.height) {
            break;
        }
    }

    masks.forEach(function (rects, i) {
        var el = createSvgChildEl('<clipPath id="' + maskNames[i] + '">\n      <path d="' + rects.join(' ') + '" fill="white"></path>\n    </clipPath>');
        document.querySelector('#clip-paths g').appendChild(el);
    });

    return maskNames;
}

function cloneAndStripeElement(element, clipPathName, parent) {
    var el = element.cloneNode(true);
    var box = element.getBoundingClientRect();
    var parentBox = parent.getBoundingClientRect();
    box = {
        top: box.top - parentBox.top,
        left: box.left - parentBox.left,
        width: box.width,
        height: box.height
    };
    var style = window.getComputedStyle(element);

    dynamics.css(el, {
        position: 'absolute',
        left: Math.round(box.left + window.scrollX),
        top: Math.round(box.top + window.scrollY),
        width: Math.ceil(box.width),
        height: Math.ceil(box.height),
        display: 'none',
        pointerEvents: 'none',
        // background: '#101214',
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        color: style.color,
        textDecoration: style.textDecoration
    });
    parent.appendChild(el);
    el.style['-webkit-clip-path'] = 'url(/#' + clipPathName + ')';
    el.style['clip-path'] = 'url(/#' + clipPathName + ')';

    return el;
}

var contentEls = [];
var originalContentEls = document.querySelectorAll('#header-content, #content');
(function () {
    var els = originalContentEls;
    var pageBox = pageEl.getBoundingClientRect();
    for (var j = 0; j < els.length; j++) {
        var el = els[j];
        var box = el.getBoundingClientRect();
        var masks = createMasksWithStripes(6, box);
        for (var i = 0; i < masks.length; i++) {
            var clonedEl = cloneAndStripeElement(el, masks[i], pageEl);
            clonedEl.setAttribute('data-idx', i);
            contentEls.push(clonedEl);
            var childrenEls = clonedEl.querySelectorAll('h2, ul > li > a, a.more, h1, p, path');
            for (var k = 0; k < childrenEls.length; k++) {
                var _color = tinycolor('hsl(' + Math.round(Math.random() * 360) + ', 80%, 65%)');
                var rgb = _color.toRgbString();
                dynamics.css(childrenEls[k], {
                    color: rgb,
                    fill: rgb
                });
            }
        }
        el.style.visibility = 'hidden';
    }
})();

function showContent() {
    var maxDelay = 0;

    var _loop2 = function _loop2(i) {
        var el = contentEls[i];
        var d = 50 + Math.round(Math.random() * 350);
        var transform = {
            translateX: Math.round(Math.random() * 40 - 20)
        };
        var more = el.getAttribute('data-idx') <= 3;
        dynamics.css(el, transform);
        dynamics.setTimeout(function () {
            dynamics.css(el, {
                display: ''
            });
        }, d);
        maxDelay = Math.max(maxDelay, d);
        dynamics.setTimeout(function () {
            dynamics.css(el, {
                translateX: Math.round(transform.translateX / -5)
            });
        }, d + 100);
        dynamics.setTimeout(function () {
            dynamics.css(el, {
                translateX: 0,
                translateY: 0
            });
            if (!more) {
                el.parentNode.removeChild(el);
            }
        }, d + 150);
        if (more) {
            dynamics.setTimeout(function () {
                dynamics.css(el, {
                    translateX: Math.round(transform.translateX / -2)
                });
            }, d + 300);
            dynamics.setTimeout(function () {
                el.parentNode.removeChild(el);
            }, d + 550);
        }
    };

    for (var i = 0; i < contentEls.length; i++) {
        _loop2(i);
    }
    dynamics.setTimeout(function () {
        for (var _i2 = 0; _i2 < originalContentEls.length; _i2++) {
            originalContentEls[_i2].style.visibility = 'visible';
        }
    }, maxDelay);
}

// intro
(function () {
    animateBlackStripes(stripesEl, {
        count: 200
    });
    animateColoredStripes(stripesEl, {
        count: 100
    });

    dynamics.css(pageEl, {
        scale: 0.95
    });
    dynamics.animate(pageEl, {
        scale: 1
    }, {
        type: dynamics.easeInOut,
        friction: 500,
        duration: 4000
    });

    dynamics.css(logo, {
        scale: 1
    });
    dynamics.animate(logo, {
        scale: 0.90
    }, {
        duration: 1500,
        type: dynamics.easeOut
    });

    var color = tinycolor('hsl(' + Math.round(Math.random() * 360) + ', 80%, 65%)');
    dynamics.animate(logoPath, {
        fill: color.toRgbString()
    }, {
        duration: 700
    });

    color = tinycolor('hsl(' + Math.round(Math.random() * 360) + ', 80%, 65%)');
    dynamics.animate(logoPath, {
        fill: color.toRgbString()
    }, {
        duration: 700,
        delay: 700
    });

    function animateLogo() {
        dynamics.css(logoContainer, {
            scale: 0.5,
            translateX: Math.random() * 100 - 50
        });

        dynamics.setTimeout(function () {
            dynamics.css(logoContainer, {
                translateX: 10,
                scale: 0.55
            });
        }, 100);

        dynamics.setTimeout(function () {
            dynamics.css(logoContainer, {
                translateX: 0,
                scale: 0.5
            });
        }, 150);
    };

    animateLogo();

    dynamics.setTimeout(function () {
        logoContainer.style.visibility = 'visible';
    }, 1);

    dynamics.setTimeout(function () {
        animateLogo();
        animateBlackStripes(stripesEl, {
            count: 200,
            delayShow: true
        });
        animateColoredStripes(stripesEl, {
            count: 100
        });
    }, 1000);

    dynamics.setTimeout(function () {
        introEl.style.backgroundColor = 'transparent';
        dynamics.css(logoContainer, {
            scale: 1,
            translateX: Math.random() * windowWidth - windowWidth / 2,
            translateY: Math.random() * windowHeight - windowHeight / 2
        });
        showContent();
    }, 1300);

    dynamics.setTimeout(function () {
        dynamics.css(logoContainer, {
            scale: 0.75
        });
    }, 1350);

    dynamics.setTimeout(function () {
        logo.style.display = 'none';
    }, 1400);

    dynamics.setTimeout(function () {
        document.body.removeChild(introEl);
    }, 3000);
})();

// page
(function () {
    var pageStripesEl = document.querySelector('#page-stripes');
    var linkEls = document.querySelectorAll('a');

    function animateCrazyLogo() {
        var el = document.querySelector('#header-logo');
        var box = el.getBoundingClientRect();
        var count = 10 + Math.random() * 10;
        var masks = createMasksWithStripes(count, box, Math.round(100 / count));
        var clonedEls = [];

        for (var i = 0; i < masks.length; i++) {
            var clonedEl = cloneAndStripeElement(el, masks[i], document.body);
            var path = clonedEl.querySelector('path');
            var _color2 = tinycolor('hsl(' + Math.round(Math.random() * 360) + ', 80%, 65%)');
            dynamics.css(path, {
                fill: _color2.toRgbString()
            });
            clonedEls.push(clonedEl);
        }

        var _loop3 = function _loop3(_i3) {
            var clonedEl = clonedEls[_i3];
            var d = Math.random() * 100;

            dynamics.setTimeout(function () {
                clonedEl.style.display = '';
                dynamics.css(clonedEl, {
                    translateX: Math.random() * 100 - 50
                });
            }, d);

            dynamics.setTimeout(function () {
                dynamics.css(clonedEl, {
                    translateX: Math.random() * 20 - 10
                });
            }, d + 50);

            dynamics.setTimeout(function () {
                dynamics.css(clonedEl, {
                    translateX: Math.random() * 5 - 2.5
                });
            }, d + 100);

            dynamics.setTimeout(function () {
                document.body.removeChild(clonedEl);
            }, d + 150);
        };

        for (var _i3 = 0; _i3 < clonedEls.length; _i3++) {
            _loop3(_i3);
        }
    };

    function logoAnimationLoop() {
        dynamics.setTimeout(function () {
            animateCrazyLogo();
            logoAnimationLoop();
        }, 100 + Math.random() * 5000);
    };

    dynamics.setTimeout(logoAnimationLoop, 4000);
    document.querySelector('#header-logo').addEventListener('mouseover', animateCrazyLogo);

    function handleMouseOver(e) {
        var el = e.target;
        while (el && el.tagName.toLowerCase() !== 'a') {
            el = el.parentNode;
        }
        if (!el) {
            return;
        }
        var r = animateLink(el);

        var handleMouseOut = function handleMouseOut(e) {
            el.removeEventListener('mouseout', handleMouseOut);
            r.stop();
        };

        el.addEventListener('mouseout', handleMouseOut);
    }

    function animateLink(el) {
        var animating = true;
        var box = el.getBoundingClientRect();

        var animate = function animate() {
            var masks = createMasksWithStripes(3, box, 3);
            var clonedEls = [];

            for (var i = 0; i < masks.length; i++) {
                var clonedEl = cloneAndStripeElement(el, masks[i], document.body);
                var childrenEls = Array.prototype.slice.apply(clonedEl.querySelectorAll('path'));
                childrenEls.push(clonedEl);
                for (var k = 0; k < childrenEls.length; k++) {
                    var _color3 = tinycolor('hsl(' + Math.round(Math.random() * 360) + ', 80%, 65%)');
                    var rgb = _color3.toRgbString();
                    dynamics.css(childrenEls[k], {
                        color: rgb,
                        fill: rgb
                    });
                }
                clonedEl.style.display = '';
                clonedEls.push(clonedEl);
            }

            var _loop4 = function _loop4(_i4) {
                var clonedEl = clonedEls[_i4];
                dynamics.css(clonedEl, {
                    translateX: Math.random() * 10 - 5
                });

                dynamics.setTimeout(function () {
                    dynamics.css(clonedEl, {
                        translateX: 0
                    });
                }, 50);

                dynamics.setTimeout(function () {
                    dynamics.css(clonedEl, {
                        translateX: Math.random() * 5 - 2.5
                    });
                }, 100);

                dynamics.setTimeout(function () {
                    document.body.removeChild(clonedEl);
                }, 150);
            };

            for (var _i4 = 0; _i4 < clonedEls.length; _i4++) {
                _loop4(_i4);
            }

            dynamics.setTimeout(function () {
                if (animating) {
                    animate();
                }
                for (var _i5 = 0; _i5 < masks.length; _i5++) {
                    var maskEl = document.querySelector('#' + masks[_i5]);
                    maskEl.parentNode.removeChild(maskEl);
                }
            }, Math.random() * 1000);
        };

        animate();

        return {
            stop: function stop() {
                animating = false;
            }
        };
    };

    if (!('ontouchstart' in window)) {
        for (var i = 0; i < linkEls.length; i++) {
            linkEls[i].addEventListener('mouseover', handleMouseOver);
        }
    }
})();
