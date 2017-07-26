/**
 * The type `Tuple` is an `Array` of fixed length whose elements at specific
 * indices are of the specified types.
 * @typedef {Array} Tuple
 * @example
 * // A Tuple of arity (length) 2, whose first el is a Boolean and second el is
 * // an Array of Error:
 * Tuple<Boolean, Array<Error>>
 * // e.g. [ true, [] ]
 * // e.g. [ false, [ new Error('computer says no') ] ]
 * @example
 * // A Tuple of arity (length) 3, whose first el is a String, and both the
 * // second and third els are an Array of String:
 * Tuple<String, Array<String>, Array<String>>
* // e.g. [ 'hello', [ 'world' ], [ 'goodbye', 'world' ] ]
 */
