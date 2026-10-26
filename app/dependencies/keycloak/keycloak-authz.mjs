var e = function (e, t) {
  var n = this;
  this.rpt = null;
  var r = function () {},
    o = function () {};
  return (
    'undefined' != typeof Promise &&
      -1 !== Promise.toString().indexOf('[native code]') &&
      (this.ready = new Promise(function (e, t) {
        ((r = e), (o = t));
      })),
    (this.init = function () {
      var t = new XMLHttpRequest();
      (t.open('GET', e.authServerUrl + '/realms/' + e.realm + '/.well-known/uma2-configuration'),
        (t.onreadystatechange = function () {
          4 == t.readyState &&
            (200 == t.status
              ? ((n.config = JSON.parse(t.responseText)), r())
              : (console.error('Could not obtain configuration from server.'), o()));
        }),
        t.send(null));
    }),
    (this.authorize = function (t) {
      return (
        (this.then = function (r, o, s) {
          if (t && t.ticket) {
            var i = new XMLHttpRequest();
            (i.open('POST', n.config.token_endpoint, !0),
              i.setRequestHeader('Content-type', 'application/x-www-form-urlencoded'),
              i.setRequestHeader('Authorization', 'Bearer ' + e.token),
              (i.onreadystatechange = function () {
                if (4 == i.readyState) {
                  var e = i.status;
                  if (e >= 200 && e < 300) {
                    var t = JSON.parse(i.responseText).access_token;
                    ((n.rpt = t), r(t));
                  } else
                    403 == e
                      ? o
                        ? o()
                        : console.error('Authorization request was denied by the server.')
                      : s
                        ? s()
                        : console.error('Could not obtain authorization data from server.');
                }
              }));
            var a =
              'grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&client_id=' +
              e.clientId +
              '&ticket=' +
              t.ticket;
            null != t.submitRequest && (a += '&submit_request=' + t.submitRequest);
            var u = t.metadata;
            (u &&
              (u.responseIncludeResourceName &&
                (a += '&response_include_resource_name=' + u.responseIncludeResourceName),
              u.responsePermissionsLimit &&
                (a += '&response_permissions_limit=' + u.responsePermissionsLimit)),
              n.rpt &&
                (null == t.incrementalAuthorization || t.incrementalAuthorization) &&
                (a += '&rpt=' + n.rpt),
              i.send(a));
          }
        }),
        this
      );
    }),
    (this.entitlement = function (t, r) {
      return (
        (this.then = function (o, s, i) {
          var a = new XMLHttpRequest();
          (a.open('POST', n.config.token_endpoint, !0),
            a.setRequestHeader('Content-type', 'application/x-www-form-urlencoded'),
            a.setRequestHeader('Authorization', 'Bearer ' + e.token),
            (a.onreadystatechange = function () {
              if (4 == a.readyState) {
                var e = a.status;
                if (e >= 200 && e < 300) {
                  var t = JSON.parse(a.responseText).access_token;
                  ((n.rpt = t), o(t));
                } else
                  403 == e
                    ? s
                      ? s()
                      : console.error('Authorization request was denied by the server.')
                    : i
                      ? i()
                      : console.error('Could not obtain authorization data from server.');
              }
            }),
            r || (r = {}));
          var u = 'grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&client_id=' + e.clientId;
          (r.claimToken &&
            ((u += '&claim_token=' + r.claimToken),
            r.claimTokenFormat && (u += '&claim_token_format=' + r.claimTokenFormat)),
            (u += '&audience=' + t));
          var c = r.permissions;
          c || (c = []);
          for (var p = 0; p < c.length; p++) {
            var l = c[p],
              m = l.id;
            if (l.scopes && l.scopes.length > 0) {
              m += '#';
              for (var d = 0; d < l.scopes.length; d++) {
                var f = l.scopes[d];
                (m.indexOf('#') != m.length - 1 && (m += ','), (m += f));
              }
            }
            u += '&permission=' + m;
          }
          var h = r.metadata;
          (h &&
            (h.responseIncludeResourceName &&
              (u += '&response_include_resource_name=' + h.responseIncludeResourceName),
            h.responsePermissionsLimit &&
              (u += '&response_permissions_limit=' + h.responsePermissionsLimit)),
            n.rpt && (u += '&rpt=' + n.rpt),
            a.send(u));
        }),
        this
      );
    }),
    this.init(this),
    this
  );
};
export { e as default };
