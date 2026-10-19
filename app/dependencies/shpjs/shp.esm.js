function globals(t) {
  (t(
    'EPSG:4326',
    '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'
  ),
    t(
      'EPSG:4269',
      '+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees'
    ),
    t(
      'EPSG:3857',
      '+title=WGS 84 / Pseudo-Mercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs'
    ),
    (t.WGS84 = t['EPSG:4326']),
    (t['EPSG:3785'] = t['EPSG:3857']),
    (t.GOOGLE = t['EPSG:3857']),
    (t['EPSG:900913'] = t['EPSG:3857']),
    (t['EPSG:102113'] = t['EPSG:3857']));
}
var PJD_3PARAM = 1,
  PJD_7PARAM = 2,
  PJD_GRIDSHIFT = 3,
  PJD_WGS84 = 4,
  PJD_NODATUM = 5,
  SRS_WGS84_SEMIMAJOR = 6378137,
  SRS_WGS84_SEMIMINOR = 6356752.314,
  SRS_WGS84_ESQUARED = 0.0066943799901413165,
  SEC_TO_RAD = 484813681109536e-20,
  HALF_PI = Math.PI / 2,
  SIXTH = 0.16666666666666666,
  RA4 = 0.04722222222222222,
  RA6 = 0.022156084656084655,
  EPSLN = 1e-10,
  D2R$1 = 0.017453292519943295,
  R2D = 57.29577951308232,
  FORTPI = Math.PI / 4,
  TWO_PI = 2 * Math.PI,
  SPI = 3.14159265359,
  exports$2 = {
    greenwich: 0,
    lisbon: -9.131906111111,
    paris: 2.337229166667,
    bogota: -74.080916666667,
    madrid: -3.687938888889,
    rome: 12.452333333333,
    bern: 7.439583333333,
    jakarta: 106.807719444444,
    ferro: -17.666666666667,
    brussels: 4.367975,
    stockholm: 18.058277777778,
    athens: 23.7163375,
    oslo: 10.722916666667,
  },
  units = { ft: { to_meter: 0.3048 }, 'us-ft': { to_meter: 1200 / 3937 } },
  ignoredChar = /[\s_\-\/\(\)]/g;
function match(t, s) {
  if (t[s]) return t[s];
  for (
    var i, a = Object.keys(t), e = s.toLowerCase().replace(ignoredChar, ''), h = -1;
    ++h < a.length;
  )
    if ((i = a[h]).toLowerCase().replace(ignoredChar, '') === e) return t[i];
}
function projStr(t) {
  var s,
    i,
    a,
    e = {},
    h = t
      .split('+')
      .map(function (t) {
        return t.trim();
      })
      .filter(function (t) {
        return t;
      })
      .reduce(function (t, s) {
        var i = s.split('=');
        return (i.push(!0), (t[i[0].toLowerCase()] = i[1]), t);
      }, {}),
    r = {
      proj: 'projName',
      datum: 'datumCode',
      rf: function (t) {
        e.rf = parseFloat(t);
      },
      lat_0: function (t) {
        e.lat0 = t * D2R$1;
      },
      lat_1: function (t) {
        e.lat1 = t * D2R$1;
      },
      lat_2: function (t) {
        e.lat2 = t * D2R$1;
      },
      lat_ts: function (t) {
        e.lat_ts = t * D2R$1;
      },
      lon_0: function (t) {
        e.long0 = t * D2R$1;
      },
      lon_1: function (t) {
        e.long1 = t * D2R$1;
      },
      lon_2: function (t) {
        e.long2 = t * D2R$1;
      },
      alpha: function (t) {
        e.alpha = parseFloat(t) * D2R$1;
      },
      gamma: function (t) {
        e.rectified_grid_angle = parseFloat(t);
      },
      lonc: function (t) {
        e.longc = t * D2R$1;
      },
      x_0: function (t) {
        e.x0 = parseFloat(t);
      },
      y_0: function (t) {
        e.y0 = parseFloat(t);
      },
      k_0: function (t) {
        e.k0 = parseFloat(t);
      },
      k: function (t) {
        e.k0 = parseFloat(t);
      },
      a: function (t) {
        e.a = parseFloat(t);
      },
      b: function (t) {
        e.b = parseFloat(t);
      },
      r_a: function () {
        e.R_A = !0;
      },
      zone: function (t) {
        e.zone = parseInt(t, 10);
      },
      south: function () {
        e.utmSouth = !0;
      },
      towgs84: function (t) {
        e.datum_params = t.split(',').map(function (t) {
          return parseFloat(t);
        });
      },
      to_meter: function (t) {
        e.to_meter = parseFloat(t);
      },
      units: function (t) {
        e.units = t;
        var s = match(units, t);
        s && (e.to_meter = s.to_meter);
      },
      from_greenwich: function (t) {
        e.from_greenwich = t * D2R$1;
      },
      pm: function (t) {
        var s = match(exports$2, t);
        e.from_greenwich = (s || parseFloat(t)) * D2R$1;
      },
      nadgrids: function (t) {
        '@null' === t ? (e.datumCode = 'none') : (e.nadgrids = t);
      },
      axis: function (t) {
        var s = 'ewnsud';
        3 === t.length &&
          -1 !== s.indexOf(t.substr(0, 1)) &&
          -1 !== s.indexOf(t.substr(1, 1)) &&
          -1 !== s.indexOf(t.substr(2, 1)) &&
          (e.axis = t);
      },
      approx: function () {
        e.approx = !0;
      },
    };
  for (s in h)
    ((i = h[s]), s in r ? ('function' == typeof (a = r[s]) ? a(i) : (e[a] = i)) : (e[s] = i));
  return (
    'string' == typeof e.datumCode &&
      'WGS84' !== e.datumCode &&
      (e.datumCode = e.datumCode.toLowerCase()),
    e
  );
}
var NEUTRAL = 1,
  KEYWORD = 2,
  NUMBER = 3,
  QUOTED = 4,
  AFTERQUOTE = 5,
  ENDED = -1,
  whitespace = /\s/,
  latin = /[A-Za-z]/,
  keyword = /[A-Za-z84_]/,
  endThings = /[,\]]/,
  digets = /[\d\.E\-\+]/;
function Parser(t) {
  if ('string' != typeof t) throw new Error('not a string');
  ((this.text = t.trim()),
    (this.level = 0),
    (this.place = 0),
    (this.root = null),
    (this.stack = []),
    (this.currentObject = null),
    (this.state = NEUTRAL));
}
function parseString(t) {
  return new Parser(t).output();
}
function mapit(t, s, i) {
  Array.isArray(s) && (i.unshift(s), (s = null));
  var a = s ? {} : t,
    e = i.reduce(function (t, s) {
      return (sExpr(s, t), t);
    }, a);
  s && (t[s] = e);
}
function sExpr(t, s) {
  if (Array.isArray(t)) {
    var i = t.shift();
    if (('PARAMETER' === i && (i = t.shift()), 1 === t.length))
      return Array.isArray(t[0]) ? ((s[i] = {}), void sExpr(t[0], s[i])) : void (s[i] = t[0]);
    if (t.length)
      if ('TOWGS84' !== i) {
        if ('AXIS' === i) return (i in s || (s[i] = []), void s[i].push(t));
        var a;
        switch ((Array.isArray(i) || (s[i] = {}), i)) {
          case 'UNIT':
          case 'PRIMEM':
          case 'VERT_DATUM':
            return (
              (s[i] = { name: t[0].toLowerCase(), convert: t[1] }),
              void (3 === t.length && sExpr(t[2], s[i]))
            );
          case 'SPHEROID':
          case 'ELLIPSOID':
            return (
              (s[i] = { name: t[0], a: t[1], rf: t[2] }),
              void (4 === t.length && sExpr(t[3], s[i]))
            );
          case 'PROJECTEDCRS':
          case 'PROJCRS':
          case 'GEOGCS':
          case 'GEOCCS':
          case 'PROJCS':
          case 'LOCAL_CS':
          case 'GEODCRS':
          case 'GEODETICCRS':
          case 'GEODETICDATUM':
          case 'EDATUM':
          case 'ENGINEERINGDATUM':
          case 'VERT_CS':
          case 'VERTCRS':
          case 'VERTICALCRS':
          case 'COMPD_CS':
          case 'COMPOUNDCRS':
          case 'ENGINEERINGCRS':
          case 'ENGCRS':
          case 'FITTED_CS':
          case 'LOCAL_DATUM':
          case 'DATUM':
            return ((t[0] = ['name', t[0]]), void mapit(s, i, t));
          default:
            for (a = -1; ++a < t.length; ) if (!Array.isArray(t[a])) return sExpr(t, s[i]);
            return mapit(s, i, t);
        }
      } else s[i] = t;
    else s[i] = !0;
  } else s[t] = !0;
}
((Parser.prototype.readCharicter = function () {
  var t = this.text[this.place++];
  if (this.state !== QUOTED)
    for (; whitespace.test(t); ) {
      if (this.place >= this.text.length) return;
      t = this.text[this.place++];
    }
  switch (this.state) {
    case NEUTRAL:
      return this.neutral(t);
    case KEYWORD:
      return this.keyword(t);
    case QUOTED:
      return this.quoted(t);
    case AFTERQUOTE:
      return this.afterquote(t);
    case NUMBER:
      return this.number(t);
    case ENDED:
      return;
  }
}),
  (Parser.prototype.afterquote = function (t) {
    if ('"' === t) return ((this.word += '"'), void (this.state = QUOTED));
    if (endThings.test(t)) return ((this.word = this.word.trim()), void this.afterItem(t));
    throw new Error('havn\'t handled "' + t + '" in afterquote yet, index ' + this.place);
  }),
  (Parser.prototype.afterItem = function (t) {
    return ',' === t
      ? (null !== this.word && this.currentObject.push(this.word),
        (this.word = null),
        void (this.state = NEUTRAL))
      : ']' === t
        ? (this.level--,
          null !== this.word && (this.currentObject.push(this.word), (this.word = null)),
          (this.state = NEUTRAL),
          (this.currentObject = this.stack.pop()),
          void (this.currentObject || (this.state = ENDED)))
        : void 0;
  }),
  (Parser.prototype.number = function (t) {
    if (!digets.test(t)) {
      if (endThings.test(t)) return ((this.word = parseFloat(this.word)), void this.afterItem(t));
      throw new Error('havn\'t handled "' + t + '" in number yet, index ' + this.place);
    }
    this.word += t;
  }),
  (Parser.prototype.quoted = function (t) {
    '"' !== t ? (this.word += t) : (this.state = AFTERQUOTE);
  }),
  (Parser.prototype.keyword = function (t) {
    if (keyword.test(t)) this.word += t;
    else {
      if ('[' === t) {
        var s = [];
        return (
          s.push(this.word),
          this.level++,
          null === this.root ? (this.root = s) : this.currentObject.push(s),
          this.stack.push(this.currentObject),
          (this.currentObject = s),
          void (this.state = NEUTRAL)
        );
      }
      if (!endThings.test(t))
        throw new Error('havn\'t handled "' + t + '" in keyword yet, index ' + this.place);
      this.afterItem(t);
    }
  }),
  (Parser.prototype.neutral = function (t) {
    if (latin.test(t)) return ((this.word = t), void (this.state = KEYWORD));
    if ('"' === t) return ((this.word = ''), void (this.state = QUOTED));
    if (digets.test(t)) return ((this.word = t), void (this.state = NUMBER));
    if (!endThings.test(t))
      throw new Error('havn\'t handled "' + t + '" in neutral yet, index ' + this.place);
    this.afterItem(t);
  }),
  (Parser.prototype.output = function () {
    for (; this.place < this.text.length; ) this.readCharicter();
    if (this.state === ENDED) return this.root;
    throw new Error('unable to parse string "' + this.text + '". State is ' + this.state);
  }));
var D2R = 0.017453292519943295;
function rename(t, s) {
  var i = s[0],
    a = s[1];
  !(i in t) && a in t && ((t[i] = t[a]), 3 === s.length && (t[i] = s[2](t[i])));
}
function d2r(t) {
  return t * D2R;
}
function cleanWKT(t) {
  if (
    ('GEOGCS' === t.type
      ? (t.projName = 'longlat')
      : 'LOCAL_CS' === t.type
        ? ((t.projName = 'identity'), (t.local = !0))
        : 'object' == typeof t.PROJECTION
          ? (t.projName = Object.keys(t.PROJECTION)[0])
          : (t.projName = t.PROJECTION),
    t.AXIS)
  ) {
    for (var s = '', i = 0, a = t.AXIS.length; i < a; ++i) {
      var e = [t.AXIS[i][0].toLowerCase(), t.AXIS[i][1].toLowerCase()];
      -1 !== e[0].indexOf('north') || (('y' === e[0] || 'lat' === e[0]) && 'north' === e[1])
        ? (s += 'n')
        : -1 !== e[0].indexOf('south') || (('y' === e[0] || 'lat' === e[0]) && 'south' === e[1])
          ? (s += 's')
          : -1 !== e[0].indexOf('east') || (('x' === e[0] || 'lon' === e[0]) && 'east' === e[1])
            ? (s += 'e')
            : (-1 === e[0].indexOf('west') &&
                (('x' !== e[0] && 'lon' !== e[0]) || 'west' !== e[1])) ||
              (s += 'w');
    }
    (2 === s.length && (s += 'u'), 3 === s.length && (t.axis = s));
  }
  t.UNIT &&
    ((t.units = t.UNIT.name.toLowerCase()),
    'metre' === t.units && (t.units = 'meter'),
    t.UNIT.convert &&
      ('GEOGCS' === t.type
        ? t.DATUM && t.DATUM.SPHEROID && (t.to_meter = t.UNIT.convert * t.DATUM.SPHEROID.a)
        : (t.to_meter = t.UNIT.convert)));
  var h = t.GEOGCS;
  function r(s) {
    return s * (t.to_meter || 1);
  }
  ('GEOGCS' === t.type && (h = t),
    h &&
      (h.DATUM ? (t.datumCode = h.DATUM.name.toLowerCase()) : (t.datumCode = h.name.toLowerCase()),
      'd_' === t.datumCode.slice(0, 2) && (t.datumCode = t.datumCode.slice(2)),
      ('new_zealand_geodetic_datum_1949' !== t.datumCode && 'new_zealand_1949' !== t.datumCode) ||
        (t.datumCode = 'nzgd49'),
      ('wgs_1984' !== t.datumCode && 'world_geodetic_system_1984' !== t.datumCode) ||
        ('Mercator_Auxiliary_Sphere' === t.PROJECTION && (t.sphere = !0), (t.datumCode = 'wgs84')),
      '_ferro' === t.datumCode.slice(-6) && (t.datumCode = t.datumCode.slice(0, -6)),
      '_jakarta' === t.datumCode.slice(-8) && (t.datumCode = t.datumCode.slice(0, -8)),
      ~t.datumCode.indexOf('belge') && (t.datumCode = 'rnb72'),
      h.DATUM &&
        h.DATUM.SPHEROID &&
        ((t.ellps = h.DATUM.SPHEROID.name.replace('_19', '').replace(/[Cc]larke\_18/, 'clrk')),
        'international' === t.ellps.toLowerCase().slice(0, 13) && (t.ellps = 'intl'),
        (t.a = h.DATUM.SPHEROID.a),
        (t.rf = parseFloat(h.DATUM.SPHEROID.rf, 10))),
      h.DATUM && h.DATUM.TOWGS84 && (t.datum_params = h.DATUM.TOWGS84),
      ~t.datumCode.indexOf('osgb_1936') && (t.datumCode = 'osgb36'),
      ~t.datumCode.indexOf('osni_1952') && (t.datumCode = 'osni52'),
      (~t.datumCode.indexOf('tm65') || ~t.datumCode.indexOf('geodetic_datum_of_1965')) &&
        (t.datumCode = 'ire65'),
      'ch1903+' === t.datumCode && (t.datumCode = 'ch1903'),
      ~t.datumCode.indexOf('israel') && (t.datumCode = 'isr93')),
    t.b && !isFinite(t.b) && (t.b = t.a),
    [
      ['standard_parallel_1', 'Standard_Parallel_1'],
      ['standard_parallel_1', 'Latitude of 1st standard parallel'],
      ['standard_parallel_2', 'Standard_Parallel_2'],
      ['standard_parallel_2', 'Latitude of 2nd standard parallel'],
      ['false_easting', 'False_Easting'],
      ['false_easting', 'False easting'],
      ['false-easting', 'Easting at false origin'],
      ['false_northing', 'False_Northing'],
      ['false_northing', 'False northing'],
      ['false_northing', 'Northing at false origin'],
      ['central_meridian', 'Central_Meridian'],
      ['central_meridian', 'Longitude of natural origin'],
      ['central_meridian', 'Longitude of false origin'],
      ['latitude_of_origin', 'Latitude_Of_Origin'],
      ['latitude_of_origin', 'Central_Parallel'],
      ['latitude_of_origin', 'Latitude of natural origin'],
      ['latitude_of_origin', 'Latitude of false origin'],
      ['scale_factor', 'Scale_Factor'],
      ['k0', 'scale_factor'],
      ['latitude_of_center', 'Latitude_Of_Center'],
      ['latitude_of_center', 'Latitude_of_center'],
      ['lat0', 'latitude_of_center', d2r],
      ['longitude_of_center', 'Longitude_Of_Center'],
      ['longitude_of_center', 'Longitude_of_center'],
      ['longc', 'longitude_of_center', d2r],
      ['x0', 'false_easting', r],
      ['y0', 'false_northing', r],
      ['long0', 'central_meridian', d2r],
      ['lat0', 'latitude_of_origin', d2r],
      ['lat0', 'standard_parallel_1', d2r],
      ['lat1', 'standard_parallel_1', d2r],
      ['lat2', 'standard_parallel_2', d2r],
      ['azimuth', 'Azimuth'],
      ['alpha', 'azimuth', d2r],
      ['srsCode', 'name'],
    ].forEach(function (s) {
      return rename(t, s);
    }),
    t.long0 ||
      !t.longc ||
      ('Albers_Conic_Equal_Area' !== t.projName && 'Lambert_Azimuthal_Equal_Area' !== t.projName) ||
      (t.long0 = t.longc),
    t.lat_ts ||
    !t.lat1 ||
    ('Stereographic_South_Pole' !== t.projName && 'Polar Stereographic (variant B)' !== t.projName)
      ? !t.lat_ts &&
        t.lat0 &&
        'Polar_Stereographic' === t.projName &&
        ((t.lat_ts = t.lat0), (t.lat0 = d2r(t.lat0 > 0 ? 90 : -90)))
      : ((t.lat0 = d2r(t.lat1 > 0 ? 90 : -90)), (t.lat_ts = t.lat1)));
}
function wkt(t) {
  var s = parseString(t),
    i = s.shift(),
    a = s.shift();
  (s.unshift(['name', a]), s.unshift(['type', i]));
  var e = {};
  return (sExpr(s, e), cleanWKT(e), e);
}
function defs(t) {
  var s = this;
  if (2 === arguments.length) {
    var i = arguments[1];
    'string' == typeof i
      ? '+' === i.charAt(0)
        ? (defs[t] = projStr(arguments[1]))
        : (defs[t] = wkt(arguments[1]))
      : (defs[t] = i);
  } else if (1 === arguments.length) {
    if (Array.isArray(t))
      return t.map(function (t) {
        Array.isArray(t) ? defs.apply(s, t) : defs(t);
      });
    if ('string' == typeof t) {
      if (t in defs) return defs[t];
    } else
      'EPSG' in t
        ? (defs['EPSG:' + t.EPSG] = t)
        : 'ESRI' in t
          ? (defs['ESRI:' + t.ESRI] = t)
          : 'IAU2000' in t
            ? (defs['IAU2000:' + t.IAU2000] = t)
            : console.log(t);
    return;
  }
}
function testObj(t) {
  return 'string' == typeof t;
}
function testDef(t) {
  return t in defs;
}
globals(defs);
var codeWords = [
  'PROJECTEDCRS',
  'PROJCRS',
  'GEOGCS',
  'GEOCCS',
  'PROJCS',
  'LOCAL_CS',
  'GEODCRS',
  'GEODETICCRS',
  'GEODETICDATUM',
  'ENGCRS',
  'ENGINEERINGCRS',
];
function testWKT(t) {
  return codeWords.some(function (s) {
    return t.indexOf(s) > -1;
  });
}
var codes = ['3857', '900913', '3785', '102113'];
function checkMercator(t) {
  var s = match(t, 'authority');
  if (s) {
    var i = match(s, 'epsg');
    return i && codes.indexOf(i) > -1;
  }
}
function checkProjStr(t) {
  var s = match(t, 'extension');
  if (s) return match(s, 'proj4');
}
function testProj(t) {
  return '+' === t[0];
}
function parse(t) {
  if (!testObj(t)) return t;
  if (testDef(t)) return defs[t];
  if (testWKT(t)) {
    var s = wkt(t);
    if (checkMercator(s)) return defs['EPSG:3857'];
    var i = checkProjStr(s);
    return i ? projStr(i) : s;
  }
  return testProj(t) ? projStr(t) : void 0;
}
function extend(t, s) {
  var i, a;
  if (((t = t || {}), !s)) return t;
  for (a in s) void 0 !== (i = s[a]) && (t[a] = i);
  return t;
}
function msfnz(t, s, i) {
  var a = t * s;
  return i / Math.sqrt(1 - a * a);
}
function sign(t) {
  return t < 0 ? -1 : 1;
}
function adjust_lon(t) {
  return Math.abs(t) <= SPI ? t : t - sign(t) * TWO_PI;
}
function tsfnz(t, s, i) {
  var a = t * i,
    e = 0.5 * t;
  return ((a = Math.pow((1 - a) / (1 + a), e)), Math.tan(0.5 * (HALF_PI - s)) / a);
}
function phi2z(t, s) {
  for (var i, a, e = 0.5 * t, h = HALF_PI - 2 * Math.atan(s), r = 0; r <= 15; r++)
    if (
      ((i = t * Math.sin(h)),
      (h += a = HALF_PI - 2 * Math.atan(s * Math.pow((1 - i) / (1 + i), e)) - h),
      Math.abs(a) <= 1e-10)
    )
      return h;
  return -9999;
}
function init$v() {
  var t = this.b / this.a;
  ((this.es = 1 - t * t),
    'x0' in this || (this.x0 = 0),
    'y0' in this || (this.y0 = 0),
    (this.e = Math.sqrt(this.es)),
    this.lat_ts
      ? this.sphere
        ? (this.k0 = Math.cos(this.lat_ts))
        : (this.k0 = msfnz(this.e, Math.sin(this.lat_ts), Math.cos(this.lat_ts)))
      : this.k0 || (this.k ? (this.k0 = this.k) : (this.k0 = 1)));
}
function forward$u(t) {
  var s,
    i,
    a = t.x,
    e = t.y;
  if (e * R2D > 90 && e * R2D < -90 && a * R2D > 180 && a * R2D < -180) return null;
  if (Math.abs(Math.abs(e) - HALF_PI) <= EPSLN) return null;
  if (this.sphere)
    ((s = this.x0 + this.a * this.k0 * adjust_lon(a - this.long0)),
      (i = this.y0 + this.a * this.k0 * Math.log(Math.tan(FORTPI + 0.5 * e))));
  else {
    var h = Math.sin(e),
      r = tsfnz(this.e, e, h);
    ((s = this.x0 + this.a * this.k0 * adjust_lon(a - this.long0)),
      (i = this.y0 - this.a * this.k0 * Math.log(r)));
  }
  return ((t.x = s), (t.y = i), t);
}
function inverse$u(t) {
  var s,
    i,
    a = t.x - this.x0,
    e = t.y - this.y0;
  if (this.sphere) i = HALF_PI - 2 * Math.atan(Math.exp(-e / (this.a * this.k0)));
  else {
    var h = Math.exp(-e / (this.a * this.k0));
    if (-9999 === (i = phi2z(this.e, h))) return null;
  }
  return ((s = adjust_lon(this.long0 + a / (this.a * this.k0))), (t.x = s), (t.y = i), t);
}
var names$w = [
    'Mercator',
    'Popular Visualisation Pseudo Mercator',
    'Mercator_1SP',
    'Mercator_Auxiliary_Sphere',
    'merc',
  ],
  merc = { init: init$v, forward: forward$u, inverse: inverse$u, names: names$w };
function init$u() {}
function identity(t) {
  return t;
}
var names$v = ['longlat', 'identity'],
  longlat = { init: init$u, forward: identity, inverse: identity, names: names$v },
  projs = [merc, longlat],
  names$u = {},
  projStore = [];
function add(t, s) {
  var i = projStore.length;
  return t.names
    ? ((projStore[i] = t),
      t.names.forEach(function (t) {
        names$u[t.toLowerCase()] = i;
      }),
      this)
    : (console.log(s), !0);
}
function get(t) {
  if (!t) return !1;
  var s = t.toLowerCase();
  return void 0 !== names$u[s] && projStore[names$u[s]] ? projStore[names$u[s]] : void 0;
}
function start() {
  projs.forEach(add);
}
var projections = { start, add, get },
  exports$1 = {
    MERIT: { a: 6378137, rf: 298.257, ellipseName: 'MERIT 1983' },
    SGS85: { a: 6378136, rf: 298.257, ellipseName: 'Soviet Geodetic System 85' },
    GRS80: { a: 6378137, rf: 298.257222101, ellipseName: 'GRS 1980(IUGG, 1980)' },
    IAU76: { a: 6378140, rf: 298.257, ellipseName: 'IAU 1976' },
    airy: { a: 6377563.396, b: 6356256.91, ellipseName: 'Airy 1830' },
    APL4: { a: 6378137, rf: 298.25, ellipseName: 'Appl. Physics. 1965' },
    NWL9D: { a: 6378145, rf: 298.25, ellipseName: 'Naval Weapons Lab., 1965' },
    mod_airy: { a: 6377340.189, b: 6356034.446, ellipseName: 'Modified Airy' },
    andrae: { a: 6377104.43, rf: 300, ellipseName: 'Andrae 1876 (Den., Iclnd.)' },
    aust_SA: { a: 6378160, rf: 298.25, ellipseName: 'Australian Natl & S. Amer. 1969' },
    GRS67: { a: 6378160, rf: 298.247167427, ellipseName: 'GRS 67(IUGG 1967)' },
    bessel: { a: 6377397.155, rf: 299.1528128, ellipseName: 'Bessel 1841' },
    bess_nam: { a: 6377483.865, rf: 299.1528128, ellipseName: 'Bessel 1841 (Namibia)' },
    clrk66: { a: 6378206.4, b: 6356583.8, ellipseName: 'Clarke 1866' },
    clrk80: { a: 6378249.145, rf: 293.4663, ellipseName: 'Clarke 1880 mod.' },
    clrk80ign: { a: 6378249.2, b: 6356515, rf: 293.4660213, ellipseName: 'Clarke 1880 (IGN)' },
    clrk58: { a: 6378293.645208759, rf: 294.2606763692654, ellipseName: 'Clarke 1858' },
    CPM: { a: 6375738.7, rf: 334.29, ellipseName: 'Comm. des Poids et Mesures 1799' },
    delmbr: { a: 6376428, rf: 311.5, ellipseName: 'Delambre 1810 (Belgium)' },
    engelis: { a: 6378136.05, rf: 298.2566, ellipseName: 'Engelis 1985' },
    evrst30: { a: 6377276.345, rf: 300.8017, ellipseName: 'Everest 1830' },
    evrst48: { a: 6377304.063, rf: 300.8017, ellipseName: 'Everest 1948' },
    evrst56: { a: 6377301.243, rf: 300.8017, ellipseName: 'Everest 1956' },
    evrst69: { a: 6377295.664, rf: 300.8017, ellipseName: 'Everest 1969' },
    evrstSS: { a: 6377298.556, rf: 300.8017, ellipseName: 'Everest (Sabah & Sarawak)' },
    fschr60: { a: 6378166, rf: 298.3, ellipseName: 'Fischer (Mercury Datum) 1960' },
    fschr60m: { a: 6378155, rf: 298.3, ellipseName: 'Fischer 1960' },
    fschr68: { a: 6378150, rf: 298.3, ellipseName: 'Fischer 1968' },
    helmert: { a: 6378200, rf: 298.3, ellipseName: 'Helmert 1906' },
    hough: { a: 6378270, rf: 297, ellipseName: 'Hough' },
    intl: { a: 6378388, rf: 297, ellipseName: 'International 1909 (Hayford)' },
    kaula: { a: 6378163, rf: 298.24, ellipseName: 'Kaula 1961' },
    lerch: { a: 6378139, rf: 298.257, ellipseName: 'Lerch 1979' },
    mprts: { a: 6397300, rf: 191, ellipseName: 'Maupertius 1738' },
    new_intl: { a: 6378157.5, b: 6356772.2, ellipseName: 'New International 1967' },
    plessis: { a: 6376523, rf: 6355863, ellipseName: 'Plessis 1817 (France)' },
    krass: { a: 6378245, rf: 298.3, ellipseName: 'Krassovsky, 1942' },
    SEasia: { a: 6378155, b: 6356773.3205, ellipseName: 'Southeast Asia' },
    walbeck: { a: 6376896, b: 6355834.8467, ellipseName: 'Walbeck' },
    WGS60: { a: 6378165, rf: 298.3, ellipseName: 'WGS 60' },
    WGS66: { a: 6378145, rf: 298.25, ellipseName: 'WGS 66' },
    WGS7: { a: 6378135, rf: 298.26, ellipseName: 'WGS 72' },
  },
  WGS84 = (exports$1.WGS84 = { a: 6378137, rf: 298.257223563, ellipseName: 'WGS 84' });
function eccentricity(t, s, i, a) {
  var e = t * t,
    h = s * s,
    r = (e - h) / e,
    n = 0;
  return (
    a ? ((e = (t *= 1 - r * (SIXTH + r * (RA4 + r * RA6))) * t), (r = 0)) : (n = Math.sqrt(r)),
    { es: r, e: n, ep2: (e - h) / h }
  );
}
function sphere(t, s, i, a, e) {
  if (!t) {
    var h = match(exports$1, a);
    (h || (h = WGS84), (t = h.a), (s = h.b), (i = h.rf));
  }
  return (
    i && !s && (s = (1 - 1 / i) * t),
    (0 === i || Math.abs(t - s) < EPSLN) && ((e = !0), (s = t)),
    { a: t, b: s, rf: i, sphere: e }
  );
}
exports$1.sphere = { a: 6370997, b: 6370997, ellipseName: 'Normal Sphere (r=6370997)' };
var exports = {};
function datum(t, s, i, a, e, h, r) {
  var n = {};
  return (
    (n.datum_type = void 0 === t || 'none' === t ? PJD_NODATUM : PJD_WGS84),
    s &&
      ((n.datum_params = s.map(parseFloat)),
      (0 === n.datum_params[0] && 0 === n.datum_params[1] && 0 === n.datum_params[2]) ||
        (n.datum_type = PJD_3PARAM),
      n.datum_params.length > 3 &&
        ((0 === n.datum_params[3] &&
          0 === n.datum_params[4] &&
          0 === n.datum_params[5] &&
          0 === n.datum_params[6]) ||
          ((n.datum_type = PJD_7PARAM),
          (n.datum_params[3] *= SEC_TO_RAD),
          (n.datum_params[4] *= SEC_TO_RAD),
          (n.datum_params[5] *= SEC_TO_RAD),
          (n.datum_params[6] = n.datum_params[6] / 1e6 + 1)))),
    r && ((n.datum_type = PJD_GRIDSHIFT), (n.grids = r)),
    (n.a = i),
    (n.b = a),
    (n.es = e),
    (n.ep2 = h),
    n
  );
}
((exports.wgs84 = { towgs84: '0,0,0', ellipse: 'WGS84', datumName: 'WGS84' }),
  (exports.ch1903 = { towgs84: '674.374,15.056,405.346', ellipse: 'bessel', datumName: 'swiss' }),
  (exports.ggrs87 = {
    towgs84: '-199.87,74.79,246.62',
    ellipse: 'GRS80',
    datumName: 'Greek_Geodetic_Reference_System_1987',
  }),
  (exports.nad83 = { towgs84: '0,0,0', ellipse: 'GRS80', datumName: 'North_American_Datum_1983' }),
  (exports.nad27 = {
    nadgrids: '@conus,@alaska,@ntv2_0.gsb,@ntv1_can.dat',
    ellipse: 'clrk66',
    datumName: 'North_American_Datum_1927',
  }),
  (exports.potsdam = {
    towgs84: '598.1,73.7,418.2,0.202,0.045,-2.455,6.7',
    ellipse: 'bessel',
    datumName: 'Potsdam Rauenberg 1950 DHDN',
  }),
  (exports.carthage = {
    towgs84: '-263.0,6.0,431.0',
    ellipse: 'clark80',
    datumName: 'Carthage 1934 Tunisia',
  }),
  (exports.hermannskogel = {
    towgs84: '577.326,90.129,463.919,5.137,1.474,5.297,2.4232',
    ellipse: 'bessel',
    datumName: 'Hermannskogel',
  }),
  (exports.militargeographische_institut = {
    towgs84: '577.326,90.129,463.919,5.137,1.474,5.297,2.4232',
    ellipse: 'bessel',
    datumName: 'Militar-Geographische Institut',
  }),
  (exports.osni52 = {
    towgs84: '482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15',
    ellipse: 'airy',
    datumName: 'Irish National',
  }),
  (exports.ire65 = {
    towgs84: '482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15',
    ellipse: 'mod_airy',
    datumName: 'Ireland 1965',
  }),
  (exports.rassadiran = {
    towgs84: '-133.63,-157.5,-158.62',
    ellipse: 'intl',
    datumName: 'Rassadiran',
  }),
  (exports.nzgd49 = {
    towgs84: '59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993',
    ellipse: 'intl',
    datumName: 'New Zealand Geodetic Datum 1949',
  }),
  (exports.osgb36 = {
    towgs84: '446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894',
    ellipse: 'airy',
    datumName: 'Airy 1830',
  }),
  (exports.s_jtsk = { towgs84: '589,76,480', ellipse: 'bessel', datumName: 'S-JTSK (Ferro)' }),
  (exports.beduaram = { towgs84: '-106,-87,188', ellipse: 'clrk80', datumName: 'Beduaram' }),
  (exports.gunung_segara = {
    towgs84: '-403,684,41',
    ellipse: 'bessel',
    datumName: 'Gunung Segara Jakarta',
  }),
  (exports.rnb72 = {
    towgs84: '106.869,-52.2978,103.724,-0.33657,0.456955,-1.84218,1',
    ellipse: 'intl',
    datumName: 'Reseau National Belge 1972',
  }));
var loadedNadgrids = {};
function nadgrid(t, s) {
  var i = new DataView(s),
    a = detectLittleEndian(i),
    e = readHeader(i, a),
    h = { header: e, subgrids: readSubgrids(i, e, a) };
  return ((loadedNadgrids[t] = h), h);
}
function getNadgrids(t) {
  return void 0 === t ? null : t.split(',').map(parseNadgridString);
}
function parseNadgridString(t) {
  if (0 === t.length) return null;
  var s = '@' === t[0];
  return (
    s && (t = t.slice(1)),
    'null' === t
      ? { name: 'null', mandatory: !s, grid: null, isNull: !0 }
      : { name: t, mandatory: !s, grid: loadedNadgrids[t] || null, isNull: !1 }
  );
}
function secondsToRadians(t) {
  return ((t / 3600) * Math.PI) / 180;
}
function detectLittleEndian(t) {
  var s = t.getInt32(8, !1);
  return (
    11 !== s &&
    (11 !== (s = t.getInt32(8, !0)) &&
      console.warn('Failed to detect nadgrid endian-ness, defaulting to little-endian'),
    !0)
  );
}
function readHeader(t, s) {
  return {
    nFields: t.getInt32(8, s),
    nSubgridFields: t.getInt32(24, s),
    nSubgrids: t.getInt32(40, s),
    shiftType: decodeString(t, 56, 64).trim(),
    fromSemiMajorAxis: t.getFloat64(120, s),
    fromSemiMinorAxis: t.getFloat64(136, s),
    toSemiMajorAxis: t.getFloat64(152, s),
    toSemiMinorAxis: t.getFloat64(168, s),
  };
}
function decodeString(t, s, i) {
  return String.fromCharCode.apply(null, new Uint8Array(t.buffer.slice(s, i)));
}
function readSubgrids(t, s, i) {
  for (var a = 176, e = [], h = 0; h < s.nSubgrids; h++) {
    var r = readGridHeader(t, a, i),
      n = readGridNodes(t, a, r, i),
      o = Math.round(1 + (r.upperLongitude - r.lowerLongitude) / r.longitudeInterval),
      l = Math.round(1 + (r.upperLatitude - r.lowerLatitude) / r.latitudeInterval);
    (e.push({
      ll: [secondsToRadians(r.lowerLongitude), secondsToRadians(r.lowerLatitude)],
      del: [secondsToRadians(r.longitudeInterval), secondsToRadians(r.latitudeInterval)],
      lim: [o, l],
      count: r.gridNodeCount,
      cvs: mapNodes(n),
    }),
      (a += 176 + 16 * r.gridNodeCount));
  }
  return e;
}
function mapNodes(t) {
  return t.map(function (t) {
    return [secondsToRadians(t.longitudeShift), secondsToRadians(t.latitudeShift)];
  });
}
function readGridHeader(t, s, i) {
  return {
    name: decodeString(t, s + 8, s + 16).trim(),
    parent: decodeString(t, s + 24, s + 24 + 8).trim(),
    lowerLatitude: t.getFloat64(s + 72, i),
    upperLatitude: t.getFloat64(s + 88, i),
    lowerLongitude: t.getFloat64(s + 104, i),
    upperLongitude: t.getFloat64(s + 120, i),
    latitudeInterval: t.getFloat64(s + 136, i),
    longitudeInterval: t.getFloat64(s + 152, i),
    gridNodeCount: t.getInt32(s + 168, i),
  };
}
function readGridNodes(t, s, i, a) {
  for (var e = s + 176, h = [], r = 0; r < i.gridNodeCount; r++) {
    var n = {
      latitudeShift: t.getFloat32(e + 16 * r, a),
      longitudeShift: t.getFloat32(e + 16 * r + 4, a),
      latitudeAccuracy: t.getFloat32(e + 16 * r + 8, a),
      longitudeAccuracy: t.getFloat32(e + 16 * r + 12, a),
    };
    h.push(n);
  }
  return h;
}
function Projection(t, s) {
  if (!(this instanceof Projection)) return new Projection(t);
  s =
    s ||
    function (t) {
      if (t) throw t;
    };
  var i = parse(t);
  if ('object' == typeof i) {
    var a = Projection.projections.get(i.projName);
    if (a) {
      if (i.datumCode && 'none' !== i.datumCode) {
        var e = match(exports, i.datumCode);
        e &&
          ((i.datum_params = i.datum_params || (e.towgs84 ? e.towgs84.split(',') : null)),
          (i.ellps = e.ellipse),
          (i.datumName = e.datumName ? e.datumName : i.datumCode));
      }
      ((i.k0 = i.k0 || 1),
        (i.axis = i.axis || 'enu'),
        (i.ellps = i.ellps || 'wgs84'),
        (i.lat1 = i.lat1 || i.lat0));
      var h = sphere(i.a, i.b, i.rf, i.ellps, i.sphere),
        r = eccentricity(h.a, h.b, h.rf, i.R_A),
        n = getNadgrids(i.nadgrids),
        o = i.datum || datum(i.datumCode, i.datum_params, h.a, h.b, r.es, r.ep2, n);
      (extend(this, i),
        extend(this, a),
        (this.a = h.a),
        (this.b = h.b),
        (this.rf = h.rf),
        (this.sphere = h.sphere),
        (this.es = r.es),
        (this.e = r.e),
        (this.ep2 = r.ep2),
        (this.datum = o),
        this.init(),
        s(null, this));
    } else s(t);
  } else s(t);
}
function compareDatums(t, s) {
  return (
    t.datum_type === s.datum_type &&
    !(t.a !== s.a || Math.abs(t.es - s.es) > 5e-11) &&
    (t.datum_type === PJD_3PARAM
      ? t.datum_params[0] === s.datum_params[0] &&
        t.datum_params[1] === s.datum_params[1] &&
        t.datum_params[2] === s.datum_params[2]
      : t.datum_type !== PJD_7PARAM ||
        (t.datum_params[0] === s.datum_params[0] &&
          t.datum_params[1] === s.datum_params[1] &&
          t.datum_params[2] === s.datum_params[2] &&
          t.datum_params[3] === s.datum_params[3] &&
          t.datum_params[4] === s.datum_params[4] &&
          t.datum_params[5] === s.datum_params[5] &&
          t.datum_params[6] === s.datum_params[6]))
  );
}
function geodeticToGeocentric(t, s, i) {
  var a,
    e,
    h,
    r,
    n = t.x,
    o = t.y,
    l = t.z ? t.z : 0;
  if (o < -HALF_PI && o > -1.001 * HALF_PI) o = -HALF_PI;
  else if (o > HALF_PI && o < 1.001 * HALF_PI) o = HALF_PI;
  else {
    if (o < -HALF_PI) return { x: -1 / 0, y: -1 / 0, z: t.z };
    if (o > HALF_PI) return { x: 1 / 0, y: 1 / 0, z: t.z };
  }
  return (
    n > Math.PI && (n -= 2 * Math.PI),
    (e = Math.sin(o)),
    (r = Math.cos(o)),
    (h = e * e),
    {
      x: ((a = i / Math.sqrt(1 - s * h)) + l) * r * Math.cos(n),
      y: (a + l) * r * Math.sin(n),
      z: (a * (1 - s) + l) * e,
    }
  );
}
function geocentricToGeodetic(t, s, i, a) {
  var e,
    h,
    r,
    n,
    o,
    l,
    c,
    u,
    f,
    d,
    M,
    p,
    _,
    m,
    y,
    g = t.x,
    x = t.y,
    v = t.z ? t.z : 0;
  if (((e = Math.sqrt(g * g + x * x)), (h = Math.sqrt(g * g + x * x + v * v)), e / i < 1e-12)) {
    if (((m = 0), h / i < 1e-12)) return ((y = -a), { x: t.x, y: t.y, z: t.z });
  } else m = Math.atan2(x, g);
  ((r = v / h),
    (u = (n = e / h) * (1 - s) * (o = 1 / Math.sqrt(1 - s * (2 - s) * n * n))),
    (f = r * o),
    (_ = 0));
  do {
    (_++,
      (l =
        (s * (c = i / Math.sqrt(1 - s * f * f))) / (c + (y = e * u + v * f - c * (1 - s * f * f)))),
      (p = (M = r * (o = 1 / Math.sqrt(1 - l * (2 - l) * n * n))) * u - (d = n * (1 - l) * o) * f),
      (u = d),
      (f = M));
  } while (p * p > 1e-24 && _ < 30);
  return { x: m, y: Math.atan(M / Math.abs(d)), z: y };
}
function geocentricToWgs84(t, s, i) {
  if (s === PJD_3PARAM) return { x: t.x + i[0], y: t.y + i[1], z: t.z + i[2] };
  if (s === PJD_7PARAM) {
    var a = i[0],
      e = i[1],
      h = i[2],
      r = i[3],
      n = i[4],
      o = i[5],
      l = i[6];
    return {
      x: l * (t.x - o * t.y + n * t.z) + a,
      y: l * (o * t.x + t.y - r * t.z) + e,
      z: l * (-n * t.x + r * t.y + t.z) + h,
    };
  }
}
function geocentricFromWgs84(t, s, i) {
  if (s === PJD_3PARAM) return { x: t.x - i[0], y: t.y - i[1], z: t.z - i[2] };
  if (s === PJD_7PARAM) {
    var a = i[0],
      e = i[1],
      h = i[2],
      r = i[3],
      n = i[4],
      o = i[5],
      l = i[6],
      c = (t.x - a) / l,
      u = (t.y - e) / l,
      f = (t.z - h) / l;
    return { x: c + o * u - n * f, y: -o * c + u + r * f, z: n * c - r * u + f };
  }
}
function checkParams(t) {
  return t === PJD_3PARAM || t === PJD_7PARAM;
}
function datum_transform(t, s, i) {
  if (compareDatums(t, s)) return i;
  if (t.datum_type === PJD_NODATUM || s.datum_type === PJD_NODATUM) return i;
  var a = t.a,
    e = t.es;
  if (t.datum_type === PJD_GRIDSHIFT) {
    if (0 !== applyGridShift(t, !1, i)) return;
    ((a = SRS_WGS84_SEMIMAJOR), (e = SRS_WGS84_ESQUARED));
  }
  var h = s.a,
    r = s.b,
    n = s.es;
  return (
    s.datum_type === PJD_GRIDSHIFT &&
      ((h = SRS_WGS84_SEMIMAJOR), (r = SRS_WGS84_SEMIMINOR), (n = SRS_WGS84_ESQUARED)),
    e !== n || a !== h || checkParams(t.datum_type) || checkParams(s.datum_type)
      ? ((i = geodeticToGeocentric(i, e, a)),
        checkParams(t.datum_type) && (i = geocentricToWgs84(i, t.datum_type, t.datum_params)),
        checkParams(s.datum_type) && (i = geocentricFromWgs84(i, s.datum_type, s.datum_params)),
        (i = geocentricToGeodetic(i, n, h, r)),
        s.datum_type !== PJD_GRIDSHIFT || 0 === applyGridShift(s, !0, i) ? i : void 0)
      : i
  );
}
function applyGridShift(t, s, i) {
  if (null === t.grids || 0 === t.grids.length)
    return (console.log('Grid shift grids not found'), -1);
  var a = { x: -i.x, y: i.y },
    e = { x: Number.NaN, y: Number.NaN },
    h = [];
  t: for (var r = 0; r < t.grids.length; r++) {
    var n = t.grids[r];
    if ((h.push(n.name), n.isNull)) {
      e = a;
      break;
    }
    if ((n.mandatory, null !== n.grid))
      for (var o = n.grid.subgrids, l = 0, c = o.length; l < c; l++) {
        var u = o[l],
          f = (Math.abs(u.del[1]) + Math.abs(u.del[0])) / 1e4,
          d = u.ll[0] - f,
          M = u.ll[1] - f,
          p = u.ll[0] + (u.lim[0] - 1) * u.del[0] + f,
          _ = u.ll[1] + (u.lim[1] - 1) * u.del[1] + f;
        if (
          !(
            M > a.y ||
            d > a.x ||
            _ < a.y ||
            p < a.x ||
            ((e = applySubgridShift(a, s, u)), isNaN(e.x))
          )
        )
          break t;
      }
    else if (n.mandatory)
      return (console.log("Unable to find mandatory grid '" + n.name + "'"), -1);
  }
  return isNaN(e.x)
    ? (console.log(
        "Failed to find a grid shift table for location '" +
          -a.x * R2D +
          ' ' +
          a.y * R2D +
          " tried: '" +
          h +
          "'"
      ),
      -1)
    : ((i.x = -e.x), (i.y = e.y), 0);
}
function applySubgridShift(t, s, i) {
  var a = { x: Number.NaN, y: Number.NaN };
  if (isNaN(t.x)) return a;
  var e = { x: t.x, y: t.y };
  ((e.x -= i.ll[0]), (e.y -= i.ll[1]), (e.x = adjust_lon(e.x - Math.PI) + Math.PI));
  var h = nadInterpolate(e, i);
  if (s) {
    if (isNaN(h.x)) return a;
    ((h.x = e.x - h.x), (h.y = e.y - h.y));
    var r,
      n,
      o = 9;
    do {
      if (((n = nadInterpolate(h, i)), isNaN(n.x))) {
        console.log(
          'Inverse grid shift iteration failed, presumably at grid edge.  Using first approximation.'
        );
        break;
      }
      ((r = { x: e.x - (n.x + h.x), y: e.y - (n.y + h.y) }), (h.x += r.x), (h.y += r.y));
    } while (o-- && Math.abs(r.x) > 1e-12 && Math.abs(r.y) > 1e-12);
    if (o < 0) return (console.log('Inverse grid shift iterator failed to converge.'), a);
    ((a.x = adjust_lon(h.x + i.ll[0])), (a.y = h.y + i.ll[1]));
  } else isNaN(h.x) || ((a.x = t.x + h.x), (a.y = t.y + h.y));
  return a;
}
function nadInterpolate(t, s) {
  var i,
    a = { x: t.x / s.del[0], y: t.y / s.del[1] },
    e = Math.floor(a.x),
    h = Math.floor(a.y),
    r = a.x - 1 * e,
    n = a.y - 1 * h,
    o = { x: Number.NaN, y: Number.NaN };
  if (e < 0 || e >= s.lim[0]) return o;
  if (h < 0 || h >= s.lim[1]) return o;
  i = h * s.lim[0] + e;
  var l = s.cvs[i][0],
    c = s.cvs[i][1];
  i++;
  var u = s.cvs[i][0],
    f = s.cvs[i][1];
  i += s.lim[0];
  var d = s.cvs[i][0],
    M = s.cvs[i][1];
  i--;
  var p = s.cvs[i][0],
    _ = s.cvs[i][1],
    m = r * n,
    y = r * (1 - n),
    g = (1 - r) * (1 - n),
    x = (1 - r) * n;
  return ((o.x = g * l + y * u + x * p + m * d), (o.y = g * c + y * f + x * _ + m * M), o);
}
function adjust_axis(t, s, i) {
  var a,
    e,
    h,
    r = i.x,
    n = i.y,
    o = i.z || 0,
    l = {};
  for (h = 0; h < 3; h++)
    if (!s || 2 !== h || void 0 !== i.z)
      switch (
        (0 === h
          ? ((a = r), (e = -1 !== 'ew'.indexOf(t.axis[h]) ? 'x' : 'y'))
          : 1 === h
            ? ((a = n), (e = -1 !== 'ns'.indexOf(t.axis[h]) ? 'y' : 'x'))
            : ((a = o), (e = 'z')),
        t.axis[h])
      ) {
        case 'e':
        case 'n':
          l[e] = a;
          break;
        case 'w':
        case 's':
          l[e] = -a;
          break;
        case 'u':
          void 0 !== i[e] && (l.z = a);
          break;
        case 'd':
          void 0 !== i[e] && (l.z = -a);
          break;
        default:
          return null;
      }
  return l;
}
function common(t) {
  var s = { x: t[0], y: t[1] };
  return (t.length > 2 && (s.z = t[2]), t.length > 3 && (s.m = t[3]), s);
}
function checkSanity(t) {
  (checkCoord(t.x), checkCoord(t.y));
}
function checkCoord(t) {
  if ('function' == typeof Number.isFinite) {
    if (Number.isFinite(t)) return;
    throw new TypeError('coordinates must be finite numbers');
  }
  if ('number' != typeof t || t != t || !isFinite(t))
    throw new TypeError('coordinates must be finite numbers');
}
function checkNotWGS(t, s) {
  return (
    ((t.datum.datum_type === PJD_3PARAM ||
      t.datum.datum_type === PJD_7PARAM ||
      t.datum.datum_type === PJD_GRIDSHIFT) &&
      'WGS84' !== s.datumCode) ||
    ((s.datum.datum_type === PJD_3PARAM ||
      s.datum.datum_type === PJD_7PARAM ||
      s.datum.datum_type === PJD_GRIDSHIFT) &&
      'WGS84' !== t.datumCode)
  );
}
function transform(t, s, i, a) {
  var e,
    h = void 0 !== (i = Array.isArray(i) ? common(i) : { x: i.x, y: i.y, z: i.z, m: i.m }).z;
  if (
    (checkSanity(i),
    t.datum &&
      s.datum &&
      checkNotWGS(t, s) &&
      ((i = transform(t, (e = new Projection('WGS84')), i, a)), (t = e)),
    a && 'enu' !== t.axis && (i = adjust_axis(t, !1, i)),
    'longlat' === t.projName)
  )
    i = { x: i.x * D2R$1, y: i.y * D2R$1, z: i.z || 0 };
  else if (
    (t.to_meter && (i = { x: i.x * t.to_meter, y: i.y * t.to_meter, z: i.z || 0 }),
    !(i = t.inverse(i)))
  )
    return;
  if ((t.from_greenwich && (i.x += t.from_greenwich), (i = datum_transform(t.datum, s.datum, i))))
    return (
      s.from_greenwich && (i = { x: i.x - s.from_greenwich, y: i.y, z: i.z || 0 }),
      'longlat' === s.projName
        ? (i = { x: i.x * R2D, y: i.y * R2D, z: i.z || 0 })
        : ((i = s.forward(i)),
          s.to_meter && (i = { x: i.x / s.to_meter, y: i.y / s.to_meter, z: i.z || 0 })),
      a && 'enu' !== s.axis ? adjust_axis(s, !0, i) : (i && !h && delete i.z, i)
    );
}
((Projection.projections = projections), Projection.projections.start());
var wgs84 = Projection('WGS84');
function transformer(t, s, i, a) {
  var e, h, r;
  return Array.isArray(i)
    ? ((e = transform(t, s, i, a) || { x: NaN, y: NaN }),
      i.length > 2
        ? (void 0 !== t.name && 'geocent' === t.name) || (void 0 !== s.name && 'geocent' === s.name)
          ? 'number' == typeof e.z
            ? [e.x, e.y, e.z].concat(i.splice(3))
            : [e.x, e.y, i[2]].concat(i.splice(3))
          : [e.x, e.y].concat(i.splice(2))
        : [e.x, e.y])
    : ((h = transform(t, s, i, a)),
      2 === (r = Object.keys(i)).length ||
        r.forEach(function (a) {
          if (
            (void 0 !== t.name && 'geocent' === t.name) ||
            (void 0 !== s.name && 'geocent' === s.name)
          ) {
            if ('x' === a || 'y' === a || 'z' === a) return;
          } else if ('x' === a || 'y' === a) return;
          h[a] = i[a];
        }),
      h);
}
function checkProj(t) {
  return t instanceof Projection ? t : t.oProj ? t.oProj : Projection(t);
}
function proj4(t, s, i) {
  t = checkProj(t);
  var a,
    e = !1;
  return (
    void 0 === s
      ? ((s = t), (t = wgs84), (e = !0))
      : (void 0 !== s.x || Array.isArray(s)) && ((i = s), (s = t), (t = wgs84), (e = !0)),
    (s = checkProj(s)),
    i
      ? transformer(t, s, i)
      : ((a = {
          forward: function (i, a) {
            return transformer(t, s, i, a);
          },
          inverse: function (i, a) {
            return transformer(s, t, i, a);
          },
        }),
        e && (a.oProj = s),
        a)
  );
}
var NUM_100K_SETS = 6,
  SET_ORIGIN_COLUMN_LETTERS = 'AJSAJS',
  SET_ORIGIN_ROW_LETTERS = 'AFAFAF',
  A$1 = 65,
  I = 73,
  O = 79,
  V = 86,
  Z = 90,
  mgrs = { forward: forward$t, inverse: inverse$t, toPoint };
function forward$t(t, s) {
  return ((s = s || 5), encode(LLtoUTM({ lat: t[1], lon: t[0] }), s));
}
function inverse$t(t) {
  var s = UTMtoLL(decode(t.toUpperCase()));
  return s.lat && s.lon ? [s.lon, s.lat, s.lon, s.lat] : [s.left, s.bottom, s.right, s.top];
}
function toPoint(t) {
  var s = UTMtoLL(decode(t.toUpperCase()));
  return s.lat && s.lon ? [s.lon, s.lat] : [(s.left + s.right) / 2, (s.top + s.bottom) / 2];
}
function degToRad(t) {
  return t * (Math.PI / 180);
}
function radToDeg(t) {
  return (t / Math.PI) * 180;
}
function LLtoUTM(t) {
  var s,
    i,
    a,
    e,
    h,
    r,
    n,
    o = t.lat,
    l = t.lon,
    c = 6378137,
    u = 0.9996,
    f = degToRad(o),
    d = degToRad(l);
  ((n = Math.floor((l + 180) / 6) + 1),
    180 === l && (n = 60),
    o >= 56 && o < 64 && l >= 3 && l < 12 && (n = 32),
    o >= 72 &&
      o < 84 &&
      (l >= 0 && l < 9
        ? (n = 31)
        : l >= 9 && l < 21
          ? (n = 33)
          : l >= 21 && l < 33
            ? (n = 35)
            : l >= 33 && l < 42 && (n = 37)),
    (r = degToRad(6 * (n - 1) - 180 + 3)),
    (s = 0.006739496752268451),
    (i = c / Math.sqrt(1 - 0.00669438 * Math.sin(f) * Math.sin(f))),
    (a = Math.tan(f) * Math.tan(f)),
    (e = s * Math.cos(f) * Math.cos(f)));
  var M =
      u *
        i *
        ((h = Math.cos(f) * (d - r)) +
          ((1 - a + e) * h * h * h) / 6 +
          ((5 - 18 * a + a * a + 72 * e - 58 * s) * h * h * h * h * h) / 120) +
      5e5,
    p =
      u *
      (c *
        (0.9983242984503243 * f -
          0.002514607064228144 * Math.sin(2 * f) +
          2639046602129982e-21 * Math.sin(4 * f) -
          3.418046101696858e-9 * Math.sin(6 * f)) +
        i *
          Math.tan(f) *
          ((h * h) / 2 +
            ((5 - a + 9 * e + 4 * e * e) * h * h * h * h) / 24 +
            ((61 - 58 * a + a * a + 600 * e - 2.2240339282485886) * h * h * h * h * h * h) / 720));
  return (
    o < 0 && (p += 1e7),
    {
      northing: Math.round(p),
      easting: Math.round(M),
      zoneNumber: n,
      zoneLetter: getLetterDesignator(o),
    }
  );
}
function UTMtoLL(t) {
  var s = t.northing,
    i = t.easting,
    a = t.zoneLetter,
    e = t.zoneNumber;
  if (e < 0 || e > 60) return null;
  var h,
    r,
    n,
    o,
    l,
    c,
    u,
    f,
    d,
    M = 0.9996,
    p = 6378137,
    _ = 0.00669438,
    m = (1 - Math.sqrt(0.99330562)) / (1 + Math.sqrt(0.99330562)),
    y = i - 5e5,
    g = s;
  (a < 'N' && (g -= 1e7),
    (u = 6 * (e - 1) - 180 + 3),
    (h = 0.006739496752268451),
    (d =
      (f = g / M / 6367449.145945056) +
      ((3 * m) / 2 - (27 * m * m * m) / 32) * Math.sin(2 * f) +
      ((21 * m * m) / 16 - (55 * m * m * m * m) / 32) * Math.sin(4 * f) +
      ((151 * m * m * m) / 96) * Math.sin(6 * f)),
    (r = p / Math.sqrt(1 - _ * Math.sin(d) * Math.sin(d))),
    (n = Math.tan(d) * Math.tan(d)),
    (o = h * Math.cos(d) * Math.cos(d)),
    (l = (0.99330562 * p) / Math.pow(1 - _ * Math.sin(d) * Math.sin(d), 1.5)),
    (c = y / (r * M)));
  var x =
    d -
    ((r * Math.tan(d)) / l) *
      ((c * c) / 2 -
        ((5 + 3 * n + 10 * o - 4 * o * o - 9 * h) * c * c * c * c) / 24 +
        ((61 + 90 * n + 298 * o + 45 * n * n - 1.6983531815716497 - 3 * o * o) *
          c *
          c *
          c *
          c *
          c *
          c) /
          720);
  x = radToDeg(x);
  var v,
    P =
      (c -
        ((1 + 2 * n + o) * c * c * c) / 6 +
        ((5 - 2 * o + 28 * n - 3 * o * o + 8 * h + 24 * n * n) * c * c * c * c * c) / 120) /
      Math.cos(d);
  if (((P = u + radToDeg(P)), t.accuracy)) {
    var E = UTMtoLL({
      northing: t.northing + t.accuracy,
      easting: t.easting + t.accuracy,
      zoneLetter: t.zoneLetter,
      zoneNumber: t.zoneNumber,
    });
    v = { top: E.lat, right: E.lon, bottom: x, left: P };
  } else v = { lat: x, lon: P };
  return v;
}
function getLetterDesignator(t) {
  var s = 'Z';
  return (
    84 >= t && t >= 72
      ? (s = 'X')
      : 72 > t && t >= 64
        ? (s = 'W')
        : 64 > t && t >= 56
          ? (s = 'V')
          : 56 > t && t >= 48
            ? (s = 'U')
            : 48 > t && t >= 40
              ? (s = 'T')
              : 40 > t && t >= 32
                ? (s = 'S')
                : 32 > t && t >= 24
                  ? (s = 'R')
                  : 24 > t && t >= 16
                    ? (s = 'Q')
                    : 16 > t && t >= 8
                      ? (s = 'P')
                      : 8 > t && t >= 0
                        ? (s = 'N')
                        : 0 > t && t >= -8
                          ? (s = 'M')
                          : -8 > t && t >= -16
                            ? (s = 'L')
                            : -16 > t && t >= -24
                              ? (s = 'K')
                              : -24 > t && t >= -32
                                ? (s = 'J')
                                : -32 > t && t >= -40
                                  ? (s = 'H')
                                  : -40 > t && t >= -48
                                    ? (s = 'G')
                                    : -48 > t && t >= -56
                                      ? (s = 'F')
                                      : -56 > t && t >= -64
                                        ? (s = 'E')
                                        : -64 > t && t >= -72
                                          ? (s = 'D')
                                          : -72 > t && t >= -80 && (s = 'C'),
    s
  );
}
function encode(t, s) {
  var i = '00000' + t.easting,
    a = '00000' + t.northing;
  return (
    t.zoneNumber +
    t.zoneLetter +
    get100kID(t.easting, t.northing, t.zoneNumber) +
    i.substr(i.length - 5, s) +
    a.substr(a.length - 5, s)
  );
}
function get100kID(t, s, i) {
  var a = get100kSetForZone(i);
  return getLetter100kID(Math.floor(t / 1e5), Math.floor(s / 1e5) % 20, a);
}
function get100kSetForZone(t) {
  var s = t % NUM_100K_SETS;
  return (0 === s && (s = NUM_100K_SETS), s);
}
function getLetter100kID(t, s, i) {
  var a = i - 1,
    e = SET_ORIGIN_COLUMN_LETTERS.charCodeAt(a),
    h = SET_ORIGIN_ROW_LETTERS.charCodeAt(a),
    r = e + t - 1,
    n = h + s,
    o = !1;
  return (
    r > Z && ((r = r - Z + A$1 - 1), (o = !0)),
    (r === I || (e < I && r > I) || ((r > I || e < I) && o)) && r++,
    (r === O || (e < O && r > O) || ((r > O || e < O) && o)) && ++r === I && r++,
    r > Z && (r = r - Z + A$1 - 1),
    n > V ? ((n = n - V + A$1 - 1), (o = !0)) : (o = !1),
    (n === I || (h < I && n > I) || ((n > I || h < I) && o)) && n++,
    (n === O || (h < O && n > O) || ((n > O || h < O) && o)) && ++n === I && n++,
    n > V && (n = n - V + A$1 - 1),
    String.fromCharCode(r) + String.fromCharCode(n)
  );
}
function decode(t) {
  if (t && 0 === t.length) throw 'MGRSPoint coverting from nothing';
  for (var s, i = t.length, a = null, e = '', h = 0; !/[A-Z]/.test((s = t.charAt(h))); ) {
    if (h >= 2) throw 'MGRSPoint bad conversion from: ' + t;
    ((e += s), h++);
  }
  var r = parseInt(e, 10);
  if (0 === h || h + 3 > i) throw 'MGRSPoint bad conversion from: ' + t;
  var n = t.charAt(h++);
  if (n <= 'A' || 'B' === n || 'Y' === n || n >= 'Z' || 'I' === n || 'O' === n)
    throw 'MGRSPoint zone letter ' + n + ' not handled: ' + t;
  a = t.substring(h, (h += 2));
  for (
    var o = get100kSetForZone(r),
      l = getEastingFromChar(a.charAt(0), o),
      c = getNorthingFromChar(a.charAt(1), o);
    c < getMinNorthing(n);
  )
    c += 2e6;
  var u = i - h;
  if (u % 2 != 0)
    throw (
      'MGRSPoint has to have an even number \nof digits after the zone letter and two 100km letters - front \nhalf for easting meters, second half for \nnorthing meters' +
      t
    );
  var f,
    d,
    M,
    p = u / 2,
    _ = 0,
    m = 0;
  return (
    p > 0 &&
      ((f = 1e5 / Math.pow(10, p)),
      (d = t.substring(h, h + p)),
      (_ = parseFloat(d) * f),
      (M = t.substring(h + p)),
      (m = parseFloat(M) * f)),
    { easting: _ + l, northing: m + c, zoneLetter: n, zoneNumber: r, accuracy: f }
  );
}
function getEastingFromChar(t, s) {
  for (
    var i = SET_ORIGIN_COLUMN_LETTERS.charCodeAt(s - 1), a = 1e5, e = !1;
    i !== t.charCodeAt(0);
  ) {
    if ((++i === I && i++, i === O && i++, i > Z)) {
      if (e) throw 'Bad character: ' + t;
      ((i = A$1), (e = !0));
    }
    a += 1e5;
  }
  return a;
}
function getNorthingFromChar(t, s) {
  if (t > 'V') throw 'MGRSPoint given invalid Northing ' + t;
  for (var i = SET_ORIGIN_ROW_LETTERS.charCodeAt(s - 1), a = 0, e = !1; i !== t.charCodeAt(0); ) {
    if ((++i === I && i++, i === O && i++, i > V)) {
      if (e) throw 'Bad character: ' + t;
      ((i = A$1), (e = !0));
    }
    a += 1e5;
  }
  return a;
}
function getMinNorthing(t) {
  var s;
  switch (t) {
    case 'C':
      s = 11e5;
      break;
    case 'D':
      s = 2e6;
      break;
    case 'E':
      s = 28e5;
      break;
    case 'F':
      s = 37e5;
      break;
    case 'G':
      s = 46e5;
      break;
    case 'H':
      s = 55e5;
      break;
    case 'J':
      s = 64e5;
      break;
    case 'K':
      s = 73e5;
      break;
    case 'L':
      s = 82e5;
      break;
    case 'M':
      s = 91e5;
      break;
    case 'N':
      s = 0;
      break;
    case 'P':
      s = 8e5;
      break;
    case 'Q':
      s = 17e5;
      break;
    case 'R':
      s = 26e5;
      break;
    case 'S':
      s = 35e5;
      break;
    case 'T':
      s = 44e5;
      break;
    case 'U':
      s = 53e5;
      break;
    case 'V':
      s = 62e5;
      break;
    case 'W':
      s = 7e6;
      break;
    case 'X':
      s = 79e5;
      break;
    default:
      s = -1;
  }
  if (s >= 0) return s;
  throw 'Invalid zone letter: ' + t;
}
function Point(t, s, i) {
  if (!(this instanceof Point)) return new Point(t, s, i);
  if (Array.isArray(t)) ((this.x = t[0]), (this.y = t[1]), (this.z = t[2] || 0));
  else if ('object' == typeof t) ((this.x = t.x), (this.y = t.y), (this.z = t.z || 0));
  else if ('string' == typeof t && void 0 === s) {
    var a = t.split(',');
    ((this.x = parseFloat(a[0], 10)),
      (this.y = parseFloat(a[1], 10)),
      (this.z = parseFloat(a[2], 10) || 0));
  } else ((this.x = t), (this.y = s), (this.z = i || 0));
  console.warn('proj4.Point will be removed in version 3, use proj4.toPoint');
}
((Point.fromMGRS = function (t) {
  return new Point(toPoint(t));
}),
  (Point.prototype.toMGRS = function (t) {
    return forward$t([this.x, this.y], t);
  }));
var C00 = 1,
  C02 = 0.25,
  C04 = 0.046875,
  C06 = 0.01953125,
  C08 = 0.01068115234375,
  C22 = 0.75,
  C44 = 0.46875,
  C46 = 0.013020833333333334,
  C48 = 0.007120768229166667,
  C66 = 0.3645833333333333,
  C68 = 0.005696614583333333,
  C88 = 0.3076171875;
function pj_enfn(t) {
  var s = [];
  ((s[0] = C00 - t * (C02 + t * (C04 + t * (C06 + t * C08)))),
    (s[1] = t * (C22 - t * (C04 + t * (C06 + t * C08)))));
  var i = t * t;
  return (
    (s[2] = i * (C44 - t * (C46 + t * C48))),
    (i *= t),
    (s[3] = i * (C66 - t * C68)),
    (s[4] = i * t * C88),
    s
  );
}
function pj_mlfn(t, s, i, a) {
  return ((i *= s), (s *= s), a[0] * t - i * (a[1] + s * (a[2] + s * (a[3] + s * a[4]))));
}
var MAX_ITER$3 = 20;
function pj_inv_mlfn(t, s, i) {
  for (var a = 1 / (1 - s), e = t, h = MAX_ITER$3; h; --h) {
    var r = Math.sin(e),
      n = 1 - s * r * r;
    if (
      ((e -= n = (pj_mlfn(e, r, Math.cos(e), i) - t) * (n * Math.sqrt(n)) * a), Math.abs(n) < EPSLN)
    )
      return e;
  }
  return e;
}
function init$t() {
  ((this.x0 = void 0 !== this.x0 ? this.x0 : 0),
    (this.y0 = void 0 !== this.y0 ? this.y0 : 0),
    (this.long0 = void 0 !== this.long0 ? this.long0 : 0),
    (this.lat0 = void 0 !== this.lat0 ? this.lat0 : 0),
    this.es &&
      ((this.en = pj_enfn(this.es)),
      (this.ml0 = pj_mlfn(this.lat0, Math.sin(this.lat0), Math.cos(this.lat0), this.en))));
}
function forward$s(t) {
  var s,
    i,
    a,
    e = t.x,
    h = t.y,
    r = adjust_lon(e - this.long0),
    n = Math.sin(h),
    o = Math.cos(h);
  if (this.es) {
    var l = o * r,
      c = Math.pow(l, 2),
      u = this.ep2 * Math.pow(o, 2),
      f = Math.pow(u, 2),
      d = Math.abs(o) > EPSLN ? Math.tan(h) : 0,
      M = Math.pow(d, 2),
      p = Math.pow(M, 2);
    ((s = 1 - this.es * Math.pow(n, 2)), (l /= Math.sqrt(s)));
    var _ = pj_mlfn(h, n, o, this.en);
    ((i =
      this.a *
        (this.k0 *
          l *
          (1 +
            (c / 6) *
              (1 -
                M +
                u +
                (c / 20) *
                  (5 -
                    18 * M +
                    p +
                    14 * u -
                    58 * M * u +
                    (c / 42) * (61 + 179 * p - p * M - 479 * M))))) +
      this.x0),
      (a =
        this.a *
          (this.k0 *
            (_ -
              this.ml0 +
              ((n * r * l) / 2) *
                (1 +
                  (c / 12) *
                    (5 -
                      M +
                      9 * u +
                      4 * f +
                      (c / 30) *
                        (61 +
                          p -
                          58 * M +
                          270 * u -
                          330 * M * u +
                          (c / 56) * (1385 + 543 * p - p * M - 3111 * M)))))) +
        this.y0));
  } else {
    var m = o * Math.sin(r);
    if (Math.abs(Math.abs(m) - 1) < EPSLN) return 93;
    if (
      ((i = 0.5 * this.a * this.k0 * Math.log((1 + m) / (1 - m)) + this.x0),
      (a = (o * Math.cos(r)) / Math.sqrt(1 - Math.pow(m, 2))),
      (m = Math.abs(a)) >= 1)
    ) {
      if (m - 1 > EPSLN) return 93;
      a = 0;
    } else a = Math.acos(a);
    (h < 0 && (a = -a), (a = this.a * this.k0 * (a - this.lat0) + this.y0));
  }
  return ((t.x = i), (t.y = a), t);
}
function inverse$s(t) {
  var s,
    i,
    a,
    e,
    h = (t.x - this.x0) * (1 / this.a),
    r = (t.y - this.y0) * (1 / this.a);
  if (this.es)
    if (
      ((i = pj_inv_mlfn((s = this.ml0 + r / this.k0), this.es, this.en)), Math.abs(i) < HALF_PI)
    ) {
      var n = Math.sin(i),
        o = Math.cos(i),
        l = Math.abs(o) > EPSLN ? Math.tan(i) : 0,
        c = this.ep2 * Math.pow(o, 2),
        u = Math.pow(c, 2),
        f = Math.pow(l, 2),
        d = Math.pow(f, 2);
      s = 1 - this.es * Math.pow(n, 2);
      var M = (h * Math.sqrt(s)) / this.k0,
        p = Math.pow(M, 2);
      ((a =
        i -
        (((s *= l) * p) / (1 - this.es)) *
          0.5 *
          (1 -
            (p / 12) *
              (5 +
                3 * f -
                9 * c * f +
                c -
                4 * u -
                (p / 30) *
                  (61 +
                    90 * f -
                    252 * c * f +
                    45 * d +
                    46 * c -
                    (p / 56) * (1385 + 3633 * f + 4095 * d + 1574 * d * f))))),
        (e = adjust_lon(
          this.long0 +
            (M *
              (1 -
                (p / 6) *
                  (1 +
                    2 * f +
                    c -
                    (p / 20) *
                      (5 +
                        28 * f +
                        24 * d +
                        8 * c * f +
                        6 * c -
                        (p / 42) * (61 + 662 * f + 1320 * d + 720 * d * f))))) /
              o
        )));
    } else ((a = HALF_PI * sign(r)), (e = 0));
  else {
    var _ = Math.exp(h / this.k0),
      m = 0.5 * (_ - 1 / _),
      y = this.lat0 + r / this.k0,
      g = Math.cos(y);
    ((s = Math.sqrt((1 - Math.pow(g, 2)) / (1 + Math.pow(m, 2)))),
      (a = Math.asin(s)),
      r < 0 && (a = -a),
      (e = 0 === m && 0 === g ? 0 : adjust_lon(Math.atan2(m, g) + this.long0)));
  }
  return ((t.x = e), (t.y = a), t);
}
var names$t = ['Fast_Transverse_Mercator', 'Fast Transverse Mercator'],
  tmerc = { init: init$t, forward: forward$s, inverse: inverse$s, names: names$t };
function sinh(t) {
  var s = Math.exp(t);
  return (s - 1 / s) / 2;
}
function hypot(t, s) {
  ((t = Math.abs(t)), (s = Math.abs(s)));
  var i = Math.max(t, s),
    a = Math.min(t, s) / (i || 1);
  return i * Math.sqrt(1 + Math.pow(a, 2));
}
function log1py(t) {
  var s = 1 + t,
    i = s - 1;
  return 0 === i ? t : (t * Math.log(s)) / i;
}
function asinhy(t) {
  var s = Math.abs(t);
  return ((s = log1py(s * (1 + s / (hypot(1, s) + 1)))), t < 0 ? -s : s);
}
function gatg(t, s) {
  for (var i, a = 2 * Math.cos(2 * s), e = t.length - 1, h = t[e], r = 0; --e >= 0; )
    ((i = a * h - r + t[e]), (r = h), (h = i));
  return s + i * Math.sin(2 * s);
}
function clens(t, s) {
  for (var i, a = 2 * Math.cos(s), e = t.length - 1, h = t[e], r = 0; --e >= 0; )
    ((i = a * h - r + t[e]), (r = h), (h = i));
  return Math.sin(s) * i;
}
function cosh(t) {
  var s = Math.exp(t);
  return (s + 1 / s) / 2;
}
function clens_cmplx(t, s, i) {
  for (
    var a,
      e,
      h = Math.sin(s),
      r = Math.cos(s),
      n = sinh(i),
      o = cosh(i),
      l = 2 * r * o,
      c = -2 * h * n,
      u = t.length - 1,
      f = t[u],
      d = 0,
      M = 0,
      p = 0;
    --u >= 0;
  )
    ((a = M), (e = d), (f = l * (M = f) - a - c * (d = p) + t[u]), (p = c * M - e + l * d));
  return [(l = h * o) * f - (c = r * n) * p, l * p + c * f];
}
function init$s() {
  if (!this.approx && (isNaN(this.es) || this.es <= 0))
    throw new Error(
      'Incorrect elliptical usage. Try using the +approx option in the proj string, or PROJECTION["Fast_Transverse_Mercator"] in the WKT.'
    );
  (this.approx &&
    (tmerc.init.apply(this), (this.forward = tmerc.forward), (this.inverse = tmerc.inverse)),
    (this.x0 = void 0 !== this.x0 ? this.x0 : 0),
    (this.y0 = void 0 !== this.y0 ? this.y0 : 0),
    (this.long0 = void 0 !== this.long0 ? this.long0 : 0),
    (this.lat0 = void 0 !== this.lat0 ? this.lat0 : 0),
    (this.cgb = []),
    (this.cbg = []),
    (this.utg = []),
    (this.gtu = []));
  var t = this.es / (1 + Math.sqrt(1 - this.es)),
    s = t / (2 - t),
    i = s;
  ((this.cgb[0] =
    s * (2 + s * (-2 / 3 + s * (s * (116 / 45 + s * (26 / 45 + s * (-2854 / 675))) - 2)))),
    (this.cbg[0] =
      s * (s * (2 / 3 + s * (4 / 3 + s * (-82 / 45 + s * (32 / 45 + s * (4642 / 4725))))) - 2)),
    (i *= s),
    (this.cgb[1] = i * (7 / 3 + s * (s * (-227 / 45 + s * (2704 / 315 + s * (2323 / 945))) - 1.6))),
    (this.cbg[1] =
      i * (5 / 3 + s * (-16 / 15 + s * (-13 / 9 + s * (904 / 315 + s * (-1522 / 945)))))),
    (i *= s),
    (this.cgb[2] = i * (56 / 15 + s * (-136 / 35 + s * (-1262 / 105 + s * (73814 / 2835))))),
    (this.cbg[2] = i * (-26 / 15 + s * (34 / 21 + s * (1.6 + s * (-12686 / 2835))))),
    (i *= s),
    (this.cgb[3] = i * (4279 / 630 + s * (-332 / 35 + s * (-399572 / 14175)))),
    (this.cbg[3] = i * (1237 / 630 + s * (s * (-24832 / 14175) - 2.4))),
    (i *= s),
    (this.cgb[4] = i * (4174 / 315 + s * (-144838 / 6237))),
    (this.cbg[4] = i * (-734 / 315 + s * (109598 / 31185))),
    (i *= s),
    (this.cgb[5] = i * (601676 / 22275)),
    (this.cbg[5] = i * (444337 / 155925)),
    (i = Math.pow(s, 2)),
    (this.Qn = (this.k0 / (1 + s)) * (1 + i * (1 / 4 + i * (1 / 64 + i / 256)))),
    (this.utg[0] =
      s *
      (s * (2 / 3 + s * (-37 / 96 + s * (1 / 360 + s * (81 / 512 + s * (-96199 / 604800))))) -
        0.5)),
    (this.gtu[0] =
      s *
      (0.5 + s * (-2 / 3 + s * (5 / 16 + s * (41 / 180 + s * (-127 / 288 + s * (7891 / 37800))))))),
    (this.utg[1] =
      i * (-1 / 48 + s * (-1 / 15 + s * (437 / 1440 + s * (-46 / 105 + s * (1118711 / 3870720)))))),
    (this.gtu[1] =
      i * (13 / 48 + s * (s * (557 / 1440 + s * (281 / 630 + s * (-1983433 / 1935360))) - 0.6))),
    (i *= s),
    (this.utg[2] = i * (-17 / 480 + s * (37 / 840 + s * (209 / 4480 + s * (-5569 / 90720))))),
    (this.gtu[2] = i * (61 / 240 + s * (-103 / 140 + s * (15061 / 26880 + s * (167603 / 181440))))),
    (i *= s),
    (this.utg[3] = i * (-4397 / 161280 + s * (11 / 504 + s * (830251 / 7257600)))),
    (this.gtu[3] = i * (49561 / 161280 + s * (-179 / 168 + s * (6601661 / 7257600)))),
    (i *= s),
    (this.utg[4] = i * (-4583 / 161280 + s * (108847 / 3991680))),
    (this.gtu[4] = i * (34729 / 80640 + s * (-3418889 / 1995840))),
    (i *= s),
    (this.utg[5] = i * (-20648693 / 638668800)),
    (this.gtu[5] = 0.6650675310896665 * i));
  var a = gatg(this.cbg, this.lat0);
  this.Zb = -this.Qn * (a + clens(this.gtu, 2 * a));
}
function forward$r(t) {
  var s = adjust_lon(t.x - this.long0),
    i = t.y;
  i = gatg(this.cbg, i);
  var a = Math.sin(i),
    e = Math.cos(i),
    h = Math.sin(s),
    r = Math.cos(s);
  ((i = Math.atan2(a, r * e)), (s = Math.atan2(h * e, hypot(a, e * r))), (s = asinhy(Math.tan(s))));
  var n,
    o,
    l = clens_cmplx(this.gtu, 2 * i, 2 * s);
  return (
    (i += l[0]),
    (s += l[1]),
    Math.abs(s) <= 2.623395162778
      ? ((n = this.a * (this.Qn * s) + this.x0), (o = this.a * (this.Qn * i + this.Zb) + this.y0))
      : ((n = 1 / 0), (o = 1 / 0)),
    (t.x = n),
    (t.y = o),
    t
  );
}
function inverse$r(t) {
  var s,
    i,
    a = (t.x - this.x0) * (1 / this.a),
    e = (t.y - this.y0) * (1 / this.a);
  if (((e = (e - this.Zb) / this.Qn), (a /= this.Qn), Math.abs(a) <= 2.623395162778)) {
    var h = clens_cmplx(this.utg, 2 * e, 2 * a);
    ((e += h[0]), (a += h[1]), (a = Math.atan(sinh(a))));
    var r = Math.sin(e),
      n = Math.cos(e),
      o = Math.sin(a),
      l = Math.cos(a);
    ((e = Math.atan2(r * l, hypot(o, l * n))),
      (s = adjust_lon((a = Math.atan2(o, l * n)) + this.long0)),
      (i = gatg(this.cgb, e)));
  } else ((s = 1 / 0), (i = 1 / 0));
  return ((t.x = s), (t.y = i), t);
}
var names$s = [
    'Extended_Transverse_Mercator',
    'Extended Transverse Mercator',
    'etmerc',
    'Transverse_Mercator',
    'Transverse Mercator',
    'Gauss Kruger',
    'Gauss_Kruger',
    'tmerc',
  ],
  etmerc = { init: init$s, forward: forward$r, inverse: inverse$r, names: names$s };
function adjust_zone(t, s) {
  if (void 0 === t) {
    if ((t = Math.floor((30 * (adjust_lon(s) + Math.PI)) / Math.PI) + 1) < 0) return 0;
    if (t > 60) return 60;
  }
  return t;
}
var dependsOn = 'etmerc';
function init$r() {
  var t = adjust_zone(this.zone, this.long0);
  if (void 0 === t) throw new Error('unknown utm zone');
  ((this.lat0 = 0),
    (this.long0 = (6 * Math.abs(t) - 183) * D2R$1),
    (this.x0 = 5e5),
    (this.y0 = this.utmSouth ? 1e7 : 0),
    (this.k0 = 0.9996),
    etmerc.init.apply(this),
    (this.forward = etmerc.forward),
    (this.inverse = etmerc.inverse));
}
var names$r = ['Universal Transverse Mercator System', 'utm'],
  utm = { init: init$r, names: names$r, dependsOn };
function srat(t, s) {
  return Math.pow((1 - t) / (1 + t), s);
}
var MAX_ITER$2 = 20;
function init$q() {
  var t = Math.sin(this.lat0),
    s = Math.cos(this.lat0);
  ((s *= s),
    (this.rc = Math.sqrt(1 - this.es) / (1 - this.es * t * t)),
    (this.C = Math.sqrt(1 + (this.es * s * s) / (1 - this.es))),
    (this.phic0 = Math.asin(t / this.C)),
    (this.ratexp = 0.5 * this.C * this.e),
    (this.K =
      Math.tan(0.5 * this.phic0 + FORTPI) /
      (Math.pow(Math.tan(0.5 * this.lat0 + FORTPI), this.C) * srat(this.e * t, this.ratexp))));
}
function forward$q(t) {
  var s = t.x,
    i = t.y;
  return (
    (t.y =
      2 *
        Math.atan(
          this.K *
            Math.pow(Math.tan(0.5 * i + FORTPI), this.C) *
            srat(this.e * Math.sin(i), this.ratexp)
        ) -
      HALF_PI),
    (t.x = this.C * s),
    t
  );
}
function inverse$q(t) {
  for (
    var s = t.x / this.C,
      i = t.y,
      a = Math.pow(Math.tan(0.5 * i + FORTPI) / this.K, 1 / this.C),
      e = MAX_ITER$2;
    e > 0 &&
    ((i = 2 * Math.atan(a * srat(this.e * Math.sin(t.y), -0.5 * this.e)) - HALF_PI),
    !(Math.abs(i - t.y) < 1e-14));
    --e
  )
    t.y = i;
  return e ? ((t.x = s), (t.y = i), t) : null;
}
var names$q = ['gauss'],
  gauss = { init: init$q, forward: forward$q, inverse: inverse$q, names: names$q };
function init$p() {
  (gauss.init.apply(this),
    this.rc &&
      ((this.sinc0 = Math.sin(this.phic0)),
      (this.cosc0 = Math.cos(this.phic0)),
      (this.R2 = 2 * this.rc),
      this.title || (this.title = 'Oblique Stereographic Alternative')));
}
function forward$p(t) {
  var s, i, a, e;
  return (
    (t.x = adjust_lon(t.x - this.long0)),
    gauss.forward.apply(this, [t]),
    (s = Math.sin(t.y)),
    (i = Math.cos(t.y)),
    (a = Math.cos(t.x)),
    (e = (this.k0 * this.R2) / (1 + this.sinc0 * s + this.cosc0 * i * a)),
    (t.x = e * i * Math.sin(t.x)),
    (t.y = e * (this.cosc0 * s - this.sinc0 * i * a)),
    (t.x = this.a * t.x + this.x0),
    (t.y = this.a * t.y + this.y0),
    t
  );
}
function inverse$p(t) {
  var s, i, a, e, h;
  if (
    ((t.x = (t.x - this.x0) / this.a),
    (t.y = (t.y - this.y0) / this.a),
    (t.x /= this.k0),
    (t.y /= this.k0),
    (h = hypot(t.x, t.y)))
  ) {
    var r = 2 * Math.atan2(h, this.R2);
    ((s = Math.sin(r)),
      (i = Math.cos(r)),
      (e = Math.asin(i * this.sinc0 + (t.y * s * this.cosc0) / h)),
      (a = Math.atan2(t.x * s, h * this.cosc0 * i - t.y * this.sinc0 * s)));
  } else ((e = this.phic0), (a = 0));
  return (
    (t.x = a),
    (t.y = e),
    gauss.inverse.apply(this, [t]),
    (t.x = adjust_lon(t.x + this.long0)),
    t
  );
}
var names$p = [
    'Stereographic_North_Pole',
    'Oblique_Stereographic',
    'sterea',
    'Oblique Stereographic Alternative',
    'Double_Stereographic',
  ],
  sterea = { init: init$p, forward: forward$p, inverse: inverse$p, names: names$p };
function ssfn_(t, s, i) {
  return ((s *= i), Math.tan(0.5 * (HALF_PI + t)) * Math.pow((1 - s) / (1 + s), 0.5 * i));
}
function init$o() {
  ((this.x0 = this.x0 || 0),
    (this.y0 = this.y0 || 0),
    (this.lat0 = this.lat0 || 0),
    (this.long0 = this.long0 || 0),
    (this.coslat0 = Math.cos(this.lat0)),
    (this.sinlat0 = Math.sin(this.lat0)),
    this.sphere
      ? 1 === this.k0 &&
        !isNaN(this.lat_ts) &&
        Math.abs(this.coslat0) <= EPSLN &&
        (this.k0 = 0.5 * (1 + sign(this.lat0) * Math.sin(this.lat_ts)))
      : (Math.abs(this.coslat0) <= EPSLN && (this.lat0 > 0 ? (this.con = 1) : (this.con = -1)),
        (this.cons = Math.sqrt(
          Math.pow(1 + this.e, 1 + this.e) * Math.pow(1 - this.e, 1 - this.e)
        )),
        1 === this.k0 &&
          !isNaN(this.lat_ts) &&
          Math.abs(this.coslat0) <= EPSLN &&
          Math.abs(Math.cos(this.lat_ts)) > EPSLN &&
          (this.k0 =
            (0.5 * this.cons * msfnz(this.e, Math.sin(this.lat_ts), Math.cos(this.lat_ts))) /
            tsfnz(this.e, this.con * this.lat_ts, this.con * Math.sin(this.lat_ts))),
        (this.ms1 = msfnz(this.e, this.sinlat0, this.coslat0)),
        (this.X0 = 2 * Math.atan(this.ssfn_(this.lat0, this.sinlat0, this.e)) - HALF_PI),
        (this.cosX0 = Math.cos(this.X0)),
        (this.sinX0 = Math.sin(this.X0))));
}
function forward$o(t) {
  var s,
    i,
    a,
    e,
    h,
    r,
    n = t.x,
    o = t.y,
    l = Math.sin(o),
    c = Math.cos(o),
    u = adjust_lon(n - this.long0);
  return Math.abs(Math.abs(n - this.long0) - Math.PI) <= EPSLN && Math.abs(o + this.lat0) <= EPSLN
    ? ((t.x = NaN), (t.y = NaN), t)
    : this.sphere
      ? ((s = (2 * this.k0) / (1 + this.sinlat0 * l + this.coslat0 * c * Math.cos(u))),
        (t.x = this.a * s * c * Math.sin(u) + this.x0),
        (t.y = this.a * s * (this.coslat0 * l - this.sinlat0 * c * Math.cos(u)) + this.y0),
        t)
      : ((i = 2 * Math.atan(this.ssfn_(o, l, this.e)) - HALF_PI),
        (e = Math.cos(i)),
        (a = Math.sin(i)),
        Math.abs(this.coslat0) <= EPSLN
          ? ((h = tsfnz(this.e, o * this.con, this.con * l)),
            (r = (2 * this.a * this.k0 * h) / this.cons),
            (t.x = this.x0 + r * Math.sin(n - this.long0)),
            (t.y = this.y0 - this.con * r * Math.cos(n - this.long0)),
            t)
          : (Math.abs(this.sinlat0) < EPSLN
              ? ((s = (2 * this.a * this.k0) / (1 + e * Math.cos(u))), (t.y = s * a))
              : ((s =
                  (2 * this.a * this.k0 * this.ms1) /
                  (this.cosX0 * (1 + this.sinX0 * a + this.cosX0 * e * Math.cos(u)))),
                (t.y = s * (this.cosX0 * a - this.sinX0 * e * Math.cos(u)) + this.y0)),
            (t.x = s * e * Math.sin(u) + this.x0),
            t));
}
function inverse$o(t) {
  var s, i, a, e, h;
  ((t.x -= this.x0), (t.y -= this.y0));
  var r = Math.sqrt(t.x * t.x + t.y * t.y);
  if (this.sphere) {
    var n = 2 * Math.atan(r / (2 * this.a * this.k0));
    return (
      (s = this.long0),
      (i = this.lat0),
      r <= EPSLN
        ? ((t.x = s), (t.y = i), t)
        : ((i = Math.asin(Math.cos(n) * this.sinlat0 + (t.y * Math.sin(n) * this.coslat0) / r)),
          (s =
            Math.abs(this.coslat0) < EPSLN
              ? this.lat0 > 0
                ? adjust_lon(this.long0 + Math.atan2(t.x, -1 * t.y))
                : adjust_lon(this.long0 + Math.atan2(t.x, t.y))
              : adjust_lon(
                  this.long0 +
                    Math.atan2(
                      t.x * Math.sin(n),
                      r * this.coslat0 * Math.cos(n) - t.y * this.sinlat0 * Math.sin(n)
                    )
                )),
          (t.x = s),
          (t.y = i),
          t)
    );
  }
  if (Math.abs(this.coslat0) <= EPSLN) {
    if (r <= EPSLN) return ((i = this.lat0), (s = this.long0), (t.x = s), (t.y = i), t);
    ((t.x *= this.con),
      (t.y *= this.con),
      (a = (r * this.cons) / (2 * this.a * this.k0)),
      (i = this.con * phi2z(this.e, a)),
      (s = this.con * adjust_lon(this.con * this.long0 + Math.atan2(t.x, -1 * t.y))));
  } else
    ((e = 2 * Math.atan((r * this.cosX0) / (2 * this.a * this.k0 * this.ms1))),
      (s = this.long0),
      r <= EPSLN
        ? (h = this.X0)
        : ((h = Math.asin(Math.cos(e) * this.sinX0 + (t.y * Math.sin(e) * this.cosX0) / r)),
          (s = adjust_lon(
            this.long0 +
              Math.atan2(
                t.x * Math.sin(e),
                r * this.cosX0 * Math.cos(e) - t.y * this.sinX0 * Math.sin(e)
              )
          ))),
      (i = -1 * phi2z(this.e, Math.tan(0.5 * (HALF_PI + h)))));
  return ((t.x = s), (t.y = i), t);
}
var names$o = [
    'stere',
    'Stereographic_South_Pole',
    'Polar Stereographic (variant B)',
    'Polar_Stereographic',
  ],
  stere = { init: init$o, forward: forward$o, inverse: inverse$o, names: names$o, ssfn_ };
function init$n() {
  var t = this.lat0;
  this.lambda0 = this.long0;
  var s = Math.sin(t),
    i = this.a,
    a = 1 / this.rf,
    e = 2 * a - Math.pow(a, 2),
    h = (this.e = Math.sqrt(e));
  ((this.R = (this.k0 * i * Math.sqrt(1 - e)) / (1 - e * Math.pow(s, 2))),
    (this.alpha = Math.sqrt(1 + (e / (1 - e)) * Math.pow(Math.cos(t), 4))),
    (this.b0 = Math.asin(s / this.alpha)));
  var r = Math.log(Math.tan(Math.PI / 4 + this.b0 / 2)),
    n = Math.log(Math.tan(Math.PI / 4 + t / 2)),
    o = Math.log((1 + h * s) / (1 - h * s));
  this.K = r - this.alpha * n + ((this.alpha * h) / 2) * o;
}
function forward$n(t) {
  var s = Math.log(Math.tan(Math.PI / 4 - t.y / 2)),
    i = (this.e / 2) * Math.log((1 + this.e * Math.sin(t.y)) / (1 - this.e * Math.sin(t.y))),
    a = -this.alpha * (s + i) + this.K,
    e = 2 * (Math.atan(Math.exp(a)) - Math.PI / 4),
    h = this.alpha * (t.x - this.lambda0),
    r = Math.atan(
      Math.sin(h) / (Math.sin(this.b0) * Math.tan(e) + Math.cos(this.b0) * Math.cos(h))
    ),
    n = Math.asin(Math.cos(this.b0) * Math.sin(e) - Math.sin(this.b0) * Math.cos(e) * Math.cos(h));
  return (
    (t.y = (this.R / 2) * Math.log((1 + Math.sin(n)) / (1 - Math.sin(n))) + this.y0),
    (t.x = this.R * r + this.x0),
    t
  );
}
function inverse$n(t) {
  for (
    var s = t.x - this.x0,
      i = t.y - this.y0,
      a = s / this.R,
      e = 2 * (Math.atan(Math.exp(i / this.R)) - Math.PI / 4),
      h = Math.asin(
        Math.cos(this.b0) * Math.sin(e) + Math.sin(this.b0) * Math.cos(e) * Math.cos(a)
      ),
      r = Math.atan(
        Math.sin(a) / (Math.cos(this.b0) * Math.cos(a) - Math.sin(this.b0) * Math.tan(e))
      ),
      n = this.lambda0 + r / this.alpha,
      o = 0,
      l = h,
      c = -1e3,
      u = 0;
    Math.abs(l - c) > 1e-7;
  ) {
    if (++u > 20) return;
    ((o =
      (1 / this.alpha) * (Math.log(Math.tan(Math.PI / 4 + h / 2)) - this.K) +
      this.e * Math.log(Math.tan(Math.PI / 4 + Math.asin(this.e * Math.sin(l)) / 2))),
      (c = l),
      (l = 2 * Math.atan(Math.exp(o)) - Math.PI / 2));
  }
  return ((t.x = n), (t.y = l), t);
}
var names$n = ['somerc'],
  somerc = { init: init$n, forward: forward$n, inverse: inverse$n, names: names$n },
  TOL = 1e-7;
function isTypeA(t) {
  var s = 'object' == typeof t.PROJECTION ? Object.keys(t.PROJECTION)[0] : t.PROJECTION;
  return (
    'no_uoff' in t ||
    'no_off' in t ||
    -1 !== ['Hotine_Oblique_Mercator', 'Hotine_Oblique_Mercator_Azimuth_Natural_Origin'].indexOf(s)
  );
}
function init$m() {
  var t,
    s,
    i,
    a,
    e,
    h,
    r,
    n,
    o,
    l,
    c,
    u = 0,
    f = 0,
    d = 0,
    M = 0,
    p = 0,
    _ = 0,
    m = 0;
  ((this.no_off = isTypeA(this)), (this.no_rot = 'no_rot' in this));
  var y = !1;
  'alpha' in this && (y = !0);
  var g = !1;
  if (
    ('rectified_grid_angle' in this && (g = !0),
    y && (m = this.alpha),
    g && (u = this.rectified_grid_angle * D2R$1),
    y || g)
  )
    f = this.longc;
  else if (
    ((d = this.long1),
    (p = this.lat1),
    (M = this.long2),
    (_ = this.lat2),
    Math.abs(p - _) <= TOL ||
      (t = Math.abs(p)) <= TOL ||
      Math.abs(t - HALF_PI) <= TOL ||
      Math.abs(Math.abs(this.lat0) - HALF_PI) <= TOL ||
      Math.abs(Math.abs(_) - HALF_PI) <= TOL)
  )
    throw new Error();
  var x = 1 - this.es;
  ((s = Math.sqrt(x)),
    Math.abs(this.lat0) > EPSLN
      ? ((n = Math.sin(this.lat0)),
        (i = Math.cos(this.lat0)),
        (t = 1 - this.es * n * n),
        (this.B = i * i),
        (this.B = Math.sqrt(1 + (this.es * this.B * this.B) / x)),
        (this.A = (this.B * this.k0 * s) / t),
        (e = (a = (this.B * s) / (i * Math.sqrt(t))) * a - 1) <= 0
          ? (e = 0)
          : ((e = Math.sqrt(e)), this.lat0 < 0 && (e = -e)),
        (this.E = e += a),
        (this.E *= Math.pow(tsfnz(this.e, this.lat0, n), this.B)))
      : ((this.B = 1 / s), (this.A = this.k0), (this.E = a = e = 1)),
    y || g
      ? (y
          ? ((c = Math.asin(Math.sin(m) / a)), g || (u = m))
          : ((c = u), (m = Math.asin(a * Math.sin(c)))),
        (this.lam0 = f - Math.asin(0.5 * (e - 1 / e) * Math.tan(c)) / this.B))
      : ((h = Math.pow(tsfnz(this.e, p, Math.sin(p)), this.B)),
        (r = Math.pow(tsfnz(this.e, _, Math.sin(_)), this.B)),
        (e = this.E / h),
        (o = (r - h) / (r + h)),
        (l = ((l = this.E * this.E) - r * h) / (l + r * h)),
        (t = d - M) < -Math.pi ? (M -= TWO_PI) : t > Math.pi && (M += TWO_PI),
        (this.lam0 = adjust_lon(
          0.5 * (d + M) - Math.atan((l * Math.tan(0.5 * this.B * (d - M))) / o) / this.B
        )),
        (c = Math.atan((2 * Math.sin(this.B * adjust_lon(d - this.lam0))) / (e - 1 / e))),
        (u = m = Math.asin(a * Math.sin(c)))),
    (this.singam = Math.sin(c)),
    (this.cosgam = Math.cos(c)),
    (this.sinrot = Math.sin(u)),
    (this.cosrot = Math.cos(u)),
    (this.rB = 1 / this.B),
    (this.ArB = this.A * this.rB),
    (this.BrA = 1 / this.ArB),
    this.A,
    this.B,
    this.no_off
      ? (this.u_0 = 0)
      : ((this.u_0 = Math.abs(this.ArB * Math.atan(Math.sqrt(a * a - 1) / Math.cos(m)))),
        this.lat0 < 0 && (this.u_0 = -this.u_0)),
    (e = 0.5 * c),
    (this.v_pole_n = this.ArB * Math.log(Math.tan(FORTPI - e))),
    (this.v_pole_s = this.ArB * Math.log(Math.tan(FORTPI + e))));
}
function forward$m(t) {
  var s,
    i,
    a,
    e,
    h,
    r,
    n,
    o,
    l = {};
  if (((t.x = t.x - this.lam0), Math.abs(Math.abs(t.y) - HALF_PI) > EPSLN)) {
    if (
      ((s =
        0.5 * ((h = this.E / Math.pow(tsfnz(this.e, t.y, Math.sin(t.y)), this.B)) - (r = 1 / h))),
      (i = 0.5 * (h + r)),
      (e = Math.sin(this.B * t.x)),
      (a = (s * this.singam - e * this.cosgam) / i),
      Math.abs(Math.abs(a) - 1) < EPSLN)
    )
      throw new Error();
    ((o = 0.5 * this.ArB * Math.log((1 - a) / (1 + a))),
      (r = Math.cos(this.B * t.x)),
      (n =
        Math.abs(r) < TOL
          ? this.A * t.x
          : this.ArB * Math.atan2(s * this.cosgam + e * this.singam, r)));
  } else ((o = t.y > 0 ? this.v_pole_n : this.v_pole_s), (n = this.ArB * t.y));
  return (
    this.no_rot
      ? ((l.x = n), (l.y = o))
      : ((n -= this.u_0),
        (l.x = o * this.cosrot + n * this.sinrot),
        (l.y = n * this.cosrot - o * this.sinrot)),
    (l.x = this.a * l.x + this.x0),
    (l.y = this.a * l.y + this.y0),
    l
  );
}
function inverse$m(t) {
  var s,
    i,
    a,
    e,
    h,
    r,
    n,
    o = {};
  if (
    ((t.x = (t.x - this.x0) * (1 / this.a)),
    (t.y = (t.y - this.y0) * (1 / this.a)),
    this.no_rot
      ? ((i = t.y), (s = t.x))
      : ((i = t.x * this.cosrot - t.y * this.sinrot),
        (s = t.y * this.cosrot + t.x * this.sinrot + this.u_0)),
    (e = 0.5 * ((a = Math.exp(-this.BrA * i)) - 1 / a)),
    (h = 0.5 * (a + 1 / a)),
    (n = ((r = Math.sin(this.BrA * s)) * this.cosgam + e * this.singam) / h),
    Math.abs(Math.abs(n) - 1) < EPSLN)
  )
    ((o.x = 0), (o.y = n < 0 ? -HALF_PI : HALF_PI));
  else {
    if (
      ((o.y = this.E / Math.sqrt((1 + n) / (1 - n))),
      (o.y = phi2z(this.e, Math.pow(o.y, 1 / this.B))),
      o.y === 1 / 0)
    )
      throw new Error();
    o.x = -this.rB * Math.atan2(e * this.cosgam - r * this.singam, Math.cos(this.BrA * s));
  }
  return ((o.x += this.lam0), o);
}
var names$m = [
    'Hotine_Oblique_Mercator',
    'Hotine Oblique Mercator',
    'Hotine_Oblique_Mercator_Azimuth_Natural_Origin',
    'Hotine_Oblique_Mercator_Two_Point_Natural_Origin',
    'Hotine_Oblique_Mercator_Azimuth_Center',
    'Oblique_Mercator',
    'omerc',
  ],
  omerc = { init: init$m, forward: forward$m, inverse: inverse$m, names: names$m };
function init$l() {
  if (
    (this.lat2 || (this.lat2 = this.lat1),
    this.k0 || (this.k0 = 1),
    (this.x0 = this.x0 || 0),
    (this.y0 = this.y0 || 0),
    !(Math.abs(this.lat1 + this.lat2) < EPSLN))
  ) {
    var t = this.b / this.a;
    this.e = Math.sqrt(1 - t * t);
    var s = Math.sin(this.lat1),
      i = Math.cos(this.lat1),
      a = msfnz(this.e, s, i),
      e = tsfnz(this.e, this.lat1, s),
      h = Math.sin(this.lat2),
      r = Math.cos(this.lat2),
      n = msfnz(this.e, h, r),
      o = tsfnz(this.e, this.lat2, h),
      l = tsfnz(this.e, this.lat0, Math.sin(this.lat0));
    (Math.abs(this.lat1 - this.lat2) > EPSLN
      ? (this.ns = Math.log(a / n) / Math.log(e / o))
      : (this.ns = s),
      isNaN(this.ns) && (this.ns = s),
      (this.f0 = a / (this.ns * Math.pow(e, this.ns))),
      (this.rh = this.a * this.f0 * Math.pow(l, this.ns)),
      this.title || (this.title = 'Lambert Conformal Conic'));
  }
}
function forward$l(t) {
  var s = t.x,
    i = t.y;
  Math.abs(2 * Math.abs(i) - Math.PI) <= EPSLN && (i = sign(i) * (HALF_PI - 2 * EPSLN));
  var a,
    e,
    h = Math.abs(Math.abs(i) - HALF_PI);
  if (h > EPSLN)
    ((a = tsfnz(this.e, i, Math.sin(i))), (e = this.a * this.f0 * Math.pow(a, this.ns)));
  else {
    if ((h = i * this.ns) <= 0) return null;
    e = 0;
  }
  var r = this.ns * adjust_lon(s - this.long0);
  return (
    (t.x = this.k0 * (e * Math.sin(r)) + this.x0),
    (t.y = this.k0 * (this.rh - e * Math.cos(r)) + this.y0),
    t
  );
}
function inverse$l(t) {
  var s,
    i,
    a,
    e,
    h,
    r = (t.x - this.x0) / this.k0,
    n = this.rh - (t.y - this.y0) / this.k0;
  this.ns > 0
    ? ((s = Math.sqrt(r * r + n * n)), (i = 1))
    : ((s = -Math.sqrt(r * r + n * n)), (i = -1));
  var o = 0;
  if ((0 !== s && (o = Math.atan2(i * r, i * n)), 0 !== s || this.ns > 0)) {
    if (
      ((i = 1 / this.ns),
      (a = Math.pow(s / (this.a * this.f0), i)),
      -9999 === (e = phi2z(this.e, a)))
    )
      return null;
  } else e = -HALF_PI;
  return ((h = adjust_lon(o / this.ns + this.long0)), (t.x = h), (t.y = e), t);
}
var names$l = [
    'Lambert Tangential Conformal Conic Projection',
    'Lambert_Conformal_Conic',
    'Lambert_Conformal_Conic_1SP',
    'Lambert_Conformal_Conic_2SP',
    'lcc',
    'Lambert Conic Conformal (1SP)',
    'Lambert Conic Conformal (2SP)',
  ],
  lcc = { init: init$l, forward: forward$l, inverse: inverse$l, names: names$l };
function init$k() {
  ((this.a = 6377397.155),
    (this.es = 0.006674372230614),
    (this.e = Math.sqrt(this.es)),
    this.lat0 || (this.lat0 = 0.863937979737193),
    this.long0 || (this.long0 = 0.4334234309119251),
    this.k0 || (this.k0 = 0.9999),
    (this.s45 = 0.785398163397448),
    (this.s90 = 2 * this.s45),
    (this.fi0 = this.lat0),
    (this.e2 = this.es),
    (this.e = Math.sqrt(this.e2)),
    (this.alfa = Math.sqrt(1 + (this.e2 * Math.pow(Math.cos(this.fi0), 4)) / (1 - this.e2))),
    (this.uq = 1.04216856380474),
    (this.u0 = Math.asin(Math.sin(this.fi0) / this.alfa)),
    (this.g = Math.pow(
      (1 + this.e * Math.sin(this.fi0)) / (1 - this.e * Math.sin(this.fi0)),
      (this.alfa * this.e) / 2
    )),
    (this.k =
      (Math.tan(this.u0 / 2 + this.s45) / Math.pow(Math.tan(this.fi0 / 2 + this.s45), this.alfa)) *
      this.g),
    (this.k1 = this.k0),
    (this.n0 = (this.a * Math.sqrt(1 - this.e2)) / (1 - this.e2 * Math.pow(Math.sin(this.fi0), 2))),
    (this.s0 = 1.37008346281555),
    (this.n = Math.sin(this.s0)),
    (this.ro0 = (this.k1 * this.n0) / Math.tan(this.s0)),
    (this.ad = this.s90 - this.uq));
}
function forward$k(t) {
  var s,
    i,
    a,
    e,
    h,
    r,
    n,
    o = t.x,
    l = t.y,
    c = adjust_lon(o - this.long0);
  return (
    (s = Math.pow(
      (1 + this.e * Math.sin(l)) / (1 - this.e * Math.sin(l)),
      (this.alfa * this.e) / 2
    )),
    (i =
      2 * (Math.atan((this.k * Math.pow(Math.tan(l / 2 + this.s45), this.alfa)) / s) - this.s45)),
    (a = -c * this.alfa),
    (e = Math.asin(
      Math.cos(this.ad) * Math.sin(i) + Math.sin(this.ad) * Math.cos(i) * Math.cos(a)
    )),
    (h = Math.asin((Math.cos(i) * Math.sin(a)) / Math.cos(e))),
    (r = this.n * h),
    (n =
      (this.ro0 * Math.pow(Math.tan(this.s0 / 2 + this.s45), this.n)) /
      Math.pow(Math.tan(e / 2 + this.s45), this.n)),
    (t.y = (n * Math.cos(r)) / 1),
    (t.x = (n * Math.sin(r)) / 1),
    this.czech || ((t.y *= -1), (t.x *= -1)),
    t
  );
}
function inverse$k(t) {
  var s,
    i,
    a,
    e,
    h,
    r,
    n,
    o = t.x;
  ((t.x = t.y),
    (t.y = o),
    this.czech || ((t.y *= -1), (t.x *= -1)),
    (h = Math.sqrt(t.x * t.x + t.y * t.y)),
    (e = Math.atan2(t.y, t.x) / Math.sin(this.s0)),
    (a =
      2 *
      (Math.atan(Math.pow(this.ro0 / h, 1 / this.n) * Math.tan(this.s0 / 2 + this.s45)) -
        this.s45)),
    (s = Math.asin(
      Math.cos(this.ad) * Math.sin(a) - Math.sin(this.ad) * Math.cos(a) * Math.cos(e)
    )),
    (i = Math.asin((Math.cos(a) * Math.sin(e)) / Math.cos(s))),
    (t.x = this.long0 - i / this.alfa),
    (r = s),
    (n = 0));
  var l = 0;
  do {
    ((t.y =
      2 *
      (Math.atan(
        Math.pow(this.k, -1 / this.alfa) *
          Math.pow(Math.tan(s / 2 + this.s45), 1 / this.alfa) *
          Math.pow((1 + this.e * Math.sin(r)) / (1 - this.e * Math.sin(r)), this.e / 2)
      ) -
        this.s45)),
      Math.abs(r - t.y) < 1e-10 && (n = 1),
      (r = t.y),
      (l += 1));
  } while (0 === n && l < 15);
  return l >= 15 ? null : t;
}
var names$k = ['Krovak', 'krovak'],
  krovak = { init: init$k, forward: forward$k, inverse: inverse$k, names: names$k };
function mlfn(t, s, i, a, e) {
  return t * e - s * Math.sin(2 * e) + i * Math.sin(4 * e) - a * Math.sin(6 * e);
}
function e0fn(t) {
  return 1 - 0.25 * t * (1 + (t / 16) * (3 + 1.25 * t));
}
function e1fn(t) {
  return 0.375 * t * (1 + 0.25 * t * (1 + 0.46875 * t));
}
function e2fn(t) {
  return 0.05859375 * t * t * (1 + 0.75 * t);
}
function e3fn(t) {
  return t * t * t * (35 / 3072);
}
function gN(t, s, i) {
  var a = s * i;
  return t / Math.sqrt(1 - a * a);
}
function adjust_lat(t) {
  return Math.abs(t) < HALF_PI ? t : t - sign(t) * Math.PI;
}
function imlfn(t, s, i, a, e) {
  var h, r;
  h = t / s;
  for (var n = 0; n < 15; n++)
    if (
      ((h += r =
        (t - (s * h - i * Math.sin(2 * h) + a * Math.sin(4 * h) - e * Math.sin(6 * h))) /
        (s - 2 * i * Math.cos(2 * h) + 4 * a * Math.cos(4 * h) - 6 * e * Math.cos(6 * h))),
      Math.abs(r) <= 1e-10)
    )
      return h;
  return NaN;
}
function init$j() {
  this.sphere ||
    ((this.e0 = e0fn(this.es)),
    (this.e1 = e1fn(this.es)),
    (this.e2 = e2fn(this.es)),
    (this.e3 = e3fn(this.es)),
    (this.ml0 = this.a * mlfn(this.e0, this.e1, this.e2, this.e3, this.lat0)));
}
function forward$j(t) {
  var s,
    i,
    a = t.x,
    e = t.y;
  if (((a = adjust_lon(a - this.long0)), this.sphere))
    ((s = this.a * Math.asin(Math.cos(e) * Math.sin(a))),
      (i = this.a * (Math.atan2(Math.tan(e), Math.cos(a)) - this.lat0)));
  else {
    var h = Math.sin(e),
      r = Math.cos(e),
      n = gN(this.a, this.e, h),
      o = Math.tan(e) * Math.tan(e),
      l = a * Math.cos(e),
      c = l * l,
      u = (this.es * r * r) / (1 - this.es);
    ((s = n * l * (1 - c * o * (1 / 6 - ((8 - o + 8 * u) * c) / 120))),
      (i =
        this.a * mlfn(this.e0, this.e1, this.e2, this.e3, e) -
        this.ml0 +
        ((n * h) / r) * c * (0.5 + ((5 - o + 6 * u) * c) / 24)));
  }
  return ((t.x = s + this.x0), (t.y = i + this.y0), t);
}
function inverse$j(t) {
  ((t.x -= this.x0), (t.y -= this.y0));
  var s,
    i,
    a = t.x / this.a,
    e = t.y / this.a;
  if (this.sphere) {
    var h = e + this.lat0;
    ((s = Math.asin(Math.sin(h) * Math.cos(a))), (i = Math.atan2(Math.tan(a), Math.cos(h))));
  } else {
    var r = imlfn(this.ml0 / this.a + e, this.e0, this.e1, this.e2, this.e3);
    if (Math.abs(Math.abs(r) - HALF_PI) <= EPSLN)
      return ((t.x = this.long0), (t.y = HALF_PI), e < 0 && (t.y *= -1), t);
    var n = gN(this.a, this.e, Math.sin(r)),
      o = ((n * n * n) / this.a / this.a) * (1 - this.es),
      l = Math.pow(Math.tan(r), 2),
      c = (a * this.a) / n,
      u = c * c;
    ((s = r - ((n * Math.tan(r)) / o) * c * c * (0.5 - ((1 + 3 * l) * c * c) / 24)),
      (i = (c * (1 - u * (l / 3 + ((1 + 3 * l) * l * u) / 15))) / Math.cos(r)));
  }
  return ((t.x = adjust_lon(i + this.long0)), (t.y = adjust_lat(s)), t);
}
var names$j = ['Cassini', 'Cassini_Soldner', 'cass'],
  cass = { init: init$j, forward: forward$j, inverse: inverse$j, names: names$j };
function qsfnz(t, s) {
  var i;
  return t > 1e-7
    ? (1 - t * t) * (s / (1 - (i = t * s) * i) - (0.5 / t) * Math.log((1 - i) / (1 + i)))
    : 2 * s;
}
var S_POLE = 1,
  N_POLE = 2,
  EQUIT = 3,
  OBLIQ = 4;
function init$i() {
  var t,
    s = Math.abs(this.lat0);
  if (
    (Math.abs(s - HALF_PI) < EPSLN
      ? (this.mode = this.lat0 < 0 ? this.S_POLE : this.N_POLE)
      : Math.abs(s) < EPSLN
        ? (this.mode = this.EQUIT)
        : (this.mode = this.OBLIQ),
    this.es > 0)
  )
    switch (
      ((this.qp = qsfnz(this.e, 1)),
      (this.mmf = 0.5 / (1 - this.es)),
      (this.apa = authset(this.es)),
      this.mode)
    ) {
      case this.N_POLE:
      case this.S_POLE:
        this.dd = 1;
        break;
      case this.EQUIT:
        ((this.rq = Math.sqrt(0.5 * this.qp)),
          (this.dd = 1 / this.rq),
          (this.xmf = 1),
          (this.ymf = 0.5 * this.qp));
        break;
      case this.OBLIQ:
        ((this.rq = Math.sqrt(0.5 * this.qp)),
          (t = Math.sin(this.lat0)),
          (this.sinb1 = qsfnz(this.e, t) / this.qp),
          (this.cosb1 = Math.sqrt(1 - this.sinb1 * this.sinb1)),
          (this.dd = Math.cos(this.lat0) / (Math.sqrt(1 - this.es * t * t) * this.rq * this.cosb1)),
          (this.ymf = (this.xmf = this.rq) / this.dd),
          (this.xmf *= this.dd));
    }
  else
    this.mode === this.OBLIQ &&
      ((this.sinph0 = Math.sin(this.lat0)), (this.cosph0 = Math.cos(this.lat0)));
}
function forward$i(t) {
  var s,
    i,
    a,
    e,
    h,
    r,
    n,
    o,
    l,
    c,
    u = t.x,
    f = t.y;
  if (((u = adjust_lon(u - this.long0)), this.sphere)) {
    if (
      ((h = Math.sin(f)),
      (c = Math.cos(f)),
      (a = Math.cos(u)),
      this.mode === this.OBLIQ || this.mode === this.EQUIT)
    ) {
      if (
        (i = this.mode === this.EQUIT ? 1 + c * a : 1 + this.sinph0 * h + this.cosph0 * c * a) <=
        EPSLN
      )
        return null;
      ((s = (i = Math.sqrt(2 / i)) * c * Math.sin(u)),
        (i *= this.mode === this.EQUIT ? h : this.cosph0 * h - this.sinph0 * c * a));
    } else if (this.mode === this.N_POLE || this.mode === this.S_POLE) {
      if ((this.mode === this.N_POLE && (a = -a), Math.abs(f + this.lat0) < EPSLN)) return null;
      ((i = FORTPI - 0.5 * f),
        (s = (i = 2 * (this.mode === this.S_POLE ? Math.cos(i) : Math.sin(i))) * Math.sin(u)),
        (i *= a));
    }
  } else {
    switch (
      ((n = 0),
      (o = 0),
      (l = 0),
      (a = Math.cos(u)),
      (e = Math.sin(u)),
      (h = Math.sin(f)),
      (r = qsfnz(this.e, h)),
      (this.mode !== this.OBLIQ && this.mode !== this.EQUIT) ||
        ((n = r / this.qp), (o = Math.sqrt(1 - n * n))),
      this.mode)
    ) {
      case this.OBLIQ:
        l = 1 + this.sinb1 * n + this.cosb1 * o * a;
        break;
      case this.EQUIT:
        l = 1 + o * a;
        break;
      case this.N_POLE:
        ((l = HALF_PI + f), (r = this.qp - r));
        break;
      case this.S_POLE:
        ((l = f - HALF_PI), (r = this.qp + r));
    }
    if (Math.abs(l) < EPSLN) return null;
    switch (this.mode) {
      case this.OBLIQ:
      case this.EQUIT:
        ((l = Math.sqrt(2 / l)),
          (i =
            this.mode === this.OBLIQ
              ? this.ymf * l * (this.cosb1 * n - this.sinb1 * o * a)
              : (l = Math.sqrt(2 / (1 + o * a))) * n * this.ymf),
          (s = this.xmf * l * o * e));
        break;
      case this.N_POLE:
      case this.S_POLE:
        r >= 0
          ? ((s = (l = Math.sqrt(r)) * e), (i = a * (this.mode === this.S_POLE ? l : -l)))
          : (s = i = 0);
    }
  }
  return ((t.x = this.a * s + this.x0), (t.y = this.a * i + this.y0), t);
}
function inverse$i(t) {
  ((t.x -= this.x0), (t.y -= this.y0));
  var s,
    i,
    a,
    e,
    h,
    r,
    n,
    o = t.x / this.a,
    l = t.y / this.a;
  if (this.sphere) {
    var c,
      u = 0,
      f = 0;
    if ((i = 0.5 * (c = Math.sqrt(o * o + l * l))) > 1) return null;
    switch (
      ((i = 2 * Math.asin(i)),
      (this.mode !== this.OBLIQ && this.mode !== this.EQUIT) ||
        ((f = Math.sin(i)), (u = Math.cos(i))),
      this.mode)
    ) {
      case this.EQUIT:
        ((i = Math.abs(c) <= EPSLN ? 0 : Math.asin((l * f) / c)), (o *= f), (l = u * c));
        break;
      case this.OBLIQ:
        ((i =
          Math.abs(c) <= EPSLN
            ? this.lat0
            : Math.asin(u * this.sinph0 + (l * f * this.cosph0) / c)),
          (o *= f * this.cosph0),
          (l = (u - Math.sin(i) * this.sinph0) * c));
        break;
      case this.N_POLE:
        ((l = -l), (i = HALF_PI - i));
        break;
      case this.S_POLE:
        i -= HALF_PI;
    }
    s = 0 !== l || (this.mode !== this.EQUIT && this.mode !== this.OBLIQ) ? Math.atan2(o, l) : 0;
  } else {
    if (((n = 0), this.mode === this.OBLIQ || this.mode === this.EQUIT)) {
      if (((o /= this.dd), (l *= this.dd), (r = Math.sqrt(o * o + l * l)) < EPSLN))
        return ((t.x = this.long0), (t.y = this.lat0), t);
      ((e = 2 * Math.asin((0.5 * r) / this.rq)),
        (a = Math.cos(e)),
        (o *= e = Math.sin(e)),
        this.mode === this.OBLIQ
          ? ((n = a * this.sinb1 + (l * e * this.cosb1) / r),
            (h = this.qp * n),
            (l = r * this.cosb1 * a - l * this.sinb1 * e))
          : ((n = (l * e) / r), (h = this.qp * n), (l = r * a)));
    } else if (this.mode === this.N_POLE || this.mode === this.S_POLE) {
      if ((this.mode === this.N_POLE && (l = -l), !(h = o * o + l * l)))
        return ((t.x = this.long0), (t.y = this.lat0), t);
      ((n = 1 - h / this.qp), this.mode === this.S_POLE && (n = -n));
    }
    ((s = Math.atan2(o, l)), (i = authlat(Math.asin(n), this.apa)));
  }
  return ((t.x = adjust_lon(this.long0 + s)), (t.y = i), t);
}
var P00 = 0.3333333333333333,
  P01 = 0.17222222222222222,
  P02 = 0.10257936507936508,
  P10 = 0.06388888888888888,
  P11 = 0.0664021164021164,
  P20 = 0.016415012942191543;
function authset(t) {
  var s,
    i = [];
  return (
    (i[0] = t * P00),
    (s = t * t),
    (i[0] += s * P01),
    (i[1] = s * P10),
    (s *= t),
    (i[0] += s * P02),
    (i[1] += s * P11),
    (i[2] = s * P20),
    i
  );
}
function authlat(t, s) {
  var i = t + t;
  return t + s[0] * Math.sin(i) + s[1] * Math.sin(i + i) + s[2] * Math.sin(i + i + i);
}
var names$i = ['Lambert Azimuthal Equal Area', 'Lambert_Azimuthal_Equal_Area', 'laea'],
  laea = {
    init: init$i,
    forward: forward$i,
    inverse: inverse$i,
    names: names$i,
    S_POLE,
    N_POLE,
    EQUIT,
    OBLIQ,
  };
function asinz(t) {
  return (Math.abs(t) > 1 && (t = t > 1 ? 1 : -1), Math.asin(t));
}
function init$h() {
  Math.abs(this.lat1 + this.lat2) < EPSLN ||
    ((this.temp = this.b / this.a),
    (this.es = 1 - Math.pow(this.temp, 2)),
    (this.e3 = Math.sqrt(this.es)),
    (this.sin_po = Math.sin(this.lat1)),
    (this.cos_po = Math.cos(this.lat1)),
    (this.t1 = this.sin_po),
    (this.con = this.sin_po),
    (this.ms1 = msfnz(this.e3, this.sin_po, this.cos_po)),
    (this.qs1 = qsfnz(this.e3, this.sin_po)),
    (this.sin_po = Math.sin(this.lat2)),
    (this.cos_po = Math.cos(this.lat2)),
    (this.t2 = this.sin_po),
    (this.ms2 = msfnz(this.e3, this.sin_po, this.cos_po)),
    (this.qs2 = qsfnz(this.e3, this.sin_po)),
    (this.sin_po = Math.sin(this.lat0)),
    (this.cos_po = Math.cos(this.lat0)),
    (this.t3 = this.sin_po),
    (this.qs0 = qsfnz(this.e3, this.sin_po)),
    Math.abs(this.lat1 - this.lat2) > EPSLN
      ? (this.ns0 = (this.ms1 * this.ms1 - this.ms2 * this.ms2) / (this.qs2 - this.qs1))
      : (this.ns0 = this.con),
    (this.c = this.ms1 * this.ms1 + this.ns0 * this.qs1),
    (this.rh = (this.a * Math.sqrt(this.c - this.ns0 * this.qs0)) / this.ns0));
}
function forward$h(t) {
  var s = t.x,
    i = t.y;
  ((this.sin_phi = Math.sin(i)), (this.cos_phi = Math.cos(i)));
  var a = qsfnz(this.e3, this.sin_phi),
    e = (this.a * Math.sqrt(this.c - this.ns0 * a)) / this.ns0,
    h = this.ns0 * adjust_lon(s - this.long0),
    r = e * Math.sin(h) + this.x0,
    n = this.rh - e * Math.cos(h) + this.y0;
  return ((t.x = r), (t.y = n), t);
}
function inverse$h(t) {
  var s, i, a, e, h, r;
  return (
    (t.x -= this.x0),
    (t.y = this.rh - t.y + this.y0),
    this.ns0 >= 0
      ? ((s = Math.sqrt(t.x * t.x + t.y * t.y)), (a = 1))
      : ((s = -Math.sqrt(t.x * t.x + t.y * t.y)), (a = -1)),
    (e = 0),
    0 !== s && (e = Math.atan2(a * t.x, a * t.y)),
    (a = (s * this.ns0) / this.a),
    this.sphere
      ? (r = Math.asin((this.c - a * a) / (2 * this.ns0)))
      : ((i = (this.c - a * a) / this.ns0), (r = this.phi1z(this.e3, i))),
    (h = adjust_lon(e / this.ns0 + this.long0)),
    (t.x = h),
    (t.y = r),
    t
  );
}
function phi1z(t, s) {
  var i,
    a,
    e,
    h,
    r = asinz(0.5 * s);
  if (t < EPSLN) return r;
  for (var n = t * t, o = 1; o <= 25; o++)
    if (
      ((r += h =
        ((0.5 * (e = 1 - (a = t * (i = Math.sin(r))) * a) * e) / Math.cos(r)) *
        (s / (1 - n) - i / e + (0.5 / t) * Math.log((1 - a) / (1 + a)))),
      Math.abs(h) <= 1e-7)
    )
      return r;
  return null;
}
var names$h = ['Albers_Conic_Equal_Area', 'Albers', 'aea'],
  aea = { init: init$h, forward: forward$h, inverse: inverse$h, names: names$h, phi1z };
function init$g() {
  ((this.sin_p14 = Math.sin(this.lat0)),
    (this.cos_p14 = Math.cos(this.lat0)),
    (this.infinity_dist = 1e3 * this.a),
    (this.rc = 1));
}
function forward$g(t) {
  var s,
    i,
    a,
    e,
    h,
    r,
    n,
    o = t.x,
    l = t.y;
  return (
    (a = adjust_lon(o - this.long0)),
    (s = Math.sin(l)),
    (i = Math.cos(l)),
    (e = Math.cos(a)),
    (h = this.sin_p14 * s + this.cos_p14 * i * e) > 0 || Math.abs(h) <= EPSLN
      ? ((r = this.x0 + (1 * this.a * i * Math.sin(a)) / h),
        (n = this.y0 + (1 * this.a * (this.cos_p14 * s - this.sin_p14 * i * e)) / h))
      : ((r = this.x0 + this.infinity_dist * i * Math.sin(a)),
        (n = this.y0 + this.infinity_dist * (this.cos_p14 * s - this.sin_p14 * i * e))),
    (t.x = r),
    (t.y = n),
    t
  );
}
function inverse$g(t) {
  var s, i, a, e, h, r;
  return (
    (t.x = (t.x - this.x0) / this.a),
    (t.y = (t.y - this.y0) / this.a),
    (t.x /= this.k0),
    (t.y /= this.k0),
    (s = Math.sqrt(t.x * t.x + t.y * t.y))
      ? ((e = Math.atan2(s, this.rc)),
        (i = Math.sin(e)),
        (r = asinz((a = Math.cos(e)) * this.sin_p14 + (t.y * i * this.cos_p14) / s)),
        (h = Math.atan2(t.x * i, s * this.cos_p14 * a - t.y * this.sin_p14 * i)),
        (h = adjust_lon(this.long0 + h)))
      : ((r = this.phic0), (h = 0)),
    (t.x = h),
    (t.y = r),
    t
  );
}
var names$g = ['gnom'],
  gnom = { init: init$g, forward: forward$g, inverse: inverse$g, names: names$g };
function iqsfnz(t, s) {
  var i = 1 - ((1 - t * t) / (2 * t)) * Math.log((1 - t) / (1 + t));
  if (Math.abs(Math.abs(s) - i) < 1e-6) return s < 0 ? -1 * HALF_PI : HALF_PI;
  for (var a, e, h, r, n = Math.asin(0.5 * s), o = 0; o < 30; o++)
    if (
      ((e = Math.sin(n)),
      (h = Math.cos(n)),
      (r = t * e),
      (n += a =
        (Math.pow(1 - r * r, 2) / (2 * h)) *
        (s / (1 - t * t) - e / (1 - r * r) + (0.5 / t) * Math.log((1 - r) / (1 + r)))),
      Math.abs(a) <= 1e-10)
    )
      return n;
  return NaN;
}
function init$f() {
  this.sphere || (this.k0 = msfnz(this.e, Math.sin(this.lat_ts), Math.cos(this.lat_ts)));
}
function forward$f(t) {
  var s,
    i,
    a = t.x,
    e = t.y,
    h = adjust_lon(a - this.long0);
  if (this.sphere)
    ((s = this.x0 + this.a * h * Math.cos(this.lat_ts)),
      (i = this.y0 + (this.a * Math.sin(e)) / Math.cos(this.lat_ts)));
  else {
    var r = qsfnz(this.e, Math.sin(e));
    ((s = this.x0 + this.a * this.k0 * h), (i = this.y0 + (this.a * r * 0.5) / this.k0));
  }
  return ((t.x = s), (t.y = i), t);
}
function inverse$f(t) {
  var s, i;
  return (
    (t.x -= this.x0),
    (t.y -= this.y0),
    this.sphere
      ? ((s = adjust_lon(this.long0 + t.x / this.a / Math.cos(this.lat_ts))),
        (i = Math.asin((t.y / this.a) * Math.cos(this.lat_ts))))
      : ((i = iqsfnz(this.e, (2 * t.y * this.k0) / this.a)),
        (s = adjust_lon(this.long0 + t.x / (this.a * this.k0)))),
    (t.x = s),
    (t.y = i),
    t
  );
}
var names$f = ['cea'],
  cea = { init: init$f, forward: forward$f, inverse: inverse$f, names: names$f };
function init$e() {
  ((this.x0 = this.x0 || 0),
    (this.y0 = this.y0 || 0),
    (this.lat0 = this.lat0 || 0),
    (this.long0 = this.long0 || 0),
    (this.lat_ts = this.lat_ts || 0),
    (this.title = this.title || 'Equidistant Cylindrical (Plate Carre)'),
    (this.rc = Math.cos(this.lat_ts)));
}
function forward$e(t) {
  var s = t.x,
    i = t.y,
    a = adjust_lon(s - this.long0),
    e = adjust_lat(i - this.lat0);
  return ((t.x = this.x0 + this.a * a * this.rc), (t.y = this.y0 + this.a * e), t);
}
function inverse$e(t) {
  var s = t.x,
    i = t.y;
  return (
    (t.x = adjust_lon(this.long0 + (s - this.x0) / (this.a * this.rc))),
    (t.y = adjust_lat(this.lat0 + (i - this.y0) / this.a)),
    t
  );
}
var names$e = ['Equirectangular', 'Equidistant_Cylindrical', 'eqc'],
  eqc = { init: init$e, forward: forward$e, inverse: inverse$e, names: names$e },
  MAX_ITER$1 = 20;
function init$d() {
  ((this.temp = this.b / this.a),
    (this.es = 1 - Math.pow(this.temp, 2)),
    (this.e = Math.sqrt(this.es)),
    (this.e0 = e0fn(this.es)),
    (this.e1 = e1fn(this.es)),
    (this.e2 = e2fn(this.es)),
    (this.e3 = e3fn(this.es)),
    (this.ml0 = this.a * mlfn(this.e0, this.e1, this.e2, this.e3, this.lat0)));
}
function forward$d(t) {
  var s,
    i,
    a,
    e = t.x,
    h = t.y,
    r = adjust_lon(e - this.long0);
  if (((a = r * Math.sin(h)), this.sphere))
    Math.abs(h) <= EPSLN
      ? ((s = this.a * r), (i = -1 * this.a * this.lat0))
      : ((s = (this.a * Math.sin(a)) / Math.tan(h)),
        (i = this.a * (adjust_lat(h - this.lat0) + (1 - Math.cos(a)) / Math.tan(h))));
  else if (Math.abs(h) <= EPSLN) ((s = this.a * r), (i = -1 * this.ml0));
  else {
    var n = gN(this.a, this.e, Math.sin(h)) / Math.tan(h);
    ((s = n * Math.sin(a)),
      (i =
        this.a * mlfn(this.e0, this.e1, this.e2, this.e3, h) - this.ml0 + n * (1 - Math.cos(a))));
  }
  return ((t.x = s + this.x0), (t.y = i + this.y0), t);
}
function inverse$d(t) {
  var s, i, a, e, h, r, n, o, l;
  if (((a = t.x - this.x0), (e = t.y - this.y0), this.sphere))
    if (Math.abs(e + this.a * this.lat0) <= EPSLN)
      ((s = adjust_lon(a / this.a + this.long0)), (i = 0));
    else {
      var c;
      for (
        r = this.lat0 + e / this.a, n = (a * a) / this.a / this.a + r * r, o = r, h = MAX_ITER$1;
        h;
        --h
      )
        if (
          ((o += l =
            (-1 * (r * (o * (c = Math.tan(o)) + 1) - o - 0.5 * (o * o + n) * c)) /
            ((o - r) / c - 1)),
          Math.abs(l) <= EPSLN)
        ) {
          i = o;
          break;
        }
      s = adjust_lon(this.long0 + Math.asin((a * Math.tan(o)) / this.a) / Math.sin(i));
    }
  else if (Math.abs(e + this.ml0) <= EPSLN) ((i = 0), (s = adjust_lon(this.long0 + a / this.a)));
  else {
    var u, f, d, M, p;
    for (
      r = (this.ml0 + e) / this.a, n = (a * a) / this.a / this.a + r * r, o = r, h = MAX_ITER$1;
      h;
      --h
    )
      if (
        ((p = this.e * Math.sin(o)),
        (u = Math.sqrt(1 - p * p) * Math.tan(o)),
        (f = this.a * mlfn(this.e0, this.e1, this.e2, this.e3, o)),
        (d =
          this.e0 -
          2 * this.e1 * Math.cos(2 * o) +
          4 * this.e2 * Math.cos(4 * o) -
          6 * this.e3 * Math.cos(6 * o)),
        (o -= l =
          (r * (u * (M = f / this.a) + 1) - M - 0.5 * u * (M * M + n)) /
          ((this.es * Math.sin(2 * o) * (M * M + n - 2 * r * M)) / (4 * u) +
            (r - M) * (u * d - 2 / Math.sin(2 * o)) -
            d)),
        Math.abs(l) <= EPSLN)
      ) {
        i = o;
        break;
      }
    ((u = Math.sqrt(1 - this.es * Math.pow(Math.sin(i), 2)) * Math.tan(i)),
      (s = adjust_lon(this.long0 + Math.asin((a * u) / this.a) / Math.sin(i))));
  }
  return ((t.x = s), (t.y = i), t);
}
var names$d = ['Polyconic', 'poly'],
  poly = { init: init$d, forward: forward$d, inverse: inverse$d, names: names$d };
function init$c() {
  ((this.A = []),
    (this.A[1] = 0.6399175073),
    (this.A[2] = -0.1358797613),
    (this.A[3] = 0.063294409),
    (this.A[4] = -0.02526853),
    (this.A[5] = 0.0117879),
    (this.A[6] = -0.0055161),
    (this.A[7] = 0.0026906),
    (this.A[8] = -0.001333),
    (this.A[9] = 67e-5),
    (this.A[10] = -34e-5),
    (this.B_re = []),
    (this.B_im = []),
    (this.B_re[1] = 0.7557853228),
    (this.B_im[1] = 0),
    (this.B_re[2] = 0.249204646),
    (this.B_im[2] = 0.003371507),
    (this.B_re[3] = -0.001541739),
    (this.B_im[3] = 0.04105856),
    (this.B_re[4] = -0.10162907),
    (this.B_im[4] = 0.01727609),
    (this.B_re[5] = -0.26623489),
    (this.B_im[5] = -0.36249218),
    (this.B_re[6] = -0.6870983),
    (this.B_im[6] = -1.1651967),
    (this.C_re = []),
    (this.C_im = []),
    (this.C_re[1] = 1.3231270439),
    (this.C_im[1] = 0),
    (this.C_re[2] = -0.577245789),
    (this.C_im[2] = -0.007809598),
    (this.C_re[3] = 0.508307513),
    (this.C_im[3] = -0.112208952),
    (this.C_re[4] = -0.15094762),
    (this.C_im[4] = 0.18200602),
    (this.C_re[5] = 1.01418179),
    (this.C_im[5] = 1.64497696),
    (this.C_re[6] = 1.9660549),
    (this.C_im[6] = 2.5127645),
    (this.D = []),
    (this.D[1] = 1.5627014243),
    (this.D[2] = 0.5185406398),
    (this.D[3] = -0.03333098),
    (this.D[4] = -0.1052906),
    (this.D[5] = -0.0368594),
    (this.D[6] = 0.007317),
    (this.D[7] = 0.0122),
    (this.D[8] = 0.00394),
    (this.D[9] = -0.0013));
}
function forward$c(t) {
  var s,
    i = t.x,
    a = t.y - this.lat0,
    e = i - this.long0,
    h = (a / SEC_TO_RAD) * 1e-5,
    r = e,
    n = 1,
    o = 0;
  for (s = 1; s <= 10; s++) ((n *= h), (o += this.A[s] * n));
  var l,
    c = o,
    u = r,
    f = 1,
    d = 0,
    M = 0,
    p = 0;
  for (s = 1; s <= 6; s++)
    ((l = d * c + f * u),
      (f = f * c - d * u),
      (d = l),
      (M = M + this.B_re[s] * f - this.B_im[s] * d),
      (p = p + this.B_im[s] * f + this.B_re[s] * d));
  return ((t.x = p * this.a + this.x0), (t.y = M * this.a + this.y0), t);
}
function inverse$c(t) {
  var s,
    i,
    a = t.x,
    e = t.y,
    h = a - this.x0,
    r = (e - this.y0) / this.a,
    n = h / this.a,
    o = 1,
    l = 0,
    c = 0,
    u = 0;
  for (s = 1; s <= 6; s++)
    ((i = l * r + o * n),
      (o = o * r - l * n),
      (l = i),
      (c = c + this.C_re[s] * o - this.C_im[s] * l),
      (u = u + this.C_im[s] * o + this.C_re[s] * l));
  for (var f = 0; f < this.iterations; f++) {
    var d,
      M = c,
      p = u,
      _ = r,
      m = n;
    for (s = 2; s <= 6; s++)
      ((d = p * c + M * u),
        (M = M * c - p * u),
        (p = d),
        (_ += (s - 1) * (this.B_re[s] * M - this.B_im[s] * p)),
        (m += (s - 1) * (this.B_im[s] * M + this.B_re[s] * p)));
    ((M = 1), (p = 0));
    var y = this.B_re[1],
      g = this.B_im[1];
    for (s = 2; s <= 6; s++)
      ((d = p * c + M * u),
        (M = M * c - p * u),
        (p = d),
        (y += s * (this.B_re[s] * M - this.B_im[s] * p)),
        (g += s * (this.B_im[s] * M + this.B_re[s] * p)));
    var x = y * y + g * g;
    ((c = (_ * y + m * g) / x), (u = (m * y - _ * g) / x));
  }
  var v = c,
    P = u,
    E = 1,
    b = 0;
  for (s = 1; s <= 9; s++) ((E *= v), (b += this.D[s] * E));
  var A = this.lat0 + b * SEC_TO_RAD * 1e5,
    S = this.long0 + P;
  return ((t.x = S), (t.y = A), t);
}
var names$c = ['New_Zealand_Map_Grid', 'nzmg'],
  nzmg = { init: init$c, forward: forward$c, inverse: inverse$c, names: names$c };
function init$b() {}
function forward$b(t) {
  var s = t.x,
    i = t.y,
    a = adjust_lon(s - this.long0),
    e = this.x0 + this.a * a,
    h = this.y0 + this.a * Math.log(Math.tan(Math.PI / 4 + i / 2.5)) * 1.25;
  return ((t.x = e), (t.y = h), t);
}
function inverse$b(t) {
  ((t.x -= this.x0), (t.y -= this.y0));
  var s = adjust_lon(this.long0 + t.x / this.a),
    i = 2.5 * (Math.atan(Math.exp((0.8 * t.y) / this.a)) - Math.PI / 4);
  return ((t.x = s), (t.y = i), t);
}
var names$b = ['Miller_Cylindrical', 'mill'],
  mill = { init: init$b, forward: forward$b, inverse: inverse$b, names: names$b },
  MAX_ITER = 20;
function init$a() {
  this.sphere
    ? ((this.n = 1),
      (this.m = 0),
      (this.es = 0),
      (this.C_y = Math.sqrt((this.m + 1) / this.n)),
      (this.C_x = this.C_y / (this.m + 1)))
    : (this.en = pj_enfn(this.es));
}
function forward$a(t) {
  var s,
    i,
    a = t.x,
    e = t.y;
  if (((a = adjust_lon(a - this.long0)), this.sphere)) {
    if (this.m)
      for (var h = this.n * Math.sin(e), r = MAX_ITER; r; --r) {
        var n = (this.m * e + Math.sin(e) - h) / (this.m + Math.cos(e));
        if (((e -= n), Math.abs(n) < EPSLN)) break;
      }
    else e = 1 !== this.n ? Math.asin(this.n * Math.sin(e)) : e;
    ((s = this.a * this.C_x * a * (this.m + Math.cos(e))), (i = this.a * this.C_y * e));
  } else {
    var o = Math.sin(e),
      l = Math.cos(e);
    ((i = this.a * pj_mlfn(e, o, l, this.en)),
      (s = (this.a * a * l) / Math.sqrt(1 - this.es * o * o)));
  }
  return ((t.x = s), (t.y = i), t);
}
function inverse$a(t) {
  var s, i, a;
  return (
    (t.x -= this.x0),
    (i = t.x / this.a),
    (t.y -= this.y0),
    (s = t.y / this.a),
    this.sphere
      ? ((s /= this.C_y),
        (i /= this.C_x * (this.m + Math.cos(s))),
        this.m
          ? (s = asinz((this.m * s + Math.sin(s)) / this.n))
          : 1 !== this.n && (s = asinz(Math.sin(s) / this.n)),
        (i = adjust_lon(i + this.long0)),
        (s = adjust_lat(s)))
      : ((s = pj_inv_mlfn(t.y / this.a, this.es, this.en)),
        (a = Math.abs(s)) < HALF_PI
          ? ((a = Math.sin(s)),
            (i = adjust_lon(
              this.long0 + (t.x * Math.sqrt(1 - this.es * a * a)) / (this.a * Math.cos(s))
            )))
          : a - EPSLN < HALF_PI && (i = this.long0)),
    (t.x = i),
    (t.y = s),
    t
  );
}
var names$a = ['Sinusoidal', 'sinu'],
  sinu = { init: init$a, forward: forward$a, inverse: inverse$a, names: names$a };
function init$9() {}
function forward$9(t) {
  for (var s = t.x, i = t.y, a = adjust_lon(s - this.long0), e = i, h = Math.PI * Math.sin(i); ; ) {
    var r = -(e + Math.sin(e) - h) / (1 + Math.cos(e));
    if (((e += r), Math.abs(r) < EPSLN)) break;
  }
  ((e /= 2), Math.PI / 2 - Math.abs(i) < EPSLN && (a = 0));
  var n = 0.900316316158 * this.a * a * Math.cos(e) + this.x0,
    o = 1.4142135623731 * this.a * Math.sin(e) + this.y0;
  return ((t.x = n), (t.y = o), t);
}
function inverse$9(t) {
  var s, i;
  ((t.x -= this.x0),
    (t.y -= this.y0),
    (i = t.y / (1.4142135623731 * this.a)),
    Math.abs(i) > 0.999999999999 && (i = 0.999999999999),
    (s = Math.asin(i)));
  var a = adjust_lon(this.long0 + t.x / (0.900316316158 * this.a * Math.cos(s)));
  (a < -Math.PI && (a = -Math.PI),
    a > Math.PI && (a = Math.PI),
    (i = (2 * s + Math.sin(2 * s)) / Math.PI),
    Math.abs(i) > 1 && (i = 1));
  var e = Math.asin(i);
  return ((t.x = a), (t.y = e), t);
}
var names$9 = ['Mollweide', 'moll'],
  moll = { init: init$9, forward: forward$9, inverse: inverse$9, names: names$9 };
function init$8() {
  Math.abs(this.lat1 + this.lat2) < EPSLN ||
    ((this.lat2 = this.lat2 || this.lat1),
    (this.temp = this.b / this.a),
    (this.es = 1 - Math.pow(this.temp, 2)),
    (this.e = Math.sqrt(this.es)),
    (this.e0 = e0fn(this.es)),
    (this.e1 = e1fn(this.es)),
    (this.e2 = e2fn(this.es)),
    (this.e3 = e3fn(this.es)),
    (this.sinphi = Math.sin(this.lat1)),
    (this.cosphi = Math.cos(this.lat1)),
    (this.ms1 = msfnz(this.e, this.sinphi, this.cosphi)),
    (this.ml1 = mlfn(this.e0, this.e1, this.e2, this.e3, this.lat1)),
    Math.abs(this.lat1 - this.lat2) < EPSLN
      ? (this.ns = this.sinphi)
      : ((this.sinphi = Math.sin(this.lat2)),
        (this.cosphi = Math.cos(this.lat2)),
        (this.ms2 = msfnz(this.e, this.sinphi, this.cosphi)),
        (this.ml2 = mlfn(this.e0, this.e1, this.e2, this.e3, this.lat2)),
        (this.ns = (this.ms1 - this.ms2) / (this.ml2 - this.ml1))),
    (this.g = this.ml1 + this.ms1 / this.ns),
    (this.ml0 = mlfn(this.e0, this.e1, this.e2, this.e3, this.lat0)),
    (this.rh = this.a * (this.g - this.ml0)));
}
function forward$8(t) {
  var s,
    i = t.x,
    a = t.y;
  if (this.sphere) s = this.a * (this.g - a);
  else {
    var e = mlfn(this.e0, this.e1, this.e2, this.e3, a);
    s = this.a * (this.g - e);
  }
  var h = this.ns * adjust_lon(i - this.long0),
    r = this.x0 + s * Math.sin(h),
    n = this.y0 + this.rh - s * Math.cos(h);
  return ((t.x = r), (t.y = n), t);
}
function inverse$8(t) {
  var s, i, a, e;
  ((t.x -= this.x0),
    (t.y = this.rh - t.y + this.y0),
    this.ns >= 0
      ? ((i = Math.sqrt(t.x * t.x + t.y * t.y)), (s = 1))
      : ((i = -Math.sqrt(t.x * t.x + t.y * t.y)), (s = -1)));
  var h = 0;
  return (
    0 !== i && (h = Math.atan2(s * t.x, s * t.y)),
    this.sphere
      ? ((e = adjust_lon(this.long0 + h / this.ns)),
        (a = adjust_lat(this.g - i / this.a)),
        (t.x = e),
        (t.y = a),
        t)
      : ((a = imlfn(this.g - i / this.a, this.e0, this.e1, this.e2, this.e3)),
        (e = adjust_lon(this.long0 + h / this.ns)),
        (t.x = e),
        (t.y = a),
        t)
  );
}
var names$8 = ['Equidistant_Conic', 'eqdc'],
  eqdc = { init: init$8, forward: forward$8, inverse: inverse$8, names: names$8 };
function init$7() {
  this.R = this.a;
}
function forward$7(t) {
  var s,
    i,
    a = t.x,
    e = t.y,
    h = adjust_lon(a - this.long0);
  Math.abs(e) <= EPSLN && ((s = this.x0 + this.R * h), (i = this.y0));
  var r = asinz(2 * Math.abs(e / Math.PI));
  (Math.abs(h) <= EPSLN || Math.abs(Math.abs(e) - HALF_PI) <= EPSLN) &&
    ((s = this.x0),
    (i =
      e >= 0
        ? this.y0 + Math.PI * this.R * Math.tan(0.5 * r)
        : this.y0 + Math.PI * this.R * -Math.tan(0.5 * r)));
  var n = 0.5 * Math.abs(Math.PI / h - h / Math.PI),
    o = n * n,
    l = Math.sin(r),
    c = Math.cos(r),
    u = c / (l + c - 1),
    f = u * u,
    d = u * (2 / l - 1),
    M = d * d,
    p =
      (Math.PI * this.R * (n * (u - M) + Math.sqrt(o * (u - M) * (u - M) - (M + o) * (f - M)))) /
      (M + o);
  (h < 0 && (p = -p), (s = this.x0 + p));
  var _ = o + u;
  return (
    (p = (Math.PI * this.R * (d * _ - n * Math.sqrt((M + o) * (o + 1) - _ * _))) / (M + o)),
    (i = e >= 0 ? this.y0 + p : this.y0 - p),
    (t.x = s),
    (t.y = i),
    t
  );
}
function inverse$7(t) {
  var s, i, a, e, h, r, n, o, l, c, u, f;
  return (
    (t.x -= this.x0),
    (t.y -= this.y0),
    (u = Math.PI * this.R),
    (h = (a = t.x / u) * a + (e = t.y / u) * e),
    (u =
      (3 *
        ((e * e) / (o = -2 * (r = -Math.abs(e) * (1 + h)) + 1 + 2 * e * e + h * h) +
          ((2 * (n = r - 2 * e * e + a * a) * n * n) / o / o / o - (9 * r * n) / o / o) / 27)) /
      (l = (r - (n * n) / 3 / o) / o) /
      (c = 2 * Math.sqrt(-l / 3))),
    Math.abs(u) > 1 && (u = u >= 0 ? 1 : -1),
    (f = Math.acos(u) / 3),
    (i =
      t.y >= 0
        ? (-c * Math.cos(f + Math.PI / 3) - n / 3 / o) * Math.PI
        : -(-c * Math.cos(f + Math.PI / 3) - n / 3 / o) * Math.PI),
    (s =
      Math.abs(a) < EPSLN
        ? this.long0
        : adjust_lon(
            this.long0 + (Math.PI * (h - 1 + Math.sqrt(1 + 2 * (a * a - e * e) + h * h))) / 2 / a
          )),
    (t.x = s),
    (t.y = i),
    t
  );
}
var names$7 = ['Van_der_Grinten_I', 'VanDerGrinten', 'vandg'],
  vandg = { init: init$7, forward: forward$7, inverse: inverse$7, names: names$7 };
function init$6() {
  ((this.sin_p12 = Math.sin(this.lat0)), (this.cos_p12 = Math.cos(this.lat0)));
}
function forward$6(t) {
  var s,
    i,
    a,
    e,
    h,
    r,
    n,
    o,
    l,
    c,
    u,
    f,
    d,
    M,
    p,
    _,
    m,
    y,
    g,
    x,
    v,
    P,
    E = t.x,
    b = t.y,
    A = Math.sin(t.y),
    S = Math.cos(t.y),
    w = adjust_lon(E - this.long0);
  return this.sphere
    ? Math.abs(this.sin_p12 - 1) <= EPSLN
      ? ((t.x = this.x0 + this.a * (HALF_PI - b) * Math.sin(w)),
        (t.y = this.y0 - this.a * (HALF_PI - b) * Math.cos(w)),
        t)
      : Math.abs(this.sin_p12 + 1) <= EPSLN
        ? ((t.x = this.x0 + this.a * (HALF_PI + b) * Math.sin(w)),
          (t.y = this.y0 + this.a * (HALF_PI + b) * Math.cos(w)),
          t)
        : ((y = this.sin_p12 * A + this.cos_p12 * S * Math.cos(w)),
          (m = (_ = Math.acos(y)) ? _ / Math.sin(_) : 1),
          (t.x = this.x0 + this.a * m * S * Math.sin(w)),
          (t.y = this.y0 + this.a * m * (this.cos_p12 * A - this.sin_p12 * S * Math.cos(w))),
          t)
    : ((s = e0fn(this.es)),
      (i = e1fn(this.es)),
      (a = e2fn(this.es)),
      (e = e3fn(this.es)),
      Math.abs(this.sin_p12 - 1) <= EPSLN
        ? ((h = this.a * mlfn(s, i, a, e, HALF_PI)),
          (r = this.a * mlfn(s, i, a, e, b)),
          (t.x = this.x0 + (h - r) * Math.sin(w)),
          (t.y = this.y0 - (h - r) * Math.cos(w)),
          t)
        : Math.abs(this.sin_p12 + 1) <= EPSLN
          ? ((h = this.a * mlfn(s, i, a, e, HALF_PI)),
            (r = this.a * mlfn(s, i, a, e, b)),
            (t.x = this.x0 + (h + r) * Math.sin(w)),
            (t.y = this.y0 + (h + r) * Math.cos(w)),
            t)
          : ((n = A / S),
            (o = gN(this.a, this.e, this.sin_p12)),
            (l = gN(this.a, this.e, A)),
            (c = Math.atan((1 - this.es) * n + (this.es * o * this.sin_p12) / (l * S))),
            (g =
              0 ===
              (u = Math.atan2(Math.sin(w), this.cos_p12 * Math.tan(c) - this.sin_p12 * Math.cos(w)))
                ? Math.asin(this.cos_p12 * Math.sin(c) - this.sin_p12 * Math.cos(c))
                : Math.abs(Math.abs(u) - Math.PI) <= EPSLN
                  ? -Math.asin(this.cos_p12 * Math.sin(c) - this.sin_p12 * Math.cos(c))
                  : Math.asin((Math.sin(w) * Math.cos(c)) / Math.sin(u))),
            (f = (this.e * this.sin_p12) / Math.sqrt(1 - this.es)),
            (_ =
              o *
              g *
              (1 -
                ((x = g * g) *
                  (p = (d = (this.e * this.cos_p12 * Math.cos(u)) / Math.sqrt(1 - this.es)) * d) *
                  (1 - p)) /
                  6 +
                ((v = x * g) / 8) * (M = f * d) * (1 - 2 * p) +
                ((P = v * g) / 120) * (p * (4 - 7 * p) - 3 * f * f * (1 - 7 * p)) -
                ((P * g) / 48) * M)),
            (t.x = this.x0 + _ * Math.sin(u)),
            (t.y = this.y0 + _ * Math.cos(u)),
            t));
}
function inverse$6(t) {
  var s, i, a, e, h, r, n, o, l, c, u, f, d, M, p, _, m, y, g, x, v, P, E;
  if (((t.x -= this.x0), (t.y -= this.y0), this.sphere)) {
    if ((s = Math.sqrt(t.x * t.x + t.y * t.y)) > 2 * HALF_PI * this.a) return;
    return (
      (i = s / this.a),
      (a = Math.sin(i)),
      (e = Math.cos(i)),
      (h = this.long0),
      Math.abs(s) <= EPSLN
        ? (r = this.lat0)
        : ((r = asinz(e * this.sin_p12 + (t.y * a * this.cos_p12) / s)),
          (n = Math.abs(this.lat0) - HALF_PI),
          (h =
            Math.abs(n) <= EPSLN
              ? this.lat0 >= 0
                ? adjust_lon(this.long0 + Math.atan2(t.x, -t.y))
                : adjust_lon(this.long0 - Math.atan2(-t.x, t.y))
              : adjust_lon(
                  this.long0 + Math.atan2(t.x * a, s * this.cos_p12 * e - t.y * this.sin_p12 * a)
                ))),
      (t.x = h),
      (t.y = r),
      t
    );
  }
  return (
    (o = e0fn(this.es)),
    (l = e1fn(this.es)),
    (c = e2fn(this.es)),
    (u = e3fn(this.es)),
    Math.abs(this.sin_p12 - 1) <= EPSLN
      ? ((r = imlfn(
          ((f = this.a * mlfn(o, l, c, u, HALF_PI)) - (s = Math.sqrt(t.x * t.x + t.y * t.y))) /
            this.a,
          o,
          l,
          c,
          u
        )),
        (h = adjust_lon(this.long0 + Math.atan2(t.x, -1 * t.y))),
        (t.x = h),
        (t.y = r),
        t)
      : Math.abs(this.sin_p12 + 1) <= EPSLN
        ? ((f = this.a * mlfn(o, l, c, u, HALF_PI)),
          (r = imlfn(((s = Math.sqrt(t.x * t.x + t.y * t.y)) - f) / this.a, o, l, c, u)),
          (h = adjust_lon(this.long0 + Math.atan2(t.x, t.y))),
          (t.x = h),
          (t.y = r),
          t)
        : ((s = Math.sqrt(t.x * t.x + t.y * t.y)),
          (p = Math.atan2(t.x, t.y)),
          (d = gN(this.a, this.e, this.sin_p12)),
          (_ = Math.cos(p)),
          (y = (-(m = this.e * this.cos_p12 * _) * m) / (1 - this.es)),
          (g = (3 * this.es * (1 - y) * this.sin_p12 * this.cos_p12 * _) / (1 - this.es)),
          (P =
            1 -
            (y *
              (v =
                (x = s / d) -
                (y * (1 + y) * Math.pow(x, 3)) / 6 -
                (g * (1 + 3 * y) * Math.pow(x, 4)) / 24) *
              v) /
              2 -
            (x * v * v * v) / 6),
          (M = Math.asin(this.sin_p12 * Math.cos(v) + this.cos_p12 * Math.sin(v) * _)),
          (h = adjust_lon(this.long0 + Math.asin((Math.sin(p) * Math.sin(v)) / Math.cos(M)))),
          (E = Math.sin(M)),
          (r = Math.atan2((E - this.es * P * this.sin_p12) * Math.tan(M), E * (1 - this.es))),
          (t.x = h),
          (t.y = r),
          t)
  );
}
var names$6 = ['Azimuthal_Equidistant', 'aeqd'],
  aeqd = { init: init$6, forward: forward$6, inverse: inverse$6, names: names$6 };
function init$5() {
  ((this.sin_p14 = Math.sin(this.lat0)), (this.cos_p14 = Math.cos(this.lat0)));
}
function forward$5(t) {
  var s,
    i,
    a,
    e,
    h,
    r,
    n,
    o = t.x,
    l = t.y;
  return (
    (a = adjust_lon(o - this.long0)),
    (s = Math.sin(l)),
    (i = Math.cos(l)),
    (e = Math.cos(a)),
    ((h = this.sin_p14 * s + this.cos_p14 * i * e) > 0 || Math.abs(h) <= EPSLN) &&
      ((r = 1 * this.a * i * Math.sin(a)),
      (n = this.y0 + 1 * this.a * (this.cos_p14 * s - this.sin_p14 * i * e))),
    (t.x = r),
    (t.y = n),
    t
  );
}
function inverse$5(t) {
  var s, i, a, e, h, r, n;
  return (
    (t.x -= this.x0),
    (t.y -= this.y0),
    (i = asinz((s = Math.sqrt(t.x * t.x + t.y * t.y)) / this.a)),
    (a = Math.sin(i)),
    (e = Math.cos(i)),
    (r = this.long0),
    Math.abs(s) <= EPSLN
      ? ((n = this.lat0), (t.x = r), (t.y = n), t)
      : ((n = asinz(e * this.sin_p14 + (t.y * a * this.cos_p14) / s)),
        (h = Math.abs(this.lat0) - HALF_PI),
        Math.abs(h) <= EPSLN
          ? ((r =
              this.lat0 >= 0
                ? adjust_lon(this.long0 + Math.atan2(t.x, -t.y))
                : adjust_lon(this.long0 - Math.atan2(-t.x, t.y))),
            (t.x = r),
            (t.y = n),
            t)
          : ((r = adjust_lon(
              this.long0 + Math.atan2(t.x * a, s * this.cos_p14 * e - t.y * this.sin_p14 * a)
            )),
            (t.x = r),
            (t.y = n),
            t))
  );
}
var names$5 = ['ortho'],
  ortho = { init: init$5, forward: forward$5, inverse: inverse$5, names: names$5 },
  FACE_ENUM = { FRONT: 1, RIGHT: 2, BACK: 3, LEFT: 4, TOP: 5, BOTTOM: 6 },
  AREA_ENUM = { AREA_0: 1, AREA_1: 2, AREA_2: 3, AREA_3: 4 };
function init$4() {
  ((this.x0 = this.x0 || 0),
    (this.y0 = this.y0 || 0),
    (this.lat0 = this.lat0 || 0),
    (this.long0 = this.long0 || 0),
    (this.lat_ts = this.lat_ts || 0),
    (this.title = this.title || 'Quadrilateralized Spherical Cube'),
    this.lat0 >= HALF_PI - FORTPI / 2
      ? (this.face = FACE_ENUM.TOP)
      : this.lat0 <= -(HALF_PI - FORTPI / 2)
        ? (this.face = FACE_ENUM.BOTTOM)
        : Math.abs(this.long0) <= FORTPI
          ? (this.face = FACE_ENUM.FRONT)
          : Math.abs(this.long0) <= HALF_PI + FORTPI
            ? (this.face = this.long0 > 0 ? FACE_ENUM.RIGHT : FACE_ENUM.LEFT)
            : (this.face = FACE_ENUM.BACK),
    0 !== this.es &&
      ((this.one_minus_f = 1 - (this.a - this.b) / this.a),
      (this.one_minus_f_squared = this.one_minus_f * this.one_minus_f)));
}
function forward$4(t) {
  var s,
    i,
    a,
    e,
    h,
    r,
    n = { x: 0, y: 0 },
    o = { value: 0 };
  if (
    ((t.x -= this.long0),
    (s = 0 !== this.es ? Math.atan(this.one_minus_f_squared * Math.tan(t.y)) : t.y),
    (i = t.x),
    this.face === FACE_ENUM.TOP)
  )
    ((e = HALF_PI - s),
      i >= FORTPI && i <= HALF_PI + FORTPI
        ? ((o.value = AREA_ENUM.AREA_0), (a = i - HALF_PI))
        : i > HALF_PI + FORTPI || i <= -(HALF_PI + FORTPI)
          ? ((o.value = AREA_ENUM.AREA_1), (a = i > 0 ? i - SPI : i + SPI))
          : i > -(HALF_PI + FORTPI) && i <= -FORTPI
            ? ((o.value = AREA_ENUM.AREA_2), (a = i + HALF_PI))
            : ((o.value = AREA_ENUM.AREA_3), (a = i)));
  else if (this.face === FACE_ENUM.BOTTOM)
    ((e = HALF_PI + s),
      i >= FORTPI && i <= HALF_PI + FORTPI
        ? ((o.value = AREA_ENUM.AREA_0), (a = -i + HALF_PI))
        : i < FORTPI && i >= -FORTPI
          ? ((o.value = AREA_ENUM.AREA_1), (a = -i))
          : i < -FORTPI && i >= -(HALF_PI + FORTPI)
            ? ((o.value = AREA_ENUM.AREA_2), (a = -i - HALF_PI))
            : ((o.value = AREA_ENUM.AREA_3), (a = i > 0 ? -i + SPI : -i - SPI)));
  else {
    var l, c, u, f, d, M;
    (this.face === FACE_ENUM.RIGHT
      ? (i = qsc_shift_lon_origin(i, +HALF_PI))
      : this.face === FACE_ENUM.BACK
        ? (i = qsc_shift_lon_origin(i, +SPI))
        : this.face === FACE_ENUM.LEFT && (i = qsc_shift_lon_origin(i, -HALF_PI)),
      (f = Math.sin(s)),
      (d = Math.cos(s)),
      (M = Math.sin(i)),
      (l = d * Math.cos(i)),
      (c = d * M),
      (u = f),
      this.face === FACE_ENUM.FRONT
        ? (a = qsc_fwd_equat_face_theta((e = Math.acos(l)), u, c, o))
        : this.face === FACE_ENUM.RIGHT
          ? (a = qsc_fwd_equat_face_theta((e = Math.acos(c)), u, -l, o))
          : this.face === FACE_ENUM.BACK
            ? (a = qsc_fwd_equat_face_theta((e = Math.acos(-l)), u, -c, o))
            : this.face === FACE_ENUM.LEFT
              ? (a = qsc_fwd_equat_face_theta((e = Math.acos(-c)), u, l, o))
              : ((e = a = 0), (o.value = AREA_ENUM.AREA_0)));
  }
  return (
    (r = Math.atan((12 / SPI) * (a + Math.acos(Math.sin(a) * Math.cos(FORTPI)) - HALF_PI))),
    (h = Math.sqrt(
      (1 - Math.cos(e)) / (Math.cos(r) * Math.cos(r)) / (1 - Math.cos(Math.atan(1 / Math.cos(a))))
    )),
    o.value === AREA_ENUM.AREA_1
      ? (r += HALF_PI)
      : o.value === AREA_ENUM.AREA_2
        ? (r += SPI)
        : o.value === AREA_ENUM.AREA_3 && (r += 1.5 * SPI),
    (n.x = h * Math.cos(r)),
    (n.y = h * Math.sin(r)),
    (n.x = n.x * this.a + this.x0),
    (n.y = n.y * this.a + this.y0),
    (t.x = n.x),
    (t.y = n.y),
    t
  );
}
function inverse$4(t) {
  var s,
    i,
    a,
    e,
    h,
    r,
    n,
    o,
    l,
    c,
    u,
    f,
    d = { lam: 0, phi: 0 },
    M = { value: 0 };
  if (
    ((t.x = (t.x - this.x0) / this.a),
    (t.y = (t.y - this.y0) / this.a),
    (i = Math.atan(Math.sqrt(t.x * t.x + t.y * t.y))),
    (s = Math.atan2(t.y, t.x)),
    t.x >= 0 && t.x >= Math.abs(t.y)
      ? (M.value = AREA_ENUM.AREA_0)
      : t.y >= 0 && t.y >= Math.abs(t.x)
        ? ((M.value = AREA_ENUM.AREA_1), (s -= HALF_PI))
        : t.x < 0 && -t.x >= Math.abs(t.y)
          ? ((M.value = AREA_ENUM.AREA_2), (s = s < 0 ? s + SPI : s - SPI))
          : ((M.value = AREA_ENUM.AREA_3), (s += HALF_PI)),
    (l = (SPI / 12) * Math.tan(s)),
    (h = Math.sin(l) / (Math.cos(l) - 1 / Math.sqrt(2))),
    (r = Math.atan(h)),
    (n =
      1 -
      (a = Math.cos(s)) * a * (e = Math.tan(i)) * e * (1 - Math.cos(Math.atan(1 / Math.cos(r))))) <
    -1
      ? (n = -1)
      : n > 1 && (n = 1),
    this.face === FACE_ENUM.TOP)
  )
    ((o = Math.acos(n)),
      (d.phi = HALF_PI - o),
      M.value === AREA_ENUM.AREA_0
        ? (d.lam = r + HALF_PI)
        : M.value === AREA_ENUM.AREA_1
          ? (d.lam = r < 0 ? r + SPI : r - SPI)
          : M.value === AREA_ENUM.AREA_2
            ? (d.lam = r - HALF_PI)
            : (d.lam = r));
  else if (this.face === FACE_ENUM.BOTTOM)
    ((o = Math.acos(n)),
      (d.phi = o - HALF_PI),
      M.value === AREA_ENUM.AREA_0
        ? (d.lam = -r + HALF_PI)
        : M.value === AREA_ENUM.AREA_1
          ? (d.lam = -r)
          : M.value === AREA_ENUM.AREA_2
            ? (d.lam = -r - HALF_PI)
            : (d.lam = r < 0 ? -r - SPI : -r + SPI));
  else {
    var p, _, m;
    ((l = (p = n) * p),
      (_ =
        (l += (m = l >= 1 ? 0 : Math.sqrt(1 - l) * Math.sin(r)) * m) >= 1 ? 0 : Math.sqrt(1 - l)),
      M.value === AREA_ENUM.AREA_1
        ? ((l = _), (_ = -m), (m = l))
        : M.value === AREA_ENUM.AREA_2
          ? ((_ = -_), (m = -m))
          : M.value === AREA_ENUM.AREA_3 && ((l = _), (_ = m), (m = -l)),
      this.face === FACE_ENUM.RIGHT
        ? ((l = p), (p = -_), (_ = l))
        : this.face === FACE_ENUM.BACK
          ? ((p = -p), (_ = -_))
          : this.face === FACE_ENUM.LEFT && ((l = p), (p = _), (_ = -l)),
      (d.phi = Math.acos(-m) - HALF_PI),
      (d.lam = Math.atan2(_, p)),
      this.face === FACE_ENUM.RIGHT
        ? (d.lam = qsc_shift_lon_origin(d.lam, -HALF_PI))
        : this.face === FACE_ENUM.BACK
          ? (d.lam = qsc_shift_lon_origin(d.lam, -SPI))
          : this.face === FACE_ENUM.LEFT && (d.lam = qsc_shift_lon_origin(d.lam, +HALF_PI)));
  }
  return (
    0 !== this.es &&
      ((c = d.phi < 0 ? 1 : 0),
      (u = Math.tan(d.phi)),
      (f = this.b / Math.sqrt(u * u + this.one_minus_f_squared)),
      (d.phi = Math.atan(Math.sqrt(this.a * this.a - f * f) / (this.one_minus_f * f))),
      c && (d.phi = -d.phi)),
    (d.lam += this.long0),
    (t.x = d.lam),
    (t.y = d.phi),
    t
  );
}
function qsc_fwd_equat_face_theta(t, s, i, a) {
  var e;
  return (
    t < EPSLN
      ? ((a.value = AREA_ENUM.AREA_0), (e = 0))
      : ((e = Math.atan2(s, i)),
        Math.abs(e) <= FORTPI
          ? (a.value = AREA_ENUM.AREA_0)
          : e > FORTPI && e <= HALF_PI + FORTPI
            ? ((a.value = AREA_ENUM.AREA_1), (e -= HALF_PI))
            : e > HALF_PI + FORTPI || e <= -(HALF_PI + FORTPI)
              ? ((a.value = AREA_ENUM.AREA_2), (e = e >= 0 ? e - SPI : e + SPI))
              : ((a.value = AREA_ENUM.AREA_3), (e += HALF_PI))),
    e
  );
}
function qsc_shift_lon_origin(t, s) {
  var i = t + s;
  return (i < -SPI ? (i += TWO_PI) : i > +SPI && (i -= TWO_PI), i);
}
var names$4 = ['Quadrilateralized Spherical Cube', 'Quadrilateralized_Spherical_Cube', 'qsc'],
  qsc = { init: init$4, forward: forward$4, inverse: inverse$4, names: names$4 },
  COEFS_X = [
    [1, 22199e-21, -715515e-10, 31103e-10],
    [0.9986, -482243e-9, -24897e-9, -13309e-10],
    [0.9954, -83103e-8, -448605e-10, -9.86701e-7],
    [0.99, -0.00135364, -59661e-9, 36777e-10],
    [0.9822, -0.00167442, -449547e-11, -572411e-11],
    [0.973, -0.00214868, -903571e-10, 1.8736e-8],
    [0.96, -0.00305085, -900761e-10, 164917e-11],
    [0.9427, -0.00382792, -653386e-10, -26154e-10],
    [0.9216, -0.00467746, -10457e-8, 481243e-11],
    [0.8962, -0.00536223, -323831e-10, -543432e-11],
    [0.8679, -0.00609363, -113898e-9, 332484e-11],
    [0.835, -0.00698325, -640253e-10, 9.34959e-7],
    [0.7986, -0.00755338, -500009e-10, 9.35324e-7],
    [0.7597, -0.00798324, -35971e-9, -227626e-11],
    [0.7186, -0.00851367, -701149e-10, -86303e-10],
    [0.6732, -0.00986209, -199569e-9, 191974e-10],
    [0.6213, -0.010418, 883923e-10, 624051e-11],
    [0.5722, -0.00906601, 182e-6, 624051e-11],
    [0.5322, -0.00677797, 275608e-9, 624051e-11],
  ],
  COEFS_Y = [
    [-520417e-23, 0.0124, 121431e-23, -845284e-16],
    [0.062, 0.0124, -1.26793e-9, 4.22642e-10],
    [0.124, 0.0124, 5.07171e-9, -1.60604e-9],
    [0.186, 0.0123999, -1.90189e-8, 6.00152e-9],
    [0.248, 0.0124002, 7.10039e-8, -2.24e-8],
    [0.31, 0.0123992, -2.64997e-7, 8.35986e-8],
    [0.372, 0.0124029, 9.88983e-7, -3.11994e-7],
    [0.434, 0.0123893, -369093e-11, -4.35621e-7],
    [0.4958, 0.0123198, -102252e-10, -3.45523e-7],
    [0.5571, 0.0121916, -154081e-10, -5.82288e-7],
    [0.6176, 0.0119938, -241424e-10, -5.25327e-7],
    [0.6769, 0.011713, -320223e-10, -5.16405e-7],
    [0.7346, 0.0113541, -397684e-10, -6.09052e-7],
    [0.7903, 0.0109107, -489042e-10, -104739e-11],
    [0.8435, 0.0103431, -64615e-9, -1.40374e-9],
    [0.8936, 0.00969686, -64636e-9, -8547e-9],
    [0.9394, 0.00840947, -192841e-9, -42106e-10],
    [0.9761, 0.00616527, -256e-6, -42106e-10],
    [1, 0.00328947, -319159e-9, -42106e-10],
  ],
  FXC = 0.8487,
  FYC = 1.3523,
  C1 = R2D / 5,
  RC1 = 1 / C1,
  NODES = 18,
  poly3_val = function (t, s) {
    return t[0] + s * (t[1] + s * (t[2] + s * t[3]));
  },
  poly3_der = function (t, s) {
    return t[1] + s * (2 * t[2] + 3 * s * t[3]);
  };
function newton_rapshon(t, s, i, a) {
  for (var e = s; a; --a) {
    var h = t(e);
    if (((e -= h), Math.abs(h) < i)) break;
  }
  return e;
}
function init$3() {
  ((this.x0 = this.x0 || 0),
    (this.y0 = this.y0 || 0),
    (this.long0 = this.long0 || 0),
    (this.es = 0),
    (this.title = this.title || 'Robinson'));
}
function forward$3(t) {
  var s = adjust_lon(t.x - this.long0),
    i = Math.abs(t.y),
    a = Math.floor(i * C1);
  (a < 0 ? (a = 0) : a >= NODES && (a = NODES - 1), (i = R2D * (i - RC1 * a)));
  var e = { x: poly3_val(COEFS_X[a], i) * s, y: poly3_val(COEFS_Y[a], i) };
  return (
    t.y < 0 && (e.y = -e.y),
    (e.x = e.x * this.a * FXC + this.x0),
    (e.y = e.y * this.a * FYC + this.y0),
    e
  );
}
function inverse$3(t) {
  var s = { x: (t.x - this.x0) / (this.a * FXC), y: Math.abs(t.y - this.y0) / (this.a * FYC) };
  if (s.y >= 1) ((s.x /= COEFS_X[NODES][0]), (s.y = t.y < 0 ? -HALF_PI : HALF_PI));
  else {
    var i = Math.floor(s.y * NODES);
    for (i < 0 ? (i = 0) : i >= NODES && (i = NODES - 1); ; )
      if (COEFS_Y[i][0] > s.y) --i;
      else {
        if (!(COEFS_Y[i + 1][0] <= s.y)) break;
        ++i;
      }
    var a = COEFS_Y[i],
      e = (5 * (s.y - a[0])) / (COEFS_Y[i + 1][0] - a[0]);
    ((e = newton_rapshon(
      function (t) {
        return (poly3_val(a, t) - s.y) / poly3_der(a, t);
      },
      e,
      EPSLN,
      100
    )),
      (s.x /= poly3_val(COEFS_X[i], e)),
      (s.y = (5 * i + e) * D2R$1),
      t.y < 0 && (s.y = -s.y));
  }
  return ((s.x = adjust_lon(s.x + this.long0)), s);
}
var names$3 = ['Robinson', 'robin'],
  robin = { init: init$3, forward: forward$3, inverse: inverse$3, names: names$3 };
function init$2() {
  this.name = 'geocent';
}
function forward$2(t) {
  return geodeticToGeocentric(t, this.es, this.a);
}
function inverse$2(t) {
  return geocentricToGeodetic(t, this.es, this.a, this.b);
}
var names$2 = ['Geocentric', 'geocentric', 'geocent', 'Geocent'],
  geocent = { init: init$2, forward: forward$2, inverse: inverse$2, names: names$2 },
  mode = { N_POLE: 0, S_POLE: 1, EQUIT: 2, OBLIQ: 3 },
  params = {
    h: { def: 1e5, num: !0 },
    azi: { def: 0, num: !0, degrees: !0 },
    tilt: { def: 0, num: !0, degrees: !0 },
    long0: { def: 0, num: !0 },
    lat0: { def: 0, num: !0 },
  };
function init$1() {
  if (
    (Object.keys(params).forEach(
      function (t) {
        if (void 0 === this[t]) this[t] = params[t].def;
        else {
          if (params[t].num && isNaN(this[t]))
            throw new Error('Invalid parameter value, must be numeric ' + t + ' = ' + this[t]);
          params[t].num && (this[t] = parseFloat(this[t]));
        }
        params[t].degrees && (this[t] = this[t] * D2R$1);
      }.bind(this)
    ),
    Math.abs(Math.abs(this.lat0) - HALF_PI) < EPSLN
      ? (this.mode = this.lat0 < 0 ? mode.S_POLE : mode.N_POLE)
      : Math.abs(this.lat0) < EPSLN
        ? (this.mode = mode.EQUIT)
        : ((this.mode = mode.OBLIQ),
          (this.sinph0 = Math.sin(this.lat0)),
          (this.cosph0 = Math.cos(this.lat0))),
    (this.pn1 = this.h / this.a),
    this.pn1 <= 0 || this.pn1 > 1e10)
  )
    throw new Error('Invalid height');
  ((this.p = 1 + this.pn1),
    (this.rp = 1 / this.p),
    (this.h1 = 1 / this.pn1),
    (this.pfact = (this.p + 1) * this.h1),
    (this.es = 0));
  var t = this.tilt,
    s = this.azi;
  ((this.cg = Math.cos(s)),
    (this.sg = Math.sin(s)),
    (this.cw = Math.cos(t)),
    (this.sw = Math.sin(t)));
}
function forward$1(t) {
  t.x -= this.long0;
  var s,
    i,
    a,
    e,
    h = Math.sin(t.y),
    r = Math.cos(t.y),
    n = Math.cos(t.x);
  switch (this.mode) {
    case mode.OBLIQ:
      i = this.sinph0 * h + this.cosph0 * r * n;
      break;
    case mode.EQUIT:
      i = r * n;
      break;
    case mode.S_POLE:
      i = -h;
      break;
    case mode.N_POLE:
      i = h;
  }
  switch (((s = (i = this.pn1 / (this.p - i)) * r * Math.sin(t.x)), this.mode)) {
    case mode.OBLIQ:
      i *= this.cosph0 * h - this.sinph0 * r * n;
      break;
    case mode.EQUIT:
      i *= h;
      break;
    case mode.N_POLE:
      i *= -r * n;
      break;
    case mode.S_POLE:
      i *= r * n;
  }
  return (
    (e = 1 / ((a = i * this.cg + s * this.sg) * this.sw * this.h1 + this.cw)),
    (s = (s * this.cg - i * this.sg) * this.cw * e),
    (i = a * e),
    (t.x = s * this.a),
    (t.y = i * this.a),
    t
  );
}
function inverse$1(t) {
  ((t.x /= this.a), (t.y /= this.a));
  var s,
    i,
    a,
    e = { x: t.x, y: t.y };
  ((a = 1 / (this.pn1 - t.y * this.sw)),
    (s = this.pn1 * t.x * a),
    (i = this.pn1 * t.y * this.cw * a),
    (t.x = s * this.cg + i * this.sg),
    (t.y = i * this.cg - s * this.sg));
  var h = hypot(t.x, t.y);
  if (Math.abs(h) < EPSLN) ((e.x = 0), (e.y = t.y));
  else {
    var r, n;
    switch (
      ((n = 1 - h * h * this.pfact),
      (n = (this.p - Math.sqrt(n)) / (this.pn1 / h + h / this.pn1)),
      (r = Math.sqrt(1 - n * n)),
      this.mode)
    ) {
      case mode.OBLIQ:
        ((e.y = Math.asin(r * this.sinph0 + (t.y * n * this.cosph0) / h)),
          (t.y = (r - this.sinph0 * Math.sin(e.y)) * h),
          (t.x *= n * this.cosph0));
        break;
      case mode.EQUIT:
        ((e.y = Math.asin((t.y * n) / h)), (t.y = r * h), (t.x *= n));
        break;
      case mode.N_POLE:
        ((e.y = Math.asin(r)), (t.y = -t.y));
        break;
      case mode.S_POLE:
        e.y = -Math.asin(r);
    }
    e.x = Math.atan2(t.x, t.y);
  }
  return ((t.x = e.x + this.long0), (t.y = e.y), t);
}
var names$1 = ['Tilted_Perspective', 'tpers'],
  tpers = { init: init$1, forward: forward$1, inverse: inverse$1, names: names$1 };
function init() {
  if (
    ((this.flip_axis = 'x' === this.sweep ? 1 : 0),
    (this.h = Number(this.h)),
    (this.radius_g_1 = this.h / this.a),
    this.radius_g_1 <= 0 || this.radius_g_1 > 1e10)
  )
    throw new Error();
  if (
    ((this.radius_g = 1 + this.radius_g_1),
    (this.C = this.radius_g * this.radius_g - 1),
    0 !== this.es)
  ) {
    var t = 1 - this.es,
      s = 1 / t;
    ((this.radius_p = Math.sqrt(t)),
      (this.radius_p2 = t),
      (this.radius_p_inv2 = s),
      (this.shape = 'ellipse'));
  } else
    ((this.radius_p = 1), (this.radius_p2 = 1), (this.radius_p_inv2 = 1), (this.shape = 'sphere'));
  this.title || (this.title = 'Geostationary Satellite View');
}
function forward(t) {
  var s,
    i,
    a,
    e,
    h = t.x,
    r = t.y;
  if (((h -= this.long0), 'ellipse' === this.shape)) {
    r = Math.atan(this.radius_p2 * Math.tan(r));
    var n = this.radius_p / hypot(this.radius_p * Math.cos(r), Math.sin(r));
    if (
      ((i = n * Math.cos(h) * Math.cos(r)),
      (a = n * Math.sin(h) * Math.cos(r)),
      (e = n * Math.sin(r)),
      (this.radius_g - i) * i - a * a - e * e * this.radius_p_inv2 < 0)
    )
      return ((t.x = Number.NaN), (t.y = Number.NaN), t);
    ((s = this.radius_g - i),
      this.flip_axis
        ? ((t.x = this.radius_g_1 * Math.atan(a / hypot(e, s))),
          (t.y = this.radius_g_1 * Math.atan(e / s)))
        : ((t.x = this.radius_g_1 * Math.atan(a / s)),
          (t.y = this.radius_g_1 * Math.atan(e / hypot(a, s)))));
  } else
    'sphere' === this.shape &&
      ((s = Math.cos(r)),
      (i = Math.cos(h) * s),
      (a = Math.sin(h) * s),
      (e = Math.sin(r)),
      (s = this.radius_g - i),
      this.flip_axis
        ? ((t.x = this.radius_g_1 * Math.atan(a / hypot(e, s))),
          (t.y = this.radius_g_1 * Math.atan(e / s)))
        : ((t.x = this.radius_g_1 * Math.atan(a / s)),
          (t.y = this.radius_g_1 * Math.atan(e / hypot(a, s)))));
  return ((t.x = t.x * this.a), (t.y = t.y * this.a), t);
}
function inverse(t) {
  var s,
    i,
    a,
    e,
    h = -1,
    r = 0,
    n = 0;
  if (((t.x = t.x / this.a), (t.y = t.y / this.a), 'ellipse' === this.shape)) {
    this.flip_axis
      ? ((n = Math.tan(t.y / this.radius_g_1)), (r = Math.tan(t.x / this.radius_g_1) * hypot(1, n)))
      : ((r = Math.tan(t.x / this.radius_g_1)),
        (n = Math.tan(t.y / this.radius_g_1) * hypot(1, r)));
    var o = n / this.radius_p;
    if (((s = r * r + o * o + h * h), (a = (i = 2 * this.radius_g * h) * i - 4 * s * this.C) < 0))
      return ((t.x = Number.NaN), (t.y = Number.NaN), t);
    ((e = (-i - Math.sqrt(a)) / (2 * s)),
      (h = this.radius_g + e * h),
      (r *= e),
      (n *= e),
      (t.x = Math.atan2(r, h)),
      (t.y = Math.atan((n * Math.cos(t.x)) / h)),
      (t.y = Math.atan(this.radius_p_inv2 * Math.tan(t.y))));
  } else if ('sphere' === this.shape) {
    if (
      (this.flip_axis
        ? ((n = Math.tan(t.y / this.radius_g_1)),
          (r = Math.tan(t.x / this.radius_g_1) * Math.sqrt(1 + n * n)))
        : ((r = Math.tan(t.x / this.radius_g_1)),
          (n = Math.tan(t.y / this.radius_g_1) * Math.sqrt(1 + r * r))),
      (s = r * r + n * n + h * h),
      (a = (i = 2 * this.radius_g * h) * i - 4 * s * this.C) < 0)
    )
      return ((t.x = Number.NaN), (t.y = Number.NaN), t);
    ((e = (-i - Math.sqrt(a)) / (2 * s)),
      (h = this.radius_g + e * h),
      (r *= e),
      (n *= e),
      (t.x = Math.atan2(r, h)),
      (t.y = Math.atan((n * Math.cos(t.x)) / h)));
  }
  return ((t.x = t.x + this.long0), t);
}
var names = ['Geostationary Satellite View', 'Geostationary_Satellite', 'geos'],
  geos = { init, forward, inverse, names };
function includedProjections(t) {
  (t.Proj.projections.add(tmerc),
    t.Proj.projections.add(etmerc),
    t.Proj.projections.add(utm),
    t.Proj.projections.add(sterea),
    t.Proj.projections.add(stere),
    t.Proj.projections.add(somerc),
    t.Proj.projections.add(omerc),
    t.Proj.projections.add(lcc),
    t.Proj.projections.add(krovak),
    t.Proj.projections.add(cass),
    t.Proj.projections.add(laea),
    t.Proj.projections.add(aea),
    t.Proj.projections.add(gnom),
    t.Proj.projections.add(cea),
    t.Proj.projections.add(eqc),
    t.Proj.projections.add(poly),
    t.Proj.projections.add(nzmg),
    t.Proj.projections.add(mill),
    t.Proj.projections.add(sinu),
    t.Proj.projections.add(moll),
    t.Proj.projections.add(eqdc),
    t.Proj.projections.add(vandg),
    t.Proj.projections.add(aeqd),
    t.Proj.projections.add(ortho),
    t.Proj.projections.add(qsc),
    t.Proj.projections.add(robin),
    t.Proj.projections.add(geocent),
    t.Proj.projections.add(tpers),
    t.Proj.projections.add(geos));
}
((proj4.defaultDatum = 'WGS84'),
  (proj4.Proj = Projection),
  (proj4.WGS84 = new proj4.Proj('WGS84')),
  (proj4.Point = Point),
  (proj4.toPoint = common),
  (proj4.defs = defs),
  (proj4.nadgrid = nadgrid),
  (proj4.transform = transform),
  (proj4.mgrs = mgrs),
  (proj4.version = '__VERSION__'),
  includedProjections(proj4));
var f,
  m = 'deflate-raw',
  x = self.DecompressionStream;
try {
  (new x(m),
    (f = async (t) => {
      let s = new x(m),
        i = s.writable.getWriter(),
        a = s.readable.getReader();
      (i.write(t), i.close());
      let e,
        h,
        r = [],
        n = 0,
        o = 0;
      for (; !(h = await a.read()).done; ) ((e = h.value), r.push(e), (n += e.length));
      return r.length - 1
        ? ((e = new Uint8Array(n)),
          r.map((t) => {
            (e.set(t, o), (o += t.length));
          }),
          e)
        : r[0];
    }));
} catch {}
var _ = new TextDecoder(),
  h = (t) => {
    throw new Error('but-unzip~' + t);
  },
  E = (t) => _.decode(t),
  A = (t) => {
    let s = t.length - 20,
      i = Math.max(s - 65516, 2);
    for (
      ;
      -1 !== (s = t.lastIndexOf(80, s - 1)) &&
      (75 !== t[s + 1] || 5 !== t[s + 2] || 6 !== t[s + 3]) &&
      s > i;
    );
    return s;
  };
function* C(t, s = f) {
  let i = A(t);
  -1 === i && h(2);
  let a = (s, a) => t.subarray((i += s), (i += a)),
    e = new DataView(t.buffer, t.byteOffset),
    r = (t) => e.getUint16(t + i, !0),
    n = (t) => e.getUint32(t + i, !0),
    o = r(10);
  for (o !== r(8) && h(3), i = n(16); o--; ) {
    let t,
      e = r(10),
      o = r(28),
      l = r(30),
      c = r(32),
      u = n(20),
      f = n(42),
      d = E(a(46, o)),
      M = E(a(l, c)),
      p = i;
    ((i = f),
      (t = a(30 + r(26) + r(28), u)),
      yield { filename: d, comment: M, read: () => (8 & e ? s(t) : e ? h(1) : t) },
      (i = p));
  }
}
const regex$1 = /.+\.(shp|dbf|json|prj|cpg)$/i;
var unzip = async (t) => {
  const s = {},
    i = [];
  for (const a of C(t))
    regex$1.test(a.filename) && i.push(Promise.resolve(a.read()).then((t) => (s[a.filename] = t)));
  await Promise.all(i);
  const a = {},
    e = new TextDecoder();
  for (const [t, i] of Object.entries(s))
    'shp' === t.slice(-3).toLowerCase() || 'dbf' === t.slice(-3).toLowerCase()
      ? (a[t] = new DataView(i.buffer, i.byteOffset, i.byteLength))
      : (a[t] = e.decode(i));
  return a;
};
const URL$1 = globalThis.URL;
var combine$1 = (t, s) => {
  if (!s) return t;
  const i = new URL$1(t);
  return ((i.pathname = `${i.pathname}.${s}`), i.href);
};
async function binaryAjax(t, s) {
  const i = combine$1(t, s),
    a = 'prj' === s || 'cpg' === s;
  try {
    const t = await fetch(i);
    if (t.status > 399) throw new Error(t.statusText);
    if (a) return t.text();
    const s = await t.arrayBuffer();
    return new DataView(s);
  } catch (t) {
    if (a || 'dbf' === s) return !1;
    throw t;
  }
}
function isClockWise(t) {
  let s = 0,
    i = 1;
  const a = t.length;
  let e, h;
  const r = [t[0][0], t[0][1], t[0][0], t[0][1]];
  for (; i < a; )
    ((e = h || t[0]),
      (h = t[i]),
      (s += (h[0] - e[0]) * (h[1] + e[1])),
      i++,
      h[0] < r[0] && (r[0] = h[0]),
      h[1] < r[1] && (r[1] = h[1]),
      h[0] > r[2] && (r[2] = h[0]),
      h[1] > r[3] && (r[3] = h[1]));
  return { ring: t, clockWise: s > 0, bbox: r, children: [] };
}
function contains(t, s) {
  return !(
    t.bbox[0] > s.bbox[0] ||
    t.bbox[1] > s.bbox[1] ||
    t.bbox[2] < s.bbox[2] ||
    t.bbox[3] < s.bbox[3]
  );
}
function handleRings(t) {
  const s = [],
    i = [];
  for (const a of t) {
    const t = isClockWise(a);
    t.clockWise ? s.push(t) : i.push(t);
  }
  for (const t of i)
    for (const i of s)
      if (contains(i, t)) {
        i.children.push(t.ring);
        break;
      }
  const a = [];
  for (const t of s) a.push([t.ring].concat(t.children));
  return a;
}
((ParseShp.prototype.parsePoint = function (t) {
  return { type: 'Point', coordinates: this.parseCoord(t, 0) };
}),
  (ParseShp.prototype.parseZPoint = function (t) {
    const s = this.parsePoint(t);
    return (s.coordinates.push(t.getFloat64(16, !0)), s);
  }),
  (ParseShp.prototype.parsePointArray = function (t, s, i) {
    const a = [];
    let e = 0;
    for (; e < i; ) (a.push(this.parseCoord(t, s)), (s += 16), e++);
    return a;
  }),
  (ParseShp.prototype.parseZPointArray = function (t, s, i, a) {
    let e = 0;
    for (; e < i; ) (a[e].push(t.getFloat64(s, !0)), e++, (s += 8));
    return a;
  }),
  (ParseShp.prototype.parseArrayGroup = function (t, s, i, a, e) {
    const h = [];
    let r,
      n,
      o = 0,
      l = 0;
    for (; o < a; )
      (o++,
        (i += 4),
        (r = l),
        (l = o === a ? e : t.getInt32(i, !0)),
        (n = l - r),
        n && (h.push(this.parsePointArray(t, s, n)), (s += n << 4)));
    return h;
  }),
  (ParseShp.prototype.parseZArrayGroup = function (t, s, i, a) {
    let e = 0;
    for (; e < i; )
      ((a[e] = this.parseZPointArray(t, s, a[e].length, a[e])), (s += a[e].length << 3), e++);
    return a;
  }),
  (ParseShp.prototype.parseMultiPoint = function (t) {
    const s = {},
      i = t.getInt32(32, !0);
    if (!i) return null;
    const a = this.parseCoord(t, 0),
      e = this.parseCoord(t, 16);
    return (
      (s.bbox = [a[0], a[1], e[0], e[1]]),
      1 === i
        ? ((s.type = 'Point'), (s.coordinates = this.parseCoord(t, 36)))
        : ((s.type = 'MultiPoint'), (s.coordinates = this.parsePointArray(t, 36, i))),
      s
    );
  }),
  (ParseShp.prototype.parseZMultiPoint = function (t) {
    const s = this.parseMultiPoint(t);
    if (!s) return null;
    let i;
    if ('Point' === s.type) return (s.coordinates.push(t.getFloat64(72, !0)), s);
    i = s.coordinates.length;
    const a = 52 + (i << 4);
    return ((s.coordinates = this.parseZPointArray(t, a, i, s.coordinates)), s);
  }),
  (ParseShp.prototype.parsePolyline = function (t) {
    const s = {},
      i = t.getInt32(32, !0);
    if (!i) return null;
    const a = this.parseCoord(t, 0),
      e = this.parseCoord(t, 16);
    s.bbox = [a[0], a[1], e[0], e[1]];
    const h = t.getInt32(36, !0);
    let r, n;
    return (
      1 === i
        ? ((s.type = 'LineString'), (r = 44), (s.coordinates = this.parsePointArray(t, r, h)))
        : ((s.type = 'MultiLineString'),
          (r = 40 + (i << 2)),
          (n = 40),
          (s.coordinates = this.parseArrayGroup(t, r, 40, i, h))),
      s
    );
  }),
  (ParseShp.prototype.parseZPolyline = function (t) {
    const s = this.parsePolyline(t);
    if (!s) return null;
    const i = s.coordinates.length;
    let a;
    return 'LineString' === s.type
      ? ((a = 60 + (i << 4)), (s.coordinates = this.parseZPointArray(t, a, i, s.coordinates)), s)
      : ((a =
          56 +
          (s.coordinates.reduce(function (t, s) {
            return t + s.length;
          }, 0) <<
            4) +
          (i << 2)),
        (s.coordinates = this.parseZArrayGroup(t, a, i, s.coordinates)),
        s);
  }),
  (ParseShp.prototype.polyFuncs = function (t) {
    return t
      ? 'LineString' === t.type
        ? ((t.type = 'Polygon'), (t.coordinates = [t.coordinates]), t)
        : ((t.coordinates = handleRings(t.coordinates)),
          1 === t.coordinates.length
            ? ((t.type = 'Polygon'), (t.coordinates = t.coordinates[0]), t)
            : ((t.type = 'MultiPolygon'), t))
      : t;
  }),
  (ParseShp.prototype.parsePolygon = function (t) {
    return this.polyFuncs(this.parsePolyline(t));
  }),
  (ParseShp.prototype.parseZPolygon = function (t) {
    return this.polyFuncs(this.parseZPolyline(t));
  }));
const shpFuncObj = {
  1: 'parsePoint',
  3: 'parsePolyline',
  5: 'parsePolygon',
  8: 'parseMultiPoint',
  11: 'parseZPoint',
  13: 'parseZPolyline',
  15: 'parseZPolygon',
  18: 'parseZMultiPoint',
};
function makeParseCoord(t) {
  return t
    ? function (s, i) {
        const a = [s.getFloat64(i, !0), s.getFloat64(i + 8, !0)];
        return t.inverse(a);
      }
    : function (t, s) {
        return [t.getFloat64(s, !0), t.getFloat64(s + 8, !0)];
      };
}
function ParseShp(t, s) {
  if (!(this instanceof ParseShp)) return new ParseShp(t, s);
  ((this.buffer = t),
    (this.headers = this.parseHeader()),
    this.shpFuncs(s),
    (this.rows = this.getRows()));
}
function parseShp(t, s) {
  return new ParseShp(t, s).rows;
}
((ParseShp.prototype.shpFuncs = function (t) {
  let s = this.headers.shpCode;
  if ((s > 20 && (s -= 20), !(s in shpFuncObj))) throw new Error(`I don't know shp type "${s}"`);
  ((this.parseFunc = this[shpFuncObj[s]]), (this.parseCoord = makeParseCoord(t)));
}),
  (ParseShp.prototype.getShpCode = function () {
    return this.parseHeader().shpCode;
  }),
  (ParseShp.prototype.parseHeader = function () {
    const t = this.buffer;
    return {
      length: t.getInt32(24) << 1,
      version: t.getInt32(28, !0),
      shpCode: t.getInt32(32, !0),
      bbox: [
        t.getFloat64(36, !0),
        t.getFloat64(44, !0),
        t.getFloat64(52, !0),
        t.getFloat64(60, !0),
      ],
    };
  }),
  (ParseShp.prototype.getRows = function () {
    let t = 100;
    const s = this.buffer.byteLength - 8,
      i = [];
    let a;
    for (; t <= s && ((a = this.getRow(t)), a); )
      ((t += 8), (t += a.len), a.type ? i.push(this.parseFunc(a.data)) : i.push(null));
    return i;
  }),
  (ParseShp.prototype.getRow = function (t) {
    const s = this.buffer.getInt32(t),
      i = this.buffer.getInt32(t + 4) << 1;
    return 0 === i
      ? { id: s, len: i, type: 0 }
      : t + i + 8 > this.buffer.byteLength
        ? void 0
        : {
            id: s,
            len: i,
            data: new DataView(this.buffer.buffer, this.buffer.byteOffset + t + 12, i - 4),
            type: this.buffer.getInt32(t + 8, !0),
          };
  }));
var regex = /^(?:ANSI\s)?(\d+)$/m;
function createDecoder(t, s) {
  if (!t) return a;
  try {
    new TextDecoder(t.trim());
  } catch (e) {
    var i = regex.exec(t);
    return i && !s ? createDecoder('windows-' + i[1], !0) : ((t = void 0), a);
  }
  return a;
  function a(s) {
    var i = new TextDecoder(t || void 0);
    return (i.decode(s, { stream: !0 }) + i.decode()).replace(/\0/g, '').trim();
  }
}
function dbfHeader(t) {
  var s = {};
  return (
    (s.lastUpdated = new Date(t.getUint8(1) + 1900, t.getUint8(2), t.getUint8(3))),
    (s.records = t.getUint32(4, !0)),
    (s.headerLen = t.getUint16(8, !0)),
    (s.recLen = t.getUint16(10, !0)),
    s
  );
}
function dbfRowHeader(t, s, i) {
  for (
    var a = [], e = 32;
    e < s &&
    (a.push({
      name: i(new Uint8Array(t.buffer.slice(t.byteOffset + e, t.byteOffset + e + 11))),
      dataType: String.fromCharCode(t.getUint8(e + 11)),
      len: t.getUint8(e + 16),
      decimal: t.getUint8(e + 17),
    }),
    13 !== t.getUint8(e + 32));
  )
    e += 32;
  return a;
}
function rowFuncs(t, s, i, a, e) {
  var h = e(new Uint8Array(t.buffer.slice(t.byteOffset + s, t.byteOffset + s + i)));
  switch (a) {
    case 'N':
    case 'F':
    case 'O':
      return parseFloat(h, 10);
    case 'D':
      return new Date(h.slice(0, 4), parseInt(h.slice(4, 6), 10) - 1, h.slice(6, 8));
    case 'L':
      return 'y' === h.toLowerCase() || 't' === h.toLowerCase();
    default:
      return h;
  }
}
function parseRow(t, s, i, a) {
  for (var e, h, r = {}, n = 0, o = i.length; n < o; )
    ((e = rowFuncs(t, s, (h = i[n]).len, h.dataType, a)),
      (s += h.len),
      void 0 !== e && (r[h.name] = e),
      n++);
  return r;
}
function parseDbf(t, s) {
  for (
    var i = createDecoder(s),
      a = dbfHeader(t),
      e = dbfRowHeader(t, a.headerLen - 1, i),
      h = 2 + ((e.length + 1) << 5),
      r = a.recLen,
      n = a.records,
      o = [];
    n;
  )
    (o.push(parseRow(t, h, e, i)), (h += r), n--);
  return o;
}
const URL = globalThis.URL,
  toUitn8Arr = (t) => {
    if (!t) throw new Error('forgot to pass buffer');
    if (isArrayBuffer(t)) return new Uint8Array(t);
    if (isArrayBuffer(t.buffer))
      return 1 === t.BYTES_PER_ELEMENT ? t : new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
    throw new Error('invalid buffer like object');
  },
  txtDecoder = new TextDecoder(),
  toString = (t) => {
    if (t)
      return 'string' == typeof t
        ? t
        : isArrayBuffer(t) || ArrayBuffer.isView(t) || isDataView(t)
          ? txtDecoder.decode(t)
          : void 0;
  },
  toDataView = (t) => {
    if (!t) throw new Error('forgot to pass buffer');
    if (isDataView(t)) return t;
    if (isArrayBuffer(t)) return new DataView(t);
    if (isArrayBuffer(t.buffer)) return new DataView(t.buffer, t.byteOffset, t.byteLength);
    throw new Error('invalid buffer like object');
  };
function isArrayBuffer(t) {
  return (
    t instanceof globalThis.ArrayBuffer ||
    '[object ArrayBuffer]' === Object.prototype.toString.call(t)
  );
}
function isDataView(t) {
  return (
    t instanceof globalThis.DataView || '[object DataView]' === Object.prototype.toString.call(t)
  );
}
const combine = function ([t, s]) {
    const i = { type: 'FeatureCollection', features: [] };
    let a = 0;
    const e = t.length;
    for (s || (s = []); a < e; )
      (i.features.push({ type: 'Feature', geometry: t[a], properties: s[a] || {} }), a++);
    return i;
  },
  parseZip = async function (t, s) {
    let i;
    t = toUitn8Arr(t);
    const a = await unzip(t),
      e = [];
    for (i in ((s = s || []), a))
      -1 === i.indexOf('__MACOSX') &&
        ('.shp' === i.slice(-4).toLowerCase()
          ? (e.push(i.slice(0, -4)), (a[i.slice(0, -3) + i.slice(-3).toLowerCase()] = a[i]))
          : '.prj' === i.slice(-4).toLowerCase()
            ? (a[i.slice(0, -3) + i.slice(-3).toLowerCase()] = proj4(a[i]))
            : '.json' === i.slice(-5).toLowerCase() || s.indexOf(i.split('.').pop()) > -1
              ? e.push(i.slice(0, -3) + i.slice(-3).toLowerCase())
              : ('.dbf' !== i.slice(-4).toLowerCase() && '.cpg' !== i.slice(-4).toLowerCase()) ||
                (a[i.slice(0, -3) + i.slice(-3).toLowerCase()] = a[i]));
    if (!e.length) throw new Error('no layers founds');
    const h = e.map(function (t) {
      let i, e;
      const h = t.lastIndexOf('.');
      return (
        h > -1 && t.slice(h).indexOf('json') > -1
          ? ((i = JSON.parse(a[t])), (i.fileName = t.slice(0, h)))
          : s.indexOf(t.slice(h + 1)) > -1
            ? ((i = a[t]), (i.fileName = t))
            : (a[t + '.dbf'] && (e = parseDbf(a[t + '.dbf'], a[t + '.cpg'])),
              (i = combine([parseShp(a[t + '.shp'], a[t + '.prj']), e])),
              (i.fileName = t)),
        i
      );
    });
    return 1 === h.length ? h[0] : h;
  };
async function getZip(t, s) {
  const i = await binaryAjax(t);
  return parseZip(i, s);
}
const handleShp = async (t) => {
    const s = await Promise.all([binaryAjax(t, 'shp'), binaryAjax(t, 'prj')]);
    let i = !1;
    try {
      s[1] && (i = proj4(s[1]));
    } catch (t) {
      i = !1;
    }
    return parseShp(s[0], i);
  },
  handleDbf = async (t) => {
    const [s, i] = await Promise.all([binaryAjax(t, 'dbf'), binaryAjax(t, 'cpg')]);
    if (s) return parseDbf(s, i);
  },
  checkSuffix = (t, s) =>
    new URL(t, globalThis?.document?.location).pathname.slice(-4).toLowerCase() === s,
  fromObject = ({ shp: t, dbf: s, cpg: i, prj: a }) => {
    const e = [_parseShp(t, a)];
    return (s && e.push(_parseDbf(s, i)), combine(e));
  },
  getShapefile = async function (t, s) {
    if ('string' != typeof t) {
      if (isArrayBuffer(t) || ArrayBuffer.isView(t) || isDataView(t)) return parseZip(t);
      if (t.shp) return fromObject(t);
      throw new TypeError(
        'must be a string, some sort of Buffer, or an object with at least a .shp property'
      );
    }
    if (checkSuffix(t, '.zip')) return getZip(t, s);
    checkSuffix(t, '.shp') && (t = t.slice(0, -4));
    const i = await Promise.all([handleShp(t), handleDbf(t)]);
    return combine(i);
  },
  _parseShp = function (t, s) {
    if (((t = toDataView(t)), 'string' == typeof (s = toString(s))))
      try {
        s = proj4(s);
      } catch (t) {
        s = !1;
      }
    return parseShp(t, s);
  },
  _parseDbf = function (t, s) {
    return parseDbf((t = toDataView(t)), (s = toString(s)));
  };
export {
  combine,
  getShapefile as default,
  getShapefile,
  _parseDbf as parseDbf,
  _parseShp as parseShp,
  parseZip,
};
