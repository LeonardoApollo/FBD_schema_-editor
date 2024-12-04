import Point from '../view/geometry/Point';
import type { Properties } from '../types';
/**
 * Removes all occurrences of the given object in the given array or
 * object. If there are multiple occurrences of the object, be they
 * associative or as an array entry, all occurrences are removed from
 * the array or deleted from the object. By removing the object from
 * the array, all elements following the removed element are shifted
 * by one step towards the beginning of the array.
 *
 * The length of arrays is not modified inside this function.
 *
 * @param obj Object to find in the given array.
 * @param array Array to check for the given obj.
 */
export declare const remove: (obj: object, array: object[]) => object | null;
/**
 * Compares all Point in the given lists.
 *
 * @param a Array of <Point> to be compared.
 * @param b Array of <Point> to be compared.
 */
export declare const equalPoints: (a: (Point | null)[] | null, b: (Point | null)[] | null) => boolean;
/**
 * Returns true if all properties of the given objects are equal. Values
 * with NaN are equal to NaN and unequal to any other value.
 *
 * @param a First object to be compared.
 * @param b Second object to be compared.
 */
export declare const equalEntries: (a: Properties | null, b: Properties | null) => boolean;
/**
 * Removes all duplicates from the given array.
 */
export declare const removeDuplicates: (arr: any) => any[];
