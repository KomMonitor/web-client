/*! For license information please see leaflet-wfst.src_custom.js.LICENSE.txt */
!(function (e, t, i) {
  'use strict';
  ((L.XmlUtil = {
    namespaces: {
      xlink: 'http://www.w3.org/1999/xlink',
      xmlns: 'http://www.w3.org/2000/xmlns/',
      xsd: 'http://www.w3.org/2001/XMLSchema',
      xsi: 'http://www.w3.org/2001/XMLSchema-instance',
      wfs: 'http://www.opengis.net/wfs',
      gml: 'http://www.opengis.net/gml',
      ogc: 'http://www.opengis.net/ogc',
      ows: 'http://www.opengis.net/ows',
    },
    xmldoc: new DOMParser().parseFromString('<root />', 'text/xml'),
    setAttributes: function (e, t) {
      for (var i in t)
        if (null != t[i] && t[i].toString) {
          var r = t[i].toString(),
            n = this.namespaces[i.substring(0, i.indexOf(':'))] || null;
          e.setAttributeNS(n, i, r);
        }
    },
    evaluate: function (e, t) {
      var i = t;
      i instanceof Document || (i = this.parseXml(t));
      var r = new XPathEvaluator(),
        n = r.createNSResolver(i.documentElement);
      return r.evaluate(e, i, n, XPathResult.ANY_TYPE, null);
    },
    createElementNS: function (e, t, i) {
      var r = (i = i || {}).uri;
      (r || (r = this.namespaces[e.substring(0, e.indexOf(':'))]),
        r || (r = this.namespaces[i.prefix]));
      var n = r ? this.xmldoc.createElementNS(r, e) : this.xmldoc.createElement(e);
      return (
        t && this.setAttributes(n, t),
        null != i.value && n.appendChild(this.xmldoc.createTextNode(i.value)),
        n
      );
    },
    createTextNode: function (e) {
      return (
        null === e || e === i ? (e = '') : e instanceof Date && (e = e.toISOString()),
        this.xmldoc.createTextNode(e)
      );
    },
    getNodeText: function (e) {
      return e ? e.innerText || e.textContent || e.text : '';
    },
    serializeXmlDocumentString: function (e) {
      var i = t.implementation.createDocument('', '', null);
      return (i.appendChild(e), new XMLSerializer().serializeToString(i));
    },
    serializeXmlToString: function (e) {
      return new XMLSerializer().serializeToString(e);
    },
    parseXml: function (t) {
      if (void 0 !== e.DOMParser) return new e.DOMParser().parseFromString(t, 'text/xml');
      if (void 0 !== e.ActiveXObject && new e.ActiveXObject('Microsoft.XMLDOM')) {
        var i = new e.ActiveXObject('Microsoft.XMLDOM');
        return ((i.async = 'false'), i.loadXML(t), i);
      }
      throw new Error('No XML parser found');
    },
    parseOwsExceptionReport: function (e) {
      var t = e;
      t instanceof Document || (t = this.parseXml(e));
      var i = t.documentElement;
      if (!i || 'ows:ExceptionReport' !== i.tagName) return null;
      for (
        var r = { exceptions: [], message: '' },
          n = i.getElementsByTagNameNS(L.XmlUtil.namespaces.ows, 'Exception'),
          a = 0,
          s = n.length;
        a < s;
        a++
      ) {
        for (
          var o = n[a],
            l = o.getAttribute('exceptionCode'),
            p = o.getElementsByTagNameNS(L.XmlUtil.namespaces.ows, 'ExceptionText'),
            u = { code: l, text: '' },
            c = 0,
            m = p.length;
          c < m;
          c++
        ) {
          var d = p[c],
            h = d.innerText || d.textContent || d.text;
          ((u.text += h), c < m - 1 && (u.text += '. '));
        }
        ((r.message += u.code + ' - ' + u.text),
          a < s - 1 && (r.message += ' '),
          r.exceptions.push(u));
      }
      return r;
    },
  }),
    (L.Util.request = function (t) {
      t = L.extend(
        {
          async: !0,
          method: 'POST',
          data: '',
          params: {},
          headers: {},
          url: e.location.href,
          withCredentials: !1,
          success: function (e) {
            console.log(e);
          },
          error: function (e) {
            (console.log('Ajax request fail'), console.log(e));
          },
          complete: function () {},
        },
        t
      );
      var i = new XMLHttpRequest();
      ((i.onreadystatechange = function () {
        4 === i.readyState &&
          (200 === i.status ? t.success(i.responseText) : t.error(i.responseText), t.complete());
      }),
        (i.withCredentials = t.withCredentials));
      var r = t.url + L.Util.getParamString(t.params, t.url);
      for (var n in (i.open(t.method, r, t.async), t.headers)) i.setRequestHeader(n, t.headers[n]);
      i.send(t.data);
    }),
    (L.Filter = {}),
    (L.filter = function (e) {
      var t = L.XmlUtil.createElementNS('ogc:Filter');
      return (
        Array.isArray(e)
          ? e.forEach(function (e) {
              t.appendChild(e instanceof Element ? e : e.toGml());
            })
          : e && t.appendChild(e instanceof Element ? e : e.toGml()),
        t
      );
    }),
    (L.Filter.propertyName = function (e) {
      return L.XmlUtil.createElementNS('ogc:PropertyName', {}, { value: e });
    }),
    (L.Filter.literal = function (e) {
      return L.XmlUtil.createElementNS('ogc:Literal', {}, { value: e });
    }),
    (L.Filter.element = function (e) {
      return e instanceof Element ? e : e.toGml();
    }),
    (L.Filter.propertyElement = function (e) {
      return e instanceof Element
        ? e
        : e && 'function' == typeof e.toGml
          ? e.toGml()
          : L.Filter.propertyName(e);
    }),
    (L.Filter.literalElement = function (e) {
      return e instanceof Element
        ? e
        : e && 'function' == typeof e.toGml
          ? e.toGml()
          : L.Filter.literal(e);
    }),
    (L.Filter.Abstract = L.Class.extend({
      attributes: {},
      options: {},
      tagName: null,
      buildFilterContent: function () {
        throw 'Build filter content is abstract and should be implemented';
      },
      toGml: function () {
        var e = L.XmlUtil.createElementNS(this.tagName, this.attributes, this.options);
        return (this.buildFilterContent(e), e);
      },
    })),
    (L.Filter.BinarySpatial = L.Filter.Abstract.extend({
      initialize: function (e, t, i) {
        ((this.propertyName = e), (this.value = t), (this.crs = i));
      },
      buildFilterContent: function (e) {
        return (
          e.appendChild(L.Filter.propertyName(this.propertyName)),
          'string' == typeof this.value
            ? e.appendChild(L.Filter.propertyName(this.value))
            : e.appendChild(this.value.toGml(this.crs)),
          e
        );
      },
    })),
    (L.Filter.Equals = L.Filter.BinarySpatial.extend({ tagName: 'ogc:Equals' })),
    (L.Filter.equals = function (e) {
      return new L.Filter.Equals(e);
    }),
    (L.Filter.Disjoint = L.Filter.BinarySpatial.extend({ tagName: 'ogc:Disjoint' })),
    (L.Filter.disjoint = function (e) {
      return new L.Filter.Disjoint(e);
    }),
    (L.Filter.Touches = L.Filter.BinarySpatial.extend({ tagName: 'ogc:Touches' })),
    (L.Filter.touches = function (e) {
      return new L.Filter.Touches(e);
    }),
    (L.Filter.Within = L.Filter.BinarySpatial.extend({ tagName: 'ogc:Within' })),
    (L.Filter.within = function (e) {
      return new L.Filter.Within(e);
    }),
    (L.Filter.Overlaps = L.Filter.BinarySpatial.extend({ tagName: 'ogc:Overlaps' })),
    (L.Filter.overlaps = function (e) {
      return new L.Filter.Overlaps(e);
    }),
    (L.Filter.Crosses = L.Filter.BinarySpatial.extend({ tagName: 'ogc:Crosses' })),
    (L.Filter.crosses = function (e) {
      return new L.Filter.Crosses(e);
    }),
    (L.Filter.Intersects = L.Filter.BinarySpatial.extend({ tagName: 'ogc:Intersects' })),
    (L.Filter.intersects = function (e) {
      return new L.Filter.Intersects(e);
    }),
    (L.Filter.Contains = L.Filter.BinarySpatial.extend({ tagName: 'ogc:Contains' })),
    (L.Filter.contains = function (e) {
      return new L.Filter.Contains(e);
    }),
    (L.Filter.DistanceBuffer = L.Filter.Abstract.extend({
      initialize: function (e, t, i, r, n) {
        ((this.propertyName = e),
          (this.geomerty = t),
          (this.crs = i),
          (this.distance = r),
          (this.units = n));
      },
      buildFilterContent: function (e) {
        (e.appendChild(L.Filter.propertyName(this.propertyName)),
          e.appendChild(this.geomerty.toGml(this.crs)),
          e.appendChild(
            L.XmlUtil.createElementNS(
              'ogc:Distance',
              { units: this.units },
              { value: this.distance }
            )
          ));
      },
    })),
    (L.Filter.DWithin = L.Filter.DistanceBuffer.extend({ tagName: 'ogc:DWithin' })),
    (L.Filter.dwithin = function (e, t, i, r, n) {
      return new L.Filter.DWithin(e, t, i, r, n);
    }),
    (L.Filter.Beyond = L.Filter.DistanceBuffer.extend({ tagName: 'ogc:Beyond' })),
    (L.Filter.beyond = function (e, t, i, r, n) {
      return new L.Filter.Beyond(e, t, i, r, n);
    }),
    (L.Filter.BBox = L.Filter.Abstract.extend({
      tagName: 'ogc:BBOX',
      geometryField: null,
      bbox: null,
      crs: null,
      initialize: function (e, t, i) {
        ((this.bbox = t), (this.geometryField = e), (this.crs = i));
      },
      buildFilterContent: function (e) {
        (this.geometryField && e.appendChild(L.Filter.propertyName(this.geometryField)),
          e.appendChild(this.bbox.toGml(this.crs)));
      },
    })),
    (L.Filter.bbox = function (e, t, i) {
      return new L.Filter.BBox(e, t, i);
    }),
    (L.Filter.GmlObjectID = L.Filter.Abstract.extend({
      tagName: 'ogc:GmlObjectId',
      initialize: function (e) {
        this.attributes = { 'gml:id': e };
      },
      buildFilterContent: function () {},
    })),
    (L.Filter.gmlobjectid = function (e) {
      return new L.Filter.GmlObjectID(e);
    }),
    (L.Filter.BinaryOperator = L.Filter.Abstract.extend({
      initialize: function (e, t) {
        ((this.firstValue = e), (this.secondValue = t));
      },
      buildFilterContent: function (e) {
        (e.appendChild(L.Filter.propertyElement(this.firstValue)),
          e.appendChild(L.Filter.literalElement(this.secondValue)));
      },
    })),
    (L.Filter.Add = L.Filter.BinaryOperator.extend({ tagName: 'Add' })),
    (L.Filter.add = function (e, t) {
      return new L.Filter.Add(e, t);
    }),
    (L.Filter.Sub = L.Filter.BinaryOperator.extend({ tagName: 'Sub' })),
    (L.Filter.sub = function (e, t) {
      return new L.Filter.Sub(e, t);
    }),
    (L.Filter.Mul = L.Filter.BinaryOperator.extend({ tagName: 'Mul' })),
    (L.Filter.mul = function (e, t) {
      return new L.Filter.Mul(e, t);
    }),
    (L.Filter.Div = L.Filter.BinaryOperator.extend({ tagName: 'Div' })),
    (L.Filter.div = function (e, t) {
      return new L.Filter.Div(e, t);
    }),
    (L.Filter.BinaryComparison = L.Filter.BinaryOperator.extend({
      matchCase: !1,
      initialize: function (e, t, i) {
        (L.Filter.BinaryOperator.prototype.initialize.call(this, e, t),
          (this.attributes = { matchCase: !!i }));
      },
    })),
    (L.Filter.EQ = L.Filter.BinaryComparison.extend({ tagName: 'ogc:PropertyIsEqualTo' })),
    (L.Filter.eq = function (e, t) {
      return new L.Filter.EQ(e, t);
    }),
    (L.Filter.NotEQ = L.Filter.BinaryComparison.extend({ tagName: 'ogc:PropertyIsNotEqualTo' })),
    (L.Filter.neq = function (e, t) {
      return new L.Filter.NotEQ(e, t);
    }),
    (L.Filter.LT = L.Filter.BinaryComparison.extend({ tagName: 'ogc:PropertyIsLessThan' })),
    (L.Filter.lt = function (e, t) {
      return new L.Filter.LT(e, t);
    }),
    (L.Filter.GT = L.Filter.BinaryComparison.extend({ tagName: 'ogc:PropertyIsGreaterThan' })),
    (L.Filter.gt = function (e, t) {
      return new L.Filter.GT(e, t);
    }),
    (L.Filter.LEQ = L.Filter.BinaryComparison.extend({
      tagName: 'ogc:PropertyIsLessThanOrEqualTo',
    })),
    (L.Filter.leq = function (e, t) {
      return new L.Filter.LEQ(e, t);
    }),
    (L.Filter.GEQ = L.Filter.BinaryComparison.extend({
      tagName: 'ogc:PropertyIsGreaterThanOrEqualTo',
    })),
    (L.Filter.geq = function (e, t) {
      return new L.Filter.GEQ(e, t);
    }),
    (L.Filter.Like = L.Filter.Abstract.extend({
      tagName: 'ogc:PropertyIsLike',
      wildCard: '*',
      singleChar: '#',
      escapeChar: '!',
      matchCase: !0,
      initialize: function (e, t, i) {
        ((this.name = e), (this.val = t));
        var r = {
          wildCard: this.wildCard,
          singleChar: this.singleChar,
          escapeChar: this.escapeChar,
          matchCase: this.matchCase,
        };
        this.attributes = L.extend(r, i || {});
      },
      buildFilterContent: function (e) {
        var t = L.Filter.propertyName(this.name),
          i = L.Filter.literal(this.val);
        return (e.appendChild(t), e.appendChild(i), e);
      },
    })),
    (L.Filter.like = function (e, t, i) {
      return new L.Filter.Like(e, t, i);
    }),
    (L.Filter.IsNull = L.Filter.Abstract.extend({
      tagName: 'ogc:PropertyIsNull',
      initialize: function (e) {
        this.propertyName = e;
      },
      buildFilterContent: function (e) {
        e.appendChild(L.Filter.propertyName(this.propertyName));
      },
    })),
    (L.Filter.isnull = function (e) {
      return new L.Filter.IsNull(e);
    }),
    (L.Filter.IsBetween = L.Filter.Abstract.extend({
      tagName: 'ogc:PropertyIsBetween',
      initialize: function (e, t, i) {
        ((this.property = e), (this.lowerBoundary = t), (this.upperBoundary = i));
      },
      buildFilterContent: function (e) {
        e.appendChild(L.Filter.propertyElement(this.property));
        var t = L.XmlUtil.createElementNS('ogc:LowerBoundary');
        (t.appendChild(L.Filter.literalElement(this.lowerBoundary)), e.appendChild(t));
        var i = L.XmlUtil.createElementNS('ogc:UpperBoundary');
        (i.appendChild(L.Filter.literalElement(this.upperBoundary)), e.appendChild(i));
      },
    })),
    (L.Filter.isbetween = function (e, t, i) {
      return new L.Filter.IsBetween(e, t, i);
    }),
    (L.Filter.BinaryLogic = L.Filter.Abstract.extend({
      filters: null,
      initialize: function () {
        for (var e = [], t = 0; t < arguments.length; t++) e.push(arguments[t]);
        this.filters = e;
      },
      buildFilterContent: function (e) {
        this.filters.forEach(function (t) {
          e.appendChild(L.Filter.element(t));
        });
      },
    })),
    (L.Filter.And = L.Filter.BinaryLogic.extend({ tagName: 'And' })),
    (L.Filter.and = function () {
      return new (Function.prototype.bind.apply(L.Filter.And, arguments))();
    }),
    (L.Filter.Or = L.Filter.BinaryLogic.extend({ tagName: 'Or' })),
    (L.Filter.or = function () {
      return new (Function.prototype.bind.apply(L.Filter.Or, arguments))();
    }),
    (L.Filter.Not = L.Filter.Abstract.extend({
      tagName: 'Not',
      initialize: function (e) {
        this.filter = e;
      },
      buildFilterContent: function (e) {
        e.appendChild(L.Filter.element(this.filter));
      },
    })),
    (L.Filter.not = function (e) {
      return new L.Filter.Not(e);
    }),
    (L.Filter.Function = L.Filter.Abstract.extend({
      tagName: 'Function',
      initialize: function () {
        var e = arguments[0];
        this.attributes = { name: e };
        for (var t = [], i = 1; i < arguments.length; i++) t.push(arguments[i]);
        this.expressions = t;
      },
      buildFilterContent: function (e) {
        var t = this.expressions[0];
        e.appendChild(L.Filter.propertyElement(t));
        for (var i = 1; i < this.expressions.length; i++) {
          var r = this.expressions[i];
          e.appendChild(L.Filter.literalElement(r));
        }
      },
    })),
    (L.Filter.function = function () {
      return new (Function.prototype.bind.apply(L.Filter.Function, arguments))();
    }),
    (L.Format = {}),
    (L.Format.Scheme = L.Class.extend({
      options: { geometryField: 'Shape' },
      initialize: function (e) {
        L.setOptions(this, e);
      },
      parse: function (e) {
        for (
          var t = new L.GML.FeatureType({ geometryField: this.options.geometryField }),
            i = e
              .getElementsByTagNameNS(L.XmlUtil.namespaces.xsd, 'complexType')[0]
              .getElementsByTagNameNS(L.XmlUtil.namespaces.xsd, 'sequence')[0],
            r = 0;
          r < i.children.length;
          r++
        ) {
          var n = i.children[r];
          if (n.attributes.name) {
            var a = n.attributes.name.value,
              s = n.attributes.type;
            if (
              (s ||
                (s = n.getElementsByTagNameNS(L.XmlUtil.namespaces.xsd, 'restriction').attributes
                  .base),
              s)
            ) {
              var o = s.value.split(':').pop();
              a !== this.options.geometryField ? t.appendField(a, o) : (t.geometryFields[a] = o);
            }
          }
        }
        return t;
      },
    })),
    (L.Format.Base = L.Class.extend({
      defaultOptions: {
        crs: L.CRS.EPSG3857,
        coordsToLatLng: function (e) {
          return new L.LatLng(e[1], e[0], e[2]);
        },
        latLngToCoords: function (e) {
          var t = [e.lng, e.lat];
          return (e.alt !== i && t.push(e.alt), t);
        },
        geometryField: 'Shape',
      },
      initialize: function (e) {
        if ((L.setOptions(this, L.extend({}, this.defaultOptions, e)), e.crs)) {
          var t = e.crs;
          ((this.options.coordsToLatLng = function (e) {
            var i = L.point(e[0], e[1]),
              r = t.projection.unproject(i);
            return (e[2] && (r.alt = e[2]), r);
          }),
            (this.options.latLngToCoords = function (e) {
              var i = L.latLng(e);
              return t.projection.project(i);
            }));
        }
      },
      setFeatureDescription: function (e) {
        e.attributes.targetNamespace
          ? (this.namespaceUri = e.attributes.targetNamespace.value)
          : (this.namespaceUri = this.options.namespaceUri);
        var t = new L.Format.Scheme({ geometryField: this.options.geometryField });
        this.featureType = t.parse(e);
      },
      responseToLayers: function () {
        throw 'responseToLayers is abstract and should be implemented';
      },
    })),
    (L.Format.GeoJSON = L.Format.Base.extend({
      outputFormat: 'application/json',
      responseToLayers: function (e) {
        for (var t = [], i = JSON.parse(e), r = 0; r < i.features.length; r++) {
          var n = this.processFeature(i.features[r]);
          n && t.push(n);
        }
        return t;
      },
      processFeature: function (e) {
        var t = this.generateLayer(e);
        return t ? ((t.feature = e), t) : null;
      },
      generateLayer: function (e) {
        return (
          L.GeoJSON.geometryToLayer(e, this.options || null) ||
          (console.log(
            "Geometry field doesn' exist inside received feature: '" +
              e +
              "', so feature will be skipped and won't be converted into leaflet layer"
          ),
          null)
        );
      },
    })),
    (L.GML = L.GML || {}),
    (L.GML.ParserContainerMixin = {
      parsers: {},
      initializeParserContainer: function () {
        this.parsers = {};
      },
      appendParser: function (e) {
        this.parsers[e.elementTag] = e;
      },
      parseElement: function (e, t) {
        var i = this.parsers[e.tagName];
        if (!i) throw 'unknown child element ' + e.tagName;
        return i.parse(e, t);
      },
    }),
    (L.GML.Element = L.Class.extend({
      elementTag: '',
      parse: function () {
        throw 'not implemented parse function in parser for ' + this.elementTag;
      },
    })),
    (L.GML.Geometry = L.GML.Element.extend({
      elementOptions: function (e, t) {
        var i = L.extend({}, t),
          r = e.getAttribute('srsDimension');
        return (r && (i.dimension = parseInt(r)), i);
      },
    })),
    (L.GML.Coordinates = L.GML.Element.extend({
      defaultSeparator: { ds: '.', cs: ',', ts: ' ' },
      elementTag: 'gml:coordinates',
      parse: function (e) {
        var t = this.defaultSeparator.ds;
        e.attributes.decimal && (t = e.attributes.decimal.value);
        var i = this.defaultSeparator.cs;
        e.attributes.cs && (i = e.attributes.cs.value);
        var r = this.defaultSeparator.ts;
        e.attributes.ts && (r = e.attributes.ts.value);
        for (
          var n = [],
            a = e.textContent.split(r),
            s = function (e) {
              return ('.' !== t && (e = e.replace(t, '.')), parseFloat(e));
            },
            o = 0;
          o < a.length;
          o++
        )
          n.push(a[o].split(i).map(s));
        return 1 === n.length ? n[0] : n;
      },
    })),
    (L.GML.Pos = L.GML.Element.extend({
      elementTag: 'gml:pos',
      parse: function (e) {
        return e.textContent.split(' ').map(function (e) {
          return parseFloat(e);
        });
      },
    })),
    (L.GML.PosList = L.GML.Element.extend({
      statics: { DIM: 2 },
      elementTag: 'gml:posList',
      parse: function (e, t) {
        for (
          var i = [],
            r = (t = t || {}).dimension || L.GML.PosList.DIM,
            n = e.textContent.split(' '),
            a = 0;
          a < n.length;
          a += r
        ) {
          for (var s = [], o = a; o < a + r; o++) s.push(parseFloat(n[o]));
          i.push(s);
        }
        return i;
      },
    })),
    (L.GML.PointNode = L.GML.Geometry.extend({
      includes: L.GML.ParserContainerMixin,
      elementTag: 'gml:Point',
      initialize: function () {
        (this.initializeParserContainer(),
          this.appendParser(new L.GML.Pos()),
          this.appendParser(new L.GML.Coordinates()));
      },
      parse: function (e, t) {
        return ((t = this.elementOptions(e, t)), this.parseElement(e.firstElementChild, t));
      },
    })),
    (L.GML.PointSequence = L.GML.Geometry.extend({
      includes: L.GML.ParserContainerMixin,
      initialize: function () {
        (this.initializeParserContainer(),
          this.appendParser(new L.GML.Pos()),
          this.appendParser(new L.GML.PosList()),
          this.appendParser(new L.GML.Coordinates()),
          this.appendParser(new L.GML.PointNode()));
      },
      parse: function (e, t) {
        t = this.elementOptions(e, t);
        var i = e.firstElementChild,
          r = [],
          n = i.tagName;
        if ('gml:pos' === n || 'gml:Point' === n)
          for (
            var a = this.parsers[n],
              s = e.getElementsByTagNameNS(L.XmlUtil.namespaces.gml, n.split(':').pop()),
              o = 0;
            o < s.length;
            o++
          )
            r.push(a.parse(s[o], t));
        else r = this.parseElement(i, t);
        return r;
      },
    })),
    (L.GML.LinearRing = L.GML.PointSequence.extend({
      elementTag: 'gml:LinearRing',
      parse: function (e, t) {
        var i = L.GML.PointSequence.prototype.parse.call(this, e, t);
        return (i.pop(), i);
      },
    })),
    (L.GML.LineStringNode = L.GML.PointSequence.extend({ elementTag: 'gml:LineString' })),
    (L.GML.PolygonNode = L.GML.Geometry.extend({
      elementTag: 'gml:Polygon',
      initialize: function () {
        this.linearRingParser = new L.GML.LinearRing();
      },
      parse: function (e, t) {
        t = this.elementOptions(e, t);
        for (var i = [], r = 0; r < e.children.length; r++) {
          var n = e.children[r];
          i.push(this.linearRingParser.parse(n.firstElementChild, t));
        }
        return i;
      },
    })),
    (L.GML.CoordsToLatLngMixin = {
      transform: function (e, t) {
        if (Array.isArray(e[0])) {
          for (var i = [], r = 0; r < e.length; r++) i.push(this.transform(e[r], t));
          return i;
        }
        return t.coordsToLatLng(e);
      },
    }),
    (L.GML.Point = L.GML.PointNode.extend({
      includes: L.GML.CoordsToLatLngMixin,
      parse: function (e, t) {
        var i = L.GML.PointNode.prototype.parse.call(this, e, t),
          r = new L.Marker();
        return (r.setLatLng(this.transform(i, t)), r);
      },
    })),
    (L.GML.LineString = L.GML.LineStringNode.extend({
      includes: L.GML.CoordsToLatLngMixin,
      parse: function (e, t) {
        var i = new L.Polyline([]),
          r = L.GML.LineStringNode.prototype.parse.call(this, e);
        return (i.setLatLngs(this.transform(r, t)), i);
      },
    })),
    (L.GML.Polygon = L.GML.PolygonNode.extend({
      includes: L.GML.CoordsToLatLngMixin,
      parse: function (e, t) {
        var i = new L.Polygon([]),
          r = L.GML.PolygonNode.prototype.parse.call(this, e, t);
        return (i.setLatLngs(this.transform(r, t)), i);
      },
    })),
    (L.GML.MultiGeometry = L.GML.Geometry.extend({
      includes: [L.GML.ParserContainerMixin, L.GML.CoordsToLatLngMixin],
      initialize: function () {
        this.initializeParserContainer();
      },
      parse: function (e, t) {
        t = this.elementOptions(e, t);
        for (var i = [], r = 0; r < e.children.length; r++)
          for (var n = e.children[r], a = 0; a < n.children.length; a++) {
            var s = n.children[a];
            i.push(this.parseElement(s, t));
          }
        return this.transform(i, t);
      },
    })),
    (L.GML.AbstractMultiPolyline = L.GML.MultiGeometry.extend({
      initialize: function () {
        (L.GML.MultiGeometry.prototype.initialize.call(this),
          this.appendParser(new L.GML.LineStringNode()));
      },
      parse: function (e, t) {
        var i = L.GML.MultiGeometry.prototype.parse.call(this, e, t),
          r = new L.Polyline([]);
        return (r.setLatLngs(i), r);
      },
    })),
    (L.GML.AbstractMultiPolygon = L.GML.MultiGeometry.extend({
      initialize: function () {
        (L.GML.MultiGeometry.prototype.initialize.call(this),
          this.appendParser(new L.GML.PolygonNode()));
      },
      parse: function (e, t) {
        var i = L.GML.MultiGeometry.prototype.parse.call(this, e, t),
          r = new L.Polygon([]);
        return (r.setLatLngs(i), r);
      },
    })),
    (L.GML.MultiLineString = L.GML.AbstractMultiPolyline.extend({
      elementTag: 'gml:MultiLineString',
    })),
    (L.GML.MultiCurve = L.GML.AbstractMultiPolyline.extend({ elementTag: 'gml:MultiCurve' })),
    (L.GML.MultiPolygon = L.GML.AbstractMultiPolygon.extend({ elementTag: 'gml:MultiPolygon' })),
    (L.GML.MultiSurface = L.GML.AbstractMultiPolygon.extend({ elementTag: 'gml:MultiSurface' })),
    (L.GML.MultiPoint = L.GML.MultiGeometry.extend({
      elementTag: 'gml:MultiPoint',
      initialize: function () {
        (L.GML.MultiGeometry.prototype.initialize.call(this),
          this.appendParser(new L.GML.PointNode()));
      },
      parse: function (e, t) {
        for (
          var i = L.GML.MultiGeometry.prototype.parse.call(this, e, t),
            r = new L.FeatureGroup(),
            n = 0;
          n < i.length;
          n++
        ) {
          var a = new L.Marker();
          (a.setLatLng(i[n]), r.addLayer(a));
        }
        return r;
      },
    })),
    (L.GML.FeatureType = L.Class.extend({
      options: { geometryField: 'Shape' },
      primitives: [
        {
          types: ['byte', 'short', 'int', 'integer', 'long', 'float', 'double', 'decimal'],
          parse: function (e) {
            return 0 === e
              ? 0
              : '' === (e = String.prototype.trim.call(e || ''))
                ? null
                : Number(e);
          },
          validate: function (e) {
            return !isNaN(e);
          },
          type: 'number',
        },
        {
          types: ['string'],
          parse: function (e) {
            return e;
          },
          validate: function (e) {
            return !0;
          },
          type: 'string',
        },
        {
          types: ['boolean'],
          parse: function (e) {
            return 'false' !== String.prototype.trim.call(e || '').toLowerCase();
          },
          validate: function (e) {
            return !0;
          },
          type: 'boolean',
        },
        {
          types: ['date', 'time', 'datetime'],
          parse: function (e) {
            return '' === (e = String.prototype.trim.call(e || '')) ? null : new Date(e);
          },
          validate: function (e) {
            return !isNaN(e);
          },
          type: 'date',
        },
      ],
      initialize: function (e) {
        (L.setOptions(this, e),
          (this.fields = {}),
          (this.fieldValidators = {}),
          (this.fieldTypes = {}),
          (this.geometryFields = {}));
      },
      appendField: function (e, t) {
        var i = this;
        ((t = String.prototype.toLowerCase.call(t || '')),
          this.primitives.forEach(function (r) {
            -1 !== r.types.indexOf(t) &&
              ((i.fields[e] = r.parse),
              (i.fieldValidators[e] = r.validate),
              (i.fieldTypes[e] = r.type));
          }));
      },
      parse: function (e) {
        for (var t, i = {}, r = 0; r < e.children.length; r++) {
          var n = e.children[r],
            a = n.tagName.split(':').pop();
          if (a !== this.options.geometryField) {
            var s = this.fields[a];
            (s || (this.appendField(a, 'string'), (s = this.fields[a])), (i[a] = s(n.textContent)));
          }
        }
        return (
          e.attributes['gml:id'] && (t = e.attributes['gml:id'].value),
          { type: 'Feature', properties: i, id: t }
        );
      },
    })),
    (L.Format.GML = L.Format.Base.extend({
      includes: L.GML.ParserContainerMixin,
      outputFormat: 'text/xml; subtype=gml/3.1.1',
      initialize: function (e) {
        (L.Format.Base.prototype.initialize.call(this, e),
          this.initializeParserContainer(),
          this.appendParser(new L.GML.Point()),
          this.appendParser(new L.GML.LineString()),
          this.appendParser(new L.GML.Polygon()),
          this.appendParser(new L.GML.MultiLineString()),
          this.appendParser(new L.GML.MultiPolygon()),
          this.appendParser(new L.GML.MultiCurve()),
          this.appendParser(new L.GML.MultiSurface()),
          this.appendParser(new L.GML.MultiPoint()));
      },
      responseToLayers: function (e) {
        for (
          var t = [],
            i = L.XmlUtil.parseXml(e).documentElement,
            r = i.getElementsByTagNameNS(L.XmlUtil.namespaces.gml, 'featureMember'),
            n = 0;
          n < r.length;
          n++
        ) {
          var a = r[n].firstElementChild,
            s = this.processFeature(a);
          s && t.push(s);
        }
        var o = i.getElementsByTagNameNS(L.XmlUtil.namespaces.gml, 'featureMembers');
        if (o.length > 0)
          for (var l = o[0].children, p = 0; p < l.length; p++) {
            var u = l[p],
              c = this.processFeature(u);
            c && t.push(c);
          }
        return t;
      },
      processFeature: function (e) {
        var t = this.generateLayer(e);
        return t ? ((t.feature = this.featureType.parse(e)), t) : null;
      },
      generateLayer: function (e) {
        var t = e.getElementsByTagNameNS(this.namespaceUri, this.options.geometryField)[0];
        return t
          ? this.parseElement(t.firstElementChild, this.options)
          : (console.log(
              "Geometry field '" +
                this.options.geometryField +
                "' doesn' exist inside received feature: '" +
                e.innerHTML +
                "', so feature will be skipped and won't be converted into leaflet layer"
            ),
            null);
      },
    })),
    (L.Util.project = function (e, t) {
      if (L.Util.isArray(t)) {
        var i = [];
        return (
          t.forEach(function (t) {
            i.push(L.Util.project(e, t));
          }),
          i
        );
      }
      return e.projection.project(t);
    }),
    (L.Util.isFlat = L.LineUtil.isFlat || L.LineUtil._flat || L.Polyline._flat),
    (L.GmlUtil = {
      posNode: function (e) {
        return L.XmlUtil.createElementNS(
          'gml:pos',
          { srsDimension: 2 },
          { value: e.x + ' ' + e.y }
        );
      },
      posListNode: function (e, t) {
        var i = [];
        if (
          (e.forEach(function (e) {
            i.push(e.x + ' ' + e.y);
          }),
          t && e.length > 0)
        ) {
          var r = e[0];
          i.push(r.x + ' ' + r.y);
        }
        var n = i.join(' ');
        return L.XmlUtil.createElementNS('gml:posList', {}, { value: n });
      },
    }),
    L.CircleMarker.include({
      toGml: function (e) {
        var t = L.XmlUtil.createElementNS('gml:Point', { srsName: e.code });
        return (t.appendChild(L.GmlUtil.posNode(L.Util.project(e, this.getLatLng()))), t);
      },
    }),
    (L.LatLngBounds.prototype.toGml = function (e) {
      var t = e.project(this.getSouthWest()),
        i = e.project(this.getNorthEast()),
        r = L.XmlUtil.createElementNS('gml:Envelope', { srsName: e.code });
      return (
        r.appendChild(L.XmlUtil.createElementNS('gml:lowerCorner', {}, { value: t.x + ' ' + t.y })),
        r.appendChild(L.XmlUtil.createElementNS('gml:upperCorner', {}, { value: i.x + ' ' + i.y })),
        r
      );
    }),
    L.Marker.include({
      toGml: function (e) {
        var t = L.XmlUtil.createElementNS('gml:Point', { srsName: e.code });
        return (t.appendChild(L.GmlUtil.posNode(L.Util.project(e, this.getLatLng()))), t);
      },
    }),
    L.Polygon.include({
      toGml: function (e, t) {
        for (var i = this.getLatLngs(), r = [], n = 0; n < i.length; n++) {
          var a = i[n],
            s = L.Util.isFlat(a),
            o = L.XmlUtil.createElementNS('gml:Polygon', { srsName: e.code, srsDimension: 2 });
          if (
            (o
              .appendChild(L.XmlUtil.createElementNS('gml:exterior'))
              .appendChild(L.XmlUtil.createElementNS('gml:LinearRing', { srsDimension: 2 }))
              .appendChild(L.GmlUtil.posListNode(L.Util.project(e, s ? a : a[0]), !0)),
            !s)
          )
            for (var l = 1; l < a.length; l++)
              o.appendChild(L.XmlUtil.createElementNS('gml:interior'))
                .appendChild(L.XmlUtil.createElementNS('gml:LinearRing', { srsDimension: 2 }))
                .appendChild(L.GmlUtil.posListNode(L.Util.project(e, a[l]), !0));
          r.push(o);
        }
        if (1 === r.length && !t) return r[0];
        for (
          var p = L.XmlUtil.createElementNS('gml:MultiSurface', {
              srsName: e.code,
              srsDimension: 2,
            }),
            u = p.appendChild(L.XmlUtil.createElementNS('gml:surfaceMembers')),
            c = 0;
          c < r.length;
          c++
        )
          u.appendChild(r[c]);
        return p;
      },
    }),
    L.Polyline.include({
      _lineStringNode: function (e, t) {
        var i = L.XmlUtil.createElementNS('gml:LineString', { srsName: e.code, srsDimension: 2 });
        return (i.appendChild(L.GmlUtil.posListNode(L.Util.project(e, t), !1)), i);
      },
      toGml: function (e, t) {
        var i = this.getLatLngs(),
          r = [];
        if (L.Util.isFlat(i)) r.push(this._lineStringNode(e, i));
        else for (var n = 0; n < i.length; n++) r.push(this._lineStringNode(e, i[n]));
        if (1 === r.length && !t) return r[0];
        for (
          var a = L.XmlUtil.createElementNS('gml:MultiCurve', { srsName: e.code, srsDimension: 2 }),
            s = a.appendChild(L.XmlUtil.createElementNS('gml:curveMembers')),
            o = 0;
          o < r.length;
          o++
        )
          s.appendChild(r[o]);
        return a;
      },
    }));
  var r = {
    setProperties: function (e) {
      for (var t in e) e.hasOwnProperty(t) && (this.feature.properties[t] = e[t]);
    },
    getProperty: function (e) {
      return this.feature.properties[e];
    },
    deleteProperties: function (e) {
      for (var t = 0; t < e.length; t++)
        this.feature.properties.hasOwnProperty(e[t]) && delete this.feature.properties[e[t]];
    },
  };
  (L.Marker.include(r),
    L.Path.include(r),
    (L.WFS = L.FeatureGroup.extend({
      _capabilities: null,
      _boundingBox: null,
      options: {
        crs: L.CRS.EPSG3857,
        showExisting: !0,
        geometryField: 'Shape',
        url: '',
        version: '1.1.0',
        typeNS: '',
        typeName: '',
        typeNSName: '',
        maxFeatures: null,
        filter: null,
        opacity: 1,
        fillOpacity: 1,
        style: { color: 'black', weight: 1, opacity: 1, fillOpacity: 1 },
        namespaceUri: '',
      },
      state: {},
      initialize: function (e, t) {
        (L.setOptions(this, e),
          (this.state = { exist: 'exist' }),
          (this._layers = {}),
          (this.readFormat =
            t ||
            new L.Format.GML({ crs: this.options.crs, geometryField: this.options.geometryField })),
          (this.options.typeNSName = this.namespaceName(this.options.typeName)),
          (this.options.srsName = this.options.crs.code),
          this._updateOpacity());
        var i = this;
        this.describeFeatureType(
          function () {
            i.options.showExisting && i.loadFeatures(i.options.filter);
          },
          function (e) {
            i.fire('error', { error: new Error(e) });
          }
        );
      },
      namespaceName: function (e) {
        return this.options.typeNS + ':' + e;
      },
      describeFeatureType: function (e, t) {
        var i = L.XmlUtil.createElementNS('wfs:DescribeFeatureType', {
          service: 'WFS',
          version: this.options.version,
        });
        i.appendChild(
          L.XmlUtil.createElementNS('TypeName', {}, { value: this.options.typeNSName })
        );
        var r = this;
        L.Util.request({
          url: this.options.url,
          data: L.XmlUtil.serializeXmlDocumentString(i),
          method: 'GET',
          params: {
            service: 'WFS',
            version: this.options.version,
            request: 'DescribeFeatureType',
            typeName: this.options.typeNSName,
          },
          headers: this.options.headers || {},
          success: function (i) {
            var n = L.XmlUtil.parseOwsExceptionReport(i);
            if (n) 'function' == typeof t && t(n.message);
            else {
              var a = L.XmlUtil.parseXml(i).documentElement;
              (r.readFormat.setFeatureDescription(a),
                (r.options.namespaceUri = a.attributes.targetNamespace.value),
                'function' == typeof e && e());
            }
          },
          error: function (e) {
            'function' == typeof t && t(e);
          },
        });
      },
      getFeature: function (e) {
        var t = L.XmlUtil.createElementNS('wfs:GetFeature', {
            service: 'WFS',
            version: this.options.version,
            maxFeatures: this.options.maxFeatures,
            outputFormat: this.readFormat.outputFormat,
          }),
          i = t.appendChild(
            L.XmlUtil.createElementNS('wfs:Query', {
              typeName: this.options.typeNSName,
              srsName: this.options.srsName,
            })
          );
        return (e && i.appendChild(L.filter(e)), t);
      },
      loadFeatures: function (e) {
        var t = this;
        L.Util.request({
          url: this.options.url,
          data: L.XmlUtil.serializeXmlDocumentString(t.getFeature(e)),
          method: 'GET',
          params: {
            service: 'WFS',
            version: this.options.version,
            request: 'GetFeature',
            typeName: this.options.typeNSName,
            srsName: this.options.srsName,
            outputFormat: this.readFormat.outputFormat,
            filter: L.XmlUtil.serializeXmlDocumentString(L.filter(e)),
          },
          headers: this.options.headers || {},
          success: function (e) {
            var i = L.XmlUtil.parseOwsExceptionReport(e);
            if (i) return (t.fire('error', { error: new Error(i.message) }), t);
            var r = t.readFormat.responseToLayers(e, {
              coordsToLatLng: t.options.coordsToLatLng,
              pointToLayer: t.options.pointToLayer,
            });
            return (
              'function' == typeof t.options.style
                ? r.forEach(function (e) {
                    ((e.state = t.state.exist),
                      e.setStyle && e.setStyle(t.options.style(e)),
                      t.addLayer(e));
                  })
                : (r.forEach(function (e) {
                    ((e.state = t.state.exist), t.addLayer(e));
                  }),
                  t.setStyle(t.options.style)),
              t.fire('load', { responseText: e }),
              t
            );
          },
          error: function (e) {
            return (t.fire('error', { error: new Error(e) }), t);
          },
        });
      },
      getCapabilities: function (e, t) {
        var i = this._capabilities;
        if (i && 'function' == typeof e) e(i);
        else {
          var r = L.XmlUtil.createElementNS('wfs:GetCapabilities', {
              service: 'WFS',
              version: this.options.version,
            }),
            n = this;
          L.Util.request({
            url: this.options.url,
            data: L.XmlUtil.serializeXmlDocumentString(r),
            method: 'GET',
            params: { service: 'WFS', version: this.options.version, request: 'GetCapabilities' },
            headers: this.options.headers || {},
            success: function (r) {
              var a = L.XmlUtil.parseOwsExceptionReport(r);
              if (a) 'function' == typeof t && t(new Error(a.message));
              else {
                try {
                  i = L.XmlUtil.parseXml(r).documentElement;
                } catch (e) {
                  return void ('function' == typeof t && t(e));
                }
                ((n._capabilities = i), 'function' == typeof e && e(i));
              }
            },
            error: function (e) {
              'function' == typeof t && t(new Error(e));
            },
          });
        }
      },
      getBoundingBox: function (e, t) {
        var i = this._boundingBox;
        if (i && 'function' == typeof e) e(i);
        else {
          var r = this;
          this.getCapabilities(
            function (t) {
              for (
                var n = t
                    .getElementsByTagName('FeatureTypeList')[0]
                    .getElementsByTagName('FeatureType'),
                  a = 0,
                  s = n.length;
                a < s;
                a++
              ) {
                var o = n[a];
                if (
                  L.XmlUtil.getNodeText(o.getElementsByTagName('Name')[0]) === r.options.typeNSName
                ) {
                  var l = o.getElementsByTagNameNS(L.XmlUtil.namespaces.ows, 'WGS84BoundingBox')[0],
                    p = l.getElementsByTagNameNS(L.XmlUtil.namespaces.ows, 'LowerCorner')[0],
                    u = l.getElementsByTagNameNS(L.XmlUtil.namespaces.ows, 'UpperCorner')[0],
                    c = L.XmlUtil.getNodeText(p),
                    m = L.XmlUtil.getNodeText(u),
                    d = c.split(' ').reverse(),
                    h = m.split(' ').reverse();
                  i = L.latLngBounds([d, h]);
                  break;
                }
              }
              ((r._boundingBox = i), 'function' == typeof e && e(i));
            },
            function (e) {
              'function' == typeof t && t(new Error(e));
            }
          );
        }
      },
      setOpacity: function (e, t) {
        return (
          (this.options.opacity = e),
          (this.options.fillOpacity = t || e),
          this._updateOpacity(),
          this
        );
      },
      _updateOpacity: function () {
        var e = L.extend(this.options.style || {}, {
          opacity: this.options.opacity,
          fillOpacity: this.options.fillOpacity,
        });
        this.setStyle(e);
      },
    })),
    (L.wfs = function (e, t) {
      return new L.WFS(e, t);
    }),
    (L.WFST = L.WFS.extend({
      options: { forceMulti: !1 },
      initialize: function (e, t) {
        (L.WFS.prototype.initialize.call(this, e, t),
          (this.state = L.extend(this.state, {
            insert: 'insertElement',
            update: 'updateElement',
            remove: 'removeElement',
          })),
          (this.changes = {}));
      },
      addLayer: function (e) {
        if (
          (L.FeatureGroup.prototype.addLayer.call(this, e),
          e.feature || (e.feature = { properties: {} }),
          !e.state)
        ) {
          e.state = this.state.insert;
          var t = this.getLayerId(e);
          this.changes[t] = e;
        }
        return this;
      },
      removeLayer: function (e) {
        L.FeatureGroup.prototype.removeLayer.call(this, e);
        var t = this.getLayerId(e);
        if (t in this.changes) {
          var i = this.changes[t];
          i.state === this.state.insert ? delete this.changes[t] : (i.state = this.state.remove);
        } else ((e.state = this.state.remove), (this.changes[t] = e));
      },
      editLayer: function (e) {
        e.state !== this.state.insert && (e.state = this.state.update);
        var t = this.getLayerId(e);
        return ((this.changes[t] = e), this);
      },
      save: function () {
        var e = L.XmlUtil.createElementNS('wfs:Transaction', {
            service: 'WFS',
            version: this.options.version,
          }),
          t = [];
        for (var i in this.changes) {
          var r = this.changes[i],
            n = this[r.state](r);
          (e.appendChild(n), r.state === this.state.insert && t.push(r));
        }
        var a = this;
        return (
          L.Util.request({
            url: this.options.url,
            data: L.XmlUtil.serializeXmlDocumentString(e),
            headers: this.options.headers || {},
            withCredentials: !0,
            success: function (e) {
              var i = L.XmlUtil.parseXml(e),
                r = L.XmlUtil.parseOwsExceptionReport(i);
              if (null === r) {
                for (
                  var n = L.XmlUtil.evaluate(
                      '//wfs:InsertResults/wfs:Feature/ogc:FeatureId/@fid',
                      i
                    ),
                    s = [],
                    o = n.iterateNext();
                  o;
                )
                  (s.push(new L.Filter.GmlObjectID(o.value)), (o = n.iterateNext()));
                (t.forEach(function (e) {
                  L.FeatureGroup.prototype.removeLayer.call(a, e);
                }),
                  a.once('load', function () {
                    (a.fire('save:success'), (a.changes = {}));
                  }),
                  a.loadFeatures(s));
              } else a.fire('save:failed', r);
            },
            error: function (e) {
              a.fire('save:failed', e);
            },
          }),
          this
        );
      },
    })),
    (L.wfst = function (e, t) {
      return new L.WFST(e, t);
    }),
    L.WFST.include({
      gmlFeature: function (e) {
        var t = L.XmlUtil.createElementNS(
            this.options.typeNSName,
            {},
            { uri: this.options.namespaceUri }
          ),
          i = e.feature;
        for (var r in i.properties) t.appendChild(this.gmlProperty(r, i.properties[r]));
        return (
          t.appendChild(
            this.gmlProperty(
              this.options.geometryField,
              e.toGml(this.options.crs, this.options.forceMulti)
            )
          ),
          t
        );
      },
      gmlProperty: function (e, t) {
        var r = L.XmlUtil.createElementNS(this.namespaceName(e));
        return (
          t instanceof Element
            ? r.appendChild(t)
            : null === t || t === i || '' === t
              ? L.XmlUtil.setAttributes(r, { 'xsi:nil': !0 })
              : r.appendChild(L.XmlUtil.createTextNode(t)),
          r
        );
      },
      wfsProperty: function (e, t) {
        var i = L.XmlUtil.createElementNS('wfs:Property');
        i.appendChild(L.XmlUtil.createElementNS('wfs:Name', {}, { value: e }));
        var r = L.XmlUtil.createElementNS('wfs:Value');
        return (
          t instanceof Element ? r.appendChild(t) : r.appendChild(L.XmlUtil.createTextNode(t)),
          i.appendChild(r),
          i
        );
      },
    }),
    L.WFST.include({
      insertElement: function (e) {
        var t = L.XmlUtil.createElementNS('wfs:Insert');
        return (t.appendChild(this.gmlFeature(e)), t);
      },
      updateElement: function (e) {
        var t = L.XmlUtil.createElementNS('wfs:Update', { typeName: this.options.typeNSName }),
          i = e.feature;
        for (var r in i.properties)
          i.properties.hasOwnProperty(r) && t.appendChild(this.wfsProperty(r, i.properties[r]));
        t.appendChild(
          this.wfsProperty(
            this.namespaceName(this.options.geometryField),
            e.toGml(this.options.crs, this.options.forceMulti)
          )
        );
        var n = new L.Filter.GmlObjectID(e.feature.id);
        return (t.appendChild(L.filter(n)), t);
      },
      removeElement: function (e) {
        var t = L.XmlUtil.createElementNS('wfs:Delete', { typeName: this.options.typeNSName }),
          i = new L.Filter.GmlObjectID(e.feature.id);
        return (t.appendChild(L.filter(i)), t);
      },
    }));
})(window, document);
