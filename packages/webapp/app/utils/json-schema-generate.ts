// Adapted from https://github.com/romeovs/json-schema-empty

// Original License:
// Copyright (c) 2015, Romeo Van Snick <romeovs@gmail.com>

// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.

// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

// ---

// import deref from 'simple-json-schema-deref';
import type { JSONSchema4 } from "json-schema";

// merges the array of schema's
// into one usable schema
const merge = function (schemas: JSONSchema4[]) {
  return schemas.reduce(function (prev, next) {
    return Object.assign(prev, next);
  }, {});
};

// ---

// array <<
const _array = function (schema: JSONSchema4) {
  const {
    items,
    minItems,
    // maxItems, // does not matter
  } = schema;

  if (items instanceof Array) {
    return items.map(function (item) {
      return empty(item);
    });
  } else if (minItems && items) {
    // we need at least this amount of items
    return new Array(minItems).map(() => empty(items));
  } else {
    // minItems is not given or we don't know item
    // type, so jsut make empty array
    return [];
  }
};
// >>

// boolean <<
const _boolean = function () {
  // just return a value
  // randomly picked at implementation time :)
  return false;
};
// >>

// integer <<
// import _integer from './integer';
// >>

// number <<
const _number = function (schema: JSONSchema4) {
  // just return an integer
  // return _integer(schema);
  return 0;
};
// >>

// null <<
const _null = function () {
  // this one was easy
  return null;
};
// >>

// object <<
const _object = function (schema: JSONSchema4) {
  const { required, properties } = schema;

  const keys = Object.keys(properties ?? {});

  // if (!required) {
  //   // no required fields, return empty object
  //   return {};
  // } else if (required === true) {
  //   // TODO: true
  //   return {};
  // } else {
  return keys.reduce(function (prev, next) {
    const s = properties?.[next];
    if (!s) {
      throw new Error(`property \`${next}\` not defined on object`);
    }
    prev[next] = empty(s);
    return prev;
  }, {} as any);
  // }
};
// >>

// string <<
const _string = function () {
  // we do not know what we need
  // so return empty string
  return "";
};
// >>

// create empty value based on schema <<
function empty(schema: JSONSchema4): any {
  const {
    type,
    default: default_, // rename default to default_
    enum: enum_, // rename enum to enum_
    // , $ref
    oneOf,
    anyOf,
    allOf,
  } = schema;

  if (default_) {
    // if a default is given, return that
    return default_;
  } else if (enum_) {
    // if it is an enum, just use an enum value
    // json schema enums must have at least one value
    return enum_[0];
    // } else if ( $ref ) {
    //   // a ref is passed, deref it and go on from there
    //   const s = deref($ref);
    //   return empty(s);
  } else if (type) {
    // type is given
    let t;
    if (type instanceof Array) {
      // select first one
      // jsons type unions always have at least one element
      t = type.sort()[0];
    } else {
      t = type;
    }
    switch (t) {
      case "array":
        return _array(schema);

      case "boolean":
        return _boolean();

      case "integer":
        // TODO: Integer
        // return _integer(schema);
        return _number(schema);

      case "number":
        return _number(schema);

      case "null":
        return _null();

      case "object":
        return _object(schema);

      case "string":
        return _string();

      default:
        throw new Error(`cannot create value of type ${type}`);
    }
  } else if (allOf) {
    // merge schema's and follow that
    return empty(merge(allOf));
  } else if (anyOf?.[0]) {
    // any of the schema's is ok so pick the first
    // todo: is this deterministic?
    return empty(anyOf[0]);
  } else if (oneOf?.[0]) {
    // one of the schema's is ok so pick the first
    // todo: is this deterministic?
    return empty(oneOf[0]);
  } else {
    throw new Error(`cannot generate data from schema ${schema}`);
  }
}
// >>

export const generateFromSchema = function (schema: JSONSchema4) {
  // TODO: Derefence
  // const s = deref(schema);
  return empty(schema);
};
