"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _qs = require("qs");

var _deepmerge = _interopRequireDefault(require("deepmerge"));

var _axios = _interopRequireDefault(require("axios"));

var _actions = require("./actions");

var _defaultSettings = _interopRequireDefault(require("./default-settings"));

var _errors = require("./errors");

var _initializer = _interopRequireDefault(require("./initializer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Set HTTP interceptors.
(0, _initializer["default"])();
/**
 * Maps react-admin queries to a JSONAPI REST API
 *
 * @param {string} apiUrl the base URL for the JSONAPI
 * @param {Object} userSettings Settings to configure this client.
 *
 * @param {string} type Request type, e.g GET_LIST
 * @param {string} resource Resource name, e.g. "posts"
 * @param {Object} payload Request parameters. Depends on the request type
 * @returns {Promise} the Promise for a data response
 */

var _default = function _default(apiUrl) {
  var userSettings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return function (type, resource, params) {
    var url = '';
    var settings = (0, _deepmerge["default"])(_defaultSettings["default"], userSettings);
    var options = {
      headers: settings.headers
    };

    switch (type) {
      case _actions.GET_LIST:
        {
          var _params$pagination = params.pagination,
              page = _params$pagination.page,
              perPage = _params$pagination.perPage; // Create query with pagination params.

          var query = {
            'page[number]': page,
            'page[size]': perPage
          }; // Add all filter params to query.

          Object.keys(params.filter || {}).forEach(function (key) {
            query["filter[".concat(key, "]")] = params.filter[key];
          }); // Add sort parameter

          if (params.sort && params.sort.field) {
            var prefix = params.sort.order === 'ASC' ? '' : '-';
            query.sort = "".concat(prefix).concat(params.sort.field);
          }

          url = "".concat(apiUrl, "/").concat(resource, "?").concat((0, _qs.stringify)(query));
          break;
        }

      case _actions.GET_ONE:
        url = "".concat(apiUrl, "/").concat(resource, "/").concat(params.id);
        break;

      case _actions.CREATE:
        url = "".concat(apiUrl, "/").concat(resource);
        options.method = 'POST';
        options.data = JSON.stringify({
          data: {
            type: resource,
            attributes: params.data
          }
        });
        break;

      case _actions.UPDATE:
        {
          url = "".concat(apiUrl, "/").concat(resource, "/").concat(params.id);
          var attributes = params.data;
          delete attributes.id;
          var data = {
            data: {
              id: params.id,
              type: resource,
              attributes: attributes
            }
          };
          options.method = settings.updateMethod;
          options.data = JSON.stringify(data);
          break;
        }

      case _actions.DELETE:
        url = "".concat(apiUrl, "/").concat(resource, "/").concat(params.id);
        options.method = 'DELETE';
        break;

      case _actions.GET_MANY:
        {
          var _query = (0, _qs.stringify)(_defineProperty({}, "filter[".concat(settings.getManyKey, "]"), params.ids), {
            arrayFormat: settings.arrayFormat
          });

          url = "".concat(apiUrl, "/").concat(resource, "?").concat(_query);
          break;
        }

      case _actions.GET_MANY_REFERENCE:
        {
          var _params$pagination2 = params.pagination,
              _page = _params$pagination2.page,
              _perPage = _params$pagination2.perPage; // Create query with pagination params.

          var _query2 = {
            'page[number]': _page,
            'page[size]': _perPage
          }; // Add all filter params to query.

          Object.keys(params.filter || {}).forEach(function (key) {
            _query2["filter[".concat(key, "]")] = params.filter[key];
          }); // Add the reference id to the filter params.

          _query2["filter[".concat(params.target, "]")] = params.id; // Add sort parameter

          if (params.sort && params.sort.field) {
            var _prefix = params.sort.order === 'ASC' ? '' : '-';

            _query2.sort = "".concat(_prefix).concat(params.sort.field);
          }

          url = "".concat(apiUrl, "/").concat(resource, "?").concat((0, _qs.stringify)(_query2));
          break;
        }

      default:
        throw new _errors.NotImplementedError("Unsupported Data Provider request type ".concat(type));
    }

    return (0, _axios["default"])(_objectSpread({
      url: url
    }, options)).then(function (response) {
      var total; // For all collection requests get the total count.

      if ([_actions.GET_LIST, _actions.GET_MANY, _actions.GET_MANY_REFERENCE].includes(type)) {
        // When meta data and the 'total' setting is provided try
        // to get the total count.
        if (response.data.meta && settings.total) {
          total = response.data.meta[settings.total];
        } // Use the length of the data array as a fallback.


        total = total || response.data.data.length;
      }

      switch (type) {
        case _actions.GET_MANY:
        case _actions.GET_LIST:
          {
            var datas = [];

            for (var idx in response.data.data) {
              var _response$data$data$i = response.data.data[idx],
                  id = _response$data$data$i.id,
                  attributes = _response$data$data$i.attributes,
                  relationships = _response$data$data$i.relationships;

              if (null !== relationships) {
                for (var rel_name in relationships) {
                  var _relationships$rel_na;

                  var rel_attribs = relationships[rel_name];

                  if (Array.isArray((_relationships$rel_na = relationships[rel_name]) === null || _relationships$rel_na === void 0 ? void 0 : _relationships$rel_na.data)) {
                    var rel_ids = [];

                    for (var many_relidx in relationships[rel_name].data) {
                      var many_rel = relationships[rel_name].data[many_relidx];

                      if (many_rel.id) {
                        rel_ids.push(many_rel.id);
                      }
                    }
                  } else {
                    var _relationships$rel_na2, _relationships$rel_na3;

                    var rel_id = (_relationships$rel_na2 = relationships[rel_name]) === null || _relationships$rel_na2 === void 0 ? void 0 : (_relationships$rel_na3 = _relationships$rel_na2.data) === null || _relationships$rel_na3 === void 0 ? void 0 : _relationships$rel_na3.id;

                    if (null !== rel_id) {
                      attributes[rel_name] = rel_id;
                    }
                  }
                }

                datas.push(_objectSpread({
                  id: id
                }, attributes));
              }
            }

            return {
              data: datas,
              total: total
            };
          }

        case _actions.GET_MANY_REFERENCE:
          {
            return {
              data: response.data.data.map(function (value) {
                return Object.assign({
                  id: value.id
                }, value.attributes);
              }),
              total: total
            };
          }

        case _actions.GET_ONE:
          {
            var _response$data$data = response.data.data,
                id = _response$data$data.id,
                attributes = _response$data$data.attributes,
                relationships = _response$data$data.relationships;

            if (null !== relationships) {
              for (var _rel_name in relationships) {
                var _relationships$_rel_n;

                var _rel_attribs = relationships[_rel_name];

                if (Array.isArray((_relationships$_rel_n = relationships[_rel_name]) === null || _relationships$_rel_n === void 0 ? void 0 : _relationships$_rel_n.data)) {
                  var rel_ids = [];

                  for (var _many_relidx in relationships[_rel_name].data) {
                    var _many_rel = relationships[_rel_name].data[_many_relidx];

                    if (_many_rel.id) {
                      rel_ids.push(_many_rel.id);
                    }
                  }
                } else {
                  var _relationships$_rel_n2, _relationships$_rel_n3;

                  var _rel_id = (_relationships$_rel_n2 = relationships[_rel_name]) === null || _relationships$_rel_n2 === void 0 ? void 0 : (_relationships$_rel_n3 = _relationships$_rel_n2.data) === null || _relationships$_rel_n3 === void 0 ? void 0 : _relationships$_rel_n3.id;

                  if (null !== _rel_id) {
                    attributes[_rel_name] = _rel_id;
                  }
                }
              }
            }

            return {
              data: _objectSpread({
                id: id
              }, attributes)
            };
          }

        case _actions.CREATE:
          {
            var _response$data$data2 = response.data.data,
                _id = _response$data$data2.id,
                _attributes = _response$data$data2.attributes;
            return {
              data: _objectSpread({
                id: _id
              }, _attributes)
            };
          }

        case _actions.UPDATE:
          {
            var _response$data$data3 = response.data.data,
                _id2 = _response$data$data3.id,
                _attributes2 = _response$data$data3.attributes;
            return {
              data: _objectSpread({
                id: _id2
              }, _attributes2)
            };
          }

        case _actions.DELETE:
          {
            return {
              data: {
                id: params.id
              }
            };
          }

        default:
          throw new _errors.NotImplementedError("Unsupported Data Provider request type ".concat(type));
      }
    });
  };
};

exports["default"] = _default;